'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { openDb } = require('../src/db');
const { repairBrokenProductPhotos } = require('../src/product-images');

test('Broken seeded product photos are repaired to existing, relevant local images', () => {
  const db = openDb(':memory:');
  assert.equal(repairBrokenProductPhotos(db), 5);
  for (const [id, image] of [[5, '/images/catalog/cap.jpg'], [10, '/images/catalog/coffee.jpg'], [45, '/images/catalog/books.jpg'], [48, '/images/catalog/blender.jpg'], [70, '/images/catalog/product-70.jpg']]) {
    assert.equal(db.data.products.find(product => product.id === id).image, image);
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'public', image)));
  }
  assert.equal(repairBrokenProductPhotos(db), 0);
  db.close();
});
