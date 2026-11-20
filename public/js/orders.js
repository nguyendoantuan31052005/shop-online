// Storefront: orders. Loaded in index.html order; shared state is in state.js.
async function loadOrderHistory() {
  orderHistory = [];
  if (localStorage.getItem('shop_token')) {
    try { orderHistory = (await api('/api/orders/mine')).map(o => ({...o,time:o.created_at})); }
    catch (e) { document.getElementById('orderHistoryList').textContent = e.message; return; }
  }
  renderOrderHistory(); renderAccountSummary();
  refreshCustomerOverview();
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
    container.innerHTML = '<div class="service-empty"><span class="empty-symbol" aria-hidden="true">◎</span><strong>Chào mừng bạn đến Home Shopping</strong><p>Đăng nhập để xem hồ sơ và theo dõi đơn mua của bạn.</p><button type="button" class="small-btn detail-btn" onclick="toggleAuth(\'login\')">Đăng nhập tài khoản <span aria-hidden="true">→</span></button></div>';
    return;
  }


  renderProfileCard(container, user);
}

function renderOrderHistory() {
  const container = document.getElementById('orderHistoryList');
  if (!orderHistory.length) {
    container.innerHTML = '<div class="service-empty order-empty"><span class="empty-symbol" aria-hidden="true">▤</span><div><strong>Chưa có đơn hàng nào</strong><p>Đơn mua của bạn sẽ xuất hiện tại đây sau khi đặt hàng.</p></div></div>';
    return;
  }

  container.innerHTML = orderHistory.filter(matchesOrderHub).map((order) => `
    <div class="mini-item">
      <div>
        <strong>#${order.id}</strong>
        <div style="color:var(--sub); font-size:12px;">${new Date(order.time).toLocaleString('vi-VN')}</div>
      </div>
      <div style="text-align:right;">
        <strong>${Number(order.total).toLocaleString('vi-VN')}đ</strong>
        <div style="color:var(--green); font-size:12px;">${esc(ADMIN_STATUS_LABELS[order.status] || order.status)}</div>
        <button type="button" class="small-btn" data-view-customer-order="${order.id}">Xem chi tiết →</button>
      </div>
    </div>
  `).join('');
}
