const crypto = require('node:crypto');
const { HttpError } = require('./db');
const commerce = require('./commerce');
function transaction(db, work) {
  const backup = structuredClone(db.data);
  try { const result = work(); db.save(); return structuredClone(result); }
  catch (error) { db.data = backup; throw error; }
}
function text(value, max, required = true) {
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) throw new HttpError(400, 'Thông tin không hợp lệ');
  return value.trim();
}
function reviews(db, productId) {
  const items = (db.data.reviews || []).filter(review => review.productId === productId && !review.hidden).map(({ userId, hidden, ...review }) => review);
  return { items, count: items.length, average: items.length ? Math.round(items.reduce((sum, item) => sum + item.rating, 0) / items.length * 10) / 10 : 0 };
}
function customer(db, userId, route, method, body) {
  const user = db.data.users.find(item => item.id === userId);
  if (route === '/api/addresses') {
    if (method === 'GET') return { items: user.addresses || [] };
    if (method !== 'PUT') throw new HttpError(405, 'Phương thức không hỗ trợ');
    if (!Array.isArray(body.items) || body.items.length > 10) throw new HttpError(400, 'Tối đa 10 địa chỉ');
    const items = body.items.map(item => {
      if (!item || typeof item !== 'object') throw new HttpError(400, 'Địa chỉ không hợp lệ');
      const result = { id: text(item.id, 80), name: text(item.name, 200), phone: text(item.phone, 11), city: text(item.city, 200), ward: text(item.ward, 200), address: text(item.address, 500), district: text(item.district || '', 200, false), isDefault: item.isDefault === true };
      if (!/^0\d{9,10}$/.test(result.phone)) throw new HttpError(400, 'Số điện thoại không hợp lệ');
      return result;
    });
    if (new Set(items.map(item => item.id)).size !== items.length || items.filter(item => item.isDefault).length > 1) throw new HttpError(400, 'Địa chỉ bị trùng hoặc có nhiều địa chỉ mặc định');
    if (items.length && !items.some(item => item.isDefault)) items[0].isDefault = true;
    return transaction(db, () => { user.addresses = items; return { items }; });
  }
  const reviewMatch = route.match(/^\/api\/products\/(\d+)\/reviews$/);
  if (reviewMatch && method === 'POST') {
    const productId = Number(reviewMatch[1]);
    if (!db.data.products.some(product => product.id === productId)) throw new HttpError(404, 'Sản phẩm không tồn tại');
    if (!db.data.orders.some(order => order.user_id === userId && order.status === 'done' && order.items.some(item => item.product_id === productId))) throw new HttpError(403, 'Bạn cần mua và hoàn thành đơn hàng để đánh giá');
    if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) throw new HttpError(400, 'Chọn từ 1 đến 5 sao');
    const comment = text(body.comment, 2000);
    const images = body.images ?? [];
    if (!Array.isArray(images) || images.length > 3 || images.some(image => typeof image !== 'string' || !(user.pendingReviewImages || []).some(pending => pending.image === image && pending.productId === productId))) throw new HttpError(400, 'Ảnh đánh giá không hợp lệ');
    if ((db.data.reviews || []).some(review => review.userId === userId && review.productId === productId)) throw new HttpError(409, 'Bạn đã đánh giá sản phẩm này');
    return transaction(db, () => {
      const review = { id: crypto.randomUUID(), productId, userId, name: user.name, rating: body.rating, comment, images, createdAt: new Date().toISOString(), verified: true, hidden: false };
      user.pendingReviewImages = (user.pendingReviewImages || []).filter(image => !images.includes(image.image));
      (db.data.reviews ||= []).push(review);
      return reviews(db, productId);
    });
  }
  const reorder = route.match(/^\/api\/orders\/(\d+)\/reorder$/);
  if (reorder && method === 'POST') {
    const order = db.data.orders.find(item => item.id === Number(reorder[1]) && item.user_id === userId);
    if (!order) throw new HttpError(404, 'Không tìm thấy đơn của bạn');
    const combined = [...(user.cart || []).map(item => ({ ...item })), ...order.items.map(item => ({ productId: item.product_id, quantity: item.quantity, size: item.size, color: item.color }))];
    const quote = commerce.quoteOrder(db, { items: combined });
    return transaction(db, () => { user.cart = quote.items.map(item => ({ productId: item.product_id, quantity: item.quantity, size: item.size, color: item.color })); return { added: order.items.length }; });
  }
  if (route === '/api/support') {
    if (method === 'GET') return { items: (db.data.support || []).filter(item => item.userId === userId).slice().reverse() };
    if (method !== 'POST') throw new HttpError(405, 'Phương thức không hỗ trợ');
    const order = db.data.orders.find(item => item.id === body.orderId && item.user_id === userId);
    if (!order) throw new HttpError(404, 'Không tìm thấy đơn của bạn');
    if (!['question', 'return'].includes(body.type)) throw new HttpError(400, 'Loại yêu cầu không hợp lệ');
    if (body.type === 'return' && order.status !== 'done') throw new HttpError(409, 'Chỉ gửi yêu cầu đổi trả cho đơn hoàn thành');
    const message = text(body.message, 3000);
    if ((db.data.support || []).some(item => item.orderId === order.id && !['resolved', 'rejected'].includes(item.status))) throw new HttpError(409, 'Đơn này đã có yêu cầu đang xử lý');
    return transaction(db, () => {
      const ticket = { id: crypto.randomUUID(), userId, orderId: order.id, name: user.name, type: body.type, message, status: 'open', reply: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      (db.data.support ||= []).push(ticket); return ticket;
    });
  }
  throw new HttpError(405, 'Phương thức không hỗ trợ');
}
function admin(db, route, method, body) {
  if (route === '/api/admin/support' && method === 'GET') return (db.data.support || []).slice().reverse();
  if (route === '/api/admin/reviews' && method === 'GET') return (db.data.reviews || []).slice().reverse();
  const ticketMatch = route.match(/^\/api\/admin\/support\/([a-f0-9-]+)$/);
  if (ticketMatch && method === 'PATCH') {
    const ticket = (db.data.support || []).find(item => item.id === ticketMatch[1]);
    if (!ticket) throw new HttpError(404, 'Không tìm thấy yêu cầu');
    if (!['open', 'reviewing', 'resolved', 'rejected'].includes(body.status)) throw new HttpError(400, 'Trạng thái không hợp lệ');
    const reply = text(body.reply, 3000, false);
    return transaction(db, () => Object.assign(ticket, { status: body.status, reply, updatedAt: new Date().toISOString() }));
  }
  const reviewMatch = route.match(/^\/api\/admin\/reviews\/([a-f0-9-]+)$/);
  if (reviewMatch && method === 'PATCH') {
    const review = (db.data.reviews || []).find(item => item.id === reviewMatch[1]);
    if (!review) throw new HttpError(404, 'Không tìm thấy đánh giá');
    if (typeof body.hidden !== 'boolean') throw new HttpError(400, 'Trạng thái không hợp lệ');
    return transaction(db, () => { review.hidden = body.hidden; return review; });
  }
  throw new HttpError(405, 'Phương thức không hỗ trợ');
}
module.exports = { reviews, customer, admin };
