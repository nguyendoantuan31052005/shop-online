'use strict';

const crypto = require('node:crypto');
const { HttpError } = require('../db');
const { normalizeVietnamPhone, isVietnamMobilePhone } = require('../phone');
const { estimateOrderParcel, resolveUnitParcel } = require('./parcels');

const TRACKING_URL = 'https://donhang.ghn.vn/?order_code=';
const REQUIRED_NOTES = new Set(['KHONGCHOXEMHANG', 'CHOXEMHANGKHONGTHU', 'CHOTHUHANG']);
const SHIPPING_STATUSES = new Set([
  'picked', 'storing', 'sorting', 'transporting', 'delivering', 'money_collect_delivering',
]);

function configuration(env = process.env) {
  const baseUrl = env.GHN_BASE_URL || 'https://online-gateway.ghn.vn';
  if (!['https://online-gateway.ghn.vn', 'https://dev-online-gateway.ghn.vn'].includes(baseUrl)) {
    throw new HttpError(500, 'GHN_BASE_URL must be the official GHN production or staging URL.');
  }
  return {
    baseUrl,
    token: String(env.GHN_TOKEN || '').trim(),
    shopId: String(env.GHN_SHOP_ID || '').trim(),
    autoCreate: env.GHN_AUTO_CREATE_ORDERS === 'true',
    webhookSecret: String(env.GHN_WEBHOOK_SECRET || ''),
    sender: {
      name: String(env.GHN_FROM_NAME || '').trim(),
      phone: String(env.GHN_FROM_PHONE || '').trim(),
      address: String(env.GHN_FROM_ADDRESS || '').trim(),
      province: String(env.GHN_FROM_PROVINCE || '').trim(),
      ward: String(env.GHN_FROM_WARD || '').trim(),
      district: String(env.GHN_FROM_DISTRICT || '').trim(),
    },
    requiredNote: env.GHN_REQUIRED_NOTE || 'CHOXEMHANGKHONGTHU',
  };
}

function isConfigured(env = process.env) {
  const config = configuration(env);
  return Boolean(config.token && config.shopId && REQUIRED_NOTES.has(config.requiredNote));
}

function isAutoCreateEnabled(env = process.env) {
  return configuration(env).autoCreate && isConfigured(env);
}

