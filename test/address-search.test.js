const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/vietnam-addresses.json'), 'utf8'));
const script = fs.readFileSync(path.join(__dirname, '../public/js/address-search.js'), 'utf8');
const context = vm.createContext({});
vm.runInContext(script.slice(0, script.indexOf('(() => {')), context);

test('Address suggestions find Vietnamese names without accents and include the parent province', () => {
  const results = context.findAddresses(data, 'ba dinh ha noi');
  assert.ok(results.length > 0);
  assert.ok(results.some(item => item.ward === 'Phường Ba Đình' && item.city === 'Thành phố Hà Nội'));
  assert.equal(context.findAddresses(data, '  ').length, 0);
  assert.equal(context.findAddresses(data, 'zzzzzzzz').length, 0);
  assert.ok(context.findAddresses(data, 'ha').length <= 20);
});

test('Bundled address data has unique provinces and ward codes', () => {
  assert.equal(data.length, 34);
  assert.equal(new Set(data.map(p => p.code)).size, data.length);
  const codes = new Set();
  for (const province of data) {
    assert.ok(province.name && province.wards.length);
    for (const ward of province.wards) {
      assert.ok(ward.name);
      assert.ok(Number.isInteger(ward.code));
      assert.ok(!codes.has(ward.code));
      codes.add(ward.code);
    }
  }
});
