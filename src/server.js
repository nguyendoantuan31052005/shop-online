const fs = require('node:fs');
const path = require('node:path');
const { createApp } = require('./app');
const { openDb } = require('./db');

const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);
if (!process.env.ADMIN_TOKEN || process.env.ADMIN_TOKEN.length < 8 || process.env.ADMIN_TOKEN === 'doi-mat-khau-nay') {
  throw new Error('ADMIN_TOKEN bị thiếu hoặc không hợp lệ. Trên máy chủ chạy node scripts/docker-start.js để tạo cấu hình và khởi động Docker. Nếu dùng docker run, thêm --env-file .env và -p 8080:3000.');
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET phải có ít nhất 32 ký tự. Chạy node scripts/setup.js tại thư mục dự án.');
}
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT phải là số nguyên từ 1 đến 65535.');
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'shop.json');
const db = openDb(dbPath);
const server = createApp({ db, adminToken: process.env.ADMIN_TOKEN, jwtSecret: process.env.JWT_SECRET, version: process.env.APP_VERSION || 'dev' });
server.on('error', error => {
  console.error('Không thể khởi động server:', error.message);
  process.exit(1);
});
server.listen(port, '0.0.0.0', () => {
  console.log('Server đang nghe tại cổng ' + port);
  console.log('Nếu chạy Docker Compose: http://localhost:' + (process.env.HOST_PORT || '8080'));
  console.log('Nếu chạy Node trực tiếp: http://localhost:' + port);
  console.log('Trang quản trị: /admin');
});
let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  const timer = setTimeout(() => process.exit(1), 10000);
  timer.unref();
  server.close(() => {
    clearTimeout(timer);
    db.close();
    process.exit(0);
  });
  server.closeIdleConnections();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
