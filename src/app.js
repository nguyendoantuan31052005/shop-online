const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const store = require('./db');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 100 * 1024) {
        reject(new store.HttpError(413, 'Dữ liệu quá lớn'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch {
        reject(new store.HttpError(400, 'JSON không hợp lệ'));
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(urlPath, res) {
  const rel = urlPath === '/' ? 'index.html' : decodeURIComponent(urlPath).replace(/^\/+/, '');
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return sendJson(res, 403, { error: 'Forbidden' });
  fs.readFile(file, (err, content) => {
    if (err) return sendJson(res, 404, { error: 'Not found' });
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(content);
  });
}

function createApp({ db, adminToken = process.env.ADMIN_TOKEN || 'admin123', version = process.env.APP_VERSION || 'dev' }) {
  return http.createServer(async (req, res) => {
    try {
      const u = new URL(req.url, 'http://localhost');
      const p = u.pathname;
      const m = req.method;
      let match;

      if (p === '/health') return sendJson(res, 200, { status: 'ok', uptime: process.uptime() });

      if (p === '/api/info') {
        return sendJson(res, 200, { app: 'shop-online', version, node: process.version, hostname: os.hostname() });
      }

      // ----- Khách hàng -----
      if (m === 'GET' && p === '/api/products') {
        return sendJson(res, 200, store.listProducts(db, {
          q: u.searchParams.get('q') || '',
          category: u.searchParams.get('category') || '',
        }));
      }
      if (m === 'GET' && p === '/api/categories') return sendJson(res, 200, store.listCategories(db));

      if (m === 'GET' && (match = p.match(/^\/api\/products\/(\d+)$/))) {
        const product = store.getProduct(db, Number(match[1]));
        return product ? sendJson(res, 200, product) : sendJson(res, 404, { error: 'Không tìm thấy sản phẩm' });
      }

      if (m === 'POST' && p === '/api/orders') {
        const order = store.createOrder(db, await readJson(req));
        return sendJson(res, 201, order);
      }

      // Tra cứu đơn: cần đúng số điện thoại đã đặt
      if (m === 'GET' && (match = p.match(/^\/api\/orders\/(\d+)$/))) {
        const order = store.getOrder(db, Number(match[1]));
        if (!order || order.phone !== (u.searchParams.get('phone') || '')) {
          return sendJson(res, 404, { error: 'Không tìm thấy đơn hàng' });
        }
        return sendJson(res, 200, order);
      }

      // ----- Quản trị (header x-admin-token) -----
      if (p.startsWith('/api/admin/')) {
        if (req.headers['x-admin-token'] !== adminToken) return sendJson(res, 401, { error: 'Sai mã quản trị' });

        if (m === 'GET' && p === '/api/admin/orders') return sendJson(res, 200, store.listOrders(db));

        if (m === 'PATCH' && (match = p.match(/^\/api\/admin\/orders\/(\d+)$/))) {
          const body = await readJson(req);
          return sendJson(res, 200, store.updateOrderStatus(db, Number(match[1]), body.status));
        }
      }

      if (m === 'GET' && !p.startsWith('/api/')) return serveStatic(p, res);
      return sendJson(res, 404, { error: 'Not found' });
    } catch (err) {
      if (err instanceof store.HttpError) return sendJson(res, err.status, { error: err.message });
      console.error(err);
      return sendJson(res, 500, { error: 'Lỗi máy chủ' });
    }
  });
}

module.exports = { createApp };
