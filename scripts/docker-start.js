const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { setup } = require('./setup');

const root = path.join(__dirname, '..');
process.chdir(root);
setup();
process.loadEnvFile(path.join(root, '.env'));
function run(args) {
  const result = spawnSync('docker', args, { cwd: root, stdio: 'inherit', windowsHide: true });
  if (result.error || result.status !== 0) {
    console.error(result.error?.message || 'Docker chưa sẵn sàng hoặc không thể khởi động cửa hàng. Hãy mở Docker Desktop và thử lại.');
    process.exit(result.status || 1);
  }
}
run(['info', '--format', '{{.ServerVersion}}']);
run(['compose', 'up', '-d', '--build', '--wait', '--wait-timeout', '90']);
const base = 'http://localhost:' + (process.env.HOST_PORT || '8080');
console.log('\nCửa hàng: ' + base + '\nQuản trị: ' + base + '/admin');
console.log('Docker Desktop → Containers → shop-online. Mật khẩu quản trị: ADMIN_TOKEN trong .env.');
console.log('Không cần tạo thêm container bằng nút Run trong Images.');
