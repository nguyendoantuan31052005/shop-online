const { DatabaseSync } = require('node:sqlite');

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

function openDb(file = ':memory:', { seed = true } = {}) {
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL CHECK (price >= 0),
      stock INTEGER NOT NULL CHECK (stock >= 0),
      emoji TEXT NOT NULL DEFAULT '📦',
      description TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      total INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0)
    );
  `);

  if (seed) {
    const { n } = db.prepare('SELECT COUNT(*) AS n FROM products').get();
    if (n === 0) {
      const ins = db.prepare(
        'INSERT INTO products (name, category, price, stock, emoji, description) VALUES (?,?,?,?,?,?)'
      );
      for (const p of SEED_PRODUCTS) ins.run(...p);
    }
  }
  return db;
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function listProducts(db, { q = '', category = '' } = {}) {
  const like = `%${q.trim()}%`;
  return db
    .prepare(
      `SELECT * FROM products
       WHERE (name LIKE ? OR description LIKE ?) AND (? = '' OR category = ?)
       ORDER BY id`
    )
    .all(like, like, category, category)
    .map((p) => ({ ...p }));
}

function listCategories(db) {
  return db.prepare('SELECT DISTINCT category FROM products ORDER BY category').all().map((r) => r.category);
}

function getProduct(db, id) {
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  return p ? { ...p } : null;
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

  db.exec('BEGIN IMMEDIATE');
  try {
    let total = 0;
    const lines = [];
    const seen = new Set();
    for (const it of items) {
      const qty = Number(it.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
        throw new HttpError(400, 'Số lượng không hợp lệ');
      }
      const pid = Number(it.productId);
      if (seen.has(pid)) throw new HttpError(400, 'Sản phẩm bị trùng trong giỏ hàng');
      seen.add(pid);
      const p = db.prepare('SELECT * FROM products WHERE id = ?').get(pid);
      if (!p) throw new HttpError(400, `Sản phẩm #${it.productId} không tồn tại`);
      if (p.stock < qty) throw new HttpError(409, `"${p.name}" chỉ còn ${p.stock} sản phẩm`);
      total += p.price * qty; // giá luôn lấy từ server, không tin client
      lines.push({ p, qty });
    }

    const { lastInsertRowid: orderId } = db
      .prepare('INSERT INTO orders (customer_name, phone, address, total) VALUES (?,?,?,?)')
      .run(c.name.trim(), c.phone.trim(), c.address.trim(), total);

    for (const { p, qty } of lines) {
      db.prepare('INSERT INTO order_items (order_id, product_id, name, price, quantity) VALUES (?,?,?,?,?)')
        .run(orderId, p.id, p.name, p.price, qty);
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(qty, p.id);
    }
    db.exec('COMMIT');
    return getOrder(db, Number(orderId));
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

function getOrder(db, id) {
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!o) return null;
  const items = db.prepare('SELECT product_id, name, price, quantity FROM order_items WHERE order_id = ?').all(id);
  return { ...o, items: items.map((i) => ({ ...i })) };
}

function listOrders(db) {
  return db
    .prepare('SELECT id FROM orders ORDER BY id DESC LIMIT 200')
    .all()
    .map((o) => getOrder(db, o.id));
}

const STATUSES = ['new', 'confirmed', 'shipping', 'done', 'cancelled'];

function updateOrderStatus(db, id, status) {
  if (!STATUSES.includes(status)) throw new HttpError(400, 'Trạng thái không hợp lệ');
  const r = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  if (r.changes === 0) throw new HttpError(404, 'Không tìm thấy đơn hàng');
  return getOrder(db, id);
}

module.exports = {
  openDb, HttpError, listProducts, listCategories, getProduct,
  createOrder, getOrder, listOrders, updateOrderStatus, STATUSES,
};
