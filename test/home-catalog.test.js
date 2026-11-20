const { test } = require('node:test');
const assert = require('node:assert/strict');
const { addHomeCatalog } = require('../src/home-catalog');
test('Home catalog migration adds household products once and preserves existing records', () => {
  const original = { id: 55, name: 'Existing product', stock: 7 };
  const data = { products: [original], nextProductId: 56, orders: [{ id: 9 }], users: [{ id: 3 }] };
  addHomeCatalog(data);
  assert.equal(data.products.length, 51);
  assert.equal(data.nextProductId, 106);
  assert.equal(data.products[0], original);
  assert.equal(new Set(data.products.map(product => product.id)).size, 51);
  assert.equal(data.products[1].category, 'Trang trí');
  const snapshot = structuredClone(data);
  addHomeCatalog(data);
  assert.deepEqual(data, snapshot);
});
test('Existing home catalog receives only newer batches without replacing edited products', () => {
  const data = { homeCatalogVersion: 1, products: [{ id: 1, name: 'Edited lamp', stock: 2 }], nextProductId: 2 };
  addHomeCatalog(data);
  assert.equal(data.products.length, 43);
  assert.equal(data.products[0].name, 'Edited lamp');
  assert.equal(data.products[0].stock, 2);
  const snapshot = structuredClone(data);
  addHomeCatalog(data);
  assert.deepEqual(data, snapshot);
});
