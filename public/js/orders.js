// Storefront: orders. Loaded in index.html order; shared state is in state.js.
async function loadOrderHistory() {
  orderHistory = [];
  if (localStorage.getItem('shop_token')) {
    try { orderHistory = (await api('/api/orders/mine')).map(o => ({...o,time:o.created_at})); }
    catch (e) { document.getElementById('orderHistoryList').textContent = e.message; return; }
  }
  renderOrderHistory(); renderAccountSummary();
}
const ADMIN_STATUS_LABELS = {
  new: 'Mới',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  done: 'Hoàn tất',
  cancelled: 'Đã hủy',
};


function renderAccountSummary() {
  const container = document.getElementById('accountSummary');
  const token = localStorage.getItem('shop_token');
  const user = getStoredUser();

  if (!token || !user) {
    container.innerHTML = '<div class="mini-item"><span>Chưa đăng nhập</span><button class="small-btn detail-btn" onclick="document.getElementById(\'authModal\').classList.add(\'show\')">Đăng nhập</button></div>';
    return;
  }


  const totalSpent = orderHistory.filter(order => order.status === 'done').reduce((sum, order) => sum + Number(order.total || 0), 0);
  container.innerHTML = `
    <div class="mini-item"><span>Khách hàng</span><strong>${esc(user.name)}</strong></div>
    <div class="mini-item"><span>Đã mua (đơn hoàn thành)</span><strong>${totalSpent.toLocaleString('vi-VN')}đ</strong></div>
    <div class="mini-item"><span>Email</span><strong>${esc(user.email || 'Chưa cung cấp')}</strong></div>
  `;
}

function renderOrderHistory() {
  const container = document.getElementById('orderHistoryList');
  if (!orderHistory.length) {
    container.innerHTML = '<div class="mini-item"><span>Chưa có đơn hàng nào</span></div>';
    return;
  }

  container.innerHTML = orderHistory.slice(0, 5).map((order) => `
    <div class="mini-item">
      <div>
        <strong>#${order.id}</strong>
        <div style="color:var(--sub); font-size:12px;">${new Date(order.time).toLocaleString('vi-VN')}</div>
      </div>
      <div style="text-align:right;">
        <strong>${Number(order.total).toLocaleString('vi-VN')}đ</strong>
        <div style="color:var(--green); font-size:12px;">${esc(ADMIN_STATUS_LABELS[order.status] || order.status)}</div>
      </div>
    </div>
  `).join('');
}
