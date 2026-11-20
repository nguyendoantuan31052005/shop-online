const { HttpError } = require('./db');
const defaults = { phone: '0777523946', zaloPhone: '0777523946', facebookName: 'TuanDoan', facebookUrl: '', messengerUrl: '', email: '', address: '', hours: '' };
function getContact(db) {
  return Object.fromEntries(Object.keys(defaults).map(key => [key, db.data.contact?.[key] ?? defaults[key]]));
}
function saveContact(db, input) {
  if (!input || Object.keys(input).some(key => !Object.hasOwn(defaults, key))) throw new HttpError(400, 'Trường liên hệ không hợp lệ');
  const next = { ...getContact(db), ...input };
  for (const [key, value] of Object.entries(next)) {
    if (typeof value !== 'string' || value.length > (key === 'address' ? 1000 : 300)) throw new HttpError(400, 'Thông tin liên hệ không hợp lệ');
    next[key] = value.trim();
  }
  for (const key of ['phone', 'zaloPhone']) if (next[key] && !/^0\d{9,10}$/.test(next[key])) throw new HttpError(400, 'Số điện thoại phải bắt đầu bằng 0 và có 10–11 chữ số');
  if (next.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email)) throw new HttpError(400, 'Email không hợp lệ');
  for (const [key, hosts] of [['facebookUrl', ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.com', 'www.fb.com']], ['messengerUrl', ['m.me', 'www.messenger.com', 'messenger.com', 'www.facebook.com', 'facebook.com']]]) {
    if (!next[key]) continue;
    let url;
    try { url = new URL(next[key]); } catch { throw new HttpError(400, 'Liên kết Facebook/Messenger không hợp lệ'); }
    if (url.protocol !== 'https:' || !hosts.includes(url.hostname) || url.username || url.password || url.port) throw new HttpError(400, 'Dùng liên kết HTTPS chính thức của Facebook/Messenger');
    next[key] = url.href;
  }
  const previous = db.data.contact;
  db.data.contact = next;
  try { db.save(); } catch (error) { if (previous === undefined) delete db.data.contact; else db.data.contact = previous; throw error; }
  return getContact(db);
}
module.exports = { getContact, saveContact };
