const fs = require('fs');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const {
  HttpError,
  listProducts,
  listCategories,
  getProduct,
  createOrder,
  getOrder,
  listOrders,
  updateOrderStatus,
  createUser,
  findUserByUsername,
  findUserByEmail,
  findUserById,
  verifyPassword,
  getMenCatalog,
} = require('./db');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        req.destroy();
        reject(new HttpError(413, 'Request body quá lớn'));
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new HttpError(400, 'Body JSON không hợp lệ'));
      }
    });
    req.on('error', reject);
  });
}

function parseUrl(req) {
  return new URL(req.url, `http://${req.headers.host || 'localhost'}`);
}

function getTokenFromRequest(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

function signToken(payload, secret) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token, secret) {
  if (!token) return null;
  try {
    const [headerB64, payloadB64, signature] = token.split('.');
    if (!headerB64 || !payloadB64 || !signature) return null;
    const expected = crypto.createHmac('sha256', secret).update(`${headerB64}.${payloadB64}`).digest('base64url');
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
      if (payload.exp && Date.now() >= payload.exp * 1000) return null;
      return payload;
    }
  } catch (error) {
    return null;
  }
  return null;
}

function serveStaticFile(res, requestPath) {
  const safePath = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
  const target = path.normalize(path.join(PUBLIC_DIR, safePath));
  if (!target.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return true;
  }

  fs.stat(target, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(target).toLowerCase();
    const contentType = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
    }[ext] || 'application/octet-stream';

    const cacheControl = ext === '.html' || ext === '.js' || ext === '.css' ? 'no-store, no-cache, must-revalidate, max-age=0' : 'public, max-age=3600';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    fs.createReadStream(target).pipe(res);
  });
  return true;
}

function readAuthState(req, db, secret) {
  const token = getTokenFromRequest(req);
  const payload = verifyToken(token, secret);
  if (!payload || !payload.sub) return null;
  const user = findUserById(db, payload.sub);
  return user ? { token, user: { id: user.id, name: user.name, email: user.email } } : null;
}

