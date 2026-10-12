// Storefront: wishlist. Loaded in index.html order; shared state is in state.js.
function toggleWishlist(id, btn = null) {
  const exists = wishlist.includes(id);
  if (exists) wishlist = wishlist.filter((item) => item !== id);
  else wishlist.push(id);
  localStorage.setItem('shop_wishlist', JSON.stringify(wishlist));
  const token = localStorage.getItem('shop_token');
  if (token) api('/api/wishlist', {method:'PUT',headers:{Authorization:'Bearer '+token},body:JSON.stringify({productIds:wishlist})}).catch(error=>showToast(error.message,'error'));

  if (btn) {
    btn.textContent = exists ? '♡' : '♥';
    btn.setAttribute('aria-pressed', String(!exists));
    btn.style.background = exists ? '#f9f1ef' : '#fff0f0';
  }
  renderWishlist();
}

function renderWishlist() {
  const container = document.getElementById('wishlistList');
  const items = allProducts.filter((p) => wishlist.includes(p.id));

  if (!items.length) {
    container.innerHTML = '<div class="mini-item"><span>Chưa có sản phẩm yêu thích</span></div>';
    return;
  }

  container.innerHTML = items.slice(0, 4).map((p) => `
    <div class="mini-item">
      <div>
        <strong>${esc(p.name)}</strong>
        <div style="color:var(--sub); font-size:12px;">${Number(p.price).toLocaleString('vi-VN')}đ</div>
      </div>
      <button class="small-btn" data-wishlist-open="${p.id}">Xem</button>
      <button class="small-btn" data-wishlist-remove="${p.id}" aria-label="Bỏ yêu thích ${esc(p.name)}">×</button>
    </div>
  `).join('');
  container.querySelectorAll('[data-wishlist-open]').forEach(button => button.onclick = () => openDetail(Number(button.dataset.wishlistOpen)));
  container.querySelectorAll('[data-wishlist-remove]').forEach(button => button.onclick = () => { toggleWishlist(Number(button.dataset.wishlistRemove)); renderProductsPanel(); });
}