async function createShipment(order, env = process.env) {
  const config = configuration(env);
  if (!isConfigured(env)) throw new HttpError(503, 'GHN is not configured. Add the GHN token and Shop ID in AWS Secrets Manager.');
  if (!order || !Number.isSafeInteger(order.id)) throw new HttpError(400, 'Invalid shop order.');
  if (order.shipment?.carrier === 'GHN' && order.shipment.trackingNumber) return order.shipment;
  if (!['new', 'confirmed'].includes(order.status)) throw new HttpError(409, 'Only new or confirmed orders can be submitted to GHN.');
  if (!order.shippingAddress?.province || !order.shippingAddress?.ward || !order.shippingAddress?.line1) {
    throw new HttpError(409, 'This order needs a province, ward, and street address before GHN can create a shipment.');
  }
  const recipientPhone = normalizeVietnamPhone(order.phone);
  if (!isVietnamMobilePhone(recipientPhone)) {
    throw new HttpError(409, 'Số điện thoại nhận hàng không hợp lệ với GHN. Sửa thành số di động Việt Nam 10 số bắt đầu bằng 03, 05, 07, 08 hoặc 09 rồi thử lại.');
  }
  let parcel;
  try { parcel = order.parcel || estimateOrderParcel(order.items); }
  catch { throw new HttpError(409, 'Could not estimate the package for this order. Check that it has shippable products.'); }
  if (!Number.isSafeInteger(parcel.weight) || parcel.weight < 1 || parcel.weight > 500000 ||
      ![parcel.length, parcel.width, parcel.height].every(value => Number.isSafeInteger(value) && value > 0)) {
    throw new HttpError(409, 'The package estimate for this order is invalid.');
  }
  const itemParcels = order.items.map(item => resolveUnitParcel(item));
  if (itemParcels.some(item => [item.length, item.width, item.height].some(value => value > 200))) {
    throw new HttpError(409, 'A product package exceeds GHN’s 200 cm per-side limit. Split or measure the shipment before creating its waybill.');
  }
  const multiParcel = [parcel.length, parcel.width, parcel.height].some(value => value > 200);
  const serviceTypeId = parcel.weight >= 20000 || multiParcel ? 5 : 2;

  const payload = {
    client_order_code: `HS-${order.id}`,
    payment_type_id: 1,
    required_note: config.requiredNote,
    to_name: order.customer_name,
    to_phone: recipientPhone,
    to_address: order.shippingAddress.line1,
    to_province_name: order.shippingAddress.province,
    to_ward_name: order.shippingAddress.ward,
    is_new_to_address: !order.shippingAddress.district,
    weight: parcel.weight,
    length: Math.min(parcel.length, 200),
    width: Math.min(parcel.width, 200),
    height: Math.min(parcel.height, 200),
    service_type_id: serviceTypeId,
    cod_amount: order.paymentMethod === 'cod' && order.paymentStatus !== 'paid' ? order.total : 0,
    cod_failed_amount: 0,
    insurance_value: Math.min(Math.max(0, order.subtotal - (order.discount || 0)), 5_000_000),
    order_value: Math.max(0, order.subtotal - (order.discount || 0)),
    content: order.items.map(item => `${item.name} x${item.quantity}`).join(', ').slice(0, 2000),
    items: order.items.map((item, index) => ({
      name: String(item.name).slice(0, 512),
      code: String(item.product_id || item.name).slice(0, 50),
      quantity: item.quantity,
      price: item.price,
      weight: itemParcels[index].weight,
      length: itemParcels[index].length,
      width: itemParcels[index].width,
      height: itemParcels[index].height,
    })),
  };
  // GHN defaults omitted sender fields to the registered ShopId pickup profile.
  // Only send an explicit sender address when the operator configured one.
  if (config.sender.name) payload.from_name = config.sender.name;
  if (config.sender.phone) payload.from_phone = config.sender.phone;
  if (config.sender.address) payload.from_address = config.sender.address;
  if (config.sender.province) payload.from_province_name = config.sender.province;
  if (config.sender.ward) payload.from_ward_name = config.sender.ward;
  if (config.sender.province || config.sender.ward || config.sender.district) {
    payload.is_new_from_address = !config.sender.district;
  }
  if (config.sender.district) payload.from_district_name = config.sender.district;
  if (order.shippingAddress.district) payload.to_district_name = order.shippingAddress.district;

  let response;
  try {
    response = await fetch(`${config.baseUrl}/shiip/public-api/v2/shipping-order/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Token: config.token, ShopId: config.shopId },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12000),
    });
  } catch (error) {
    throw new HttpError(502, `Could not reach GHN: ${error.name === 'TimeoutError' ? 'request timed out' : 'network error'}. Retry this shipment; the client order code is idempotent.`);
  }

  let result;
  try { result = await response.json(); }
  catch { throw new HttpError(502, 'GHN returned an unreadable response. Retry this shipment.'); }
  if (!response.ok || result?.code !== 200 || !result?.data?.order_code) {
    const message = String(result?.message_display || result?.message || 'GHN rejected the shipment.').slice(0, 300);
    throw new HttpError(502, `GHN shipment creation failed: ${message}`);
  }

  const trackingNumber = String(result.data.order_code);
  return {
    carrier: 'GHN',
    trackingNumber,
    trackingUrl: TRACKING_URL + encodeURIComponent(trackingNumber),
    clientOrderCode: payload.client_order_code,
    externalStatus: 'ready_to_pick',
    fee: Number(result.data.total_fee) || 0,
    expectedDeliveryTime: result.data.expected_delivery_time || null,
    updatedAt: new Date().toISOString(),
  };
}

function saveGhnShipment(db, orderId, shipment) {
  const order = db.data.orders.find(item => item.id === orderId);
  if (!order) throw new HttpError(404, 'Order not found.');
  const previous = structuredClone(order.shipment);
  order.shipment = { ...shipment };
  try { db.save(); }
  catch (error) { order.shipment = previous; throw error; }
  return structuredClone(order);
}

function secureTokenMatch(secret, provided) {
  if (typeof secret !== 'string' || secret.length < 32 || typeof provided !== 'string') return false;
  const expectedBytes = Buffer.from(secret);
  const providedBytes = Buffer.from(provided);
  return expectedBytes.length === providedBytes.length && crypto.timingSafeEqual(expectedBytes, providedBytes);
}

function applyWebhook(db, payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new HttpError(400, 'Invalid GHN webhook payload.');
  const orderCode = String(payload.OrderCode || '').trim();
  const clientCode = String(payload.ClientOrderCode || '').trim();
  const status = String(payload.Status || '').trim().toLowerCase();
  const eventType = String(payload.Type || '').trim().toLowerCase();
  const eventTime = String(payload.Time || '').trim();
  if (!orderCode || !status || !eventType) throw new HttpError(400, 'GHN webhook is missing its order code, status, or event type.');

  const clientMatch = clientCode.match(/^HS-(\d+)$/);
  const order = db.data.orders.find(item => item.shipment?.trackingNumber === orderCode ||
    (clientCode && item.shipment?.clientOrderCode === clientCode) ||
    (clientMatch && item.id === Number(clientMatch[1])));
  if (!order) return { accepted: true, ignored: true };

  const eventKey = `${orderCode}|${eventType}|${eventTime}`;
  const shipment = order.shipment || {
    carrier: 'GHN', trackingNumber: orderCode, trackingUrl: TRACKING_URL + encodeURIComponent(orderCode),
    clientOrderCode: clientCode || `HS-${order.id}`,
  };
  if (shipment.lastWebhookEvent === eventKey) return { accepted: true, duplicate: true, order };
  if (eventTime && shipment.externalUpdatedAt && Date.parse(eventTime) <= Date.parse(shipment.externalUpdatedAt)) {
    return { accepted: true, stale: true, order };
  }

  const previousStatus = order.status;
  shipment.externalStatus = status;
  shipment.externalUpdatedAt = eventTime && Number.isFinite(Date.parse(eventTime)) ? new Date(eventTime).toISOString() : new Date().toISOString();
  shipment.lastWebhookEvent = eventKey;
  if (status === 'picked' || SHIPPING_STATUSES.has(status)) {
    if (order.status === 'new') order.status = 'confirmed';
    if (order.status === 'confirmed') order.status = 'shipping';
  } else if (status === 'delivered') {
    if (order.status === 'new') order.status = 'confirmed';
    if (order.status === 'confirmed') order.status = 'shipping';
    if (order.status === 'shipping') order.status = 'done';
  }
  const previousShipment = order.shipment;
  order.shipment = shipment;
  try { db.save(); }
  catch (error) { order.shipment = previousShipment; order.status = previousStatus; throw error; }
  return { accepted: true, duplicate: false, order, previousStatus };
}

module.exports = { configuration, isConfigured, isAutoCreateEnabled, createShipment, saveGhnShipment, secureTokenMatch, applyWebhook };
