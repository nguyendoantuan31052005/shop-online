'use strict';

const crypto = require('node:crypto');
const { HttpError, hashPassword } = require('./db');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const message = 'Nếu email khớp với tài khoản đang hoạt động, bạn sẽ nhận được liên kết đặt lại mật khẩu. Vui lòng kiểm tra cả thư rác.';

function createPasswordReset({ db, sendEmail, origin, now = Date.now }) {
  function save(work) {
    const before = structuredClone(db.data);
    try { const result = work(); db.save(); return result; }
    catch (error) { db.data = before; throw error; }
  }
  return {
    options() { return { emailEnabled: Boolean(sendEmail && origin), authenticatorEnabled: true }; },
    async request(body) {
      if (typeof body.email !== 'string' || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) throw new HttpError(400, 'Email không hợp lệ');
      if (!sendEmail || !origin) throw new HttpError(503, 'Shop chưa kích hoạt gửi email khôi phục. Vui lòng liên hệ shop để được hỗ trợ.');
      const email = body.email.trim().toLowerCase();
      const user = db.data.users.find(u => u.email?.toLowerCase() === email && !u.disabled);
      if (!user || user.passwordReset?.sentAt > now() - 60000) return { message };
      const token = crypto.randomBytes(32).toString('hex');
      const hash = digest(token);
      save(() => { user.passwordReset = { hash, email, password: digest(JSON.stringify(user.password)), version: user.tokenVersion || 0, expiresAt: now() + 15 * 60000, sentAt: now() }; });
      const link = new URL('/', origin); link.hash = 'reset=' + token;
      try { await sendEmail({ to: email, link: link.href }); }
      catch {
        const current = db.data.users.find(u => u.id === user.id);
        if (current?.passwordReset?.hash === hash) save(() => { delete current.passwordReset; });
        console.error('Password reset email delivery failed');
      }
      return { message };
    },
    reset(body) {
      if (typeof body.token !== 'string' || !/^[a-f0-9]{64}$/.test(body.token)) throw new HttpError(400, 'Liên kết không hợp lệ hoặc đã hết hạn');
      if (typeof body.newPassword !== 'string' || body.newPassword.length < 8 || body.newPassword.length > 256) throw new HttpError(400, 'Mật khẩu mới cần từ 8 đến 256 ký tự');
      const hash = digest(body.token);
      const user = db.data.users.find(u => u.passwordReset?.hash === hash);
      const reset = user?.passwordReset;
      if (!user || user.disabled || reset.expiresAt <= now() || reset.email !== user.email?.toLowerCase() || reset.password !== digest(JSON.stringify(user.password)) || reset.version !== (user.tokenVersion || 0)) throw new HttpError(400, 'Liên kết không hợp lệ hoặc đã hết hạn');
      return save(() => { user.password = hashPassword(body.newPassword); user.tokenVersion = (user.tokenVersion || 0) + 1; delete user.passwordReset; return { changed: true, requiresLogin: true }; });
    },
  };
}

function emailConfig(env = process.env) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM || !env.PUBLIC_URL) return {};
  const origin = new URL(env.PUBLIC_URL);
  if (origin.protocol !== 'https:' && !(origin.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(origin.hostname))) throw new Error('PUBLIC_URL cần HTTPS (hoặc localhost để phát triển)');
  if (origin.username || origin.password) throw new Error('PUBLIC_URL không được chứa thông tin đăng nhập');
  const sendMessage = async ({ to, subject, text }) => {
    if (typeof to !== 'string' || typeof subject !== 'string' || typeof text !== 'string') throw new Error('Invalid email message');
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', signal: AbortSignal.timeout(10000), headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: env.MAIL_FROM, to: [to], subject, text }) });
    if (!response.ok) throw new Error('Email delivery failed');
  };
  return {
    origin: origin.origin,
    sendMessage,
    sendEmail: ({ to, link }) => sendMessage({ to, subject: 'Home Shopping · Đặt lại mật khẩu', text: 'Bạn đã yêu cầu đặt lại mật khẩu. Mở liên kết sau trong 15 phút:\n' + link + '\n\nNếu bạn không yêu cầu, hãy bỏ qua email này. Liên kết chỉ dùng một lần.' }),
  };
}
module.exports = { createPasswordReset, emailConfig };