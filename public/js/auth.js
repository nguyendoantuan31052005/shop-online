// Storefront: auth. Loaded in index.html order; shared state is in state.js.
function requireShoppingLogin() {
  if (localStorage.getItem('shop_token') && getStoredUser()) return true;
  closeCart();
  closeDetail();
  document.getElementById('checkoutModal').classList.remove('show');
  toggleAuth('login');
  setStatus('Vui lòng đăng nhập để thêm vào giỏ hàng và mua sản phẩm.');
  return false;
}
function setStatus(message, isError = false) {
  const node = document.getElementById('authStatus');
  if (!node) return;
  node.textContent = message;
  node.style.color = isError ? '#d93025' : '#2f7d4b';
  node.classList.toggle('auth-error', isError);
  node.setAttribute('role', isError ? 'alert' : 'status');
}

function toggleAuth(mode) {
  if (document.getElementById('accountHub')?.open) document.getElementById('accountHub').close();
  const modal = document.getElementById('authModal');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const authTitle = document.getElementById('authTitle');
  const isLogin = mode === 'login';

  loginForm.classList.toggle('hidden', !isLogin);
  registerForm.classList.toggle('hidden', mode !== 'register');
  document.getElementById('forgotPasswordForm').classList.toggle('hidden', mode !== 'forgot');
  document.getElementById('forgotAuthenticatorForm')?.classList.add('hidden');
  const recoveryMethods = document.getElementById('recoveryMethods');
  if (recoveryMethods) recoveryMethods.hidden = mode !== 'forgot';
  const recoveryUnavailable = document.getElementById('recoveryUnavailable');
  if (recoveryUnavailable) {
    if (mode !== 'forgot') recoveryUnavailable.classList.add('hidden');
    else if (window.recoveryOptions && !window.recoveryOptions.emailEnabled && !window.recoveryOptions.authenticatorEnabled) recoveryUnavailable.classList.remove('hidden');
  }
  document.getElementById('resetPasswordForm').classList.toggle('hidden', mode !== 'reset');
  authTitle.textContent = ({ login: 'Đăng nhập', register: 'Đăng ký', forgot: 'Quên mật khẩu', reset: 'Đặt mật khẩu mới' })[mode] || 'Đăng nhập';
  modal.classList.add('show');
  setStatus('');
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('shop_user') || 'null');
  } catch (error) {
    return null;
  }
}

function renderUserPanel() {
  const user = getStoredUser();
  const userPanel = document.getElementById('userPanel');
  const loginBtn = document.getElementById('openLoginBtn');
  const registerBtn = document.getElementById('openRegisterBtn');

  if (user) {
    userPanel.classList.remove('hidden');
    loginBtn.classList.add('hidden');
    registerBtn.classList.add('hidden');
    userPanel.innerHTML = `
      <button type="button" class="user-account-trigger" data-open-account="profile" aria-haspopup="dialog" aria-controls="accountHub" aria-expanded="false" aria-label="Mở tài khoản của ${esc(user.name)}">
      <span class="user-avatar avatar-initial" aria-hidden="true">${esc(String(user.name || 'K').slice(0, 1).toUpperCase())}</span>
      <span class="user-meta">
        <span class="user-name">${esc(user.name)}</span>
        <span class="user-role">Khách hàng</span>
      </span><span class="account-chevron" aria-hidden="true">⌄</span></button>
      <button class="user-action-btn" data-logout="true">Đăng xuất</button>
    `;
  } else {
    userPanel.classList.add('hidden');
    loginBtn.classList.remove('hidden');
    registerBtn.classList.remove('hidden');
    userPanel.innerHTML = '';
  }

  document.querySelector('[data-logout]')?.addEventListener('click', async () => {
    try { await api('/api/auth/logout', {method:'POST'}); } catch (error) { if(error.status !== 401) { showToast(error.message,'error'); return; } }
    cart = []; localStorage.removeItem('shop_cart'); localStorage.removeItem('shop_guest_cart'); renderCart();
    wishlist = []; localStorage.removeItem('shop_wishlist'); renderWishlist(); renderProductsPanel();
    localStorage.removeItem('shop_token');
    localStorage.removeItem('shop_user');
    localStorage.removeItem('shop_admin_token');
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    orderHistory = []; renderOrderHistory();
    renderUserPanel();
    renderAccountSummary();
    showToast('Bạn đã đăng xuất thành công.');
  });
}



async function hydrateUserSession() {
  const token = localStorage.getItem('shop_token');
  if (!token) {
    renderUserPanel();
    return;
  }

  try {
    const response = await api('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response?.user) {
      localStorage.setItem('shop_user', JSON.stringify({
        ...response.user,
        avatar: response.user.avatar || ''
      }));
    }
  } catch (error) {
    localStorage.removeItem('shop_token');
    localStorage.removeItem('shop_user');
  }
  if (localStorage.getItem('shop_token')) await loadCustomerShopping();
  else {
    if (localStorage.getItem('shop_guest_cart')) cart = readArray('shop_guest_cart');
    localStorage.setItem('shop_cart', JSON.stringify(cart));
    renderCart();
  }
  renderUserPanel();
  await loadOrderHistory();
}
