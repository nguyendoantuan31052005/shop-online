'use strict';

const { HttpError, hashPassword } = require('./db');

function safeStaff(staff) {
  return { id: staff.id, name: staff.name, username: staff.username, disabled: !!staff.disabled, createdAt: staff.created_at };
}

function transaction(db, work) {
  const before = structuredClone(db.data);
  try { const result = work(); db.save(); return structuredClone(result); }
  catch (error) { db.data = before; throw error; }
}

function list(db) {
  return (db.data.staff || []).map(safeStaff).sort((a, b) => a.id - b.id);
}

function create(db, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, 'Thông tin nhân viên không hợp lệ');
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const username = typeof input.username === 'string' ? input.username.trim() : '';
  const password = input.password;
  if (!name || name.length > 120 || !/^[a-zA-Z0-9._-]{3,40}$/.test(username) || username.toLowerCase() === 'admin') throw new HttpError(400, 'Nhập họ tên và username nhân viên hợp lệ (3–40 chữ cái, số, dấu chấm, gạch dưới hoặc gạch ngang)');
  if (typeof password !== 'string' || password.length < 12 || password.length > 256 || !password.trim()) throw new HttpError(400, 'Mật khẩu nhân viên cần từ 12 đến 256 ký tự');
  const key = username.toLowerCase();
  if ((db.data.staff || []).some(s => s.username.toLowerCase() === key) || db.data.users.some(u => u.username.toLowerCase() === key || u.email?.toLowerCase() === key)) throw new HttpError(409, 'Tên đăng nhập đã được sử dụng');
  return transaction(db, () => {
    db.data.staff ||= [];
    db.data.nextStaffId ||= 1;
    const staff = { id: db.data.nextStaffId++, name, username, password: hashPassword(password), disabled: false, tokenVersion: 0, created_at: new Date().toISOString() };
    db.data.staff.push(staff);
    return safeStaff(staff);
  });
}

function update(db, id, input) {
  const staff = (db.data.staff || []).find(s => s.id === id);
  if (!staff) throw new HttpError(404, 'Staff account not found');
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, 'Thông tin nhân viên không hợp lệ');
  const keys = Object.keys(input);
  if (keys.length !== 1 || !['disabled', 'password'].includes(keys[0])) throw new HttpError(400, 'Chỉ được cập nhật trạng thái hoặc mật khẩu nhân viên');
  if (keys[0] === 'disabled' && typeof input.disabled !== 'boolean') throw new HttpError(400, 'Trạng thái nhân viên không hợp lệ');
  if (keys[0] === 'password' && (typeof input.password !== 'string' || input.password.length < 12 || input.password.length > 256 || !input.password.trim())) throw new HttpError(400, 'Mật khẩu nhân viên cần từ 12 đến 256 ký tự');
  return transaction(db, () => {
    if (keys[0] === 'disabled') staff.disabled = input.disabled;
    else { staff.password = hashPassword(input.password); staff.tokenVersion = (staff.tokenVersion || 0) + 1; }
    return safeStaff(staff);
  });
}

module.exports = { list, create, update, safeStaff };
