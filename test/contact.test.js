const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const { openDb } = require('../src/db');
const { getContact, saveContact } = require('../src/contact');

test('Contact settings enforce admin auth, validate links, and expose only public fields', async () => {
  const db = openDb(':memory:');
  const server = createApp({ db, adminToken: 'contact-test-admin' });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const put = (data, authenticated = true) => fetch(base + '/api/admin/contact', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(authenticated ? { 'x-admin-token': 'contact-test-admin' } : {}) }, body: JSON.stringify(data) });
  try {
    assert.equal((await put({ phone: '' }, false)).status, 401);
    for (const data of [{ facebookUrl: 'javascript:alert(1)' }, { facebookUrl: 'https://facebook.com.evil.test/name' }, { messengerUrl: 'https://evil.test/' }, { phone: 'abc' }, { email: 'invalid' }, { secret: 'hidden' }]) assert.equal((await put(data)).status, 400);
    const saved = await put({ phone: '0901234567', zaloPhone: '', facebookName: 'Shop', facebookUrl: 'https://www.facebook.com/shop', email: 'shop@example.com', address: '<b>Address</b>', hours: '8:00–20:00' });
    assert.equal(saved.status, 200);
    db.data.contact.secret = 'internal';
    const publicContact = await (await fetch(base + '/api/contact')).json();
    assert.equal(publicContact.phone, '0901234567');
    assert.equal(publicContact.zaloPhone, '');
    assert.equal(publicContact.secret, undefined);
    delete db.data.contact.secret;
    const before = getContact(db);
    const save = db.save;
    db.save = () => { throw new Error('disk failure'); };
    assert.throws(() => saveContact(db, { phone: '0987654321' }), /disk failure/);
    assert.deepEqual(getContact(db), before);
    db.save = save;
  } finally { const closed = new Promise(resolve => server.close(resolve)); server.closeAllConnections(); server.closeIdleConnections(); await closed; db.close(); }
});
