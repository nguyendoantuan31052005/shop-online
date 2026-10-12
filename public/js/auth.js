// Storefront: auth. Loaded in index.html order; shared state is in state.js.
function setStatus(message, isError = false) {
  const node = document.getElementById('authStatus');
  if (!node) return;
  node.textContent = message;
  node.style.color = isError ? '#d93025' : '#2f7d4b';
}

function toggleAuth(mode) {
  const modal = document.getElementById('authModal');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const authTitle = document.getElementById('authTitle');
  const isLogin = mode === 'login';

  loginForm.classList.toggle('hidden', !isLogin);
  registerForm.classList.toggle('hidden', isLogin);
  authTitle.textContent = isLogin ? 'Đăng nhập' : 'Đăng ký';
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
  const badge = document.getElementById('userBadge');

  if (user) {
    userPanel.classList.remove('hidden');
    loginBtn.classList.add('hidden');
    registerBtn.classList.add('hidden');
    userPanel.innerHTML = `
      <span class="user-avatar avatar-initial" aria-hidden="true">${esc(String(user.name || 'K').slice(0, 1).toUpperCase())}</span>
      <div class="user-meta">
        <span class="user-name">${esc(user.name)}</span>
        <span class="user-role">Khách hàng</span>
      </div>
      <button class="user-action-btn" data-logout="true">Đăng xuất</button>
    `;
    badge.textContent = `Xin chào, ${user.name}`;
  } else {
    userPanel.classList.add('hidden');
    loginBtn.classList.remove('hidden');
    registerBtn.classList.remove('hidden');
    badge.textContent = 'Bạn chưa đăng nhập';
    userPanel.innerHTML = '';
  }

  document.querySelector('[data-logout]')?.addEventListener('click', () => {
    localStorage.removeItem('shop_token');
    localStorage.removeItem('shop_user');
    localStorage.removeItem('shop_admin_token');
    orderHistory = []; renderOrderHistory();
    renderUserPanel();
    renderAccountSummary();
    showToast('Bạn đã đăng xuất thành công.');
  });
}


function updateUserBadge() {
  const token = localStorage.getItem('shop_token');
  const badge = document.getElementById('userBadge');
  if (!token) {
    badge.textContent = 'Bạn chưa đăng nhập';
    return;
  }
  const user = getStoredUser();
  badge.textContent = user ? `Xin chào, ${user.name}` : 'Tài khoản đã đăng nhập';
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
  renderUserPanel();
  await loadOrderHistory();
}
