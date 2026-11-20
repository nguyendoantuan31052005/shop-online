'use strict';
const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const adminThemeButton = document.createElement('button');
adminThemeButton.type = 'button';
adminThemeButton.id = 'adminThemeToggle';
adminThemeButton.className = 'admin-theme-toggle';
$('.admin-header-links').prepend(adminThemeButton);
function setAdminTheme(dark) {
  document.documentElement.dataset.adminTheme = dark ? 'dark' : 'light';
  const label = dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối';
  adminThemeButton.setAttribute('aria-pressed', String(dark));
  adminThemeButton.setAttribute('aria-label', label);
  adminThemeButton.title = label;
  adminThemeButton.innerHTML = `<span aria-hidden="true">${dark ? '☀' : '☾'}</span><span>${dark ? 'Giao diện sáng' : 'Giao diện tối'}</span>`;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = dark ? '#171918' : '#f3f5ef';
}
setAdminTheme(document.documentElement.dataset.adminTheme === 'dark');
adminThemeButton.addEventListener('click', () => {
  const dark = document.documentElement.dataset.adminTheme !== 'dark';
  setAdminTheme(dark);
  try { localStorage.setItem('home-shopping-admin-theme', dark ? 'dark' : 'light'); } catch {}
});
const passwordForm = $('#staffPasswordForm');
const passwordUserId = document.createElement('input');
passwordUserId.type = 'hidden';
passwordUserId.name = 'userId';
passwordForm.prepend(passwordUserId);
const passwordHint = document.createElement('p');
passwordHint.className = 'muted';
passwordHint.textContent = 'Mật khẩu cần ít nhất 12 ký tự. Người dùng sẽ phải đăng nhập lại.';
passwordForm.querySelector('.form-error').before(passwordHint);
const money = (v) => Number(v || 0).toLocaleString('vi-VN') + 'đ';
const labels = {new:'Mới',confirmed:'Đã xác nhận',shipping:'Đang giao',done:'Hoàn thành',cancelled:'Đã hủy'};
const transitions = {new:['confirmed','cancelled'],confirmed:['shipping','cancelled'],shipping:['done','cancelled'],done:[],cancelled:[]};
let products = [], vouchers = [], orders = [], users = [], categories = [], staff = [], integrations = null, adminRole = 'owner', deleteAction = null;
let usersRefreshInFlight = false;
function message(text, error = false) { $('#message').textContent = text; $('#message').classList.toggle('error', error); }
function auth(show) { $('#dashboard').hidden = !show; $('#loginPanel').hidden = show; $('#logout').hidden = !show; document.querySelectorAll('[data-owner-only]').forEach(node => node.hidden = !show || adminRole !== 'owner'); }
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
  $('#dashboard').setAttribute('aria-busy', 'true');
  $('#refresh').disabled = true;
  try {
    const session = await api('session');
    adminRole = session.role || 'owner';
    [products, vouchers, orders, users, categories, integrations] = await Promise.all(['products','vouchers','orders','users','categories','integrations'].map(p => api(p)));
    staff = adminRole === 'owner' ? await api('staff') : [];
    auth(true); $('#adminRoleLabel').textContent = adminRole === 'owner' ? 'Chủ shop' : 'Nhân viên'; render();
    $('#lastUpdated').textContent = 'Cập nhật lúc ' + new Date().toLocaleTimeString('vi-VN');
  } finally {
    $('#dashboard').setAttribute('aria-busy', 'false');
    $('#refresh').disabled = false;
  }
}
function render() {
  const revenue = orders.filter(o => o.status === 'done').reduce((s,o) => s + o.total, 0);
  $('#stats').innerHTML = [['Sản phẩm', products.length],['Đơn mới',orders.filter(o => o.status === 'new').length],['Voucher đang bật',vouchers.filter(v => v.active).length],['Doanh thu hoàn thành',money(revenue)]].map(([label,value]) => `<div class="stat">${esc(label)}<strong>${esc(value)}</strong></div>`).join('');
  renderIntegrationStatus();
  renderProducts(); renderCategories(); renderVouchers(); renderOrders(); renderUsers(); renderStaff(); renderAdminInsights();
}
function renderIntegrationStatus() {
  if (!integrations) return;
  const state = (ready, positive, missing) => `<span class="integration-pill ${ready ? 'ready' : 'missing'}"><i aria-hidden="true"></i>${ready ? positive : missing}</span>`;
  const rows = [
    ['Giao hàng GHN', state(integrations.shipping.configured, 'Đã có cấu hình', 'Chưa có thông tin kết nối'), integrations.shipping.automatic ? 'Tự gửi GHN khi khách đặt COD; kích thước lấy theo từng sản phẩm hoặc ước tính theo loại.' : 'Chưa bật tự gửi GHN. Kích thước kiện được ước tính riêng theo các sản phẩm trong từng đơn.'],
    ['Email khách hàng', state(integrations.emailConfigured, 'Đã có cấu hình', 'Chưa cấu hình gửi email'), integrations.emailConfigured ? 'Gửi thông báo đơn và khôi phục mật khẩu.' : 'Cần cấu hình Resend, tên người gửi và URL website.'],
    ['Thanh toán online', state(integrations.payment.online, 'Đã bật', 'Chỉ hỗ trợ COD'), 'Chưa kết nối cổng thanh toán trực tuyến.'],
    ['Lưu trữ dữ liệu', state(!integrations.storage.multiInstance, 'Một máy chủ', 'Nhiều máy chủ'), 'Dữ liệu JSON hiện dùng cho một máy chủ; cần chuyển database trước khi mở rộng.'],
  ];
  $('#integrationStatus').innerHTML = `<div class="integration-heading"><div><h2>Tình trạng vận hành</h2><p>Trạng thái cấu hình hiện tại; thông tin bí mật không hiển thị ở đây.</p></div><span class="integration-note">Dịch vụ ngoài cần thông tin từ tài khoản của shop</span></div><div class="integration-grid">${rows.map(([name,pill,detail]) => `<article class="integration-item"><div><strong>${esc(name)}</strong>${pill}</div><p>${esc(detail)}</p></article>`).join('')}</div>`;
}
function renderProducts() {
  const q = $('#productSearch').value.toLocaleLowerCase('vi');
  const items = adminPaged(products.filter(matchesStockFilter).filter(p => adminSearchText(`${p.id} ${p.name} ${p.category}`).includes(adminSearchText(q))).sort(adminProductSort), 'products', renderProducts);
  $('#productRows').innerHTML = items.map(p => `<tr><td><div class="product-cell"><img class="product-thumb" src="${esc(p.image || '/images/product-placeholder.svg')}" alt="" loading="lazy"><div><strong>${esc(p.name)}</strong><div class="muted">${esc(p.brand || 'Chưa gắn thương hiệu')} · #${p.id} · ${esc(p.sizes.join(', '))} / ${esc(p.colors.join(', '))}</div></div></div></td><td>${esc(p.category)}</td><td>${p.salePrice ? `<del>${money(p.price)}</del><br><strong>${money(p.salePrice)}</strong>` : money(p.price)}</td><td>${p.stock} ${p.stock === 0 ? '<span class="badge">Hết hàng</span>' : ''}</td><td><button data-edit-product="${p.id}">Sửa</button>${adminRole === 'owner' ? `<button class="danger" data-delete-product="${p.id}">Xóa</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">Không có sản phẩm</td></tr>';
  $('#categoryOptions').innerHTML = categories.map(c => `<option value="${esc(c)}"></option>`).join('');
}
function renderCategories() {
  $('#categoryRows').innerHTML = categories.map(name => `<form class="category-row" data-category-original="${esc(name)}"><input name="name" aria-label="Tên danh mục" maxlength="80" required value="${esc(name)}"><span>${products.filter(product => product.category === name).length} sản phẩm</span><button type="submit">Đổi tên</button>${adminRole === 'owner' ? `<button type="button" class="danger" data-category-delete="${esc(name)}">Xóa</button>` : ''}</form>`).join('') || '<p class="empty">Chưa có danh mục.</p>';
}
function renderVouchers() {
  const now = new Date().toISOString();
  $('#voucherRows').innerHTML = adminPaged(filteredVouchers(), 'vouchers', renderVouchers).map(v => {
    const status = !v.active ? 'Đã tắt' : v.expiresAt && v.expiresAt <= now ? 'Hết hạn' : v.startsAt && v.startsAt > now ? 'Chưa bắt đầu' : v.usageLimit && v.used >= v.usageLimit ? 'Hết lượt' : 'Đang áp dụng';
    return `<tr><td><strong>${esc(v.code)}</strong><div class="muted">${esc(v.description)}</div></td><td>${v.type === 'shipping' ? 'Miễn phí ship' : v.type === 'percent' ? v.value + '%' : money(v.value)}</td><td>Từ ${money(v.minOrder)}<div class="muted">Tối đa: ${v.maxDiscount ? money(v.maxDiscount) : 'Không giới hạn'}<br>Hết hạn: ${v.expiresAt ? esc(new Date(v.expiresAt).toLocaleString('vi-VN')) : 'Không'}</div></td><td>${v.used} / ${v.usageLimit || '∞'}</td><td><span class="badge">${status}</span></td><td><button data-edit-voucher="${v.id}">Sửa</button><button data-toggle-voucher="${v.id}">${v.active ? 'Tắt' : 'Bật'}</button>${adminRole === 'owner' ? `<button class="danger" data-delete-voucher="${v.id}">Xóa</button>` : ''}</td></tr>`;
  }).join('') || '<tr><td colspan="6" class="empty">Chưa có voucher. Thêm mã ưu đãi đầu tiên.</td></tr>';
}
function renderOrders() {
  $('#orderRows').innerHTML = filteredAdminOrders().filter(o => !$('#orderFilter').value || o.status === $('#orderFilter').value).map(o => `<article class="order"><div class="heading"><strong>Đơn #${o.id} · ${esc(new Date(o.created_at).toLocaleString('vi-VN'))}</strong><span class="badge">${esc(labels[o.status] || o.status)}</span></div><p><strong>${esc(o.customer_name)}</strong> · ${esc(o.phone)} · ${esc(o.email || '')}<br>${esc(o.address)}</p>${['new','confirmed'].includes(o.status) && !o.shipment?.trackingNumber ? `<form class="order-phone-form" data-order-phone="${o.id}"><label>Số điện thoại nhận hàng<input name="phone" type="tel" value="${esc(o.phone)}" pattern="0[35789][0-9]{8}" maxlength="10" required></label><button type="submit">Lưu số điện thoại</button></form>` : ''}<ul>${o.items.map(i => `<li>${esc(i.name)} — ${esc(i.size || '')} / ${esc(i.color || '')} × ${i.quantity} · ${money(i.price * i.quantity)}</li>`).join('')}</ul>${o.parcel ? `<p class="parcel-estimate">Kiện GHN ${o.parcel.estimated ? 'ước tính' : 'theo thông số sản phẩm'}: ${o.parcel.weight.toLocaleString('vi-VN')} g · ${o.parcel.length} × ${o.parcel.width} × ${o.parcel.height} cm</p>` : ''}<p>Tiền hàng: ${money(o.subtotal ?? o.total)} · Ship: ${money(o.shippingFee)} · Giảm: ${money(o.discount)} ${o.voucherCode ? '(' + esc(o.voucherCode) + ')' : ''}<br><strong>Tổng: ${money(o.total)}</strong> · COD · ${o.paymentStatus === 'paid' ? 'Đã thu tiền' : 'Chưa thu tiền'}</p><div>${(transitions[o.status] || []).map(s => `<button data-order="${o.id}" data-status="${s}" class="${s === 'cancelled' ? 'danger' : ''}">${esc(labels[s])}</button>`).join(' ')}${o.paymentStatus !== 'paid' && ['shipping','done'].includes(o.status) ? ` <button data-payment="${o.id}">Xác nhận đã thu COD</button>` : ''}</div>${o.shipment ? `<p>Vận chuyển: ${esc(o.shipment.carrier)} · Mã ${esc(o.shipment.trackingNumber)} ${o.shipment.trackingUrl ? `· <a href="${esc(o.shipment.trackingUrl)}" target="_blank" rel="noopener">Mở trang tra cứu</a>` : ''}</p>` : ''}${['new','confirmed'].includes(o.status) && !o.shipment?.trackingNumber ? `<button type="button" data-simulate-ghn="${o.id}">Mô phỏng GHN</button>${o.status === 'confirmed' ? ` <button type="button" data-create-ghn="${o.id}">Tạo vận đơn thật</button>` : ''}` : ''}<form class="shipment-form" data-shipment-order="${o.id}"><label>Đơn vị vận chuyển<input name="carrier" maxlength="100" value="${esc(o.shipment?.carrier || '')}" placeholder="GHN, GHTK…"></label><label>Mã vận đơn<input name="trackingNumber" maxlength="120" value="${esc(o.shipment?.trackingNumber || '')}"></label><label>Link theo dõi HTTPS<input name="trackingUrl" type="url" maxlength="1000" value="${esc(o.shipment?.trackingUrl || '')}"></label><button type="submit">Lưu vận đơn</button></form></article>`).join('') || '<p class="empty">Không có đơn hàng</p>';
}
function setForm(form, values) { for (const [key,value] of Object.entries(values)) if (form.elements.namedItem(key)) form.elements.namedItem(key).value = value ?? ''; }
function openProduct(id) {
  const form = $('#productForm'); form.reset(); form.querySelector('.form-error').textContent = '';
  const p = products.find(p => p.id === id);
  setForm(form, p ? {...p,sizes:p.sizes.join(', '),colors:p.colors.join(', '),images:(p.images || []).join('\n')} : {id:'',sizes:'One Size',colors:'Mặc định',price:0,salePrice:'',stock:0,brand:'',images:''});
  updateImagePreview(); updateGalleryPreview(); $('#imageUploadStatus').textContent = '';
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
    for (const key of ['shippingWeightG','shippingLengthCm','shippingWidthCm','shippingHeightCm']) data[key] = data[key] ? Number(data[key]) : null;
    data.salePrice = data.salePrice ? Number(data.salePrice) : null;
    data.images = data.images.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
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
  try { await api('login',{method:'POST',body:JSON.stringify({username:e.currentTarget.elements.username.value,password:e.currentTarget.elements.password.value})}); $('#loginForm').reset(); await refresh(); message('Đã đăng nhập quản trị.'); }
  catch(e) { message(e.message,true); } finally { button.disabled = false; }
});
$('#logout').onclick = async () => { try { await api('logout',{method:'POST'}); products=[];vouchers=[];orders=[];auth(false);message('Đã đăng xuất.'); } catch(e){message(e.message,true);} };
$('#refresh').onclick = async () => { try{await refresh();message('Đã cập nhật dữ liệu.');}catch(e){message(e.message,true);} };
$('#productSearch').oninput = renderProducts; $('#orderFilter').onchange = renderOrders;
$('#newProduct').onclick = () => openProduct(); $('#newVoucher').onclick = () => openVoucher();
$('#productForm').onsubmit = e => saveForm(e,'products'); $('#voucherForm').onsubmit = e => saveForm(e,'vouchers');
$('#categoryForm').onsubmit = async event => { event.preventDefault(); const form = event.currentTarget, button = form.querySelector('button'); button.disabled = true; try { await api('categories', {method:'POST',body:JSON.stringify({name:form.elements.name.value.trim()})}); form.reset(); await refresh(); message('Đã thêm danh mục.'); } catch(error) { message(error.message,true); } finally { button.disabled = false; } };
document.addEventListener('submit', async event => {
  const form = event.target.closest('[data-shipment-order]'); if (!form) return; event.preventDefault();
  const button = form.querySelector('button'); button.disabled = true;
  const shipment = Object.fromEntries(new FormData(form));
  try { await api('orders/' + form.dataset.shipmentOrder, {method:'PATCH',body:JSON.stringify({shipment})}); await refresh(); message('Đã lưu thông tin vận đơn.'); }
  catch(error) { message(error.message,true); }
  finally { button.disabled = false; }
});
document.addEventListener('submit', async event => {
  const phoneForm = event.target.closest('[data-order-phone]');
  if (phoneForm) {
    event.preventDefault(); const button = phoneForm.querySelector('button[type="submit"]'); button.disabled = true;
    try { await api('orders/' + phoneForm.dataset.orderPhone, {method:'PATCH',body:JSON.stringify({phone:phoneForm.elements.phone.value.trim()})}); await refresh(); message('Đã cập nhật số nhận hàng.'); }
    catch(error) { message(error.message,true); }
    finally { button.disabled = false; }
    return;
  }
  const form = event.target.closest('[data-category-original]'); if (!form) return; event.preventDefault();
  const name = form.elements.name.value.trim(), original = form.dataset.categoryOriginal;
  try { await api('categories/' + encodeURIComponent(original), {method:'PATCH',body:JSON.stringify({name})}); await refresh(); message('Đã đổi tên danh mục và cập nhật sản phẩm.'); }
  catch(error) { message(error.message,true); }
});
$('#cancelDelete').onclick = () => $('#confirmDialog').close();
$('#confirmDelete').onclick = async () => { const button=$('#confirmDelete');button.disabled=true;try {await deleteAction();$('#confirmDialog').close();await refresh();message('Đã xóa.');}catch(e){$('#confirmDialog .form-error').textContent=e.message;message(e.message,true);}finally{button.disabled=false;} };
document.addEventListener('click',async e => {
  const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
  if(d.close) document.getElementById(d.close).close();
  if(d.tab){document.querySelectorAll('.panel').forEach(p=>p.hidden=p.id!==d.tab);document.querySelectorAll('[data-tab]').forEach(t=>t.classList.toggle('active',t===b));if(d.tab==='users')await refreshUsers();}
  if(d.editProduct) openProduct(Number(d.editProduct)); if(d.editVoucher) openVoucher(Number(d.editVoucher));
  if(d.categoryDelete){b.disabled=true;try{await api('categories/'+encodeURIComponent(d.categoryDelete),{method:'DELETE'});await refresh();message('Đã xóa danh mục.');}catch(error){message(error.message,true);}finally{b.disabled=false;}}
  if(d.deleteProduct) askDelete('products',Number(d.deleteProduct)); if(d.deleteVoucher) askDelete('vouchers',Number(d.deleteVoucher));
  if(d.createGhn){b.disabled=true;try{await api('orders/'+d.createGhn+'/shipment/ghn',{method:'POST'});await refresh();message('Đã tạo vận đơn GHN.');}catch(error){message(error.message,true);}finally{b.disabled=false;}}
  if(d.simulateGhn){b.disabled=true;try{const result=await api('orders/'+d.simulateGhn+'/shipment/ghn/simulate',{method:'POST'});message('Mô phỏng GHN · mã '+result.trackingNumber+'. Chưa gửi hãng, không lưu vận đơn.');}catch(error){message(error.message,true);}finally{b.disabled=false;}}
  if(d.toggleVoucher || d.order || d.payment){b.disabled=true;try {
    if(d.toggleVoucher){const v=vouchers.find(v=>v.id===Number(d.toggleVoucher));await api('vouchers/'+v.id,{method:'PATCH',body:JSON.stringify({active:!v.active})});}
    if(d.order) await api('orders/'+d.order,{method:'PATCH',body:JSON.stringify({status:d.status})});
    if(d.payment) await api('orders/'+d.payment,{method:'PATCH',body:JSON.stringify({paymentStatus:'paid'})});
    await refresh();message('Đã cập nhật.');
  }catch(e){message(e.message,true);}finally{b.disabled=false;}}
});
window.addEventListener('DOMContentLoaded', () => api('session').then(refresh).catch(e=>{auth(false);if(!e.message.includes('đăng nhập'))message(e.message,true);}));
let imageUploading = false;
function updateImagePreview() {
  const url = $('#productForm').elements.image.value.trim();
  const preview = $('#productImagePreview');
  const valid = /^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url);
  preview.hidden = !valid; $('#imagePlaceholder').hidden = valid;
  if (valid) preview.src = url; else preview.removeAttribute('src');
}
function updateGalleryPreview() {
  const field = $('#productForm').elements.images, gallery = $('#productGalleryPreview');
  const urls = field.value.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
  gallery.replaceChildren();
  urls.forEach((url, index) => {
    if (!/^https?:\/\//i.test(url) && !/^\/(?!\/)/.test(url)) return;
    const item = document.createElement('div'); item.className = 'gallery-preview-item';
    const image = document.createElement('img'); image.src = url; image.alt = `Ảnh chi tiết ${index + 1}`; image.loading = 'lazy';
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', `Xóa ảnh ${index + 1}`);
    remove.onclick = () => { urls.splice(index, 1); field.value = urls.join('\n'); updateGalleryPreview(); };
    item.append(image, remove); gallery.append(item);
  });
}
$('#productForm').elements.image.addEventListener('input', updateImagePreview);
$('#productForm').elements.images.addEventListener('input', updateGalleryPreview);
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
$('#productGalleryFiles').onchange = async e => {
  const files = [...(e.target.files || [])]; if (!files.length) return;
  const status = $('#imageUploadStatus');
  const field = $('#productForm').elements.images;
  const currentImages = field.value.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
  if (currentImages.length + files.length > 8) {
    status.textContent = `Thư viện ảnh chỉ tối đa 8 ảnh; hiện đã có ${currentImages.length}.`;
    e.target.value = ''; return;
  }
  if (files.some(file => !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
    status.textContent = 'Chọn ảnh JPG, PNG hoặc WebP, tối đa 5 MB mỗi ảnh.';
    e.target.value = ''; return;
  }
  imageUploading = true;
  const controls = [...$('#productForm').querySelectorAll('button,input,select,textarea')];
  const disabledStates = controls.map(control => control.disabled);
  controls.forEach(control => control.disabled = true);
  try {
    for (const [index, file] of files.entries()) {
      status.textContent = `Đang tải ảnh ${index + 1}/${files.length}…`;
      const result = await api('images', { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
      currentImages.push(result.image);
      field.value = currentImages.join('\n');
      updateGalleryPreview();
    }
    status.textContent = `Đã tải ${files.length} ảnh chi tiết. Bấm Lưu sản phẩm để áp dụng.`;
  } catch (error) { status.textContent = error.message; }
  finally { imageUploading = false; controls.forEach((control,index) => control.disabled = disabledStates[index]); e.target.value = ''; }
};
document.addEventListener('error', e => {
  if (e.target.matches?.('.product-thumb') && !e.target.src.endsWith('/images/product-placeholder.svg')) e.target.src = '/images/product-placeholder.svg';
}, true);
$('#productDialog').addEventListener('cancel', e => { if (imageUploading) e.preventDefault(); });
function renderUsers() {
  const query = $('#userSearch').value.trim().toLocaleLowerCase('vi');
  const items = adminPaged(users.filter(matchesAccountFilter).filter(u => adminSearchText(`${u.name} ${u.username} ${u.email}`).includes(adminSearchText(query))), 'users', renderUsers);
  $('#userCount').textContent = `${users.length} tài khoản`;
  $('#userRows').innerHTML = items.map(u => `<tr><td><strong>${esc(u.name)}</strong><div class="muted">@${esc(u.username)} · #${u.id}</div></td><td>${esc(u.email || 'Chưa cung cấp')}</td><td>${esc(new Date(u.createdAt).toLocaleDateString('vi-VN'))}</td><td>${u.orderCount}</td><td><span class="badge ${u.disabled ? 'account-locked' : ''}">${u.disabled ? 'Đã khóa' : 'Hoạt động'}</span></td><td><button data-user-orders="${u.id}">Xem đơn</button>${adminRole === 'owner' ? `<button data-user-password="${u.id}">Đặt mật khẩu</button><button data-user-toggle="${u.id}" class="${u.disabled ? '' : 'danger'}">${u.disabled ? 'Mở khóa' : 'Khóa'}</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">Không tìm thấy tài khoản</td></tr>';
}
async function refreshUsers() {
  if (usersRefreshInFlight || $('#dashboard').hidden) return;
  usersRefreshInFlight = true;
  try {
    users = await api('users');
    renderUsers();
  } catch (error) {
    message(error.message, true);
  } finally {
    usersRefreshInFlight = false;
  }
}
function renderStaff() {
  $('#staffRows').innerHTML = staff.map(item => `<tr><td>${esc(item.name)}</td><td>@${esc(item.username)}</td><td>${item.disabled ? 'Đã khóa' : 'Hoạt động'}</td><td><button data-staff-password="${item.id}">Đặt mật khẩu</button><button data-staff-toggle="${item.id}" class="${item.disabled ? '' : 'danger'}">${item.disabled ? 'Mở khóa' : 'Khóa'}</button></td></tr>`).join('') || '<tr><td colspan="4" class="empty">Chưa có tài khoản nhân viên.</td></tr>';
}
$('#staffForm').addEventListener('submit', async event => {
  event.preventDefault(); const form = event.currentTarget, button = form.querySelector('button'); button.disabled = true;
  try { await api('staff', {method:'POST', body:JSON.stringify(Object.fromEntries(new FormData(form)))}); form.reset(); await refresh(); message('Đã tạo tài khoản nhân viên.'); }
  catch (error) { message(error.message, true); }
  finally { button.disabled = false; }
});
$('#staffPasswordForm').addEventListener('submit', async event => {
  event.preventDefault(); const form = event.currentTarget, button = form.querySelector('button[type="submit"]'); button.disabled = true;
  const userId = form.elements.userId.value;
  const isCustomer = Boolean(userId);
  const path = isCustomer ? `users/${userId}/password` : `staff/${form.elements.staffId.value}`;
  try { await api(path, {method:'PATCH',body:JSON.stringify({password:form.elements.password.value})}); form.closest('dialog').close(); form.reset(); await refresh(); message(isCustomer ? 'Đã đặt lại mật khẩu khách hàng. Phiên đăng nhập cũ đã bị thu hồi.' : 'Đã đặt lại mật khẩu nhân viên. Phiên cũ đã bị thu hồi.'); }
  catch (error) { form.querySelector('.form-error').textContent = error.message; }
  finally { button.disabled = false; }
});
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
  if (button.dataset.staffToggle) {
    const item = staff.find(row => row.id === Number(button.dataset.staffToggle)); if (!item) return;
    button.disabled = true;
    try { await api('staff/' + item.id, {method:'PATCH',body:JSON.stringify({disabled:!item.disabled})}); await refresh(); message(item.disabled ? 'Đã mở khóa nhân viên.' : 'Đã khóa nhân viên.'); }
    catch (error) { message(error.message,true); }
    finally { button.disabled = false; }
  }
  if (button.dataset.staffPassword) {
    const item = staff.find(row => row.id === Number(button.dataset.staffPassword)); if (!item) return;
    const form = $('#staffPasswordForm'); form.reset(); form.elements.staffId.value = item.id; form.querySelector('.form-error').textContent = '';
    $('#staffPasswordTitle').textContent = 'Đặt lại mật khẩu · ' + item.name; $('#staffPasswordDialog').showModal();
  }
  if (button.dataset.userPassword) {
    const user = users.find(row => row.id === Number(button.dataset.userPassword)); if (!user) return;
    const form = $('#staffPasswordForm'); form.reset(); form.elements.userId.value = user.id; form.querySelector('.form-error').textContent = '';
    $('#staffPasswordTitle').textContent = 'Đặt lại mật khẩu · ' + user.name; $('#staffPasswordDialog').showModal();
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
setInterval(() => {
  if (!document.hidden && !$('#dashboard').hidden && !$('#users').hidden) refreshUsers();
}, 30000);
