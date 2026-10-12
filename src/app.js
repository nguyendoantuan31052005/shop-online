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

const commerce = require('./commerce');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    req.setEncoding('utf8');
    let raw = '';
    let bytes = 0;
    let tooLarge = false;
    req.on('data', (chunk) => {
      if (tooLarge) return;
      bytes += Buffer.byteLength(chunk);
      if (bytes > 1_000_000) {
        tooLarge = true;
        raw = '';
        reject(new HttpError(413, 'Request body quá lớn'));
        return;
      }
      raw += chunk;
    });
    req.on('end', () => {
      if (tooLarge) return;
      if (!raw) return resolve({});
      try {
        const value = JSON.parse(raw);
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
          return reject(new HttpError(400, 'Body JSON phải là một đối tượng'));
        }
        resolve(value);
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
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signature] = parts;
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
  if (!target.startsWith(PUBLIC_DIR + path.sep)) {
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
    const stream = fs.createReadStream(target);
    stream.on('error', () => res.destroy());
    res.on('close', () => stream.destroy());
    stream.pipe(res);
  });
  return true;
}

function readAuthState(req, db, secret) {
  const token = getTokenFromRequest(req);
  const payload = verifyToken(token, secret);
  if (!payload || !payload.sub) return null;
  const user = findUserById(db, payload.sub);
  return user ? { token, user: { id: user.id, name: user.name, username: user.username, email: user.email, createdAt: user.created_at } } : null;
}

