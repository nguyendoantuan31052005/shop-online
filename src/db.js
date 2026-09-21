// Lớp dữ liệu: lưu trong bộ nhớ và ghi ra 1 file JSON (không cần cài thư viện, chạy được trên Node >= 18).
const fs = require('fs');
const path = require('path');

const SEED_PRODUCTS = [
  ['Áo thun basic trắng', 'Thời trang', 149000, 50, '👕', 'Áo thun cotton 100%, form rộng thoải mái.'],
  ['Quần jeans slim fit', 'Thời trang', 399000, 30, '👖', 'Quần jeans co giãn nhẹ, dễ phối đồ.'],
  ['Giày sneaker trắng', 'Thời trang', 599000, 20, '👟', 'Giày sneaker đế êm, đi học đi chơi đều hợp.'],
  ['Balo laptop 15.6"', 'Phụ kiện', 329000, 25, '🎒', 'Balo chống nước, ngăn laptop có đệm.'],
  ['Mũ lưỡi trai', 'Phụ kiện', 89000, 60, '🧢', 'Mũ thêu logo, điều chỉnh được size.'],
  ['Kính râm thời trang', 'Phụ kiện', 199000, 40, '🕶️', 'Chống tia UV400.'],
  ['Tai nghe bluetooth', 'Điện tử', 499000, 35, '🎧', 'Pin 30 giờ, chống ồn cơ bản.'],
  ['Chuột không dây', 'Điện tử', 179000, 45, '🖱️', 'Kết nối 2.4GHz, pin AA dùng 12 tháng.'],
  ['Bàn phím cơ mini', 'Điện tử', 699000, 15, '⌨️', 'Switch red, đèn nền RGB.'],
  ['Cà phê rang xay 500g', 'Đồ ăn uống', 129000, 80, '☕', 'Robusta - Arabica nguyên chất, rang vừa.'],
  ['Trà xanh hộp 100g', 'Đồ ăn uống', 79000, 70, '🍵', 'Trà xanh Thái Nguyên hảo hạng.'],
  ['Bình giữ nhiệt 500ml', 'Gia dụng', 159000, 55, '🥤', 'Inox 304 giữ nóng 12 giờ, giữ lạnh 24 giờ.'],
];

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function seedData() {
  return {
    nextProductId: SEED_PRODUCTS.length + 1,
    nextOrderId: 1,
    products: SEED_PRODUCTS.map(([name, category, price, stock, emoji, description], i) => (
      { id: i + 1, name, category, price, stock, emoji, description }
    )),
    orders: [],
  };
}

/** Mở "cơ sở dữ liệu". file = ':memory:' thì chỉ giữ trong bộ nhớ (dùng cho test). */
function openDb(file = ':memory:', { seed = true } = {}) {
  const persistent = file !== ':memory:';
  let data;
  if (persistent && fs.existsSync(file)) {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } else {
    data = seed ? seedData() : { nextProductId: 1, nextOrderId: 1, products: [], orders: [] };
  }
  const db = {
    file,
    data,
    save() {
      if (!persistent) return;
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const tmp = `${file}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(db.data));
      fs.renameSync(tmp, file); // ghi file tạm rồi đổi tên để không bị hỏng dữ liệu giữa chừng
    },
    close() { db.save(); },
  };
  if (persistent && !fs.existsSync(file)) db.save();
  return db;
}

const clone = (x) => structuredClone(x);

function listProducts(db, { q = '', category = '' } = {}) {
  const kw = q.trim().toLowerCase();
  return clone(
    db.data.products.filter((p) =>
      (!kw || p.name.toLowerCase().includes(kw) || p.description.toLowerCase().includes(kw)) &&
      (!category || p.category === category))
  );
}

function listCategories(db) {
  return [...new Set(db.data.products.map((p) => p.category))].sort((a, b) => a.localeCompare(b, 'vi'));
}

function getProduct(db, id) {
  const p = db.data.products.find((x) => x.id === id);
  return p ? clone(p) : null;
}

function nowString() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function createOrder(db, payload) {
  const c = payload && payload.customer;
  const items = payload && payload.items;
  if (!c || !String(c.name || '').trim() || !String(c.address || '').trim()) {
    throw new HttpError(400, 'Vui lòng nhập họ tên và địa chỉ giao hàng');
  }
  if (!/^0\d{9,10}$/.test(String(c.phone || '').trim())) {
    throw new HttpError(400, 'Số điện thoại không hợp lệ');
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'Giỏ hàng trống');
  }

  // Bước 1: kiểm tra toàn bộ, chưa thay đổi dữ liệu gì
  let total = 0;
  const lines = [];
  const seen = new Set();
  for (const it of items) {
    const qty = Number(it.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) throw new HttpError(400, 'Số lượng không hợp lệ');
    const pid = Number(it.productId);
    if (seen.has(pid)) throw new HttpError(400, 'Sản phẩm bị trùng trong giỏ hàng');
    seen.add(pid);
    const p = db.data.products.find((x) => x.id === pid);
    if (!p) throw new HttpError(400, `Sản phẩm #${it.productId} không tồn tại`);
    if (p.stock < qty) throw new HttpError(409, `"${p.name}" chỉ còn ${p.stock} sản phẩm`);
    total += p.price * qty; // giá luôn lấy từ server, không tin client
    lines.push({ p, qty });
  }

  // Bước 2: ghi dữ liệu; nếu lưu file lỗi thì khôi phục lại như cũ
  const backup = clone(db.data);
  try {
    const order = {
      id: db.data.nextOrderId++,
      customer_name: c.name.trim(),
      phone: c.phone.trim(),
      address: c.address.trim(),
      total,
      status: 'new',
      created_at: nowString(),
      items: lines.map(({ p, qty }) => ({ product_id: p.id, name: p.name, price: p.price, quantity: qty })),
    };
    for (const { p, qty } of lines) p.stock -= qty;
    db.data.orders.push(order);
    db.save();
    return clone(order);
  } catch (err) {
    db.data = backup;
    throw err;
  }
}

function getOrder(db, id) {
  const o = db.data.orders.find((x) => x.id === id);
  return o ? clone(o) : null;
}

function listOrders(db) {
  return clone([...db.data.orders].sort((a, b) => b.id - a.id).slice(0, 200));
}

const STATUSES = ['new', 'confirmed', 'shipping', 'done', 'cancelled'];

function updateOrderStatus(db, id, status) {
  if (!STATUSES.includes(status)) throw new HttpError(400, 'Trạng thái không hợp lệ');
  const o = db.data.orders.find((x) => x.id === id);
  if (!o) throw new HttpError(404, 'Không tìm thấy đơn hàng');
  o.status = status;
  db.save();
  return clone(o);
}

module.exports = {
  openDb, HttpError, listProducts, listCategories, getProduct,
  createOrder, getOrder, listOrders, updateOrderStatus, STATUSES,
};
