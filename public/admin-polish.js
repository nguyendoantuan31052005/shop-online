'use strict';
const adminPages = {};
const adminSearchText = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
const navigation = $('#dashboard > nav');
navigation.insertAdjacentHTML('afterbegin', '<button data-tab="overviewPanel">Tổng quan</button>');
const overviewPanel = document.createElement('section');
overviewPanel.id = 'overviewPanel'; overviewPanel.className = 'panel';
navigation.insertAdjacentElement('afterend', overviewPanel);
overviewPanel.append($('#stats'), $('.insights'));
overviewPanel.insertAdjacentHTML('beforeend', '<div class="admin-quick-actions"><div><h3>Việc cần làm hôm nay</h3><p>Đi thẳng đến những mục cần xử lý.</p></div><button type="button" data-tab="orders" data-overview-status="new">Xử lý đơn mới ↗</button><button type="button" data-tab="products" data-overview-stock="low">Sản phẩm sắp hết ↗</button><button type="button" data-tab="contactSettings">Cập nhật liên hệ ↗</button></div>');
$('.overview').insertAdjacentHTML('afterend', '<div class="admin-context"><span id="adminSectionTitle">Tổng quan</span><span id="lastUpdated" role="status"></span></div>');
$('#products > .table-wrap').insertAdjacentHTML('beforebegin', '<div class="table-toolbar"><span id="productsTotal"></span><label>Sắp xếp<select id="adminProductSort"><option value="newest">Mới thêm trước</option><option value="stock">Tồn kho thấp trước</option><option value="price_asc">Giá tăng dần</option><option value="price_desc">Giá giảm dần</option></select></label></div>');
$('#vouchers > p').insertAdjacentHTML('afterend', '<div class="admin-filters voucher-filters"><label>Tìm voucher<input id="voucherSearch" type="search" placeholder="Mã hoặc mô tả, có thể nhập không dấu"></label><label>Trạng thái<select id="voucherStatusFilter"><option value="">Tất cả</option><option value="available">Đang áp dụng</option><option value="inactive">Đã tắt</option><option value="expired">Hết hạn / hết lượt</option><option value="scheduled">Chưa bắt đầu</option></select></label></div>');
for (const name of ['products', 'users', 'vouchers']) {
  $('#' + name + ' > .table-wrap').insertAdjacentHTML('afterend', `<div id="${name}Pagination" class="admin-pagination" role="group" aria-label="Phân trang ${name}"></div>`);
}
function adminProductSort(a, b) {
  const mode = $('#adminProductSort').value;
  if (mode === 'stock') return a.stock - b.stock || b.id - a.id;
  if (mode === 'price_asc') return a.price - b.price || b.id - a.id;
  if (mode === 'price_desc') return b.price - a.price || b.id - a.id;
  return b.id - a.id;
}
function voucherState(voucher, now = new Date().toISOString()) {
  if (!voucher.active) return 'inactive';
  if ((voucher.expiresAt && voucher.expiresAt <= now) || (voucher.usageLimit && voucher.used >= voucher.usageLimit)) return 'expired';
  if (voucher.startsAt && voucher.startsAt > now) return 'scheduled';
  return 'available';
}
function filteredVouchers() {
  const query = adminSearchText($('#voucherSearch').value);
  const status = $('#voucherStatusFilter').value;
  return vouchers.filter(voucher => adminSearchText(voucher.code + ' ' + voucher.description).includes(query) && (!status || voucherState(voucher) === status));
}
function adminPaged(items, key, render) {
  const signature = JSON.stringify(items.map(item => item.id));
  const previous = adminPages[key];
  const page = previous?.signature === signature ? previous.page : 1;
  const size = 12, pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(page, pages);
  adminPages[key] = { signature, page: current };
  const from = (current - 1) * size;
  const node = $('#' + key + 'Pagination');
  node.innerHTML = `<span role="status">${items.length ? from + 1 : 0}–${Math.min(from + size, items.length)} / ${items.length}</span><div><button type="button" data-admin-page="${current - 1}" ${current === 1 ? 'disabled' : ''}>← Trước</button><span>Trang ${current}/${pages}</span><button type="button" data-admin-page="${current + 1}" ${current === pages ? 'disabled' : ''}>Sau →</button></div>`;
  node.querySelectorAll('[data-admin-page]').forEach(button => button.onclick = () => { adminPages[key].page = Number(button.dataset.adminPage); render(); });
  if (key === 'products') $('#productsTotal').textContent = `${items.length} sản phẩm phù hợp`;
  return items.slice(from, from + size);
}
$('#adminProductSort').onchange = renderProducts;
$('#voucherSearch').oninput = renderVouchers;
$('#voucherStatusFilter').onchange = renderVouchers;
document.addEventListener('click', event => {
  const button = event.target.closest('[data-tab]');
  if (!button) return;
  $('#adminSectionTitle').textContent = navigation.querySelector(`[data-tab="${button.dataset.tab}"]`)?.textContent || button.textContent;
  if (button.dataset.overviewStatus) { $('#orderFilter').value = button.dataset.overviewStatus; $('#orderSearch').value = ''; $('#orderFrom').value = ''; $('#orderTo').value = ''; renderOrders(); }
  if (button.dataset.overviewStock) { $('#stockFilter').value = button.dataset.overviewStock; $('#adminCategoryFilter').value = ''; $('#productSearch').value = ''; renderProducts(); }
  if (button.dataset.tab === 'contactSettings' && !navigation.contains(button)) navigation.querySelector('[data-tab="contactSettings"]').click();
  navigation.querySelectorAll('[data-tab]').forEach(item => {
    const active = item.dataset.tab === button.dataset.tab;
    item.classList.toggle('active', active);
    if (active) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current');
  });
});
document.addEventListener('error', event => {
  const image = event.target;
  if (image instanceof HTMLImageElement && image.classList.contains('product-thumb') && !image.dataset.fallback) {
    image.dataset.fallback = 'true'; image.src = '/images/product-placeholder.svg';
  }
}, true);
// Fresh sessions open the overview; other panels stay accessible through the tabs.
document.querySelector('[data-tab="overviewPanel"]').click();
