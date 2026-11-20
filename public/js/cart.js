// Storefront: cart. Loaded in index.html order; shared state is in state.js.
function addToCart(id, selectedVariant = {}) {
  const product = allProducts.find((item) => item.id === id);
  if (!product) return false;
  if (typeof requireShoppingLogin === 'function' && !requireShoppingLogin()) return false;
  if (product.stock <= 0) {
    showToast('Sản phẩm hiện đã hết hàng.', 'error');
    return;
  }

  const color = selectedVariant.color || product.colors?.[0] || 'Trắng';
  const size = selectedVariant.size || product.sizes?.[0] || 'M';
  const inCart=cart.filter(i=>i.id===id).reduce((n,i)=>n+i.qty,0);
  if(inCart>=product.stock){showToast('Đã đạt số lượng tồn kho.','error');return false;}
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

  persistCustomerCart();
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

  persistCustomerCart();
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
    <article class="cart-item">
      <img class="cart-item-image" src="${esc(getProductImage(item, Number(item.id) || 0))}" alt="${esc(item.name)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='/images/product-placeholder.svg';" />
      <div class="cart-item-info">
        <div class="cart-item-name">${esc(item.name)}</div>
        <div class="cart-item-unit-price">${Number(item.price).toLocaleString('vi-VN')}\u0111</div>
        <div class="cart-item-variant">${esc(item.color || 'Tr\u1eafng')} / ${esc(item.size || 'M')}</div>
        <div class="qty cart-item-qty">
          <button type="button" data-dec="${item.id}" data-size="${esc(item.size || '')}" data-color="${esc(item.color || '')}" aria-label="Gi\u1ea3m s\u1ed1 l\u01b0\u1ee3ng">\u2212</button>
          <span aria-label="S\u1ed1 l\u01b0\u1ee3ng">${item.qty}</span>
          <button type="button" data-inc="${item.id}" data-size="${esc(item.size || '')}" data-color="${esc(item.color || '')}" aria-label="T\u0103ng s\u1ed1 l\u01b0\u1ee3ng">+</button>
          <button type="button" class="remove-cart-item" data-remove="${item.id}" data-size="${esc(item.size || '')}" data-color="${esc(item.color || '')}" aria-label="X\u00f3a ${esc(item.name)} kh\u1ecfi gi\u1ecf">X\u00f3a</button>
        </div>
      </div>
      <div class="cart-item-total">${(Number(item.price) * item.qty).toLocaleString('vi-VN')}\u0111</div>
    </article>
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
  renderCart();
  document.getElementById('cartDrawer').classList.add('open');
  document.querySelector('.cart-pill').setAttribute('aria-expanded', 'true');
}

function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.querySelector('.cart-pill').setAttribute('aria-expanded', 'false');
}

document.querySelector('.cart-pill').addEventListener('click', openCart);
document.getElementById('closeCartBtn').addEventListener('click', closeCart);
let cartSaveQueue = Promise.resolve();
function persistCustomerCart() {
  localStorage.setItem('shop_cart', JSON.stringify(cart));
  const token = localStorage.getItem('shop_token');
  const items = cart.map(i=>({productId:i.id,quantity:i.qty,size:i.size,color:i.color}));
  if (!token) {
    localStorage.setItem('shop_guest_cart', JSON.stringify(cart));
    return;
  }
  cartSaveQueue = cartSaveQueue.catch(()=>{}).then(()=>api('/api/cart',{method:'PUT',headers:{Authorization:'Bearer '+token},body:JSON.stringify({items})})).catch(error=>showToast('Không lưu được giỏ hàng: '+error.message,'error'));
}
async function loadCustomerShopping() {
  try {
    await cartSaveQueue;
    const guestCart = readArray('shop_guest_cart');
    const result = await api('/api/cart');
    const merged = new Map(result.items.filter(i=>i.product).map(i=>{
      const item={...i.product,qty:i.quantity,size:i.size,color:i.color};
      return [`${item.id}|${item.color}|${item.size}`,item];
    }));
    for (const guest of guestCart) {
      const product=allProducts.find(item=>item.id===guest.id);
      if(!product||product.stock<=0)continue;
      const color=guest.color||product.colors?.[0]||'Trắng', size=guest.size||product.sizes?.[0]||'M';
      const key=`${product.id}|${color}|${size}`, existing=merged.get(key);
      const quantity=Math.min(product.stock,99,(existing?.qty||0)+guest.qty);
      if(quantity>0)merged.set(key,{...product,qty:quantity,color,size});
    }
    cart=[...merged.values()];
    localStorage.setItem('shop_cart',JSON.stringify(cart));renderCart();
    if(guestCart.length){localStorage.removeItem('shop_guest_cart');persistCustomerCart();await cartSaveQueue;}
    const favorites = await api('/api/wishlist');
    wishlist = favorites.products.map(p=>p.id);
    localStorage.setItem('shop_wishlist',JSON.stringify(wishlist));renderWishlist();renderProductsPanel();
  } catch(error) { showToast(error.message,'error'); }
}
