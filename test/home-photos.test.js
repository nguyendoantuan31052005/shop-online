const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { addHomePhotos } = require('../src/home-photos');
const { openDb } = require('../src/db');
test('Photo migration replaces only matching illustrations and leaves custom images and prices intact', () => {
  const data = { products: [{ id: 71, name: 'Đèn bàn Nordic', subCategory: 'home', image: '/images/home-lamp.svg', stock: 4, price: 123 }, { id: 72, name: 'Đèn ngủ để bàn', subCategory: 'home', image: '/uploads/my-image.jpg' }], homePhotoVersion: 2 };
  addHomePhotos(data);
  assert.equal(data.products[0].image, '/images/products/lamp.jpg');
  assert.equal(data.products[0].stock, 4); assert.equal(data.products[0].price, 123);
  assert.equal(data.products[1].image, '/uploads/my-image.jpg');
  const snapshot = structuredClone(data); addHomePhotos(data); assert.deepEqual(data, snapshot);
});
test('All assigned product photos exist locally and have valid JPEG headers', () => {
  const db = openDb(':memory:');
  const products = db.data.products.filter(item => item.image.startsWith('/images/products/'));
  assert.ok(products.length >= 9);
  for (const product of products) {
    const bytes = fs.readFileSync(path.join(__dirname, '../public', product.image));
    assert.equal(bytes[0], 255); assert.equal(bytes[1], 216); assert.ok(bytes.length > 10000);
  }
});
