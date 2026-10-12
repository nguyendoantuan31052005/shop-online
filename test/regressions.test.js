const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { openDb, createUser } = require('../src/db');
const { createApp } = require('../src/app');

test('Invalid request bodies and paths return client errors; stock reflects actual variants', async t => {
  const db = openDb();
  const server = createApp({ db });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const body of ['null', '[]', '42', '"text"']) {
    const res = await fetch(base + '/api/auth/login', { method: 'POST', body });
    assert.equal(res.status, 400);
  }
  assert.equal((await fetch(base + '/%ZZ')).status, 400);
  assert.equal((await fetch(base + '/%00')).status, 400);
  assert.equal((await fetch(base + '/api/v1/vn/vi/products/999999/stock')).status, 404);
  const product = db.data.products[2];
  const stock = await (await fetch(base + `/api/v1/vn/vi/products/${product.id}/stock`)).json();
  assert.equal(stock.variants.length, product.sizes.length * product.colors.length);
  assert.ok(stock.variants.every(v => product.sizes.includes(v.size) && product.colors.includes(v.color)));
  const recommend = body => fetch(base + '/api/v1/vn/vi/size-recommendation', { method: 'POST', body: JSON.stringify(body) });
  assert.equal((await recommend({})).status, 400);
  assert.equal((await (await recommend({ height: 175, weight: 90, fit: 'loose' })).json()).recommendedSize, 'XL');
  const oversized = await fetch(base + '/api/checkout/quote', { method: 'POST', body: JSON.stringify({ value: 'a'.repeat(1_000_001) }) });
  assert.equal(oversized.status, 413);
  const first = await (await fetch(base + '/api/v1/vn/vi/products?limit=3&sort=price_asc')).json();
  const second = await (await fetch(base + '/api/v1/vn/vi/products?limit=3&page=2&sort=price_asc')).json();
  assert.equal(first.items.length, 3);
  assert.equal(second.items.length, 3);
  assert.ok(second.items.every(p => !first.items.some(x => x.id === p.id)));
  assert.ok(first.items[2].price <= second.items[0].price);
  assert.ok(first.meta.total > 3);
  assert.equal((await fetch(base + '/api/v1/vn/vi/products?page=-1')).status, 400);
});

test('Account names cannot collide with another account email or differ only by case', () => {
  const db = openDb();
  createUser(db, { name: 'Alice', username: 'Alice', email: 'alice@example.com', password: 'password123' });
  for (const details of [{ username: 'ALICE' }, { username: 'alice@example.com' }, { username: 'Other', email: 'alice@example.com' }]) {
    assert.throws(() => createUser(db, { name: 'Other', password: 'password123', ...details }), e => e.status === 409);
  }
});

test('Registration rolls back on save failure and rejects non-string credentials', () => {
  const db = openDb();
  const user = { name: 'Test', username: 'test', password: 'password123' };
  assert.throws(() => createUser(db, { ...user, password: {} }), e => e.status === 400);
  const before = structuredClone(db.data);
  db.save = () => { throw new Error('disk full'); };
  assert.throws(() => createUser(db, user), /disk full/);
  assert.deepEqual(db.data, before);
});

test('Legacy data recovers all counters from existing ids and initializes missing orders', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shop-regression-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'shop.json');
  fs.writeFileSync(file, JSON.stringify({ products: [{ id: 100 }], users: [{ id: 80 }], orders: [{ id: 90 }], vouchers: [{ id: 70 }], nextUserId: 1 }));
  const db = openDb(file);
  assert.equal(db.data.nextProductId, 101);
  assert.equal(db.data.nextUserId, 81);
  assert.equal(db.data.nextOrderId, 91);
  assert.equal(db.data.nextVoucherId, 71);
  fs.writeFileSync(file, '{}');
  assert.deepEqual(openDb(file).data.orders, []);
});
