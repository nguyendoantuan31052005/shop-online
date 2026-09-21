const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');
const { openDb } = require('../src/db');

let server, base, db;
const ADMIN = { 'x-admin-token': 'test-token' };
const customer = { name: 'Nguyễn Văn A', phone: '0901234567', address: '12 Bạch Đằng, Đà Nẵng' };

const post = (url, body, headers = {}) =>
  fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });

before(async () => {
  db = openDb(':memory:');
  server = createApp({ db, adminToken: 'test-token', version: 'test' });
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => { server.close(); db.close(); });

test('GET /health', async () => {
  const res = await fetch(`${base}/health`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual((await res.json()).status, 'ok');
});

test('GET / trả về trang HTML cửa hàng', async () => {
  const res = await fetch(`${base}/`);
  assert.strictEqual(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);
});

test('Danh sách sản phẩm, tìm kiếm và lọc danh mục', async () => {
  const all = await (await fetch(`${base}/api/products`)).json();
  assert.ok(all.length >= 10);

  const search = await (await fetch(`${base}/api/products?q=${encodeURIComponent('tai nghe')}`)).json();
  assert.ok(search.length >= 1 && search.every((p) => /tai nghe/i.test(p.name + p.description)));

  const cat = await (await fetch(`${base}/api/products?category=${encodeURIComponent('Điện tử')}`)).json();
  assert.ok(cat.length >= 1 && cat.every((p) => p.category === 'Điện tử'));

  const cats = await (await fetch(`${base}/api/categories`)).json();
  assert.ok(cats.includes('Thời trang'));
});

test('Chi tiết sản phẩm và 404', async () => {
  assert.strictEqual((await fetch(`${base}/api/products/1`)).status, 200);
  assert.strictEqual((await fetch(`${base}/api/products/99999`)).status, 404);
});

test('Đặt hàng thành công: tính tổng tiền ở server và trừ tồn kho', async () => {
  const before = await (await fetch(`${base}/api/products/1`)).json();
  const res = await post('/api/orders', { customer, items: [{ productId: 1, quantity: 2 }, { productId: 5, quantity: 1 }] });
  assert.strictEqual(res.status, 201);
  const order = await res.json();
  assert.strictEqual(order.status, 'new');
  assert.strictEqual(order.items.length, 2);
  const p5 = await (await fetch(`${base}/api/products/5`)).json();
  assert.strictEqual(order.total, before.price * 2 + p5.price);

  const after = await (await fetch(`${base}/api/products/1`)).json();
  assert.strictEqual(after.stock, before.stock - 2);
});

test('Đặt vượt tồn kho bị từ chối (409) và không trừ kho', async () => {
  const before = await (await fetch(`${base}/api/products/9`)).json();
  const res = await post('/api/orders', { customer, items: [{ productId: 9, quantity: 99 }] });
  assert.strictEqual(res.status, 409);
  const after = await (await fetch(`${base}/api/products/9`)).json();
  assert.strictEqual(after.stock, before.stock);
});

test('Dữ liệu đặt hàng không hợp lệ trả về 400', async () => {
  assert.strictEqual((await post('/api/orders', { customer, items: [] })).status, 400);
  assert.strictEqual((await post('/api/orders', { customer: { ...customer, phone: '123' }, items: [{ productId: 1, quantity: 1 }] })).status, 400);
  assert.strictEqual((await post('/api/orders', { customer, items: [{ productId: 1, quantity: -1 }] })).status, 400);
  assert.strictEqual((await post('/api/orders', { customer, items: [{ productId: 424242, quantity: 1 }] })).status, 400);
});

test('Tra cứu đơn cần đúng số điện thoại', async () => {
  const order = await (await post('/api/orders', { customer, items: [{ productId: 3, quantity: 1 }] })).json();
  assert.strictEqual((await fetch(`${base}/api/orders/${order.id}?phone=${customer.phone}`)).status, 200);
  assert.strictEqual((await fetch(`${base}/api/orders/${order.id}?phone=0999999999`)).status, 404);
});

test('API quản trị: cần token, xem và đổi trạng thái đơn', async () => {
  assert.strictEqual((await fetch(`${base}/api/admin/orders`)).status, 401);

  const list = await fetch(`${base}/api/admin/orders`, { headers: ADMIN });
  assert.strictEqual(list.status, 200);
  const orders = await list.json();
  assert.ok(orders.length >= 1);

  const patch = await fetch(`${base}/api/admin/orders/${orders[0].id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', ...ADMIN }, body: JSON.stringify({ status: 'shipping' }),
  });
  assert.strictEqual(patch.status, 200);
  assert.strictEqual((await patch.json()).status, 'shipping');

  const bad = await fetch(`${base}/api/admin/orders/${orders[0].id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', ...ADMIN }, body: JSON.stringify({ status: 'xyz' }),
  });
  assert.strictEqual(bad.status, 400);
});

test('Không đọc được file ngoài thư mục public (path traversal)', async () => {
  const res = await fetch(`${base}/..%2Fsrc%2Fdb.js`);
  assert.ok([403, 404].includes(res.status));
});
