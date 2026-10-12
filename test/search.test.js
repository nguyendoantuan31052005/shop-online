const { test } = require('node:test');
const assert = require('node:assert/strict');
const { openDb, listProducts } = require('../src/db');
test('Search supports Vietnamese without accents, word order, category and colors', () => {
  const db = openDb();
  for (const q of ['ao thun', 'ÁO THUN', '  thun   ao ', 'điện tử', 'dien tu', 'xanh navy']) {
    assert.ok(listProducts(db, { q }).length > 0, q);
  }
  assert.deepEqual(listProducts(db, { q: 'ao thun' }).map(p => p.id), listProducts(db, { q: 'ÁO THUN' }).map(p => p.id));
  assert.equal(listProducts(db, { q: 'zzzzunknown123' }).length, 0);
  assert.ok(listProducts(db, { q: 'ao', category: 'quan' }).every(p => p.subCategory === 'quan'));
});
