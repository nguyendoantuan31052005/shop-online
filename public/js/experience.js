// Customer tools use existing authenticated backend endpoints.
let comparisonIds = [];
const experienceMoney = value => Number(value).toLocaleString('vi-VN') + 'đ';
function rememberProduct(id) {
  const ids = [id, ...readArray('shop_recent').filter(value => value !== id)].slice(0, 8);
  localStorage.setItem('shop_recent', JSON.stringify(ids));
  renderRecentProducts();
}
function renderRecentProducts() {
  const products = readArray('shop_recent').map(id => allProducts.find(p => p.id === id)).filter(Boolean).slice(0, 4);
  document.getElementById('recentSection').hidden = !products.length;
  document.getElementById('recentProducts').innerHTML = products.map(p => `<button type="button" class="recent-product" data-recent="${p.id}"><img src="${esc(getProductImage(p, p.id))}" alt="" loading="lazy"><span><strong>${esc(p.name)}</strong><small>${esc(p.category)}</small><b>${experienceMoney(p.price)}</b></span><span aria-hidden="true">↗</span></button>`).join('');
}
function updateComparison() {
  document.getElementById('compareBar').hidden = !comparisonIds.length;
  document.getElementById('compareCount').textContent = `${comparisonIds.length}/3 sản phẩm đã chọn`;
  document.querySelectorAll('[data-compare]').forEach(button => {
    const selected = comparisonIds.includes(Number(button.dataset.compare));
    button.setAttribute('aria-pressed', String(selected));
    button.textContent = selected ? '✓ Đã thêm so sánh' : '+ So sánh sản phẩm';
  });
}
function renderComparison() {
  const products = comparisonIds.map(id => allProducts.find(p => p.id === id)).filter(Boolean);
  const rows = [['Giá', p => experienceMoney(p.price)], ['Danh mục', p => p.category], ['Kích cỡ', p => p.sizes.join(', ')], ['Màu sắc', p => p.colors.join(', ')], ['Tình trạng', p => p.stock > 0 ? 'Còn hàng' : 'Hết hàng']];
  document.getElementById('compareContent').innerHTML = `<div class="comparison-scroll"><table><caption>Đối chiếu giá, kích cỡ và màu sắc trước khi chọn mua.</caption><thead><tr><th scope="col">Thông tin</th>${products.map(p => `<th scope="col"><img src="${esc(getProductImage(p, p.id))}" alt=""><strong>${esc(p.name)}</strong><button type="button" data-compare-open="${p.id}">Xem chi tiết →</button><button type="button" data-compare-remove="${p.id}" aria-label="Bỏ ${esc(p.name)} khỏi so sánh">Bỏ chọn</button></th>`).join('')}</tr></thead><tbody>${rows.map(([label, value]) => `<tr><th scope="row">${label}</th>${products.map(p => `<td>${esc(value(p))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.hasAttribute('data-close-experience')) button.closest('dialog').close();
  if (button.hasAttribute('data-recent')) openDetail(Number(button.dataset.recent));
  if (button.hasAttribute('data-compare')) {
    const id = Number(button.dataset.compare);
    if (comparisonIds.includes(id)) comparisonIds = comparisonIds.filter(value => value !== id);
    else if (comparisonIds.length >= 3) return showToast('Bạn có thể so sánh tối đa 3 sản phẩm.', 'error');
    else comparisonIds.push(id);
    updateComparison();
  }
  if (button.hasAttribute('data-compare-remove')) {
    comparisonIds = comparisonIds.filter(id => id !== Number(button.dataset.compareRemove));
    updateComparison(); renderComparison();
    if (!comparisonIds.length) document.getElementById('compareDialog').close();
  }
  if (button.hasAttribute('data-compare-open')) {
    document.getElementById('compareDialog').close();
    openDetail(Number(button.dataset.compareOpen));
  }
  if (button.hasAttribute('data-edit-profile')) {
    if (!localStorage.getItem('shop_token')) return toggleAuth('login');
    const user = getStoredUser();
    const form = document.getElementById('profileForm');
    for (const name of ['name', 'email', 'phone', 'address', 'birthday', 'gender', 'bio', 'avatarColor']) form.elements[name].value = user?.[name] || (name === 'avatarColor' ? 'sage' : '');
    document.getElementById('profileIdentity').textContent = `@${user.username} · Mã khách KH-${String(user.id).padStart(5, '0')}`;
    document.getElementById('passwordForm').reset();
    document.getElementById('accountFeedback').textContent = '';
    document.getElementById('accountDialog').showModal();
    document.dispatchEvent(new CustomEvent('totp:refresh'));
  }
});
document.getElementById('clearRecent').onclick = () => { localStorage.removeItem('shop_recent'); renderRecentProducts(); };
document.getElementById('clearCompare').onclick = () => { comparisonIds = []; updateComparison(); };
document.getElementById('openCompare').onclick = () => { renderComparison(); closeDetail(); document.getElementById('compareDialog').showModal(); };
document.getElementById('profileForm').onsubmit = async event => {
  event.preventDefault();
  const form = event.currentTarget, button = form.querySelector('[type=submit]');
  if (button.disabled) return;
  button.disabled = true;
  const feedback = document.getElementById('accountFeedback');
  try {
    const { user } = await api('/api/auth/me', { method: 'PATCH', body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    localStorage.setItem('shop_user', JSON.stringify(user));
    renderUserPanel(); renderAccountSummary();
    refreshCustomerOverview();
    feedback.textContent = 'Đã lưu thông tin cá nhân.';
  } catch (error) { feedback.textContent = error.message; }
  finally { button.disabled = false; }
};
document.getElementById('passwordForm').onsubmit = async event => {
  event.preventDefault();
  const form = event.currentTarget, button = form.querySelector('[type=submit]');
  const feedback = document.getElementById('accountFeedback');
  if (form.elements.newPassword.value !== form.elements.confirmPassword.value) { feedback.textContent = 'Mật khẩu nhập lại chưa khớp.'; return; }
  if (button.disabled) return;
  button.disabled = true;
  try {
    await api('/api/auth/password', { method: 'POST', body: JSON.stringify({ currentPassword: form.elements.currentPassword.value, newPassword: form.elements.newPassword.value }) });
    form.reset(); document.getElementById('accountDialog').close();
    localStorage.removeItem('shop_token'); localStorage.removeItem('shop_user');
    cart = []; wishlist = []; orderHistory = [];
    localStorage.removeItem('shop_cart'); localStorage.removeItem('shop_guest_cart'); localStorage.removeItem('shop_wishlist');
    renderCart(); renderWishlist(); renderOrderHistory(); renderAccountSummary(); renderUserPanel(); renderProductsPanel();
    toggleAuth('login'); setStatus('Đã đổi mật khẩu. Vui lòng đăng nhập lại.');
  } catch (error) { feedback.textContent = error.message; }
  finally { button.disabled = false; }
};
