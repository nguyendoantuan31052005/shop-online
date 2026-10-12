const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('Storefront no longer renders or accesses the removed LifeWear section', () => {
  const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
  assert.doesNotMatch(html, /Nam \| LifeWear|id="menNav"|id="menCollections"/);
  const script = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(match =>
    fs.readFileSync(path.join(__dirname, '../public', match[1]), 'utf8')).join('\n');
  new vm.Script(script);
  assert.doesNotMatch(script, /menNav|menCollections|renderMenFeatures|renderMenCollectionGroups/);
});
