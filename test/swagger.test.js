const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const { openDb } = require('../src/db');
const { TRANSITIONS } = require('../src/commerce');

test('Swagger serves the live API specification and preserves authentication', async () => {
  const db = openDb(':memory:');
  const server = createApp({ db, adminToken: 'swagger-test-secret', version: 'swagger-test' });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const route of ['/api-docs', '/api-docs/', '/swagger', '/swagger/']) {
      const response = await fetch(base + route);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /text\/html/);
      assert.match(await response.text(), /swagger-ui/);
    }
    const response = await fetch(base + '/api/openapi.json');
    assert.equal(response.status, 200);
    const spec = await response.json();
    assert.equal(spec.openapi, '3.0.3');
    assert.equal(spec.info.version, 'swagger-test');
    assert.equal(spec.servers[0].url, '/');
    assert.deepEqual(spec.paths['/api/orders'].post.security, [{ CustomerBearer: [] }]);
    assert.deepEqual(spec.paths['/api/admin/orders/{id}'].patch.requestBody.content['application/json'].schema.properties.status.enum, Object.keys(TRANSITIONS));
    assert.equal(JSON.stringify(spec).includes('swagger-test-secret'), false);
    for (const [route, operations] of Object.entries(spec.paths)) {
      for (const operation of Object.values(operations)) {
        for (const [, name] of route.matchAll(/\{(\w+)\}/g)) {
          assert.ok(operation.parameters.some(p => p.in === 'path' && p.name === name && p.required));
        }
      }
    }
    assert.equal((await fetch(base + '/api/admin/stats')).status, 401);
    assert.equal((await fetch(base + '/api/auth/me')).status, 401);
    assert.equal((await fetch(base + '/swagger-init.js')).status, 200);
    for (const asset of ['/vendor/swagger-ui/swagger-ui.css', '/vendor/swagger-ui/swagger-ui-bundle.js']) {
      const res = await fetch(base + asset);
      assert.equal(res.status, 200);
      assert.ok((await res.text()).length > 10000);
    }
    const operationIds = new Set();
    for (const operations of Object.values(spec.paths)) {
      for (const operation of Object.values(operations)) {
        assert.ok(!operationIds.has(operation.operationId));
        operationIds.add(operation.operationId);
        for (const response of Object.values(operation.responses)) assert.ok(Object.keys(response.content['application/json'].schema).length > 0);
      }
    }
    const login = await fetch(base + '/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'swagger-test-secret' }) });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const product = { name: 'Swagger product', category: 'Demo', price: 100000, stock: 3, sizes: ['M'], colors: ['Đen'] };
    const headers = { 'Content-Type': 'application/json', Cookie: cookie, 'X-Requested-With': 'shop-admin' };
    assert.equal((await fetch(base + '/api/admin/products', { method: 'POST', headers: { ...headers, 'X-Requested-With': '' }, body: JSON.stringify(product) })).status, 401);
    const created = await fetch(base + '/api/admin/products', { method: 'POST', headers, body: JSON.stringify(product) });
    assert.equal(created.status, 201);
    const saved = await created.json();
    const signup = await fetch(base + '/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Swagger customer', username: 'swagger-customer', password: 'Testing123!' }) });
    assert.equal(signup.status, 201);
    const { token } = await signup.json();
    const placed = await fetch(base + '/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ customer: { name: 'Swagger customer', phone: '0901234567', address: '12 Test' }, items: [{ productId: saved.id, quantity: 1 }], paymentMethod: 'cod' }) });
    assert.equal(placed.status, 201);
    const order = await placed.json();
    for (const status of ['confirmed', 'shipping', 'done']) {
      const updated = await fetch(base + '/api/admin/orders/' + order.id, { method: 'PATCH', headers, body: JSON.stringify({ status }) });
      assert.equal(updated.status, 200);
      assert.equal((await updated.json()).status, status);
    }
    assert.equal(db.data.products.find(p => p.id === saved.id).stock, 2);
  } finally {
    const closed = new Promise(resolve => server.close(resolve));
    server.closeAllConnections(); server.closeIdleConnections();
    await closed;
    db.close();
  }
});
