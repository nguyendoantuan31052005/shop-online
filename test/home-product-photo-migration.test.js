const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { openDb } = require('../src/db');
const { addHomeCatalogExpansion, BATCH } = require('../src/home-catalog-expansion');
const photoMap = require('../src/home-product-photos.json');

test('All expanded home products migrate to locally hosted real photo files', () => {
  const db = openDb(':memory:');
  const products = db.data.products.filter(item => item.catalogBatch === BATCH);
  assert.equal(products.length, 1000);
  assert.ok(products.every(item => !item.image.endsWith('.svg')));
  for (const product of products) {
    assert.ok(photoMap[product.imageType]?.includes(product.image), `${product.sku} has a mapped photo`);
    assert.equal(product.images[0], product.image);
    const file = path.join(__dirname, '../public', product.image);
    assert.ok(fs.existsSync(file), `${product.sku} photo exists on disk`);
    const bytes = fs.readFileSync(file);
    assert.ok(bytes.length > 8_000, `${product.sku} photo is not an empty placeholder`);
    const ext = path.extname(file).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') assert.equal(bytes[0] === 0xff && bytes[1] === 0xd8, true);
    if (ext === '.webp') assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  }
  const snapshot = structuredClone(db.data);
  assert.equal(addHomeCatalogExpansion(db.data), 0);
  assert.deepEqual(db.data, snapshot);
});

test('Photo migration preserves an image selected by the shop owner', () => {
  const data = {
    products: [{ catalogBatch: BATCH, sku: 'HSX-0001', imageType: 'tray', image: '/uploads/shop-photo.jpg', images: ['/uploads/detail.jpg'] }],
    homeCatalogExpansionVersion: 3,
  };
  addHomeCatalogExpansion(data);
  assert.equal(data.products[0].image, '/uploads/shop-photo.jpg');
  assert.deepEqual(data.products[0].images, ['/uploads/detail.jpg']);
  assert.equal(data.homeCatalogExpansionVersion, 4);
});
