'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { storeProductImage } = require('../src/product-images');

test('Product images are signed and uploaded to the configured private S3 prefix', async t => {
  const keys = ['PRODUCT_IMAGE_BUCKET', 'PRODUCT_IMAGE_PREFIX', 'PRODUCT_IMAGE_BASE_PATH', 'AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_SESSION_TOKEN'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  });

  Object.assign(process.env, {
    PRODUCT_IMAGE_BUCKET: 'shop-images-test',
    PRODUCT_IMAGE_PREFIX: 'product-images',
    PRODUCT_IMAGE_BASE_PATH: '/product-images',
    AWS_REGION: 'ap-southeast-2',
    AWS_ACCESS_KEY_ID: 'TESTACCESSKEY',
    AWS_SECRET_ACCESS_KEY: 'test-secret-key',
    AWS_SESSION_TOKEN: 'test-session-token'
  });

  let request;
  global.fetch = async (url, options) => {
    request = { url: String(url), ...options };
    return new Response(null, { status: 200 });
  };
  const bytes = Buffer.from('validated-image-bytes');
  const image = await storeProductImage({ bytes, ext: 'png', contentType: 'image/png' });

  assert.match(image, /^\/product-images\/[0-9a-f-]{36}\.png$/);
  assert.equal(request.method, 'PUT');
  assert.match(request.url, /^https:\/\/shop-images-test\.s3\.ap-southeast-2\.amazonaws\.com\/product-images\//);
  assert.equal(request.headers['x-amz-security-token'], 'test-session-token');
  assert.match(request.headers.Authorization, /^AWS4-HMAC-SHA256 Credential=TESTACCESSKEY\//);
  assert.equal(Buffer.from(request.body).toString(), bytes.toString());
});
