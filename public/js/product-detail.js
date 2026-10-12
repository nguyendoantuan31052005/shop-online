// Storefront: product-detail. Loaded in index.html order; shared state is in state.js.
function openDetail(id, preserveSelection = false) {
  const product = allProducts.find((item) => item.id === id);
  if (!product) return;

  if (!preserveSelection) { state.selectedColor = ''; state.selectedSize = ''; }

  const detailNode = document.getElementById('productDetailContent');
  const image = getProductImage(product, Number(product.id) || 0);

  detailNode.innerHTML = `
    <div>
      <img class="detail-image" src="${esc(image)}" alt="${esc(product.name)}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';" />
      <div class="detail-meta">
        <span class="variant-tag">${esc(product.category)}</span>
        <span class="variant-tag">Còn ${product.stock}</span>
        <span class="variant-tag">Thanh toán COD</span>
      </div>
    </div>
    <div>
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
        <div>
          <div style="color:var(--sub); font-size:12px; font-weight:700; text-transform:uppercase;">Mã SP-${String(product.id).padStart(4, '0')} · ${esc(product.category)}</div>
          <h3 style="margin:8px 0; font-size:30px; letter-spacing:-0.05em;">${esc(product.name)}</h3>
        </div>
        <button class="small-btn soft" data-wishlist-detail="${product.id}" style="border:none;">${wishlist.includes(product.id) ? '♥' : '❤'}</button>
      </div>
      <div class="price-wrap" style="margin-top:12px;">
        <span class="price">${Number(product.price).toLocaleString('vi-VN')}đ</span>
      </div>
      <p style="color:var(--sub); line-height:1.7;">${esc(product.description)}</p>
      <dl class="product-specs">
        <div><dt>Kích cỡ có sẵn</dt><dd>${esc((product.sizes || []).join(', '))}</dd></div>
        <div><dt>Màu có sẵn</dt><dd>${esc((product.colors || []).join(', '))}</dd></div>
        <div><dt>Tồn kho</dt><dd>${product.stock} sản phẩm, dùng chung cho các size/màu</dd></div>
        <div><dt>Giao hàng</dt><dd>30.000đ/đơn trước ưu đãi vận chuyển</dd></div>
        <div><dt>Thanh toán</dt><dd>Trả tiền khi nhận hàng (COD)</dd></div>
      </dl>
      <p class="selection-hint" aria-live="polite">${state.selectedColor && state.selectedSize ? 'Đã chọn: ' + esc(state.selectedColor) + ' / ' + esc(state.selectedSize) : 'Chọn màu và kích cỡ bên dưới trước khi mua.'}</p>

      <div class="variant-selector">
        <div class="variant-label">Chọn màu sắc</div>
        <div class="variant-options">
          ${(product.colors || ['Trắng']).map((color) => `
            <button type="button" class="variant-option ${state.selectedColor === color ? 'active' : ''}" data-variant-color="${esc(color)}">${esc(color)}</button>
          `).join('')}
        </div>
      </div>

      <div class="variant-selector">
        <div class="variant-label">Chọn kích cỡ</div>
        <div class="variant-options">
          ${(product.sizes || ['M']).map((size) => `
            <button type="button" class="variant-option ${state.selectedSize === size ? 'active' : ''}" data-variant-size="${esc(size)}">${esc(size)}</button>
          `).join('')}
        </div>
      </div>

      <div class="detail-actions">
        <button class="primary" data-add-detail="${product.id}" ${product.stock <= 0 ? 'disabled' : ''}>${product.stock > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}</button>
        <button class="soft" data-buy-now="true" ${product.stock <= 0 ? 'disabled' : ''}>Mua ngay</button>
      </div>
    </div>
  `;

  detailNode.querySelectorAll('[data-variant-color]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.selectedColor = btn.dataset.variantColor;
      openDetail(product.id, true);
    });
  });

  detailNode.querySelectorAll('[data-variant-size]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.selectedSize = btn.dataset.variantSize;
      openDetail(product.id, true);
    });
  });

  const wishlistBtn = detailNode.querySelector('[data-wishlist-detail]');
  wishlistBtn?.addEventListener('click', () => toggleWishlist(product.id));

  const addBtn = detailNode.querySelector('[data-add-detail]');
  addBtn?.addEventListener('click', () => {
    if (!state.selectedColor || !state.selectedSize) {
      showToast('Vui lòng chọn màu sắc và kích cỡ trước khi thêm vào giỏ.', 'error');
      return;
    }
    if (addToCart(product.id, { color: state.selectedColor, size: state.selectedSize })) closeDetail();
  });

  detailNode.querySelector('[data-buy-now]').addEventListener('click', () => {
    if(!state.selectedColor||!state.selectedSize){showToast('Vui lòng chọn màu và size.','error');return;}
    if(addToCart(product.id,{color:state.selectedColor,size:state.selectedSize})){closeDetail();document.getElementById('checkoutBtn').click();}
  });
  document.getElementById('productDetailModal').classList.add('show');
}

function closeDetail() {
  document.getElementById('productDetailModal').classList.remove('show');
}

document.getElementById('closeDetailModalBtn').addEventListener('click', closeDetail);
document.getElementById('productDetailModal').addEventListener('click', event => {
  if (event.target === event.currentTarget) closeDetail();
});
