'use strict';

const crypto = require('node:crypto');
const { openDb } = require('./db');

let cachedAwsCredentials = null;

async function fetchJson(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(2500) });
  if (!response.ok) throw new Error(`AWS credentials endpoint returned HTTP ${response.status}`);
  return response.json();
}

async function getAwsCredentials() {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN || ''
    };
  }
  if (cachedAwsCredentials && cachedAwsCredentials.expiresAt > Date.now() + 60_000) return cachedAwsCredentials;

  let credentials;
  const relativeUri = process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI;
  const fullUri = process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI;
  if (relativeUri || fullUri) {
    const url = fullUri || `http://169.254.170.2${relativeUri}`;
    const headers = process.env.AWS_CONTAINER_AUTHORIZATION_TOKEN
      ? { Authorization: process.env.AWS_CONTAINER_AUTHORIZATION_TOKEN }
      : {};
    credentials = await fetchJson(url, { headers });
  } else {
    const metadataRoot = 'http://169.254.169.254/latest';
    const tokenResponse = await fetch(`${metadataRoot}/api/token`, {
      method: 'PUT',
      headers: { 'X-aws-ec2-metadata-token-ttl-seconds': '21600' },
      signal: AbortSignal.timeout(2500)
    });
    if (!tokenResponse.ok) throw new Error(`EC2 metadata token request returned HTTP ${tokenResponse.status}`);
    const token = await tokenResponse.text();
    const headers = { 'X-aws-ec2-metadata-token': token };
    const roleResponse = await fetch(`${metadataRoot}/meta-data/iam/security-credentials/`, { headers, signal: AbortSignal.timeout(2500) });
    if (!roleResponse.ok) throw new Error(`EC2 instance role request returned HTTP ${roleResponse.status}`);
    const roleName = (await roleResponse.text()).trim().split('\n')[0];
    if (!roleName || roleName.includes('/')) throw new Error('EC2 instance role is unavailable');
    credentials = await fetchJson(`${metadataRoot}/meta-data/iam/security-credentials/${encodeURIComponent(roleName)}`, { headers });
  }

  const accessKeyId = credentials.accessKeyId || credentials.AccessKeyId;
  const secretAccessKey = credentials.secretAccessKey || credentials.SecretAccessKey;
  const sessionToken = credentials.token || credentials.Token || credentials.SessionToken || '';
  if (!accessKeyId || !secretAccessKey) throw new Error('AWS credentials are incomplete');
  cachedAwsCredentials = {
    accessKeyId,
    secretAccessKey,
    sessionToken,
    expiresAt: credentials.expiration ? Date.parse(credentials.expiration) : credentials.Expiration ? Date.parse(credentials.Expiration) : Date.now() + 5 * 60_000
  };
  return cachedAwsCredentials;
}

function hmac(key, value, encoding) {
  return crypto.createHmac('sha256', key).update(value, 'utf8').digest(encoding);
}

async function storeProductImage({ bytes, ext, contentType }) {
  const bucket = process.env.PRODUCT_IMAGE_BUCKET;
  if (!bucket) return null;
  if (!['png', 'jpg', 'webp'].includes(ext)) throw new Error('Unsupported product image type');

  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  if (!region) throw new Error('AWS region is not configured for product image storage');
  const prefix = (process.env.PRODUCT_IMAGE_PREFIX || 'product-images').split('/').filter(Boolean).join('/');
  const name = `${crypto.randomUUID()}.${ext}`;
  const key = [prefix, name].filter(Boolean).join('/');
  const encodedKey = key.split('/').map(part => encodeURIComponent(part).replace(/[!'()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)).join('/');
  const host = `${bucket}.s3.${region}.amazonaws.com`;
  const uri = `/${encodedKey}`;
  const bodyHash = crypto.createHash('sha256').update(bytes).digest('hex');
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const credentials = await getAwsCredentials();
  const headers = {
    'content-type': contentType,
    host,
    'x-amz-content-sha256': bodyHash,
    'x-amz-date': amzDate,
    ...(credentials.sessionToken ? { 'x-amz-security-token': credentials.sessionToken } : {})
  };
  const signedHeaders = Object.keys(headers).sort().join(';');
  const canonicalHeaders = Object.keys(headers).sort().map(name => `${name}:${String(headers[name]).trim()}\n`).join('');
  const canonicalRequest = `PUT\n${uri}\n\n${canonicalHeaders}\n${signedHeaders}\n${bodyHash}`;
  const scope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${crypto.createHash('sha256').update(canonicalRequest).digest('hex')}`;
  const dateKey = hmac(`AWS4${credentials.secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, 's3');
  const signingKey = hmac(serviceKey, 'aws4_request');
  const signature = hmac(signingKey, stringToSign, 'hex');
  headers.Authorization = `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(`https://${host}${uri}`, { method: 'PUT', headers, body: bytes, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`S3 image upload returned HTTP ${response.status}`);
  const basePath = (process.env.PRODUCT_IMAGE_BASE_PATH || '/product-images').replace(/\/+$/, '');
  return `${basePath}/${name}`;
}

// Previous image migrations assigned generic Wikimedia search-result photos to
// duplicate products. Restore those items to their original seed product photo.
// Household items are handled by the curated, unique map in home-photos.js.
function addUniqueImages(db) {
  if ((Number(db.data.productImageVersion) || 0) >= 2) return 0;

  const seedDb = openDb(':memory:');
  const seedImages = new Map(seedDb.data.products.map(product => [Number(product.id), product.image]));
  seedDb.close();

  let changed = 0;
  for (const product of db.data.products) {
    if (product.subCategory === 'home') continue;
    if (!/^\/images\/catalog\/product-\d+\.jpg(?:\?.*)?$/i.test(String(product.image || ''))) continue;
    const originalImage = seedImages.get(Number(product.id));
    if (originalImage) {
      product.image = originalImage;
      changed++;
    }
  }

  db.data.productImageVersion = 2;
  return changed;
}

// Repair the four catalog records that pointed to removed Unsplash photos.
// Match the old URL exactly so any image an administrator has since selected
// is left untouched. This is safe to run at every server start.
function repairBrokenProductPhotos(db) {
  const repairs = new Map([
    [5, {
      old: 'https://images.unsplash.com/photo-1521369909026-2afc7c2a5f94?auto=format&fit=crop&w=900&q=80',
      image: '/images/catalog/cap.jpg'
    }],
    [10, {
      old: 'https://images.unsplash.com/photo-1498804103079-a4f7d7e1a8a8?auto=format&fit=crop&w=900&q=80',
      image: '/images/catalog/coffee.jpg'
    }],
    [45, {
      old: 'https://images.unsplash.com/photo-1516979187454-437ec3f9d7d5?auto=format&fit=crop&w=900&q=80',
      image: '/images/catalog/books.jpg'
    }],
    [48, {
      old: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2b4e?auto=format&fit=crop&w=900&q=80',
      image: '/images/catalog/blender.jpg'
    }],
    [70, {
      old: 'https://images.unsplash.com/photo-1521369909026-2afc7c2a5f94?auto=format&fit=crop&w=900&q=80',
      image: '/images/catalog/product-70.jpg'
    }]
  ]);

  let changed = 0;
  for (const product of db.data.products) {
    const repair = repairs.get(Number(product.id));
    if (repair && product.image === repair.old) {
      product.image = repair.image;
      changed++;
    }
  }
  return changed;
}

module.exports = { addUniqueImages, repairBrokenProductPhotos, storeProductImage };