function createApp({ db, uploadDir = path.join(path.dirname(process.env.DB_PATH || path.join(__dirname, '..', 'data', 'shop.json')), 'uploads'), adminToken = process.env.ADMIN_TOKEN, version = process.env.APP_VERSION || 'dev', jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(48).toString('hex') } = {}) {
  const adminSessions = new Map();
  const attempts = new Map();
  const safeEqual = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length > 0 && Buffer.byteLength(a) === Buffer.byteLength(b) && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  function sessionId(req) { return (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith('shop_admin='))?.slice(11); }
  function isAdmin(req) {
    if (safeEqual(req.headers['x-admin-token'], adminToken)) return true;
    const id = sessionId(req); const expires = adminSessions.get(id);
    if (!expires || expires < Date.now()) { adminSessions.delete(id); return false; }
    if (!['GET', 'HEAD'].includes(req.method) && req.headers['x-requested-with'] !== 'shop-admin') return false;
    return true;
  }
  function rateLimit(req) {
    const key = req.socket.remoteAddress;
    const now = Date.now();
    for (const [ip, entry] of attempts) if (entry.until <= now) attempts.delete(ip);
    const entry = attempts.get(key) || { count: 0, until: now + 15 * 60 * 1000 };
    entry.count++; attempts.set(key, entry);
    if (entry.count > 30) throw new HttpError(429, 'Quá nhiều lần thử. Vui lòng thử lại sau 15 phút.');
  }
  const cookie = (value, age) => 'shop_admin=' + value + '; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=' + age + (process.env.COOKIE_SECURE === 'true' ? '; Secure' : '');
  function startAdminSession(res) {
    for (const [id, expiry] of adminSessions) if (expiry < Date.now()) adminSessions.delete(id);
    const id = crypto.randomBytes(32).toString('hex');
    adminSessions.set(id, Date.now() + 8 * 60 * 60 * 1000);
    res.setHeader('Set-Cookie', cookie(id, 28800));
  }
  const server = http.createServer(async (req, res) => {
    try {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Referrer-Policy', 'same-origin');
      res.setHeader('Cache-Control', 'no-store');
      const url = parseUrl(req);
      let pathname;
      try { pathname = decodeURIComponent(url.pathname || '/'); }
      catch { throw new HttpError(400, 'Đường dẫn không hợp lệ'); }
      if (pathname.includes('\0')) throw new HttpError(400, 'Đường dẫn không hợp lệ');

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

      if (pathname.startsWith('/api/admin/')) {
        if (pathname === '/api/admin/login' && req.method === 'POST') {
          rateLimit(req);
          const body = await readJson(req);
          if (!safeEqual(body?.password, adminToken)) throw new HttpError(401, 'Mật khẩu quản trị không đúng');
          startAdminSession(res);
          sendJson(res, 200, { authenticated: true }); return;
        }
        if (!isAdmin(req)) throw new HttpError(401, 'Vui lòng đăng nhập quản trị');
        if (pathname === '/api/admin/images' && req.method === 'POST') {
          const chunks = []; let size = 0;
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 5 * 1024 * 1024) throw new HttpError(413, 'Ảnh tối đa 5 MB');
            chunks.push(chunk);
          }
          const bytes = Buffer.concat(chunks);
          let ext;
          if (bytes.length >= 24 && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && bytes.toString('ascii',12,16) === 'IHDR') ext = 'png';
          else if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 && bytes[bytes.length-2] === 255 && bytes[bytes.length-1] === 217) ext = 'jpg';
          else if (bytes.length >= 20 && bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP') ext = 'webp';
          if (!ext) throw new HttpError(400, 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP');
          const name = crypto.randomUUID() + '.' + ext;
          await fs.promises.mkdir(uploadDir, { recursive: true });
          await fs.promises.writeFile(path.join(uploadDir, name), bytes, { flag: 'wx' });
          sendJson(res, 201, { image: '/uploads/' + name }); return;
        }
        if (pathname === '/api/admin/logout' && req.method === 'POST') {
          adminSessions.delete(sessionId(req)); res.setHeader('Set-Cookie', cookie('', 0));
          sendJson(res, 200, { loggedOut: true }); return;
        }
        if (pathname === '/api/admin/session' && req.method === 'GET') { sendJson(res, 200, { authenticated: true }); return; }
        const resource = pathname.match(/^\/api\/admin\/(products|vouchers)(?:\/(\d+))?$/);
        if (resource) {
          const [, kind, rawId] = resource; const id = rawId ? Number(rawId) : null;
          if (req.method === 'GET' && id === null) { sendJson(res, 200, db.data[kind]); return; }
          if ((req.method === 'POST' && id === null) || (req.method === 'PATCH' && id !== null)) {
            const body = await readJson(req);
            if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Dữ liệu không hợp lệ');
            const result = kind === 'products' ? commerce.saveProduct(db, id, body) : commerce.saveVoucher(db, id, body);
            sendJson(res, req.method === 'POST' ? 201 : 200, result); return;
          }
          if (req.method === 'DELETE' && id !== null) {
            sendJson(res, 200, kind === 'products' ? commerce.deleteProduct(db, id) : commerce.deleteVoucher(db, id)); return;
          }
        }
        if (pathname === '/api/admin/orders' && req.method === 'GET') { sendJson(res, 200, [...db.data.orders].reverse()); return; }
        const orderMatch = pathname.match(/^\/api\/admin\/orders\/(\d+)$/);
        if (orderMatch && req.method === 'PATCH') {
          const body = await readJson(req); sendJson(res, 200, updateOrderStatus(db, Number(orderMatch[1]), body?.status)); return;
        }
        throw new HttpError(404, 'Không tìm thấy API quản trị');
      }

      if (req.method === 'GET' && pathname.startsWith('/uploads/')) {
        const name = pathname.slice('/uploads/'.length);
        if (!/^[a-f0-9-]{36}\.(png|jpg|webp)$/.test(name)) throw new HttpError(404, 'Không tìm thấy ảnh');
        let bytes;
        try { bytes = await fs.promises.readFile(path.join(uploadDir, name)); }
        catch (error) { if (error.code === 'ENOENT') throw new HttpError(404, 'Không tìm thấy ảnh'); throw error; }
        res.writeHead(200, { 'Content-Type': { png:'image/png', jpg:'image/jpeg', webp:'image/webp' }[name.split('.').pop()], 'Cache-Control':'public, max-age=31536000, immutable' });
        res.end(bytes); return;
      }
      if (req.method === 'GET' && (pathname === '/admin.html' || pathname === '/admin/')) {
        res.writeHead(302, { Location: '/admin' });
        res.end();
        return;
      }

      if (req.method === 'GET' && pathname === '/admin') {
        serveStaticFile(res, '/admin.html');
        return;
      }

      if (pathname.startsWith('/api/auth')) {
        if (req.method === 'POST') rateLimit(req);
        const body = await readJson(req);

        if (pathname === '/api/auth/register' && req.method === 'POST') {
          if (String(body?.username || '').trim().toLowerCase() === 'admin' || String(body?.email || '').trim().toLowerCase() === 'admin') {
            throw new HttpError(409, 'Tên đăng nhập admin dành riêng cho quản trị viên');
          }
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
          if (loginKey.toLowerCase() === 'admin') {
            if (!safeEqual(body.password, adminToken)) throw new HttpError(401, 'Tên đăng nhập/email hoặc mật khẩu không đúng');
            startAdminSession(res);
            sendJson(res, 200, { role: 'admin', redirect: '/admin' });
            return;
          }
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
        if (pathname === '/api/vouchers' && req.method === 'GET') {
          sendJson(res, 200, db.data.vouchers.filter(v => commerce.available(v)).map(({ code, type, value, minOrder, maxDiscount, expiresAt, description }) => ({ code, type, value, minOrder, maxDiscount, expiresAt, description }))); return;
        }
        if (pathname === '/api/checkout/quote' && req.method === 'POST') { sendJson(res, 200, commerce.quoteOrder(db, await readJson(req))); return; }
        if (pathname === '/api/orders/mine' && req.method === 'GET') {
          const auth = readAuthState(req, db, jwtSecret);
          if (!auth) throw new HttpError(401, 'Vui lòng đăng nhập');
          sendJson(res, 200, db.data.orders.filter(o => o.user_id === auth.user.id).slice().reverse()); return;
        }
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
          const page = Number(params.get('page') || 1);
          const limit = Number(params.get('limit') || 24);
          const sort = params.get('sort') || 'rank';
          if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !['rank', 'price_asc', 'price_desc', 'newest'].includes(sort)) throw new HttpError(400, 'Phân trang hoặc sắp xếp không hợp lệ');
          const products = listProducts(db, { q: params.get('q') || '', category: params.get('category') || '', gender: params.get('gender') || 'men' });
          if (sort === 'price_asc') products.sort((a, b) => a.price - b.price || a.id - b.id);
          if (sort === 'price_desc') products.sort((a, b) => b.price - a.price || a.id - b.id);
          if (sort === 'newest') products.sort((a, b) => b.id - a.id);
          sendJson(res, 200, {
            items: products.slice((page - 1) * limit, page * limit),
            meta: { page, limit, sort, total: products.length, totalPages: Math.ceil(products.length / limit) },
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
          if (!product) throw new HttpError(404, 'Không tìm thấy sản phẩm');
          sendJson(res, 200, { productId: product.id, stock: product.stock, variants: product.colors.flatMap(color => product.sizes.map(size => ({ color, size, available: product.stock > 0 }))) });
          return;
        }

        if (pathname === '/api/v1/vn/vi/size-recommendation' && req.method === 'POST') {
          const body = await readJson(req);
          const height = Number(body.height || 0);
          const weight = Number(body.weight || 0);
          const fit = String(body.fit || 'regular');
          if (!Number.isFinite(height) || height <= 0 || !Number.isFinite(weight) || weight <= 0 || !['regular', 'loose'].includes(fit)) throw new HttpError(400, 'Chiều cao, cân nặng hoặc kiểu mặc không hợp lệ');
          let size = 'M';
          if (height >= 180 || weight >= 80) size = fit === 'loose' ? 'XL' : 'L';
          sendJson(res, 200, { recommendedSize: size, confidence: 'high', breakpoints: { height, weight, fit } });
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
          const auth = readAuthState(req, db, jwtSecret);
          if (!auth) throw new HttpError(401, 'Vui lòng đăng nhập để đặt hàng');
          const order = createOrder(db, body || {}, auth.user.id);
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
