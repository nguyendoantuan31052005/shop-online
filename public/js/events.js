// Storefront: events. Loaded in index.html order; shared state is in state.js.
document.getElementById('openLoginBtn').addEventListener('click', () => toggleAuth('login'));
document.getElementById('openRegisterBtn').addEventListener('click', () => toggleAuth('register'));
document.getElementById('closeModalBtn').addEventListener('click', () => document.getElementById('authModal').classList.remove('show'));
document.querySelectorAll('[data-switch]').forEach((btn) => {
  btn.addEventListener('click', () => toggleAuth(btn.dataset.switch));
});

sortSelect.addEventListener('change', (event) => {
  sortMode = event.target.value;
  renderProductsPanel();
});

document.querySelector('.search-wrap input').addEventListener('input', (event) => {
  const value = event.target.value.trim();
  selectedCategory = 'Tất cả';
  selectedGender = '';
  document.querySelectorAll('[data-nav]').forEach(button => button.classList.remove('active'));
  renderFilterChips();
  const suggestions = document.getElementById('searchSuggestions');

  if (!value) {
    suggestions.innerHTML = '';
    renderProductsPanel();
    return;
  }

  const matches = getFilteredProducts();

  if (!matches.length) {
    suggestions.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <h4>Không tìm thấy kết quả</h4>
        <div>Gợi ý: áo thun, quần jeans, tai nghe, balo, mũ.</div>
      </div>
    `;
    renderProductsPanel();
    return;
  }

  suggestions.innerHTML = matches.slice(0, 4).map((p, index) => `
    <div class="suggestion-item" data-suggestion="${p.id}">
      <img src="${esc(getProductImage(p, index))}" alt="${esc(p.name)}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';" />
      <div style="font-weight:700; margin-top:8px;">${esc(p.name)}</div>
      <div style="color:var(--sub); font-size:12px; margin-top:4px;">${Number(p.price).toLocaleString('vi-VN')}đ</div>
    </div>
  `).join('');

  suggestions.querySelectorAll('[data-suggestion]').forEach((item) => {
    item.addEventListener('click', () => openDetail(Number(item.dataset.suggestion)));
  });
  renderProductsPanel();
});

function submitSearch() {
  selectedCategory = 'Tất cả';
  selectedGender = '';
  renderFilterChips();
  renderProductsPanel();
  scrollToProducts();
}
document.querySelector('.search-btn').addEventListener('click', submitSearch);
document.querySelector('.search-wrap input')?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    submitSearch();
  }
});

document.querySelectorAll('.nav-item').forEach((button) => {
  button.addEventListener('click', () => applyQuickNavFilter(button.dataset.nav));
});

document.querySelectorAll('.panel-link').forEach((button) => {
  button.addEventListener('click', () => {
    document.getElementById('mobileMenuPanel')?.classList.remove('open');
    applyQuickNavFilter(button.dataset.nav);
  });
});


document.getElementById('registerForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: form.querySelector('[name="name"]').value,
        username: form.querySelector('[name="username"]').value,
        email: form.querySelector('[name="email"]').value,
        password: form.querySelector('[name="password"]').value,
      }),
    });
    localStorage.setItem('shop_token', data.token);
    localStorage.setItem('shop_user', JSON.stringify(data.user));
    setStatus(`Đăng ký thành công. Xin chào ${data.user.name}!`);
    renderUserPanel();
    renderAccountSummary();
    await loadOrderHistory();
    form.reset();
    setTimeout(() => document.getElementById('authModal').classList.remove('show'), 700);
  } catch (error) {
    setStatus(error.message, true);
  }
});

document.getElementById('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: form.querySelector('[name="username"]').value,
        password: form.querySelector('[name="password"]').value,
      }),
    });
    if (data.role === 'admin') {
      localStorage.removeItem('shop_token');
      localStorage.removeItem('shop_user');
      form.reset();
      window.location.assign('/admin');
      return;
    }
    localStorage.setItem('shop_token', data.token);
    localStorage.setItem('shop_user', JSON.stringify(data.user));
    setStatus(`Đăng nhập thành công. Xin chào ${data.user.name}!`);
    renderUserPanel();
    renderAccountSummary();
    await loadOrderHistory();
    form.reset();
    setTimeout(() => document.getElementById('authModal').classList.remove('show'), 700);
  } catch (error) {
    setStatus(error.message, true);
  }
});

document.getElementById('mobileMenuBtn').addEventListener('click', () => {
  document.getElementById('mobileMenuPanel').classList.add('open');
});
document.getElementById('closeMobileMenuBtn').addEventListener('click', () => {
  document.getElementById('mobileMenuPanel').classList.remove('open');
});

document.getElementById('lookupForm').addEventListener('submit',async e=>{
  e.preventDefault(); const f=e.currentTarget; const node=document.getElementById('lookupResult');
  try{const o=await api('/api/orders/'+encodeURIComponent(f.elements.orderId.value)+'?phone='+encodeURIComponent(f.elements.phone.value.trim()));node.textContent='Đơn #'+o.id+' — '+(ADMIN_STATUS_LABELS[o.status]||o.status)+' — '+Number(o.total).toLocaleString('vi-VN')+'đ';}catch(error){node.textContent=error.message;}
});
