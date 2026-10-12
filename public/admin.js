'use strict';
const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = (v) => Number(v || 0).toLocaleString('vi-VN') + 'đ';
const labels = {new:'Mới',confirmed:'Đã xác nhận',shipping:'Đang giao',done:'Hoàn thành',cancelled:'Đã hủy'};
const transitions = {new:['confirmed','cancelled'],confirmed:['shipping','cancelled'],shipping:['done','cancelled'],done:[],cancelled:[]};
let products = [], vouchers = [], orders = [], users = [], deleteAction = null;
function message(text, error = false) { $('#message').textContent = text; $('#message').classList.toggle('error', error); }
function auth(show) { $('#dashboard').hidden = !show; $('#loginPanel').hidden = show; $('#logout').hidden = !show; }
async function api(path, options = {}) {
  const res = await fetch('/api/admin/' + path, { ...options, headers: {'Content-Type':'application/json','X-Requested-With':'shop-admin', ...options.headers} });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) { auth(false); document.querySelectorAll('dialog[open]').forEach(d => d.close()); }
    throw new Error(data.error || 'Không thể thực hiện yêu cầu');
  }
  return data;
}
async function refresh() {
  [products, vouchers, orders, users] = await Promise.all(['products','vouchers','orders','users'].map(p => api(p)));
  auth(true); render();
}
function render() {
  const revenue = orders.filter(o => o.status === 'done').reduce((s,o) => s + o.total, 0);
  $('#stats').innerHTML = [['Sản phẩm', products.length],['Đơn mới',orders.filter(o => o.status === 'new').length],['Voucher đang bật',vouchers.filter(v => v.active).length],['Doanh thu hoàn thành',money(revenue)]].map(([label,value]) => `<div class="stat">${esc(label)}<strong>${esc(value)}</strong></div>`).join('');
  renderProducts(); renderVouchers(); renderOrders(); renderUsers();
}
function renderProducts() {
  const q = $('#productSearch').value.toLocaleLowerCase('vi');
  const items = products.filter(p => `${p.id} ${p.name} ${p.category}`.toLocaleLowerCase('vi').includes(q));
  $('#productRows').innerHTML = items.map(p => `<tr><td><div class="product-cell"><img class="product-thumb" src="${esc(p.image || '/images/product-placeholder.svg')}" alt="" loading="lazy"><div><strong>${esc(p.name)}</strong><div class="muted">#${p.id} · ${esc(p.sizes.join(', '))} / ${esc(p.colors.join(', '))}</div></div></div></td><td>${esc(p.category)}</td><td>${money(p.price)}</td><td>${p.stock} ${p.stock === 0 ? '<span class="badge">Hết hàng</span>' : ''}</td><td><button data-edit-product="${p.id}">Sửa</button><button class="danger" data-delete-product="${p.id}">Xóa</button></td></tr>`).join('') || '<tr><td colspan="5" class="empty">Không có sản phẩm</td></tr>';
  $('#categoryOptions').innerHTML = [...new Set(products.map(p => p.category))].map(c => `<option value="${esc(c)}"></option>`).join('');
}
function renderVouchers() {
  const now = new Date().toISOString();
  $('#voucherRows').innerHTML = vouchers.map(v => {
    const status = !v.active ? 'Đã tắt' : v.expiresAt && v.expiresAt <= now ? 'Hết hạn' : v.startsAt && v.startsAt > now ? 'Chưa bắt đầu' : v.usageLimit && v.used >= v.usageLimit ? 'Hết lượt' : 'Đang áp dụng';
    return `<tr><td><strong>${esc(v.code)}</strong><div class="muted">${esc(v.description)}</div></td><td>${v.type === 'shipping' ? 'Miễn phí ship' : v.type === 'percent' ? v.value + '%' : money(v.value)}</td><td>Từ ${money(v.minOrder)}<div class="muted">Tối đa: ${v.maxDiscount ? money(v.maxDiscount) : 'Không giới hạn'}<br>Hết hạn: ${v.expiresAt ? esc(new Date(v.expiresAt).toLocaleString('vi-VN')) : 'Không'}</div></td><td>${v.used} / ${v.usageLimit || '∞'}</td><td><span class="badge">${status}</span></td><td><button data-edit-voucher="${v.id}">Sửa</button><button data-toggle-voucher="${v.id}">${v.active ? 'Tắt' : 'Bật'}</button><button class="danger" data-delete-voucher="${v.id}">Xóa</button></td></tr>`;
  }).join('') || '<tr><td colspan="6" class="empty">Chưa có voucher. Thêm mã ưu đãi đầu tiên.</td></tr>';
}
function renderOrders() {
  $('#orderRows').innerHTML = orders.filter(o => !$('#orderFilter').value || o.status === $('#orderFilter').value).map(o => `<article class="order"><div class="heading"><strong>Đơn #${o.id} · ${esc(new Date(o.created_at).toLocaleString('vi-VN'))}</strong><span class="badge">${esc(labels[o.status] || o.status)}</span></div><p><strong>${esc(o.customer_name)}</strong> · ${esc(o.phone)} · ${esc(o.email || '')}<br>${esc(o.address)}</p><ul>${o.items.map(i => `<li>${esc(i.name)} — ${esc(i.size || '')} / ${esc(i.color || '')} × ${i.quantity} · ${money(i.price * i.quantity)}</li>`).join('')}</ul><p>Tiền hàng: ${money(o.subtotal ?? o.total)} · Ship: ${money(o.shippingFee)} · Giảm: ${money(o.discount)} ${o.voucherCode ? '(' + esc(o.voucherCode) + ')' : ''}<br><strong>Tổng: ${money(o.total)}</strong> · COD</p><div>${(transitions[o.status] || []).map(s => `<button data-order="${o.id}" data-status="${s}" class="${s === 'cancelled' ? 'danger' : ''}">${esc(labels[s])}</button>`).join(' ')}</div></article>`).join('') || '<p class="empty">Không có đơn hàng</p>';
}
function setForm(form, values) { for (const [key,value] of Object.entries(values)) if (form.elements.namedItem(key)) form.elements.namedItem(key).value = value ?? ''; }
function openProduct(id) {
  const form = $('#productForm'); form.reset(); form.querySelector('.form-error').textContent = '';
  const p = products.find(p => p.id === id);
  setForm(form, p ? {...p,sizes:p.sizes.join(', '),colors:p.colors.join(', ')} : {id:'',sizes:'One Size',colors:'Mặc định',price:0,stock:0});
  updateImagePreview(); $('#imageUploadStatus').textContent = '';
  $('#productTitle').textContent = p ? 'Sửa sản phẩm #' + p.id : 'Thêm sản phẩm'; $('#productDialog').showModal();
}
function localDate(value) { if (!value) return ''; const d = new Date(value); return new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,16); }
function openVoucher(id) {
  const form = $('#voucherForm'); form.reset(); form.querySelector('.form-error').textContent = '';
  const v = vouchers.find(v => v.id === id);
  setForm(form, v ? {...v,startsAt:localDate(v.startsAt),expiresAt:localDate(v.expiresAt)} : {id:''});
  $('#voucherTitle').textContent = v ? 'Sửa voucher ' + v.code : 'Thêm voucher'; $('#voucherDialog').showModal();
}
async function saveForm(event, kind) {
  event.preventDefault(); const form = event.currentTarget; const button = form.querySelector('button.primary'); button.disabled = true;
  if (kind === 'products' && imageUploading) { button.disabled = false; return; }
  const data = Object.fromEntries(new FormData(form)); const id = data.id; delete data.id;
  if (kind === 'products') {
    data.price = Number(data.price); data.stock = Number(data.stock);
    data.sizes = data.sizes.split(',').map(x=>x.trim()).filter(Boolean); data.colors = data.colors.split(',').map(x=>x.trim()).filter(Boolean);
  } else {
    for (const key of ['value','minOrder','maxDiscount','usageLimit']) data[key] = Number(data[key]);
    data.active = data.active === 'true';
    for (const key of ['startsAt','expiresAt']) data[key] = data[key] ? new Date(data[key]).toISOString() : null;
  }
  try { await api(kind + (id ? '/' + id : ''), {method:id ? 'PATCH' : 'POST',body:JSON.stringify(data)}); form.closest('dialog').close(); await refresh(); message('Đã lưu thành công.'); }
  catch (e) { form.querySelector('.form-error').textContent = e.message; message(e.message,true); }
  finally { button.disabled = false; }
}
function askDelete(kind, id) {
  const item = (kind === 'products' ? products : vouchers).find(x => x.id === id);
  $('#confirmText').textContent = `Xóa ${item.name || item.code}? Lịch sử đơn hàng đã đặt vẫn được giữ lại.`;
  $('#confirmDialog .form-error').textContent = ''; deleteAction = () => api(kind + '/' + id, {method:'DELETE'}); $('#confirmDialog').showModal();
}
$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault(); const button = e.currentTarget.querySelector('button'); button.disabled = true;
  try { await api('login',{method:'POST',body:JSON.stringify({password:e.currentTarget.elements.password.value})}); $('#loginForm').reset(); await refresh(); message('Đã đăng nhập quản trị.'); }
  catch(e) { message(e.message,true); } finally { button.disabled = false; }
});
$('#logout').onclick = async () => { try { await api('logout',{method:'POST'}); products=[];vouchers=[];orders=[];auth(false);message('Đã đăng xuất.'); } catch(e){message(e.message,true);} };
$('#refresh').onclick = async () => { try{await refresh();message('Đã cập nhật dữ liệu.');}catch(e){message(e.message,true);} };
$('#productSearch').oninput = renderProducts; $('#orderFilter').onchange = renderOrders;
$('#newProduct').onclick = () => openProduct(); $('#newVoucher').onclick = () => openVoucher();
$('#productForm').onsubmit = e => saveForm(e,'products'); $('#voucherForm').onsubmit = e => saveForm(e,'vouchers');
$('#cancelDelete').onclick = () => $('#confirmDialog').close();
$('#confirmDelete').onclick = async () => { const button=$('#confirmDelete');button.disabled=true;try {await deleteAction();$('#confirmDialog').close();await refresh();message('Đã xóa.');}catch(e){$('#confirmDialog .form-error').textContent=e.message;message(e.message,true);}finally{button.disabled=false;} };
document.addEventListener('click',async e => {
  const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
  if(d.close) document.getElementById(d.close).close();
  if(d.tab){document.querySelectorAll('.panel').forEach(p=>p.hidden=p.id!==d.tab);document.querySelectorAll('[data-tab]').forEach(t=>t.classList.toggle('active',t===b));}
  if(d.editProduct) openProduct(Number(d.editProduct)); if(d.editVoucher) openVoucher(Number(d.editVoucher));
  if(d.deleteProduct) askDelete('products',Number(d.deleteProduct)); if(d.deleteVoucher) askDelete('vouchers',Number(d.deleteVoucher));
  if(d.toggleVoucher || d.order){b.disabled=true;try {
    if(d.toggleVoucher){const v=vouchers.find(v=>v.id===Number(d.toggleVoucher));await api('vouchers/'+v.id,{method:'PATCH',body:JSON.stringify({active:!v.active})});}
    if(d.order) await api('orders/'+d.order,{method:'PATCH',body:JSON.stringify({status:d.status})});
    await refresh();message('Đã cập nhật.');
  }catch(e){message(e.message,true);}finally{b.disabled=false;}}
});
api('session').then(refresh).catch(e=>{auth(false);if(!e.message.includes('đăng nhập'))message(e.message,true);});
let imageUploading = false;
function updateImagePreview() {
  const url = $('#productForm').elements.image.value.trim();
  const preview = $('#productImagePreview');
  const valid = /^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url);
  preview.hidden = !valid; $('#imagePlaceholder').hidden = valid;
  if (valid) preview.src = url; else preview.removeAttribute('src');
}
$('#productForm').elements.image.addEventListener('input', updateImagePreview);
$('#productImagePreview').onerror = () => {
  $('#productImagePreview').hidden = true; $('#imagePlaceholder').hidden = false;
  $('#imagePlaceholder').textContent = 'Không tải được ảnh. Kiểm tra đường dẫn ảnh.';
};
$('#productImagePreview').onload = () => { $('#imagePlaceholder').textContent = 'Chưa có ảnh sản phẩm'; };
$('#removeProductImage').onclick = () => {
  $('#productForm').elements.image.value = ''; $('#productImageFile').value = ''; updateImagePreview();
};
$('#productImageFile').onchange = async e => {
  const file = e.target.files[0]; if (!file) return;
  const status = $('#imageUploadStatus');
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    status.textContent = 'Chọn ảnh JPG, PNG hoặc WebP, tối đa 5 MB.'; e.target.value = ''; return;
  }
  imageUploading = true; status.textContent = 'Đang tải ảnh…';
  const controls = [...$('#productForm').querySelectorAll('button,input,select,textarea')];
  const disabledStates = controls.map(control => control.disabled);
  controls.forEach(control => control.disabled = true);
  try {
    const result = await api('images', {method:'POST',headers:{'Content-Type':file.type},body:file});
    $('#productForm').elements.image.value = result.image; updateImagePreview();
    status.textContent = 'Đã tải ảnh. Bấm Lưu sản phẩm để áp dụng.';
  } catch(error) { status.textContent = error.message; }
  finally { imageUploading = false; controls.forEach((control,index) => control.disabled = disabledStates[index]); e.target.value = ''; }
};
document.addEventListener('error', e => {
  if (e.target.matches?.('.product-thumb') && !e.target.src.endsWith('/images/product-placeholder.svg')) e.target.src = '/images/product-placeholder.svg';
}, true);
$('#productDialog').addEventListener('cancel', e => { if (imageUploading) e.preventDefault(); });
function renderUsers() {
  const query = $('#userSearch').value.trim().toLocaleLowerCase('vi');
  const items = users.filter(u => `${u.name} ${u.username} ${u.email}`.toLocaleLowerCase('vi').includes(query));
  $('#userCount').textContent = `${users.length} tài khoản`;
  $('#userRows').innerHTML = items.map(u => `<tr><td><strong>${esc(u.name)}</strong><div class="muted">@${esc(u.username)} · #${u.id}</div></td><td>${esc(u.email || 'Chưa cung cấp')}</td><td>${esc(new Date(u.createdAt).toLocaleDateString('vi-VN'))}</td><td>${u.orderCount}</td><td><span class="badge ${u.disabled ? 'account-locked' : ''}">${u.disabled ? 'Đã khóa' : 'Hoạt động'}</span></td><td><button data-user-orders="${u.id}">Xem đơn</button><button data-user-toggle="${u.id}" class="${u.disabled ? '' : 'danger'}">${u.disabled ? 'Mở khóa' : 'Khóa'}</button></td></tr>`).join('') || '<tr><td colspan="6" class="empty">Không tìm thấy tài khoản</td></tr>';
}
$('#userSearch').oninput = renderUsers;
document.addEventListener('click', async e => {
  const button = e.target.closest('button'); if (!button) return;
  if (button.dataset.userToggle) {
    const user = users.find(u => u.id === Number(button.dataset.userToggle)); if (!user) return;
    button.disabled = true;
    try {
      await api('users/' + user.id, {method:'PATCH',body:JSON.stringify({disabled:!user.disabled})});
      await refresh(); message(user.disabled ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.');
    } catch (error) { message(error.message,true); }
    finally { button.disabled = false; }
  }
  if (button.dataset.userOrders) {
    const user = users.find(u => u.id === Number(button.dataset.userOrders)); if (!user) return;
    $('#userOrdersTitle').textContent = 'Đơn hàng · ' + user.name;
    $('#userOrderRows').textContent = 'Đang tải…'; $('#userOrdersDialog').showModal();
    try {
      const items = await api('users/' + user.id + '/orders');
      if (!$('#userOrdersDialog').open) return;
      $('#userOrderRows').innerHTML = items.map(o => `<article class="order"><div class="heading"><strong>Đơn #${o.id}</strong><span class="badge">${esc(labels[o.status] || o.status)}</span></div><p>${esc(new Date(o.created_at).toLocaleString('vi-VN'))}<br>${esc(o.address)}</p><ul>${o.items.map(i => `<li>${esc(i.name)} · ${esc(i.size || '')} / ${esc(i.color || '')} × ${i.quantity}</li>`).join('')}</ul><strong>${money(o.total)}</strong></article>`).join('') || '<p class="empty">Khách hàng chưa có đơn hàng.</p>';
    } catch (error) { $('#userOrderRows').textContent = error.message; }
  }
});