function createApp({ db, adminToken = 'admin123', version = 'dev', jwtSecret = 'shop-secret' } = {}) {
  const server = http.createServer(async (req, res) => {
    try {
      const url = parseUrl(req);
      const pathname = decodeURIComponent(url.pathname || '/');

      if (pathname.includes('..')) {
        sendJson(res, 403, { error: 'Path traversal không được phép' });
        return;
      }

      if (pathname === '/health') {
        sendJson(res, 200, { status: 'ok', version });
        return;
      }

      if (pathname === '/api/info') {
        sendJson(res, 200, { name: 'Shop online', version, status: 'ok' });
        return;
      }

      if (pathname.startsWith('/api/auth')) {
        const body = await readJson(req);

        if (pathname === '/api/auth/register' && req.method === 'POST') {
          const user = createUser(db, body || {});
          const token = signToken({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }, jwtSecret);
          sendJson(res, 201, {
            token,
            user: { id: user.id, name: user.name, username: user.username, email: user.email || '', createdAt: user.created_at },
          });
          return;
        }

        if (pathname === '/api/auth/login' && req.method === 'POST') {
          const loginKey = String(body.username || body.email || '').trim();
          const user = findUserByUsername(db, loginKey) || findUserByEmail(db, loginKey);
          if (!user || !verifyPassword(String(body.password || ''), user.password)) {
            sendJson(res, 401, { error: 'Tên đăng nhập/email hoặc mật khẩu không đúng' });
            return;
          }

          const token = signToken({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }, jwtSecret);
          sendJson(res, 200, {
            token,
            user: { id: user.id, name: user.name, username: user.username, email: user.email || '', createdAt: user.created_at },
          });
          return;
        }

        if (pathname === '/api/auth/me' && req.method === 'GET') {
          const auth = readAuthState(req, db, jwtSecret);
          if (!auth) {
            sendJson(res, 401, { error: 'Unauthorized' });
            return;
          }
          sendJson(res, 200, { user: auth.user });
          return;
        }

        sendJson(res, 404, { error: 'Không tìm thấy endpoint auth' });
        return;
      }

      if (pathname.startsWith('/api/')) {
        if (pathname === '/api/products' && req.method === 'GET') {
          const params = url.searchParams;
          sendJson(res, 200, listProducts(db, { q: params.get('q') || '', category: params.get('category') || '' }));
          return;
        }

        if (pathname === '/api/categories' && req.method === 'GET') {
          sendJson(res, 200, listCategories(db));
          return;
        }

        if (pathname === '/api/v1/vn/vi/categories' && req.method === 'GET') {
          sendJson(res, 200, { categories: getMenCatalog().categories, total: getMenCatalog().categories.length });
          return;
        }

        if (pathname === '/api/v1/vn/vi/products/section/men' && req.method === 'GET') {
          const catalog = getMenCatalog();
          sendJson(res, 200, {
            ...catalog,
            products: listProducts(db, { gender: 'men' }).slice(0, 8),
          });
          return;
        }

        if (pathname === '/api/v1/vn/vi/products' && req.method === 'GET') {
          const params = url.searchParams;
          sendJson(res, 200, {
            items: listProducts(db, { q: params.get('q') || '', category: params.get('category') || '', gender: params.get('gender') || 'men' }),
            meta: { page: Number(params.get('page') || 1), limit: Number(params.get('limit') || 24), sort: params.get('sort') || 'rank' },
          });
          return;
        }

        if (pathname === '/api/v1/vn/vi/products/search' && req.method === 'GET') {
          const params = url.searchParams;
          const q = params.get('query') || '';
          const results = listProducts(db, { q, gender: params.get('gender') || 'men' });
          sendJson(res, 200, {
            query: q,
            suggestions: results.slice(0, 5).map((p) => ({ name: p.name, price: p.price, image: p.image })),
            results,
          });
          return;
        }

        if (pathname === '/api/v1/vn/vi/products/filters' && req.method === 'GET') {
          sendJson(res, 200, getMenCatalog().filters);
          return;
        }

        if (pathname.startsWith('/api/v1/vn/vi/products/') && pathname.endsWith('/stock')) {
          const matches = pathname.match(/\/api\/v1\/vn\/vi\/products\/([0-9]+)\/stock$/);
          if (!matches) {
            sendJson(res, 404, { error: 'Not found' });
            return;
          }
          const product = getProduct(db, Number(matches[1]));
          sendJson(res, 200, { productId: Number(matches[1]), stock: product ? product.stock : 0, variants: [{ color: 'Trắng', size: 'M', available: product ? product.stock > 0 : false }] });
          return;
        }

        if (pathname === '/api/v1/vn/vi/size-recommendation' && req.method === 'POST') {
          const body = await readJson(req);
          const height = Number(body.height || 0);
          const weight = Number(body.weight || 0);
          const fit = String(body.fit || 'regular');
          let size = 'M';
          if (height >= 180 || weight >= 80) size = fit === 'loose' ? 'XL' : 'L';
          if (height >= 170 && height < 180) size = 'M';
          sendJson(res, 200, { recommendedSize: size, confidence: 'high', breakpoints: { height, weight, fit } });
          return;
        }

        if (pathname === '/api/v1/vn/vi/user/wishlist' && req.method === 'GET') {
          sendJson(res, 200, { items: listProducts(db, { gender: 'men' }).slice(0, 3).map((p) => ({ productId: p.id, name: p.name, price: p.price })) });
          return;
        }

        if (pathname === '/api/v1/vn/vi/user/coupons' && req.method === 'GET') {
          sendJson(res, 200, {
            coupons: [
              { code: 'WELCOME10', type: 'percent', value: 10, description: 'Giảm 10% cho lần mua đầu' },
              { code: 'FREESHIP', type: 'shipping', value: 0, description: 'Miễn phí vận chuyển' },
            ],
          });
          return;
        }

        if (pathname === '/api/v1/vn/vi/cart/items' && req.method === 'POST') {
          const body = await readJson(req);
          sendJson(res, 200, { added: true, item: body, message: 'Đã thêm vào giỏ hàng' });
          return;
        }

        if (pathname === '/api/v1/vn/vi/coupons/apply' && req.method === 'POST') {
          const body = await readJson(req);
          const code = String(body.code || '').toUpperCase();
          const discount = code === 'WELCOME10' ? 10 : 0;
          sendJson(res, 200, { code, discountPercent: discount, message: discount ? 'Mã hợp lệ' : 'Mã không hợp lệ' });
          return;
        }

        if (pathname === '/api/v1/vn/vi/checkout/shipping-rates' && req.method === 'POST') {
          const body = await readJson(req);
          const shipping = String(body.pickupMode || 'delivery') === 'pickup' ? 0 : 30000;
          sendJson(res, 200, { shippingFee: shipping, eta: '2-4 ngày', service: 'GHN' });
          return;
        }

        if (pathname.startsWith('/api/products/') && req.method === 'GET') {
          const id = Number(pathname.split('/').pop());
          if (!Number.isInteger(id)) {
            sendJson(res, 400, { error: 'Mã sản phẩm không hợp lệ' });
            return;
          }
          const product = getProduct(db, id);
          if (!product) {
            sendJson(res, 404, { error: 'Không tìm thấy sản phẩm' });
            return;
          }
          sendJson(res, 200, product);
          return;
        }

        if (pathname === '/api/orders' && req.method === 'POST') {
          const body = await readJson(req);
          const order = createOrder(db, body || {});
          sendJson(res, 201, order);
          return;
        }

        if (pathname.startsWith('/api/orders/') && req.method === 'GET') {
          const parts = pathname.split('/');
          const id = Number(parts[parts.length - 1]);
          const phone = String(url.searchParams.get('phone') || '');
          const order = getOrder(db, id);
          if (!order || order.phone !== phone) {
            sendJson(res, 404, { error: 'Không tìm thấy đơn hàng' });
            return;
          }
          sendJson(res, 200, order);
          return;
        }

        if (pathname.startsWith('/api/admin/orders')) {
          if (req.method === 'GET') {
            const token = req.headers['x-admin-token'];
            if (token !== adminToken) {
              sendJson(res, 401, { error: 'Unauthorized' });
              return;
            }
            sendJson(res, 200, listOrders(db));
            return;
          }

          if (req.method === 'PATCH') {
            const token = req.headers['x-admin-token'];
            if (token !== adminToken) {
              sendJson(res, 401, { error: 'Unauthorized' });
              return;
            }
            const parts = pathname.split('/');
            const id = Number(parts[parts.length - 1]);
            const body = await readJson(req);
            const order = updateOrderStatus(db, id, body.status);
            sendJson(res, 200, order);
            return;
          }
        }

        sendJson(res, 404, { error: 'Không tìm thấy API' });
        return;
      }

      if (req.method === 'GET') {
        const filePath = pathname === '/' ? '/index.html' : pathname;
        if (!serveStaticFile(res, filePath)) {
          sendJson(res, 404, { error: 'Không tìm thấy trang' });
        }
        return;
      }

      sendJson(res, 405, { error: 'Method không hỗ trợ' });
    } catch (error) {
      if (error instanceof HttpError) {
        sendJson(res, error.status, { error: error.message });
        return;
      }
      console.error(error);
      sendJson(res, 500, { error: 'Lỗi máy chủ' });
    }
  });

  return server;
}

module.exports = { createApp };
