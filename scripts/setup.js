const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
function setup(file = path.join(__dirname, '..', '.env')) {
  const exists = fs.existsSync(file);
  let content = exists ? fs.readFileSync(file, 'utf8') : 'PORT=3000\nHOST_PORT=8080\nCOOKIE_SECURE=false\n';
  let changed = !exists;
  for (const [key, min, bytes] of [['ADMIN_TOKEN', 8, 24], ['JWT_SECRET', 32, 48]]) {
    const pattern = new RegExp('^[ \\t]*(?:export[ \\t]+)?' + key + '[ \\t]*=.*$', 'gm');
    const matches = [...content.matchAll(pattern)];
    const raw = matches.at(-1)?.[0].split('=').slice(1).join('=').trim() || '';
    const value = raw.startsWith('"') || raw.startsWith("'") ? raw.slice(1, raw.indexOf(raw[0], 1)) : raw.split('#')[0].trim();
    if (value.length >= min && value !== 'doi-mat-khau-nay') continue;
    const line = key + '=' + crypto.randomBytes(bytes).toString('hex');
    content = matches.length ? content.replace(pattern, line) : content.replace(/\n?$/, '\n') + line + '\n';
    changed = true;
  }
  if (changed) fs.writeFileSync(file, content, { mode: 0o600, flag: exists ? 'w' : 'wx' });
  return changed;
}
if (require.main === module) {
  console.log(setup()
    ? 'Đã tạo/bổ sung secrets hợp lệ trong .env. Mở file để xem ADMIN_TOKEN đăng nhập /admin. Nếu dùng Docker, chạy docker compose up -d --build --force-recreate.'
    : '.env đã có secrets hợp lệ, giữ nguyên cấu hình.');
}
module.exports = { setup };
