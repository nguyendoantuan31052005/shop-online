'use strict';

const crypto = require('node:crypto');
const { HttpError, hashPassword } = require('./db');
const { normalizeVietnamPhone, isVietnamMobilePhone } = require('./phone');

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');

function encodeBase32(bytes) {
  let bits = 0, value = 0, output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) { output += ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits) output += ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

function decodeBase32(text) {
  let bits = 0, value = 0;
  const output = [];
  for (const char of String(text).toUpperCase().replace(/=+$/g, '').replace(/\s/g, '')) {
    const index = ALPHABET.indexOf(char);
    if (index < 0) throw new Error('Invalid TOTP secret');
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) { output.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(output);
}

function makeCode(secret, counter) {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const mac = crypto.createHmac('sha1', decodeBase32(secret)).update(message).digest();
  const offset = mac[mac.length - 1] & 15;
  const binary = ((mac[offset] & 127) << 24) | (mac[offset + 1] << 16) | (mac[offset + 2] << 8) | mac[offset + 3];
  return String(binary % 1_000_000).padStart(6, '0');
}

function matchingCounter(secret, code, now, lastCounter = -1) {
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) return null;
  const current = Math.floor(now / 30000);
  for (const counter of [current, current - 1, current + 1]) {
    if (counter <= lastCounter) continue;
    const expected = makeCode(secret, counter);
    if (crypto.timingSafeEqual(Buffer.from(code), Buffer.from(expected))) return counter;
  }
  return null;
}

function encryptionKey(secret, userId) {
  return crypto.createHash('sha256').update(`${secret}:${userId}`).digest();
}

function encryptSecret(value, secret, userId) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(secret, userId), iv);
  cipher.setAAD(Buffer.from(String(userId)));
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
}

function decryptSecret(value, secret, userId) {
  const bytes = Buffer.from(value, 'base64url');
  if (bytes.length < 29) throw new Error('Invalid encrypted TOTP secret');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(secret, userId), bytes.subarray(0, 12));
  decipher.setAAD(Buffer.from(String(userId)));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8');
}

function createTotp({ db, secret, now = Date.now }) {
  function save(work) {
    const previous = structuredClone(db.data);
    try { const result = work(); db.save(); return result; }
    catch (error) { db.data = previous; throw error; }
  }
  function userRecord(id) {
    const user = db.data.users.find(item => item.id === Number(id) && !item.disabled);
    if (!user) throw new HttpError(401, 'Vui lòng đăng nhập lại.');
    return user;
  }
  function status(userId) {
    return { enabled: Boolean(userRecord(userId).totpSecret) };
  }
  function setup(userId) {
    const user = userRecord(userId);
    if (!isVietnamMobilePhone(normalizeVietnamPhone(user.phone))) throw new HttpError(400, 'Hãy lưu số điện thoại di động vào hồ sơ trước khi bật Authenticator.');
    if (user.totpSecret) throw new HttpError(409, 'Authenticator đã được bật cho tài khoản này.');
    const generated = encodeBase32(crypto.randomBytes(20));
    save(() => { user.totpEnrollment = { secret: encryptSecret(generated, secret, user.id), expiresAt: now() + 10 * 60 * 1000 }; });
    const label = encodeURIComponent(`Home Shopping:${user.username}`);
    const issuer = encodeURIComponent('Home Shopping');
    const otpAuthUri = `otpauth://totp/${label}?secret=${generated}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
    return { secret: generated, otpAuthUri, expiresInSeconds: 600 };
  }
  function enable(userId, body) {
    const user = userRecord(userId);
    const enrollment = user.totpEnrollment;
    if (!enrollment || enrollment.expiresAt <= now()) throw new HttpError(400, 'Thiết lập đã hết hạn. Hãy bắt đầu lại.');
    const enrollmentSecret = decryptSecret(enrollment.secret, secret, user.id);
    const counter = matchingCounter(enrollmentSecret, body.otp, now());
    if (counter === null) throw new HttpError(400, 'Mã xác minh không hợp lệ hoặc đã hết hạn.');
    return save(() => {
      user.totpSecret = enrollment.secret;
      user.totpLastCounter = counter;
      delete user.totpEnrollment;
      return { enabled: true };
    });
  }
  function disable(userId, body) {
    const user = userRecord(userId);
    if (!user.totpSecret) throw new HttpError(409, 'Authenticator chưa được bật.');
    const currentSecret = decryptSecret(user.totpSecret, secret, user.id);
    const counter = matchingCounter(currentSecret, body.otp, now(), user.totpLastCounter ?? -1);
    if (counter === null) throw new HttpError(400, 'Mã xác minh không hợp lệ hoặc đã hết hạn.');
    return save(() => {
      delete user.totpSecret;
      delete user.totpLastCounter;
      delete user.totpEnrollment;
      return { enabled: false };
    });
  }
  function resetPassword(body) {
    if (typeof body.phone !== 'string' || body.phone.length > 32) throw new HttpError(400, 'Số điện thoại hoặc mã xác minh không hợp lệ.');
    const phone = normalizeVietnamPhone(body.phone);
    if (!isVietnamMobilePhone(phone) || typeof body.newPassword !== 'string' || body.newPassword.length < 8 || body.newPassword.length > 256) throw new HttpError(400, 'Thông tin khôi phục không hợp lệ.');
    const matches = db.data.users.filter(item => !item.disabled && normalizeVietnamPhone(item.phone) === phone && item.totpSecret);
    const user = matches.length === 1 ? matches[0] : null;
    const counter = user ? matchingCounter(decryptSecret(user.totpSecret, secret, user.id), body.otp, now(), user.totpLastCounter ?? -1) : null;
    if (!user || counter === null) throw new HttpError(400, 'Số điện thoại hoặc mã Authenticator không hợp lệ.');
    return save(() => {
      user.password = hashPassword(body.newPassword);
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      user.totpLastCounter = counter;
      delete user.passwordReset;
      delete user.passwordOtpReset;
      return { changed: true, requiresLogin: true };
    });
  }
  return { status, setup, enable, disable, resetPassword };
}

module.exports = { createTotp, encodeBase32, decodeBase32, makeCode, matchingCounter };
