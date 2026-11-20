// All writes are synchronous transactions: memory and disk change together.
const { HttpError } = require('./db');
const { normalizeVietnamPhone, isVietnamMobilePhone } = require('./phone');
const clone = (value) => structuredClone(value);
function transaction(db, work) {
  const backup = clone(db.data);
  try { const result = work(); db.save(); return clone(result); }
  catch (error) { db.data = backup; throw error; }
}
function text(value, label, max = 200, required = true) {
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) {
    throw new HttpError(400, `${label} không hợp lệ`);
  }
  return value.trim();
}
function integer(value, label, min = 0, max = 1000000000) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) throw new HttpError(400, `${label} không hợp lệ`);
  return value;
}
function options(value, label) {
  if (!Array.isArray(value) || !value.length || value.length > 30) throw new HttpError(400, `${label} không hợp lệ`);
  return [...new Set(value.map(v => text(v, label, 50)))];
}
function optionalMeasure(value, label, max) {
  if (value == null || value === '') return null;
  const measure = integer(value, label, 1, max);
  return measure;
}
function saveProduct(db, id, input) {
  const existing = id == null ? null : db.data.products.find(p => p.id === id);
  if (id != null && !existing) throw new HttpError(404, 'Không tìm thấy sản phẩm');
  const p = { ...existing, ...input };
  const image = text(p.image || '', 'URL ảnh', 2000, false);
  if (image && !/^https?:\/\//i.test(image) && !/^\/(?!\/)/.test(image)) throw new HttpError(400, 'Ảnh phải là URL http/https hoặc đường dẫn /');
  const brand = text(p.brand || '', 'Thương hiệu', 100, false);
  const salePrice = p.salePrice === '' || p.salePrice == null ? null : integer(p.salePrice, 'Giá khuyến mãi', 1, 1000000000);
  if (salePrice !== null && salePrice >= p.price) throw new HttpError(400, 'Giá khuyến mãi phải thấp hơn giá gốc');
  const images = p.images == null ? (existing?.images || []) : p.images;
  if (!Array.isArray(images) || images.length > 8) throw new HttpError(400, 'Tối đa 8 ảnh chi tiết');
  const cleanImages = images.map(value => {
    const url = text(value, 'URL ảnh chi tiết', 2000);
    if (!/^https?:\/\//i.test(url) && !/^\/(?!\/)/.test(url)) throw new HttpError(400, 'Ảnh chi tiết phải là URL http/https hoặc đường dẫn /');
    return url;
  });
  const product = {
    name: text(p.name, 'Tên sản phẩm'), category: text(p.category, 'Danh mục', 80),
    description: text(p.description || '', 'Mô tả', 5000, false), image, images: cleanImages, brand, salePrice,
    price: integer(p.price, 'Giá'), stock: integer(p.stock, 'Tồn kho', 0, 1000000),
    shippingWeightG: optionalMeasure(p.shippingWeightG, 'Khối lượng đóng gói (g)', 500000),
    shippingLengthCm: optionalMeasure(p.shippingLengthCm, 'Chiều dài kiện hàng (cm)', 200),
    shippingWidthCm: optionalMeasure(p.shippingWidthCm, 'Chiều rộng kiện hàng (cm)', 200),
    shippingHeightCm: optionalMeasure(p.shippingHeightCm, 'Chiều cao kiện hàng (cm)', 200),
    sizes: options(p.sizes || ['One Size'], 'Kích cỡ'), colors: options(p.colors || ['Mặc định'], 'Màu'),
    gender: text(p.gender || 'all', 'Nhóm', 20), subCategory: text(p.subCategory || 'phu-kien', 'Nhóm danh mục', 80),
    emoji: text(p.emoji || '🛍️', 'Biểu tượng', 20),
  };
  return transaction(db, () => {
    product.id = existing ? id : db.data.nextProductId++;
    if (existing) Object.assign(existing, product); else db.data.products.push(product);
    return product;
  });
}
function deleteProduct(db, id) {
  if (!db.data.products.some(p => p.id === id)) throw new HttpError(404, 'Không tìm thấy sản phẩm');
  return transaction(db, () => { db.data.products = db.data.products.filter(p => p.id !== id); return { deleted: true }; });
}
function saveVoucher(db, id, input) {
  const existing = id == null ? null : db.data.vouchers.find(v => v.id === id);
  if (id != null && !existing) throw new HttpError(404, 'Không tìm thấy voucher');
  const v = { ...existing, ...input };
  const code = text(v.code, 'Mã voucher', 40).toUpperCase();
  if (!/^[A-Z0-9_-]+$/.test(code)) throw new HttpError(400, 'Mã chỉ gồm chữ, số, dấu - và _');
  if (db.data.vouchers.some(x => x.code === code && x.id !== id)) throw new HttpError(409, 'Mã voucher đã tồn tại');
  if (!['percent', 'fixed', 'shipping'].includes(v.type)) throw new HttpError(400, 'Loại voucher không hợp lệ');
  const date = (value) => {
    if (!value) return null;
    if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) throw new HttpError(400, 'Ngày voucher không hợp lệ');
    return new Date(value).toISOString();
  };
  const voucher = { code, type: v.type, value: integer(v.type === 'shipping' ? 0 : v.value, 'Mức giảm', v.type === 'shipping' ? 0 : 1, v.type === 'percent' ? 100 : 1000000000),
    minOrder: integer(v.minOrder ?? 0, 'Đơn tối thiểu'), maxDiscount: integer(v.maxDiscount ?? 0, 'Giảm tối đa'),
    usageLimit: integer(v.usageLimit ?? 0, 'Giới hạn lượt'), used: existing?.used || 0,
    startsAt: date(v.startsAt), expiresAt: date(v.expiresAt), active: v.active ?? true,
    description: text(v.description || '', 'Mô tả', 500, false) };
  if (typeof voucher.active !== 'boolean') throw new HttpError(400, 'Trạng thái voucher không hợp lệ');
  if (voucher.startsAt && voucher.expiresAt && voucher.startsAt >= voucher.expiresAt) throw new HttpError(400, 'Ngày hết hạn phải sau ngày bắt đầu');
  return transaction(db, () => {
    voucher.id = existing ? id : db.data.nextVoucherId++;
    if (existing) Object.assign(existing, voucher); else db.data.vouchers.push(voucher);
    return voucher;
  });
}
function deleteVoucher(db, id) {
  if (!db.data.vouchers.some(v => v.id === id)) throw new HttpError(404, 'Không tìm thấy voucher');
  return transaction(db, () => { db.data.vouchers = db.data.vouchers.filter(v => v.id !== id); return { deleted: true }; });
}
function saveCategory(db, currentName, input) {
  const name = text(input?.name, 'Tên danh mục', 80);
  const categories = require('./db').listCategories(db);
  if (currentName && !categories.includes(currentName)) throw new HttpError(404, 'Không tìm thấy danh mục');
  if (categories.some(value => value.toLocaleLowerCase('vi') === name.toLocaleLowerCase('vi') && value !== currentName)) throw new HttpError(409, 'Danh mục đã tồn tại');
  return transaction(db, () => {
    db.data.categories ||= [];
    if (currentName) {
      db.data.categories = db.data.categories.filter(value => value !== currentName);
      db.data.products.forEach(product => { if (product.category === currentName) product.category = name; });
    }
    if (!db.data.categories.includes(name)) db.data.categories.push(name);
    return { name };
  });
}
function deleteCategory(db, name) {
  if (!require('./db').listCategories(db).includes(name)) throw new HttpError(404, 'Không tìm thấy danh mục');
  if (db.data.products.some(product => product.category === name)) throw new HttpError(409, 'Hãy chuyển hoặc xóa sản phẩm trong danh mục trước');
  return transaction(db, () => { db.data.categories = (db.data.categories || []).filter(value => value !== name); return { deleted: true }; });
}
function available(v, now = new Date().toISOString()) {
  return v.active && (!v.startsAt || now >= v.startsAt) && (!v.expiresAt || now < v.expiresAt) && (!v.usageLimit || v.used < v.usageLimit);
}
function quoteOrder(db, payload) {
  if (!payload || !Array.isArray(payload.items) || !payload.items.length || payload.items.length > 100) throw new HttpError(400, 'Giỏ hàng không hợp lệ');
  const totals = new Map(); const lines = new Map();
  for (const item of payload.items) {
    if (!item || typeof item !== 'object') throw new HttpError(400, 'Sản phẩm không hợp lệ');
    const p = db.data.products.find(p => p.id === Number(item.productId));
    if (!p) throw new HttpError(400, 'Sản phẩm không còn tồn tại');
    const quantity = integer(item.quantity, 'Số lượng', 1, 99);
    const size = item.size ?? p.sizes[0]; const color = item.color ?? p.colors[0];
    if (!p.sizes.includes(size) || !p.colors.includes(color)) throw new HttpError(400, `Size/màu của ${p.name} không hợp lệ`);
    const totalQty = (totals.get(p.id) || 0) + quantity;
    if (totalQty > p.stock) throw new HttpError(409, `${p.name} chỉ còn ${p.stock} sản phẩm`);
    totals.set(p.id, totalQty);
    const key = JSON.stringify([p.id, size, color]);
    const line = lines.get(key) || {
      product_id: p.id, name: p.name, category: p.category, subCategory: p.subCategory,
      shippingWeightG: p.shippingWeightG, shippingLengthCm: p.shippingLengthCm,
      shippingWidthCm: p.shippingWidthCm, shippingHeightCm: p.shippingHeightCm,
      price: p.salePrice || p.price, size, color, quantity: 0,
    };
    line.quantity += quantity;
    if (line.quantity > 99) throw new HttpError(400, 'Mỗi biến thể tối đa 99 sản phẩm');
    lines.set(key, line);
  }
  const items = [...lines.values()]; const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  let shippingFee = 30000; let discount = 0; let voucher = null;
  if (payload.voucherCode) {
    const code = text(payload.voucherCode, 'Mã voucher', 40).toUpperCase();
    voucher = db.data.vouchers.find(v => v.code === code);
    if (!voucher || !available(voucher)) throw new HttpError(400, 'Voucher không tồn tại, hết hạn hoặc hết lượt');
    if (subtotal < voucher.minOrder) throw new HttpError(400, `Voucher yêu cầu đơn từ ${voucher.minOrder.toLocaleString('vi-VN')}đ`);
    if (voucher.type === 'shipping') shippingFee = 0;
    else {
      discount = voucher.type === 'percent' ? Math.floor(subtotal * voucher.value / 100) : voucher.value;
      if (voucher.maxDiscount) discount = Math.min(discount, voucher.maxDiscount);
      discount = Math.min(discount, subtotal);
    }
  }
  const parcel = require('./shipping/parcels').estimateOrderParcel(items);
  return { items, parcel, subtotal, shippingFee, discount, total: subtotal - discount + shippingFee, voucherCode: voucher?.code || null, voucherId: voucher?.id || null };
}
function createOrder(db, payload, userId = null) {
  const c = payload?.customer;
  if (!c) throw new HttpError(400, 'Thiếu thông tin khách hàng');
  const name = text(c.name, 'Họ tên'); const address = text(c.address, 'Địa chỉ', 1000); const phone = normalizeVietnamPhone(text(c.phone, 'Số điện thoại', 20));
  if (!isVietnamMobilePhone(phone)) throw new HttpError(400, 'Số nhận hàng cần là số di động Việt Nam 10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.');
  const email = text(c.email || '', 'Email', 254, false);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Email không hợp lệ');
  const province = text(c.city || c.province || '', 'Tỉnh/thành', 200, false);
  const ward = text(c.ward || '', 'Phường/xã', 200, false);
  const district = text(c.district || '', 'Quận/huyện', 200, false);
  const line1 = text(c.addressLine || '', 'Số nhà, đường', 500, false);
  const hasShippingAddress = Boolean(province || ward || district || line1);
  if (hasShippingAddress && (!province || !ward || !line1)) throw new HttpError(400, 'Địa chỉ giao hàng cần có tỉnh/thành, phường/xã và số nhà/tên đường.');
  const shippingAddress = hasShippingAddress ? { province, ward, district, line1 } : null;
  if (payload.paymentMethod && payload.paymentMethod !== 'cod') throw new HttpError(400, 'Hiện chỉ hỗ trợ thanh toán COD');
  const quote = quoteOrder(db, payload);
  if (payload.expectedTotal !== undefined && payload.expectedTotal !== quote.total) {
    throw new HttpError(409, 'Giá hoặc ưu đãi đã thay đổi. Vui lòng kiểm tra lại tổng thanh toán.');
  }
  return transaction(db, () => {
    const order = { id: db.data.nextOrderId++, customer_name: name, phone, email, address, shippingAddress, user_id: userId, paymentMethod: 'cod', paymentStatus: 'unpaid', ...quote, status: 'new', created_at: new Date().toISOString() };
    for (const line of quote.items) db.data.products.find(p => p.id === line.product_id).stock -= line.quantity;
    if (quote.voucherId) db.data.vouchers.find(v => v.id === quote.voucherId).used++;
    db.data.orders.push(order);
    const buyer = db.data.users.find(u => u.id === userId);
    if (buyer) buyer.cart = [];
    return order;
  });
}
const TRANSITIONS = { new: ['confirmed', 'cancelled'], confirmed: ['shipping', 'cancelled'], shipping: ['done', 'cancelled'], done: [], cancelled: [] };
function updateOrderStatus(db, id, status) {
  if (!Object.hasOwn(TRANSITIONS, status)) throw new HttpError(400, 'Trạng thái không hợp lệ');
  const order = db.data.orders.find(o => o.id === id);
  if (!order) throw new HttpError(404, 'Không tìm thấy đơn hàng');
  if (order.status === status) return clone(order);
  if (!TRANSITIONS[order.status]?.includes(status)) throw new HttpError(409, 'Không thể chuyển sang trạng thái này');
  if (status === 'cancelled' && order.paymentStatus === 'paid') throw new HttpError(409, 'Đơn đã thu tiền cần xử lý hoàn tiền trước khi hủy');
  return transaction(db, () => {
    if (status === 'cancelled') {
      for (const item of order.items) {
        const p = db.data.products.find(p => p.id === item.product_id);
        if (p) p.stock += item.quantity;
      }
      const v = db.data.vouchers.find(v => v.id === order.voucherId);
      if (v) v.used = Math.max(0, v.used - 1);
    }
    order.status = status;
    return order;
  });
}
function markOrderPaid(db, id) {
  const order = db.data.orders.find(item => item.id === id);
  if (!order) throw new HttpError(404, 'Không tìm thấy đơn hàng');
  if (order.paymentMethod !== 'cod' || !['shipping', 'done'].includes(order.status)) throw new HttpError(409, 'Chỉ xác nhận COD đã thu khi đơn đang giao hoặc hoàn thành');
  if (order.paymentStatus === 'paid') return clone(order);
  return transaction(db, () => { order.paymentStatus = 'paid'; order.paidAt = new Date().toISOString(); return order; });
}
function updateOrderPhone(db, id, value) {
  const order = db.data.orders.find(item => item.id === id);
  if (!order) throw new HttpError(404, 'Không tìm thấy đơn hàng');
  if (!['new', 'confirmed'].includes(order.status) || order.shipment?.trackingNumber) {
    throw new HttpError(409, 'Chỉ sửa số nhận hàng trước khi tạo vận đơn.');
  }
  const phone = normalizeVietnamPhone(text(value, 'Số điện thoại', 20));
  if (!isVietnamMobilePhone(phone)) {
    throw new HttpError(400, 'Số nhận hàng cần là số di động Việt Nam 10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.');
  }
  return transaction(db, () => { order.phone = phone; return order; });
}
function saveShipment(db, id, input) {
  const order = db.data.orders.find(item => item.id === id);
  if (!order) throw new HttpError(404, 'Không tìm thấy đơn hàng');
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, 'Thông tin vận chuyển không hợp lệ');
  const carrier = text(input.carrier || '', 'Đơn vị vận chuyển', 100, false);
  const trackingNumber = text(input.trackingNumber || '', 'Mã vận đơn', 120, false);
  const trackingUrl = text(input.trackingUrl || '', 'Đường dẫn tra cứu', 1000, false);
  if (trackingUrl && !/^https:\/\//i.test(trackingUrl)) throw new HttpError(400, 'Đường dẫn tra cứu phải dùng HTTPS');
  if ((carrier || trackingNumber || trackingUrl) && (!carrier || !trackingNumber)) throw new HttpError(400, 'Nhập cả đơn vị vận chuyển và mã vận đơn');
  if (order.status === 'cancelled') throw new HttpError(409, 'Không thể cập nhật vận chuyển cho đơn đã hủy');
  return transaction(db, () => {
    order.shipment = carrier ? { carrier, trackingNumber, trackingUrl, updatedAt: new Date().toISOString() } : null;
    return order;
  });
}
module.exports = { saveProduct, deleteProduct, saveVoucher, deleteVoucher, saveCategory, deleteCategory, available, quoteOrder, createOrder, updateOrderStatus, markOrderPaid, updateOrderPhone, saveShipment, TRANSITIONS };
