'use strict';
$('#refresh').insertAdjacentHTML('beforebegin', '<button data-tab="contactSettings">Liên hệ shop</button>');
$('#dashboard').insertAdjacentHTML('beforeend', '<section id="contactSettings" class="card panel" hidden><div class="heading"><h2>Thông tin liên hệ công khai</h2></div><p>Khách hàng có thể gọi, nhắn Zalo, mở Facebook/Messenger hoặc gửi email. Bỏ trống kênh chưa sử dụng để ẩn trên cửa hàng.</p><form id="contactSettingsForm"><div class="grid"><label>Điện thoại<input name="phone" type="tel" placeholder="0777523946"></label><label>Số Zalo<input name="zaloPhone" type="tel" placeholder="Số điện thoại đăng ký Zalo"></label><label>Tên Facebook<input name="facebookName" maxlength="300"></label><label>Link Facebook chính xác<input name="facebookUrl" type="url" placeholder="https://www.facebook.com/..."></label><label>Link Messenger<input name="messengerUrl" type="url" placeholder="https://m.me/..."></label><label>Email<input name="email" type="email"></label><label>Địa chỉ shop<input name="address" maxlength="1000"></label><label>Giờ hỗ trợ<input name="hours" maxlength="300" placeholder="Ví dụ: 8:00–21:00, thứ 2–chủ nhật"></label></div><button type="submit" class="primary" disabled>Lưu thông tin liên hệ</button><button type="button" id="reloadContactSettings">Tải lại thông tin</button><p id="contactSettingsFeedback" role="status" aria-live="polite"></p></form></section>');
let contactSettingsLoaded = false;
let contactSettingsLoading = false;
async function loadContactSettings() {
  if (contactSettingsLoading) return;
  const form = $('#contactSettingsForm'), button = form.querySelector('[type=submit]');
  const retry = $('#reloadContactSettings'), feedback = $('#contactSettingsFeedback');
  contactSettingsLoading = true; button.disabled = true; retry.disabled = true; feedback.textContent = 'Đang tải thông tin…';
  try {
    let contact;
    for (let attempt = 0; attempt < 2; attempt++) {
      try { contact = await api('contact'); break; }
      catch (error) {
        if (attempt === 0 && error.name === 'TypeError') { await new Promise(resolve => setTimeout(resolve, 700)); continue; }
        throw error;
      }
    }
    setForm(form, contact); contactSettingsLoaded = true; feedback.textContent = '';
  } catch (error) {
    const detail = error.name === 'TypeError' || error.message === 'Failed to fetch'
      ? 'Không kết nối được máy chủ cửa hàng. Kiểm tra kết nối mạng rồi bấm “Tải lại thông tin”.'
      : error.message;
    feedback.textContent = `Chưa tải được thông tin liên hệ: ${detail}`;
  } finally { contactSettingsLoading = false; button.disabled = !contactSettingsLoaded; retry.disabled = false; }
}
document.querySelector('[data-tab="contactSettings"]').addEventListener('click', loadContactSettings);
$('#reloadContactSettings').addEventListener('click', loadContactSettings);
$('#contactSettingsForm').onsubmit = async event => {
  event.preventDefault();
  const form = event.currentTarget, button = form.querySelector('[type=submit]');
  if (!contactSettingsLoaded || button.disabled) return;
  button.disabled = true;
  try {
    const contact = await api('contact', { method: 'PUT', body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    setForm(form, contact); $('#contactSettingsFeedback').textContent = 'Đã lưu. Thông tin mới hiển thị khi khách tải lại cửa hàng.';
  } catch (error) {
    $('#contactSettingsFeedback').textContent = error.name === 'TypeError' || error.message === 'Failed to fetch'
      ? 'Không kết nối được máy chủ. Thông tin có thể chưa lưu; hãy tải lại để kiểm tra trước khi thử lại.'
      : error.message;
  }
  finally { button.disabled = false; }
};
// All datasets are loaded through the authenticated admin API in admin.js.
$('#stats').insertAdjacentHTML('afterend', '<section class="card insights"><div class="heading"><h2>Nhịp kinh doanh</h2><span class="muted">6 tháng gần nhất · doanh thu đơn hoàn thành</span></div><div class="insights-grid"><div id="revenueTrend"></div><div><h3>Trạng thái đơn hàng</h3><div id="orderBreakdown"></div></div><div><h3>Cần chú ý</h3><div id="stockAlerts"></div></div></div></section>');
$('#orderRows').insertAdjacentHTML('beforebegin', '<div class="admin-filters"><label>Tìm đơn<input id="orderSearch" type="search" placeholder="Mã đơn, khách hàng, số điện thoại"></label><label>Từ ngày<input id="orderFrom" type="date"></label><label>Đến ngày<input id="orderTo" type="date"></label><button id="resetOrderFilters" type="button">Xóa bộ lọc</button><button id="exportOrders" type="button">Xuất CSV</button></div><p id="orderFilterSummary" role="status"></p>');
$('#products > label').insertAdjacentHTML('afterend', '<label class="extra-filter">Tình trạng tồn kho<select id="stockFilter"><option value="">Tất cả sản phẩm</option><option value="low">Sắp hết (1–4)</option><option value="out">Hết hàng</option><option value="available">Còn hàng</option></select></label>');
$('#users > label').insertAdjacentHTML('afterend', '<label class="extra-filter">Trạng thái tài khoản<select id="accountFilter"><option value="">Tất cả tài khoản</option><option value="active">Đang hoạt động</option><option value="locked">Đã khóa</option></select></label>');
function matchesStockFilter(product) {
  const category = $('#adminCategoryFilter')?.value || '';
  if (category && product.category !== category) return false;
  const filter = $('#stockFilter').value;
  return !filter || (filter === 'low' && product.stock > 0 && product.stock < 5) || (filter === 'out' && product.stock === 0) || (filter === 'available' && product.stock > 0);
}
function matchesAccountFilter(user) {
  const filter = $('#accountFilter').value;
  return !filter || (filter === 'locked' ? user.disabled : !user.disabled);
}
function filteredAdminOrders() {
  const query = $('#orderSearch').value.trim().toLocaleLowerCase('vi');
  const from = $('#orderFrom').value, to = $('#orderTo').value;
  const invalid = from && to && from > to;
  const result = invalid ? [] : orders.filter(order => {
    // Use the same local calendar date as the dates displayed in the dashboard.
    const date = new Date(order.created_at);
    const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return `${order.id} ${order.customer_name} ${order.phone} ${order.email || ''}`.toLocaleLowerCase('vi').includes(query) && (!from || day >= from) && (!to || day <= to) && (!$('#orderFilter').value || order.status === $('#orderFilter').value);
  });
  $('#orderFilterSummary').textContent = invalid ? 'Ngày kết thúc phải từ ngày bắt đầu trở đi.' : `${result.length}/${orders.length} đơn hàng · Tổng giá trị: ${money(result.reduce((sum, order) => sum + order.total, 0))}. Doanh thu chỉ tính đơn hoàn thành.`;
  $('#exportOrders').disabled = !result.length;
  return result;
}
function renderAdminInsights() {
  const categorySelect = $('#adminCategoryFilter');
  if (categorySelect) {
    const selected = categorySelect.value;
    categorySelect.innerHTML = '<option value="">Tất cả danh mục</option>' + [...new Set(products.map(product => product.category))].map(category => `<option value="${esc(category)}">${esc(category)}</option>`).join('');
    categorySelect.value = selected;
  }
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const start = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return { label: `T${start.getMonth() + 1}/${start.getFullYear()}`, value: orders.filter(order => order.status === 'done' && new Date(order.created_at) >= start && new Date(order.created_at) < end).reduce((sum, order) => sum + order.total, 0) };
  });
  const max = Math.max(1, ...months.map(month => month.value));
  $('#revenueTrend').innerHTML = months.map(month => `<div class="trend-row"><span>${month.label}</span><div class="trend-track"><div style="width:${month.value / max * 100}%"></div></div><strong>${money(month.value)}</strong></div>`).join('');
  $('#orderBreakdown').innerHTML = Object.entries(labels).map(([status, label]) => `<div class="insight-row"><span>${label}</span><strong>${orders.filter(order => order.status === status).length}</strong></div>`).join('');
  const low = products.filter(product => product.stock < 5).sort((a, b) => a.stock - b.stock);
  $('#stockAlerts').innerHTML = `<p class="muted">${low.length} sản phẩm có tồn kho dưới 5 · ${users.filter(user => user.disabled).length} tài khoản bị khóa</p>` + (low.slice(0, 4).map(product => `<button type="button" class="stock-alert" data-edit-product="${product.id}"><span>${esc(product.name)}</span><strong>${product.stock === 0 ? 'Hết hàng' : 'Còn ' + product.stock}</strong></button>`).join('') || '<p>Tồn kho đang ổn định.</p>');
}
function orderCsv(rows) {
  const cell = value => {
    let text = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  const headers = ['Mã đơn', 'Khách hàng', 'Điện thoại', 'Email', 'Địa chỉ', 'Trạng thái', 'Tổng tiền (VND)', 'Ngày đặt'];
  return '\uFEFF' + [headers, ...rows.map(order => [order.id, order.customer_name, order.phone, order.email, order.address, labels[order.status] || order.status, order.total, order.created_at])].map(row => row.map(cell).join(',')).join('\r\n');
}
$('#stockFilter').onchange = renderProducts;
$('#accountFilter').onchange = renderUsers;
for (const id of ['orderSearch', 'orderFrom', 'orderTo']) $('#' + id).addEventListener('input', renderOrders);
$('#resetOrderFilters').onclick = () => { for (const id of ['orderSearch', 'orderFrom', 'orderTo', 'orderFilter']) $('#' + id).value = ''; renderOrders(); };
$('#exportOrders').onclick = () => {
  const rows = filteredAdminOrders();
  if (!rows.length) return;
  const url = URL.createObjectURL(new Blob([orderCsv(rows)], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'home-shopping-orders.csv'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  message('Đã xuất ' + rows.length + ' đơn theo bộ lọc hiện tại.');
};
$('#products > label').insertAdjacentHTML('afterend', '<label class="extra-filter">Danh mục sản phẩm<select id="adminCategoryFilter"><option value="">Tất cả danh mục</option></select></label>');
$('#adminCategoryFilter').onchange = renderProducts;
