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
const customerBackend = require('./customer');
const shopper = require('./shopper');
const staffAccounts = require('./staff');
const { getContact, saveContact } = require('./contact');
const { createOpenApi } = require('./openapi');
const { storeProductImage } = require('./product-images');
const ghn = require('./shipping/ghn');

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
      '.webp': 'image/webp',
    }[ext] || 'application/octet-stream';

    const isHtml = ext === '.html';
    const cacheControl = isHtml
      ? 'no-store, no-cache, must-revalidate, max-age=0'
      : ['.js', '.css'].includes(ext)
        ? 'public, max-age=300'
        : 'public, max-age=3600';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
      ...(isHtml ? { Pragma: 'no-cache', Expires: '0' } : {}),
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
  return user && !user.disabled && (payload.version || 0) === (user.tokenVersion || 0) ? { token, user: customerBackend.safeUser(user) } : null;
}

function createApp({ db, passwordResetConfig = require('./password-reset').emailConfig(), uploadDir = path.join(path.dirname(process.env.DB_PATH || path.join(__dirname, '..', 'data', 'shop.json')), 'uploads'), adminToken = process.env.ADMIN_TOKEN, version = process.env.APP_VERSION || 'dev', jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(48).toString('hex'), weatherApiKey = process.env.WEATHER_API_KEY } = {}) {
  const passwordReset = require('./password-reset').createPasswordReset({ db, ...passwordResetConfig });
  const totp = require('./totp').createTotp({ db, secret: jwtSecret });
  const orderNotifications = require('./order-notifications').createOrderNotifications(passwordResetConfig);
  const weatherService = require('./weather').createWeatherService({ apiKey: weatherApiKey });
  const automaticGhnEnabled = () => {
    try { return ghn.isAutoCreateEnabled(); }
    catch (error) { console.error('GHN configuration is invalid:', error.message); return false; }
  };
  const adminSessions = new Map();
  const attempts = new Map();
  const recoveryOtpAttempts = new Map();
  const safeEqual = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length > 0 && Buffer.byteLength(a) === Buffer.byteLength(b) && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  function sessionId(req) { return (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith('shop_admin='))?.slice(11); }
  function adminSession(req) {
    const id = sessionId(req);
    const session = adminSessions.get(id);
    if (!session || session.expiresAt < Date.now()) { adminSessions.delete(id); return null; }
    if (session.role === 'staff') {
      const staff = (db.data.staff || []).find(item => item.id === session.staffId);
      if (!staff || staff.disabled || (staff.tokenVersion || 0) !== session.tokenVersion) { adminSessions.delete(id); return null; }
    }
    return session;
  }
  function isAdmin(req) {
    if (safeEqual(req.headers['x-admin-token'], adminToken)) return true;
    if (!adminSession(req)) return false;
    if (!['GET', 'HEAD'].includes(req.method) && req.headers['x-requested-with'] !== 'shop-admin') return false;
    return true;
  }
  function isOwner(req) {
    if (safeEqual(req.headers['x-admin-token'], adminToken)) return true;
    return adminSession(req)?.role === 'owner';
  }
  function rateLimit(req) {
    const key = req.socket.remoteAddress;
    const now = Date.now();
    for (const [ip, entry] of attempts) if (entry.until <= now) attempts.delete(ip);
    const entry = attempts.get(key) || { count: 0, until: now + 15 * 60 * 1000 };
    entry.count++; attempts.set(key, entry);
    if (entry.count > 30) throw new HttpError(429, 'Quá nhiều lần thử. Vui lòng thử lại sau 15 phút.');
  }
  function rateLimitRecoveryOtp(req) {
    const key = req.socket.remoteAddress;
    const now = Date.now();
    for (const [ip, entry] of recoveryOtpAttempts) if (entry.until <= now) recoveryOtpAttempts.delete(ip);
    const entry = recoveryOtpAttempts.get(key) || { count: 0, until: now + 15 * 60 * 1000 };
    entry.count++;
    recoveryOtpAttempts.set(key, entry);
    if (entry.count > 5) throw new HttpError(429, 'Quá nhiều lần khôi phục. Vui lòng thử lại sau 15 phút.');
  }
  const cookie = (value, age, path = '/') => 'shop_admin=' + value + '; HttpOnly; SameSite=Strict; Path=' + path + '; Max-Age=' + age + (process.env.COOKIE_SECURE === 'true' ? '; Secure' : '');
  function setAdminCookies(res, value, age) {
    res.setHeader('Set-Cookie', [cookie(value, age), cookie('', 0, '/api/admin')]);
  }
  function startAdminSession(res, { role = 'owner', staffId = null, tokenVersion = 0 } = {}) {
    for (const [id, session] of adminSessions) if (session.expiresAt < Date.now()) adminSessions.delete(id);
    const id = crypto.randomBytes(32).toString('hex');
    adminSessions.set(id, { expiresAt: Date.now() + 8 * 60 * 60 * 1000, role, staffId, tokenVersion });
    setAdminCookies(res, id, 28800);
  }
  function loginAdmin(body, res) {
    const username = String(body?.username || 'admin').trim();
    if (username.toLowerCase() === 'admin') {
      if (!safeEqual(body?.password, adminToken)) throw new HttpError(401, 'Tài khoản hoặc mật khẩu không đúng');
      startAdminSession(res, { role: 'owner' });
      return 'owner';
    }
    const staff = (db.data.staff || []).find(item => item.username.toLowerCase() === username.toLowerCase());
    if (!staff || staff.disabled || !verifyPassword(String(body?.password || ''), staff.password)) throw new HttpError(401, 'Tài khoản hoặc mật khẩu không đúng');
    startAdminSession(res, { role: 'staff', staffId: staff.id, tokenVersion: staff.tokenVersion || 0 });
    return 'staff';
  }
  const server = http.createServer(async (req, res) => {
    const contentType = String(req.headers['content-type'] || '').split(';', 1)[0].trim().toLowerCase();
    const bodyPromise = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && contentType === 'application/json' ? readJson(req) : null;
    if (bodyPromise) bodyPromise.catch(() => {});
    const readRequestJson = () => bodyPromise || readJson(req);
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

      if (req.method === 'GET' && ['/api-docs', '/api-docs/', '/swagger', '/swagger/'].includes(pathname)) {
        serveStaticFile(res, '/swagger.html');
        return;
      }
      if (req.method === 'GET' && pathname === '/api/openapi.json') {
        sendJson(res, 200, createOpenApi(version));
        return;
      }
      if (req.method === 'GET' && pathname === '/api/postman.json') {
        sendJson(res, 200, require('./api-export').postmanCollection(createOpenApi(version))); return;
      }

      if (pathname === '/health') {
        sendJson(res, 200, { status: 'ok', version });
        return;
      }

      if (pathname === '/api/weather/status' && req.method === 'GET') {
        sendJson(res, 200, { enabled: weatherService.isConfigured() });
        return;
      }
      if (pathname === '/api/weather/current' && req.method === 'GET') {
        const rawLatitude = url.searchParams.get('lat');
        const rawLongitude = url.searchParams.get('lon');
        if (rawLatitude === null || rawLongitude === null || rawLatitude.trim() === '' || rawLongitude.trim() === '') {
          throw new HttpError(400, 'Weather coordinates are required.');
        }
        const latitude = Number(rawLatitude);
        const longitude = Number(rawLongitude);
        const forwardedFor = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
        const address = forwardedFor || req.socket.remoteAddress || 'unknown';
        const clientKey = crypto.createHash('sha256').update(address).digest('hex');
        sendJson(res, 200, await weatherService.getCurrent(latitude, longitude, clientKey));
        return;
      }

      if (pathname === '/api/webhooks/ghn' && req.method === 'POST') {
        const webhookSecret = ghn.configuration().webhookSecret;
        if (!webhookSecret) throw new HttpError(503, 'GHN webhook chưa được cấu hình.');
        if (!ghn.secureTokenMatch(webhookSecret, req.headers['x-ghn-webhook-token'])) {
          throw new HttpError(401, 'GHN webhook token không hợp lệ.');
        }
        const result = ghn.applyWebhook(db, await readRequestJson());
        if (result.previousStatus && result.previousStatus !== result.order?.status) {
          orderNotifications.statusChanged(result.order);
        }
        sendJson(res, 200, { accepted: true, ignored: !!result.ignored, duplicate: !!result.duplicate, stale: !!result.stale });
        return;
      }

      if (pathname === '/api/contact' && req.method === 'GET') {
        sendJson(res, 200, getContact(db)); return;
      }
      if (pathname === '/api/info') {
        sendJson(res, 200, { name: 'Home Shopping App', version, status: 'ok' });
        return;
      }

      if (pathname.startsWith('/api/admin/')) {
        if (pathname === '/api/admin/login' && req.method === 'POST') {
          rateLimit(req);
          const body = await readRequestJson();
          const role = loginAdmin(body, res);
          sendJson(res, 200, { authenticated: true, role }); return;
        }
        if (!isAdmin(req)) throw new HttpError(401, 'Vui lòng đăng nhập quản trị');
        if (/^\/api\/admin\/(support|reviews)(\/[^/]+)?$/.test(pathname)) {
          sendJson(res, 200, shopper.admin(db, pathname, req.method, await readRequestJson())); return;
        }
        if (pathname === '/api/admin/contact') {
          if (req.method === 'GET') { sendJson(res, 200, getContact(db)); return; }
          if (req.method === 'PUT') { if (!isOwner(req)) throw new HttpError(403, 'Chỉ chủ shop được sửa thông tin cửa hàng'); sendJson(res, 200, saveContact(db, await readRequestJson())); return; }
          throw new HttpError(405, 'Thao tác không được hỗ trợ');
        }
        if (pathname === '/api/admin/staff') {
          if (!isOwner(req)) throw new HttpError(403, 'Chỉ chủ shop được quản lý tài khoản nhân viên');
          if (req.method === 'GET') { sendJson(res, 200, staffAccounts.list(db)); return; }
          if (req.method === 'POST') { sendJson(res, 201, staffAccounts.create(db, await readRequestJson())); return; }
          throw new HttpError(405, 'Thao tác không được hỗ trợ');
        }
        const staffMatch = pathname.match(/^\/api\/admin\/staff\/(\d+)$/);
        if (staffMatch) {
          if (!isOwner(req)) throw new HttpError(403, 'Chỉ chủ shop được quản lý tài khoản nhân viên');
          if (req.method === 'PATCH') { sendJson(res, 200, staffAccounts.update(db, Number(staffMatch[1]), await readRequestJson())); return; }
          throw new HttpError(405, 'Thao tác không được hỗ trợ');
        }
        if (pathname === '/api/admin/stats' && req.method === 'GET') {
          sendJson(res, 200, customerBackend.stats(db)); return;
        }
        if (pathname === '/api/admin/integrations' && req.method === 'GET') {
          let shippingConfigured = false;
          let webhookConfigured = false;
          let automaticShipping = false;
          try {
            const shippingConfig = ghn.configuration();
            shippingConfigured = ghn.isConfigured();
            webhookConfigured = shippingConfig.webhookSecret.length >= 32;
            automaticShipping = automaticGhnEnabled();
          } catch { /* Report incomplete configuration without exposing environment details. */ }
          sendJson(res, 200, {
            emailConfigured: typeof passwordResetConfig.sendMessage === 'function',
            shipping: { provider: 'GHN', configured: shippingConfigured, automatic: automaticShipping, webhookConfigured },
            payment: { online: false, methods: ['cod'] },
            storage: { type: 'JSON', multiInstance: false },
          });
          return;
        }
        const publicUser = (user, orderCounts = new Map()) => ({ id:user.id, name:user.name, username:user.username, email:user.email || '', createdAt:user.created_at, disabled:!!user.disabled, synthetic:user.synthetic === true, orderCount:orderCounts.get(user.id) || 0 });
        if (pathname === '/api/admin/users/seed-synthetic' && req.method === 'POST') {
          if (!isOwner(req)) throw new HttpError(403, 'Chỉ chủ shop được tạo tài khoản thử nghiệm');
          const body = await readRequestJson();
          const target = body.count === undefined ? 20_000 : body.count;
          if (!Number.isSafeInteger(target) || target < 1 || target > 20_000 || Object.keys(body).some(key => key !== 'count')) throw new HttpError(400, 'Số lượng phải từ 1 đến 20.000');
          const syntheticUsers = db.data.users.filter(user => user.synthetic === true);
          const existingCount = syntheticUsers.length;
          const desired = Math.max(target, existingCount);
          if (existingCount >= target) { sendJson(res, 200, { created:0, total:existingCount, disabled:true }); return; }
          const created = desired - existingCount;
          const originalUserCount = db.data.users.length;
          const originalNextUserId = db.data.nextUserId;
          const usernames = new Set(db.data.users.map(user => String(user.username || '').toLowerCase()));
          const dummyHash = '0'.repeat(128);
          const createdAt = Date.now();
          let serial = 1;
          while (syntheticUsers.length < desired) {
            const tag = String(serial++).padStart(6, '0');
            const username = 'test_user_' + tag;
            if (usernames.has(username)) continue;
            usernames.add(username);
            db.data.users.push({ id:db.data.nextUserId++, name:'TEST User ' + tag, username, email:'test-user-' + tag + '@example.invalid', phone:'', password:{ salt:crypto.randomBytes(16).toString('hex'), hash:dummyHash }, created_at:new Date(createdAt + serial).toISOString(), disabled:true, synthetic:true });
            syntheticUsers.push(null);
          }
          try { db.save(); } catch (error) { db.data.users.length = originalUserCount; db.data.nextUserId = originalNextUserId; throw error; }
          sendJson(res, 201, { created, total:db.data.users.filter(user => user.synthetic === true).length, disabled:true }); return;
        }
        if (pathname === '/api/admin/users/synthetic' && req.method === 'DELETE') {
          if (!isOwner(req)) throw new HttpError(403, 'Chỉ chủ shop được xóa tài khoản thử nghiệm');
          const originalUsers = db.data.users;
          const before = db.data.users.length;
          db.data.users = db.data.users.filter(user => user.synthetic !== true);
          const deleted = before - db.data.users.length;
          if (deleted) { try { db.save(); } catch (error) { db.data.users = originalUsers; throw error; } }
          sendJson(res, 200, { deleted, total:db.data.users.length }); return;
        }
        if (pathname === '/api/admin/users' && req.method === 'GET') {
          const orderCounts = new Map();
          for (const order of db.data.orders) if (order.user_id != null) orderCounts.set(order.user_id, (orderCounts.get(order.user_id) || 0) + 1);
          sendJson(res, 200, db.data.users.map(user => publicUser(user, orderCounts))); return;
        }
        const userMatch = pathname.match(/^\/api\/admin\/users\/(\d+)(\/orders|\/password)?$/);
        if (userMatch) {
          const user = db.data.users.find(u => u.id === Number(userMatch[1]));
          if (!user) throw new HttpError(404, 'Không tìm thấy tài khoản');
          if (userMatch[2] === '/orders' && req.method === 'GET') {
            sendJson(res, 200, db.data.orders.filter(o => o.user_id === user.id).slice().reverse()); return;
          }
          if (userMatch[2] === '/password' && req.method === 'PATCH') {
            if (user.synthetic === true) throw new HttpError(409, 'Tài khoản TEST luôn bị khóa và không thể dùng như tài khoản khách hàng');
            if (!isOwner(req)) throw new HttpError(403, 'Chỉ chủ shop được đặt lại mật khẩu khách hàng');
            const body = await readRequestJson();
            if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 1 || typeof body.password !== 'string') throw new HttpError(400, 'Thông tin mật khẩu không hợp lệ');
            sendJson(res, 200, customerBackend.resetPassword(db, user.id, body.password)); return;
          }
          if (!userMatch[2] && req.method === 'PATCH') {
            if (!isOwner(req)) throw new HttpError(403, 'Chỉ chủ shop được khóa tài khoản khách');
            const body = await readRequestJson();
            if (typeof body.disabled !== 'boolean' || Object.keys(body).some(key => key !== 'disabled')) throw new HttpError(400, 'Trạng thái tài khoản không hợp lệ');
            if (user.synthetic === true && body.disabled !== true) throw new HttpError(409, 'Tài khoản TEST phải luôn bị khóa');
            const original = user.disabled;
            user.disabled = body.disabled;
            try { db.save(); } catch (error) { if (original === undefined) delete user.disabled; else user.disabled = original; throw error; }
            sendJson(res, 200, publicUser(user)); return;
          }
          throw new HttpError(405, 'Thao tác không được hỗ trợ');
        }
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
          const contentType = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' }[ext];
          try {
            const image = await storeProductImage({ bytes, ext, contentType });
            if (image) { sendJson(res, 201, { image }); return; }
          } catch (error) {
            console.error('Product image storage failed:', error.message);
            throw new HttpError(502, 'Không tải được ảnh lên kho ảnh. Vui lòng thử lại sau.');
          }
          await fs.promises.mkdir(uploadDir, { recursive: true });
          await fs.promises.writeFile(path.join(uploadDir, name), bytes, { flag: 'wx' });
          sendJson(res, 201, { image: '/uploads/' + name }); return;
        }
        const categoryRoute = pathname.match(/^\/api\/admin\/categories(?:\/(.+))?$/);
        if (categoryRoute) {
          const categoryName = categoryRoute[1];
          if (req.method === 'GET' && !categoryName) { sendJson(res, 200, listCategories(db)); return; }
          if (req.method === 'POST' && !categoryName) { sendJson(res, 201, commerce.saveCategory(db, null, await readRequestJson())); return; }
          if (req.method === 'PATCH' && categoryName) { sendJson(res, 200, commerce.saveCategory(db, categoryName, await readRequestJson())); return; }
          if (req.method === 'DELETE' && categoryName) { if (!isOwner(req)) throw new HttpError(403, 'Chỉ chủ shop được xóa danh mục'); sendJson(res, 200, commerce.deleteCategory(db, categoryName)); return; }
          throw new HttpError(405, 'Thao tác danh mục không được hỗ trợ');
        }
        if (pathname === '/api/admin/logout' && req.method === 'POST') {
          adminSessions.delete(sessionId(req)); setAdminCookies(res, '', 0);
          sendJson(res, 200, { loggedOut: true }); return;
        }
        if (pathname === '/api/admin/session' && req.method === 'GET') { sendJson(res, 200, { authenticated: true, role: safeEqual(req.headers['x-admin-token'], adminToken) ? 'owner' : adminSession(req)?.role || 'owner' }); return; }
        const resource = pathname.match(/^\/api\/admin\/(products|vouchers)(?:\/(\d+))?$/);
        if (resource) {
          const [, kind, rawId] = resource; const id = rawId ? Number(rawId) : null;
          if (req.method === 'GET' && id === null) { sendJson(res, 200, db.data[kind]); return; }
          if ((req.method === 'POST' && id === null) || (req.method === 'PATCH' && id !== null)) {
            const body = await readRequestJson();
            if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Dữ liệu không hợp lệ');
            const result = kind === 'products' ? commerce.saveProduct(db, id, body) : commerce.saveVoucher(db, id, body);
            sendJson(res, req.method === 'POST' ? 201 : 200, result); return;
          }
          if (req.method === 'DELETE' && id !== null) {
            if (!isOwner(req)) throw new HttpError(403, 'Chỉ chủ shop được xóa sản phẩm hoặc voucher');
            sendJson(res, 200, kind === 'products' ? commerce.deleteProduct(db, id) : commerce.deleteVoucher(db, id)); return;
          }
        }
        if (pathname === '/api/admin/orders' && req.method === 'GET') { sendJson(res, 200, [...db.data.orders].reverse()); return; }
        const ghnSimulationMatch = pathname.match(/^\/api\/admin\/orders\/(\d+)\/shipment\/ghn\/simulate$/);
        if (ghnSimulationMatch && req.method === 'POST') {
          const id = Number(ghnSimulationMatch[1]);
          const order = db.data.orders.find(item => item.id === id);
          if (!order) throw new HttpError(404, 'Không tìm thấy đơn hàng');
          if (!['new', 'confirmed'].includes(order.status)) throw new HttpError(409, 'Chỉ mô phỏng đơn mới hoặc đã xác nhận.');
          const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
          sendJson(res, 200, {
            mode: 'simulation',
            clientOrderCode: `HS-${order.id}`,
            trackingNumber: `SIM-HS-${order.id}-${suffix}`,
            codAmount: order.paymentMethod === 'cod' && order.paymentStatus !== 'paid' ? order.total : 0,
            message: 'Chỉ mô phỏng: không gửi yêu cầu tới GHN, không tạo vận đơn và không thay đổi đơn hàng.',
          });
          return;
        }
        const ghnOrderMatch = pathname.match(/^\/api\/admin\/orders\/(\d+)\/shipment\/ghn$/);
        if (ghnOrderMatch && req.method === 'POST') {
          const id = Number(ghnOrderMatch[1]);
          const order = db.data.orders.find(item => item.id === id);
          if (!order) throw new HttpError(404, 'Không tìm thấy đơn hàng');
          if (!['new', 'confirmed'].includes(order.status)) throw new HttpError(409, 'Chỉ tạo vận đơn GHN cho đơn mới hoặc đã xác nhận.');
          try {
            const shipment = await ghn.createShipment(order);
            const updated = ghn.saveGhnShipment(db, id, shipment);
            orderNotifications.shipmentUpdated(updated);
            sendJson(res, 201, updated); return;
          } catch (error) {
            if (error instanceof HttpError) throw error;
            console.error('GHN shipment creation failed:', error.message);
            throw new HttpError(502, 'Không tạo được vận đơn GHN. Kiểm tra cấu hình hoặc thử lại.');
          }
        }
        const orderMatch = pathname.match(/^\/api\/admin\/orders\/(\d+)$/);
        if (orderMatch && req.method === 'PATCH') {
          const body = await readRequestJson();
          if (body && Object.keys(body).length === 1 && Object.hasOwn(body, 'phone')) {
            if (!isOwner(req)) throw new HttpError(403, 'Chỉ chủ shop được sửa số nhận hàng của đơn.');
            sendJson(res, 200, commerce.updateOrderPhone(db, Number(orderMatch[1]), body.phone)); return;
          }
          if (body?.paymentStatus === 'paid' && Object.keys(body).length === 1) {
            const previous = db.data.orders.find(item => item.id === Number(orderMatch[1]));
            const order = commerce.markOrderPaid(db, Number(orderMatch[1]));
            if (previous?.paymentStatus !== 'paid') orderNotifications.paymentReceived(order);
            sendJson(res, 200, order); return;
          }
          if (body?.shipment && Object.keys(body).length === 1) {
            const previous = db.data.orders.find(item => item.id === Number(orderMatch[1]));
            const previousShipment = previous?.shipment ? JSON.stringify({ carrier: previous.shipment.carrier, trackingNumber: previous.shipment.trackingNumber, trackingUrl: previous.shipment.trackingUrl }) : '';
            const order = commerce.saveShipment(db, Number(orderMatch[1]), body.shipment);
            const currentShipment = order.shipment ? JSON.stringify({ carrier: order.shipment.carrier, trackingNumber: order.shipment.trackingNumber, trackingUrl: order.shipment.trackingUrl }) : '';
            if (previousShipment !== currentShipment) orderNotifications.shipmentUpdated(order);
            sendJson(res, 200, order); return;
          }
        }
        if (orderMatch && req.method === 'PATCH') {
          const body = await readRequestJson(); const id = Number(orderMatch[1]);
          const previousStatus = db.data.orders.find(item => item.id === id)?.status;
          const order = updateOrderStatus(db, id, body?.status);
          if (previousStatus !== order.status) orderNotifications.statusChanged(order);
          if (previousStatus !== 'confirmed' && order.status === 'confirmed' && !order.shipment?.trackingNumber && automaticGhnEnabled()) {
            try {
              const shipment = await ghn.createShipment(order);
              const updated = ghn.saveGhnShipment(db, id, shipment);
              orderNotifications.shipmentUpdated(updated);
              sendJson(res, 200, updated); return;
            } catch (error) {
              console.error('Automatic GHN shipment creation failed:', error.message);
              const message = error instanceof HttpError ? error.message : 'Lỗi kết nối GHN.';
              throw new HttpError(502, `Đơn đã xác nhận nhưng chưa tạo được vận đơn GHN: ${message} Vào đơn hàng và bấm tạo lại vận đơn.`);
            }
          }
          sendJson(res, 200, order); return;
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
      if (req.method === 'GET' && pathname === '/admin-login') {
        if (adminSession(req)) { res.writeHead(302, { Location: '/admin' }); res.end(); return; }
        serveStaticFile(res, '/admin-login.html');
        return;
      }
      if (req.method === 'GET' && (pathname === '/admin.html' || pathname === '/admin/')) {
        res.writeHead(302, { Location: '/admin' });
        res.end();
        return;
      }

      if (req.method === 'GET' && pathname === '/admin') {
        if (!adminSession(req)) { res.writeHead(302, { Location: '/admin-login' }); res.end(); return; }
        serveStaticFile(res, '/admin.html');
        return;
      }

      if (pathname.startsWith('/api/auth')) {
        if (req.method === 'POST') rateLimit(req);
        const body = await readRequestJson();

        if (pathname === '/api/auth/recovery-options' && req.method === 'GET') {
          sendJson(res, 200, passwordReset.options()); return;
        }
        if (pathname === '/api/auth/totp/status' && req.method === 'GET') {
          const auth = readAuthState(req, db, jwtSecret);
          if (!auth) throw new HttpError(401, 'Vui lòng đăng nhập lại.');
          sendJson(res, 200, totp.status(auth.user.id)); return;
        }
        if (pathname === '/api/auth/totp/setup' && req.method === 'POST') {
          const auth = readAuthState(req, db, jwtSecret);
          if (!auth) throw new HttpError(401, 'Vui lòng đăng nhập lại.');
          sendJson(res, 200, totp.setup(auth.user.id)); return;
        }
        if (pathname === '/api/auth/totp/enable' && req.method === 'POST') {
          const auth = readAuthState(req, db, jwtSecret);
          if (!auth) throw new HttpError(401, 'Vui lòng đăng nhập lại.');
          sendJson(res, 200, totp.enable(auth.user.id, body)); return;
        }
        if (pathname === '/api/auth/totp/disable' && req.method === 'POST') {
          const auth = readAuthState(req, db, jwtSecret);
          if (!auth) throw new HttpError(401, 'Vui lòng đăng nhập lại.');
          sendJson(res, 200, totp.disable(auth.user.id, body)); return;
        }
        if (pathname === '/api/auth/forgot-password' && req.method === 'POST') {
          sendJson(res, 200, await passwordReset.request(body)); return;
        }
        if (pathname === '/api/auth/reset-password' && req.method === 'POST') {
          sendJson(res, 200, passwordReset.reset(body)); return;
        }
        if (pathname === '/api/auth/reset-totp-password' && req.method === 'POST') {
          rateLimitRecoveryOtp(req);
          sendJson(res, 200, totp.resetPassword(body)); return;
        }
        if (pathname === '/api/auth/register' && req.method === 'POST') {
          if (String(body?.username || '').trim().toLowerCase() === 'admin' || String(body?.email || '').trim().toLowerCase() === 'admin') {
            throw new HttpError(409, 'Tên đăng nhập admin dành riêng cho quản trị viên');
          }
          const user = createUser(db, body || {});
          const token = signToken({ sub: user.id, version:user.tokenVersion || 0, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }, jwtSecret);
          sendJson(res, 201, {
            token,
            user: customerBackend.safeUser(user),
          });
          return;
        }

        if (pathname === '/api/auth/login' && req.method === 'POST') {
          const loginKey = String(body.username || body.email || '').trim();
          if (loginKey.toLowerCase() === 'admin') {
            if (!safeEqual(body.password, adminToken)) throw new HttpError(401, 'Tên đăng nhập/email hoặc mật khẩu không đúng');
            startAdminSession(res, { role: 'owner' });
            sendJson(res, 200, { role: 'admin', redirect: '/admin' });
            return;
          }
          const staff = (db.data.staff || []).find(item => item.username.toLowerCase() === loginKey.toLowerCase());
          if (staff) {
            if (staff.disabled || !verifyPassword(String(body.password || ''), staff.password)) throw new HttpError(401, 'Tên đăng nhập/email hoặc mật khẩu không đúng');
            startAdminSession(res, { role: 'staff', staffId: staff.id, tokenVersion: staff.tokenVersion || 0 });
            sendJson(res, 200, { role: 'staff', redirect: '/admin' });
            return;
          }
          const user = findUserByUsername(db, loginKey) || findUserByEmail(db, loginKey);
          if (!user || !verifyPassword(String(body.password || ''), user.password)) {
            sendJson(res, 401, { error: 'Tên đăng nhập/email hoặc mật khẩu không đúng' });
            return;
          }
          if (user.disabled) throw new HttpError(403, 'Tài khoản đã bị khóa. Vui lòng liên hệ cửa hàng.');

          const token = signToken({ sub: user.id, version:user.tokenVersion || 0, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }, jwtSecret);
          sendJson(res, 200, {
            token,
            user: customerBackend.safeUser(user),
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

        if ((pathname === '/api/auth/me' && req.method === 'PATCH') || (pathname === '/api/auth/password' && req.method === 'POST') || (pathname === '/api/auth/logout' && req.method === 'POST')) {
          const auth = readAuthState(req, db, jwtSecret);
          if (!auth) throw new HttpError(401, 'Vui lòng đăng nhập');
          const result = customerBackend.account(db, auth.user.id, pathname, body);
          sendJson(res, 200, result); return;
        }
        sendJson(res, 404, { error: 'Không tìm thấy endpoint auth' });
        return;
      }

      if (pathname.startsWith('/api/')) {
        const reviewImage = pathname.match(/^\/api\/products\/(\d+)\/reviews\/images$/);
        if (reviewImage && req.method === 'POST') {
          const auth = readAuthState(req, db, jwtSecret);
          if (!auth) throw new HttpError(401, 'Vui lòng đăng nhập');
          const productId = Number(reviewImage[1]), user = db.data.users.find(item => item.id === auth.user.id);
          const eligible = db.data.orders.some(order => order.user_id === user.id && order.status === 'done' && (order.items || []).some(item => item.product_id === productId));
          if (!eligible || (db.data.reviews || []).some(item => item.userId === user.id && item.productId === productId)) throw new HttpError(403, 'Chỉ khách đã hoàn thành đơn mới có thể đính kèm ảnh đánh giá');
          user.pendingReviewImages ||= [];
          if (user.pendingReviewImages.filter(item => item.productId === productId).length >= 3) throw new HttpError(409, 'Mỗi đánh giá được đính kèm tối đa 3 ảnh');
          const chunks = []; let size = 0;
          for await (const chunk of req) { size += chunk.length; if (size > 5 * 1024 * 1024) throw new HttpError(413, 'Ảnh tối đa 5 MB'); chunks.push(chunk); }
          const bytes = Buffer.concat(chunks); let ext;
          if (bytes.length >= 24 && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && bytes.toString('ascii',12,16) === 'IHDR') ext = 'png';
          else if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 && bytes[bytes.length-2] === 255 && bytes[bytes.length-1] === 217) ext = 'jpg';
          else if (bytes.length >= 20 && bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP') ext = 'webp';
          if (!ext) throw new HttpError(400, 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP');
          const name = crypto.randomUUID() + '.' + ext, image = '/uploads/' + name;
          await fs.promises.mkdir(uploadDir, { recursive: true });
          await fs.promises.writeFile(path.join(uploadDir, name), bytes, { flag: 'wx' });
          const previous = [...user.pendingReviewImages]; user.pendingReviewImages.push({ productId, image });
          try { db.save(); } catch (error) { user.pendingReviewImages = previous; await fs.promises.unlink(path.join(uploadDir, name)).catch(() => {}); throw error; }
          sendJson(res, 201, { image }); return;
        }
        if (pathname === '/api/account/overview' && req.method === 'GET') {
          const auth = readAuthState(req, db, jwtSecret);
          if (!auth) throw new HttpError(401, 'Vui lòng đăng nhập');
          sendJson(res, 200, customerBackend.overview(db, auth.user.id)); return;
        }
        if (/^\/api\/products\/\d+\/reviews$/.test(pathname) && req.method === 'GET') {
          sendJson(res, 200, shopper.reviews(db, Number(pathname.split('/')[3]))); return;
        }
        if (pathname === '/api/addresses' || pathname === '/api/support' || /^\/api\/orders\/\d+\/reorder$/.test(pathname) || /^\/api\/products\/\d+\/reviews$/.test(pathname)) {
          const auth = readAuthState(req, db, jwtSecret);
          if (!auth) throw new HttpError(401, 'Vui lòng đăng nhập');
          sendJson(res, 200, shopper.customer(db, auth.user.id, pathname, req.method, await readRequestJson())); return;
        }
        if (pathname === '/api/cart' || pathname === '/api/wishlist' || /^\/api\/orders\/\d+(\/cancel)?$/.test(pathname) && req.method !== 'GET') {
          const auth = readAuthState(req, db, jwtSecret);
          if (!auth) throw new HttpError(401, 'Vui lòng đăng nhập');
          const cancelMatch = pathname.match(/^\/api\/orders\/(\d+)\/cancel$/);
          const previousStatus = cancelMatch ? db.data.orders.find(item => item.id === Number(cancelMatch[1]) && item.user_id === auth.user.id)?.status : null;
          const result = customerBackend.handle(db, auth.user.id, pathname, req.method, await readRequestJson());
          if (previousStatus && previousStatus !== result.status) orderNotifications.statusChanged(result);
          sendJson(res, 200, result); return;
        }
        if (pathname === '/api/vouchers' && req.method === 'GET') {
          sendJson(res, 200, db.data.vouchers.filter(v => commerce.available(v)).map(({ code, type, value, minOrder, maxDiscount, expiresAt, description }) => ({ code, type, value, minOrder, maxDiscount, expiresAt, description }))); return;
        }
        if (pathname === '/api/checkout/quote' && req.method === 'POST') { sendJson(res, 200, commerce.quoteOrder(db, await readRequestJson())); return; }
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
          const body = await readRequestJson();
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
          const body = await readRequestJson();
          const auth = readAuthState(req, db, jwtSecret);
          if (!auth) throw new HttpError(401, 'Vui lòng đăng nhập để đặt hàng');
          const order = createOrder(db, body || {}, auth.user.id);
          orderNotifications.created(order);
          let responseOrder = order;
          if (automaticGhnEnabled()) {
            try {
              const shipment = await ghn.createShipment(order);
              responseOrder = ghn.saveGhnShipment(db, order.id, shipment);
              orderNotifications.shipmentUpdated(responseOrder);
            } catch (error) {
              console.error('Automatic GHN shipment creation failed after checkout:', error.message);
              sendJson(res, 201, { ...order, shipmentAutomationPending: true });
              return;
            }
          }
          sendJson(res, 201, responseOrder);
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
