const fs = require('fs');
const path = require('path');
const { createApp } = require('./app');
const { openDb } = require('./db');

const PORT = Number(process.env.PORT || 3000);
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'shop.json');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = openDb(DB_PATH);
const server = createApp({ db });

function startServer(portToTry, fallbackIndex = 0) {
  const portsToTry = [portToTry, ...Array.from({ length: 10 }, (_, index) => portToTry + index + 1)];
  const port = portsToTry[fallbackIndex];

  server.once('error', (error) => {
    if (error && error.code === 'EADDRINUSE' && fallbackIndex < portsToTry.length - 1) {
      console.warn(`Port ${port} đang bận, đang thử port ${portsToTry[fallbackIndex + 1]}...`);
      startServer(portToTry, fallbackIndex + 1);
      return;
    }

    console.error('Không thể khởi động server:', error);
    process.exit(1);
  });

  server.listen(port, '0.0.0.0', () => {
    
    console.log(`Shop Tluxury của AnhTuấnDZ
  link: http://localhost:8080 nè `);
  });
}

startServer(PORT);

// Tắt êm khi `docker stop` gửi SIGTERM
function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);