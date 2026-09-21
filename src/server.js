const fs = require('fs');
const path = require('path');
const { createApp } = require('./app');
const { openDb } = require('./db');

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'shop.json');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = openDb(DB_PATH);
const server = createApp({ db });

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Shop online chạy tại http://localhost:${PORT} (DB: ${DB_PATH})`);
});

// Tắt êm khi `docker stop` gửi SIGTERM
function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
