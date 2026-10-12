// Storefront: cart. Loaded in index.html order; shared state is in state.js.
function addToCart(id, selectedVariant = {}) {
  const product = allProducts.find((item) => item.id === id);
  if (!product) return;
  if (product.stock <= 0) {
    showToast('Sản phẩm hiện đã hết hàng.', 'error');
    return;
  }

  if(!selectedVariant.color||!selectedVariant.size){openDetail(id);return false;}
  const inCart=cart.filter(i=>i.id===id).reduce((n,i)=>n+i.qty,0);
  if(inCart>=product.stock){showToast('Đã đạt số lượng tồn kho.','error');return false;}
  const color = selectedVariant.color;
  const size = selectedVariant.size || product.sizes?.[0] || 'M';
  const existing = cart.find((item) => item.id === id && item.size === size && item.color === color);

  if (existing) {
    if (existing.qty >= Math.min(product.stock, 99)) {
      showToast(`Số lượng tối đa còn lại là ${product.stock}.`, 'error');
      return;
    }
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1, size, color });
  }

  localStorage.setItem('shop_cart', JSON.stringify(cart));
  renderCart();
  showToast(`${product.name} đã được thêm vào giỏ hàng.`);
  const cartBadge = document.querySelector('.cart-pill');
  cartBadge.classList.remove('cart-added');
  void cartBadge.offsetWidth;
  cartBadge.classList.add('cart-added');
  return true;
}

function updateCartQty(id, delta, size = null, color = null) {
  const product=allProducts.find(p=>p.id===id);
  const total=cart.filter(i=>i.id===id).reduce((n,i)=>n+i.qty,0);
  if(delta>0&&(!product||total>=product.stock)){showToast('Không đủ tồn kho.','error');return;}
  cart = cart
    .map((item) => {
      if (item.id !== id || (size !== null && item.size !== size) || (color !== null && item.color !== color)) return item;
      const nextQty = item.qty + delta;
      if (nextQty <= 0) return null;
      return { ...item, qty: Math.min(nextQty, 99) };
    })
    .filter(Boolean);

  localStorage.setItem('shop_cart', JSON.stringify(cart));
  renderCart();
}

function renderCart() {
  quoteSequence++;
  checkoutQuote = null;
  if (document.getElementById('checkoutModal').classList.contains('show') && !submittingOrder) refreshQuote();
  const itemsEl = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  const badge = document.querySelector('.cart-pill span');
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  badge.textContent = String(count);

  if (!cart.length) {
    itemsEl.innerHTML = `
      <div class="empty-state">
        <h4>Giỏ hàng trống</h4>
        <div>Khám phá sản phẩm yêu thích và thêm ngay vào giỏ hàng.</div>
        <button type="button" id="shopNowBtn">Khám phá sản phẩm ngay</button>
      </div>
    `;
    totalEl.textContent = '0đ';
    document.getElementById('shopNowBtn')?.addEventListener('click', () => {
      closeCart();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    return;
  }

  const total = cart.reduce((sum, item) => sum + Number(item.price) * item.qty, 0);
  totalEl.textContent = `${total.toLocaleString('vi-VN')}đ`;

  itemsEl.innerHTML = cart.map((item) => `
    <div class="cart-item">
      <div class="mini-emoji">${esc(item.emoji || '🛍️')}</div>
      <div>
        <div style="font-weight:700; font-size:14px;">${esc(item.name)}</div>
        <div style="color:var(--text); font-weight:700;">${Number(item.price).toLocaleString('vi-VN')}đ</div>
        <div style="font-size:12px; color:var(--sub); margin-top:4px;">${esc(item.color || 'Trắng')} / ${esc(item.size || 'M')}</div>
        <div class="qty">
          <button data-dec="${item.id}" data-size="${esc(item.size || '')}" data-color="${esc(item.color || '')}">-</button>
          <span>${item.qty}</span>
          <button data-inc="${item.id}" data-size="${esc(item.size || '')}" data-color="${esc(item.color || '')}">+</button>
          <button data-remove="${item.id}" data-size="${esc(item.size || '')}" data-color="${esc(item.color || '')}" aria-label="Xóa ${esc(item.name)} khỏi giỏ">Xóa</button>
        </div>
      </div>
      <div style="font-weight:700;">${(Number(item.price) * item.qty).toLocaleString('vi-VN')}đ</div>
    </div>
  `).join('');

  itemsEl.querySelectorAll('[data-inc]').forEach((btn) => {
    btn.addEventListener('click', () => updateCartQty(Number(btn.dataset.inc), 1, btn.dataset.size || null, btn.dataset.color || null));
  });
  itemsEl.querySelectorAll('[data-dec]').forEach((btn) => {
    btn.addEventListener('click', () => updateCartQty(Number(btn.dataset.dec), -1, btn.dataset.size || null, btn.dataset.color || null));
  });
  itemsEl.querySelectorAll('[data-remove]').forEach(btn => {
    btn.onclick = () => updateCartQty(Number(btn.dataset.remove), -99, btn.dataset.size || null, btn.dataset.color || null);
  });
}

function openCart() {
  document.getElementById('cartDrawer').classList.add('open');
}

function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
}
