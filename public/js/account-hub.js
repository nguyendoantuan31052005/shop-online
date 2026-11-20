// Move the existing live account nodes into a dialog; preserve IDs and listeners.
document.body.insertAdjacentHTML('beforeend', '<dialog id="accountHub" class="account-hub" aria-labelledby="accountHubTitle"><div class="account-hub-heading"><div><span class="service-eyebrow">KHÔNG GIAN CỦA BẠN</span><h2 id="accountHubTitle">Tài khoản & đơn hàng</h2><p>Thông tin cá nhân, những món đồ yêu thích và đơn mua của bạn.</p></div><button type="button" data-close-account aria-label="Đóng tài khoản">×</button></div><nav class="account-hub-tabs" aria-label="Các mục tài khoản"><button type="button" data-account-view="profile">◎ Hồ sơ của tôi</button><button type="button" data-account-view="wishlist">♡ Yêu thích</button><button type="button" data-account-view="orders">▤ Đơn mua</button></nav><div class="account-hub-body"><section id="hubProfile" data-account-panel="profile"></section><section id="hubWishlist" data-account-panel="wishlist" hidden></section><section id="hubOrders" data-account-panel="orders" hidden></section></div><div class="account-hub-footer"><span>Home Shopping · Tài khoản khách hàng</span><button type="button" data-hub-logout>Đăng xuất</button></div></dialog>');
const accountHub = document.getElementById('accountHub');
const oldAccountSection = document.getElementById('accountSummary').closest('.section');
document.getElementById('hubProfile').append(document.getElementById('accountSummary').closest('.account-card'));
document.getElementById('hubWishlist').append(document.getElementById('wishlistList').closest('.account-card'));
oldAccountSection.remove();
const oldOrderSection = document.getElementById('lookupForm').closest('.section');
document.getElementById('hubOrders').append(oldOrderSection);
let accountReturnFocus = null;
function openAccountHub(view = 'profile') {
  if (view !== 'orders' && (!localStorage.getItem('shop_token') || !getStoredUser())) return toggleAuth('login');
  if (!['profile', 'wishlist', 'orders'].includes(view)) view = 'profile';
  if (!accountHub.open) {
    accountReturnFocus = document.activeElement;
    accountHub.showModal();
    refreshCustomerOverview(); loadOrderHistory();
  }
  accountHub.querySelectorAll('[data-account-panel]').forEach(panel => { panel.hidden = panel.dataset.accountPanel !== view; });
  accountHub.querySelectorAll('[data-account-view]').forEach(button => {
    const active = button.dataset.accountView === view;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
  });
  document.querySelector('[data-open-account]')?.setAttribute('aria-expanded', 'true');
  accountHub.querySelector('[data-hub-logout]').hidden = !localStorage.getItem('shop_token');
}
accountHub.addEventListener('close', () => {
  document.querySelector('[data-open-account]')?.setAttribute('aria-expanded', 'false');
  if (accountReturnFocus?.isConnected) accountReturnFocus.focus();
});
accountHub.addEventListener('click', event => {
  if (event.target !== accountHub) return;
  const rect = accountHub.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) accountHub.close();
});
document.addEventListener('click', event => {
  const target = event.target.closest('button,a'); if (!target) return;
  if (target.hasAttribute('data-open-account')) openAccountHub(target.dataset.openAccount);
  if (target.hasAttribute('data-account-view')) openAccountHub(target.dataset.accountView);
  if (target.hasAttribute('data-close-account')) accountHub.close();
  if (target.hasAttribute('data-hub-logout')) document.querySelector('#userPanel [data-logout]')?.click();
  if (target.dataset.homeAction === 'account') openAccountHub();
  if (target.hasAttribute('data-profile-orders')) openAccountHub('orders');
  const href = target.getAttribute('href');
  if (['#accountSummary', '#wishlistList', '#lookupForm'].includes(href)) {
    event.preventDefault(); openAccountHub(href === '#wishlistList' ? 'wishlist' : href === '#lookupForm' ? 'orders' : 'profile');
  }
});
