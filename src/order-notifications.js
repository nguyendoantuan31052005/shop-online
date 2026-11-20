'use strict';

function createOrderNotifications({ sendMessage } = {}) {
  function send(order, subject, message) {
    if (!sendMessage || !order?.email) return;
    Promise.resolve(sendMessage({ to: order.email, subject, text: message }))
      .catch(() => console.error('Order email notification failed'));
  }

  return {
    created(order) {
      send(order, `Đã nhận đơn hàng #${order.id}`,
        `Home Shopping đã nhận đơn hàng #${order.id}.\nTổng thanh toán: ${Number(order.total).toLocaleString('vi-VN')}đ.\nPhương thức: ${order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : order.paymentMethod}.\nShop sẽ cập nhật trạng thái xử lý trong tài khoản của bạn.`);
    },
    statusChanged(order) {
      const labels = { confirmed: 'đã xác nhận', shipping: 'đang giao', done: 'đã hoàn thành', cancelled: 'đã hủy' };
      const label = labels[order.status];
      if (!label) return;
      const shipment = order.shipment?.trackingNumber
        ? `\nĐơn vị vận chuyển: ${order.shipment.carrier}. Mã vận đơn: ${order.shipment.trackingNumber}.${order.shipment.trackingUrl ? ` Tra cứu: ${order.shipment.trackingUrl}` : ''}`
        : '';
      send(order, `Cập nhật đơn hàng #${order.id}`,
        `Đơn hàng #${order.id} của bạn ${label}.${shipment}\nTổng đơn: ${Number(order.total).toLocaleString('vi-VN')}đ.`);
    },
    shipmentUpdated(order) {
      if (!order.shipment?.trackingNumber) return;
      send(order, `Thông tin vận chuyển đơn #${order.id}`,
        `Đơn hàng #${order.id} đang được vận chuyển bởi ${order.shipment.carrier}.\nMã vận đơn: ${order.shipment.trackingNumber}.${order.shipment.trackingUrl ? `\nTra cứu: ${order.shipment.trackingUrl}` : ''}`);
    },
    paymentReceived(order) {
      send(order, `Đã ghi nhận thanh toán đơn #${order.id}`,
        `Shop đã ghi nhận thanh toán cho đơn #${order.id}.\nSố tiền: ${Number(order.total).toLocaleString('vi-VN')}đ.`);
    },
  };
}

module.exports = { createOrderNotifications };
