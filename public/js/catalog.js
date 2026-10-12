// Storefront: catalog. Loaded in index.html order; shared state is in state.js.
function matchesSelectedCategory(product, categoryName) {
  if (categoryName === 'Tất cả') return true;

  const normalized = categoryName.toLowerCase();
  const subCategory = String(product.subCategory || '').toLowerCase();
  const category = String(product.category || '').toLowerCase();

  const matchMap = {
    'áo khoác': ['ao-khoac'],
    'quần': ['quan'],
    'áo sơ mi': ['ao-so-mi'],
    'áo thun/nỉ': ['ao-thun-nỉ'],
    'áo len/dệt kim': ['ao-len-det-kim'],
    'phụ kiện/đồ dùng': ['phu-kien'],
    'thời trang': ['thoi-trang', 'thời trang'],
    'phụ kiện': ['phu-kien'],
    'điện tử': ['dien-tu'],
    'đồ ăn uống': ['do-an-uong'],
    'gia dụng': ['gia-dung'],
    'mẹ & bé': ['me-be', 'mẹ & bé', 'me va be'],
    'thể thao': ['the-thao', 'the thao'],
    'sức khỏe': ['suc-khoe', 'sức khỏe'],
    'nhà sách': ['nha-sach', 'nhà sách'],
    'xem thêm': ['xem-them', 'xem thêm'],
  };

  const aliases = matchMap[normalized] || [normalized];
  return category === normalized || subCategory === normalized || aliases.includes(subCategory) || aliases.includes(category);
}

function getFilteredProducts() {
  const q = (document.querySelector('.search-wrap input')?.value || '').trim().toLowerCase();
  let items = allProducts.filter((p) => {
    const categoryOk = matchesSelectedCategory(p, selectedCategory);
    const searchOk = productSearch.matches(p, q);
    const genderOk = !selectedGender || p.gender === selectedGender || p.gender === 'all';
    const normalize = (value) => String(value).normalize('NFC').trim().toLowerCase();
    const sizeOk = !shoppingFilters.size || (p.sizes || []).some(size => normalize(size) === normalize(shoppingFilters.size));
    const colorOk = !shoppingFilters.color || (p.colors || []).some(color => normalize(color) === normalize(shoppingFilters.color));
    return categoryOk && searchOk && genderOk && sizeOk && colorOk;
  });

  if (sortMode === 'price_asc') items = [...items].sort((a, b) => a.price - b.price);
  if (sortMode === 'price_desc') items = [...items].sort((a, b) => b.price - a.price);
  if (sortMode === 'newest') items = [...items].sort((a, b) => Number(b.id) - Number(a.id));
  return items;
}

function renderFilterChips() {
  const chips = ['Tất cả', ...new Set(allProducts.map(p => p.category))];
  filterChips.innerHTML = chips.map((chip) => `
    <button class="chip ${selectedCategory === chip ? 'active' : ''}" data-filter="${esc(chip)}">${esc(chip)}</button>
  `).join('');

  filterChips.querySelectorAll('.chip').forEach((button) => {
    button.addEventListener('click', () => {
      selectedCategory = button.dataset.filter;
      selectedGender = '';
      renderFilterChips();
      renderProductsPanel();
    });
  });
}

function applyQuickNavFilter(label) {
  const input = document.querySelector('.search-wrap input');
  const quickMap = {
    Nam: { category: 'Thời trang', gender: 'men', query: '' },
    Nữ: { category: 'Thời trang', gender: 'women', query: '' },
    'Trẻ em': { category: 'Mẹ & Bé', query: '' },
    'Thời trang mới': { category: 'Thời trang', query: '', sort: 'newest' },
    'Khuyến mãi': { category: 'Tất cả', query: '' },
  };

  const config = quickMap[label];
  if (!config) return;

  selectedCategory = config.category;
  selectedGender = config.gender || '';
  sortMode = config.sort || 'featured';
  sortSelect.value = sortMode;
  if (input) input.value = config.query || '';

  document.querySelectorAll('.nav-item').forEach((btn) => btn.classList.toggle('active', btn.dataset.nav === label));
  document.querySelectorAll('.panel-link').forEach((btn) => btn.classList.toggle('active', btn.dataset.nav === label));

  renderFilterChips();
  renderProductsPanel();
  if (label === 'Khuyến mãi') couponGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  else scrollToProducts();
}

function renderShoppingFilters() {
  const renderOptions = (node, values, key, className) => {
    node.innerHTML = values.map(value => `<button type="button" class="${className}${shoppingFilters[key] === value ? ' active' : ''}" aria-pressed="${shoppingFilters[key] === value}" data-value="${esc(value)}">${esc(value)}</button>`).join('');
    node.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', () => {
        shoppingFilters[key] = shoppingFilters[key] === button.dataset.value ? '' : button.dataset.value;
        renderShoppingFilters();
        renderProductsPanel();
        node.querySelectorAll('button').forEach(option => {
          if (option.dataset.value === button.dataset.value) option.focus();
        });
      });
    });
  };
  renderOptions(sizePills, ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'], 'size', 'size-pill');
  renderOptions(colorPills, ['Trắng', 'Đen', 'Xanh navy', 'Xanh', 'Nâu', 'Be'], 'color', 'color-pill');
  const clearButton = document.getElementById('clearShoppingFilters');
  clearButton.disabled = !shoppingFilters.size && !shoppingFilters.color;
  clearButton.onclick = () => {
    shoppingFilters.size = '';
    shoppingFilters.color = '';
    renderShoppingFilters();
    renderProductsPanel();
  };
}

function renderFeaturedCollections() {
  const featuredGroups = [
    {
      key: 'ao-khoac',
      title: 'Outerwear',
      icon: '🧥',
      copy: 'Áo khoác thoải mái, thiết kế tinh gọn.',
    },
    {
      key: 'ao-thun-nỉ',
      title: 'Basic Tee',
      icon: '👕',
      copy: 'Đồ mặc trong và quần áo cơ bản hàng ngày.',
    },
    {
      key: 'footwear',
      title: 'Footwear',
      icon: '👟',
      copy: 'Giày và phụ kiện tạo điểm nhấn cho outfit.',
    },
  ];

  const featuredNode = document.getElementById('featuredCollections');
  if (!featuredNode) return;

  featuredNode.innerHTML = featuredGroups.map((group, collectionIndex) => {
    const items = allProducts.filter((product) => {
      const name = String(product.name || '').toLowerCase();
      const sub = String(product.subCategory || '').toLowerCase();
      if (group.key === 'ao-khoac') return sub === 'ao-khoac' || /áo khoác|parka|bomber|denim/i.test(name);
      if (group.key === 'ao-thun-nỉ') return sub === 'ao-thun-nỉ' || /áo thun|ao thun|basic tee|thể thao/i.test(name);
      return /giày|sneaker|shoe|footwear/i.test(name) || (sub === 'phu-kien' && /giày|sneaker/i.test(name));
    }).slice(0, 4);

    const productMarkup = items.length
      ? items.map((item, index) => `
          <div class="mini-item" data-detail="${item.id}" style="cursor:pointer; padding:8px 10px;">
            <img src="${esc(getProductImage(item, collectionIndex + index + Number(item.id)))}" alt="${esc(item.name)}" style="width:56px; height:56px; object-fit:cover; border-radius:12px;" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';" />
            <div style="flex:1; min-width:0;">
              <strong style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(item.name)}</strong>
              <div style="color:var(--sub); font-size:12px;">${Number(item.price).toLocaleString('vi-VN')}đ</div>
            </div>
          </div>
        `).join('')
      : '<div class="mini-item"><span>Chưa có sản phẩm trong nhóm này</span></div>';

    return `
      <div class="mini-card">
        <div style="font-size:42px;">${group.icon}</div>
        <h4>${group.title}</h4>
        <div>${group.copy}</div>
        <div class="mini-list" style="margin-top:12px;">${productMarkup}</div>
      </div>
    `;
  }).join('');

  featuredNode.querySelectorAll('[data-detail]').forEach((item) => {
    item.addEventListener('click', () => openDetail(Number(item.dataset.detail)));
  });
}

let productPage = 1;
let productFilterKey = '';
const productsPerPage = 8;

function scrollToProducts() {
  requestAnimationFrame(() => {
    const header = document.querySelector('.header-main');
    const offset = header && ['sticky', 'fixed'].includes(getComputedStyle(header).position) ? header.getBoundingClientRect().height : 0;
    const results = document.getElementById('recommendedProducts');
    window.scrollTo({ top: Math.max(0, window.scrollY + results.getBoundingClientRect().top - offset - 20), behavior: 'smooth' });
  });
}

function renderProductsPanel() {
  const items = getFilteredProducts();
  const key = JSON.stringify([document.querySelector('.search-wrap input').value.trim(), selectedCategory, selectedGender, shoppingFilters, sortMode]);
  if (key !== productFilterKey) { productPage = 1; productFilterKey = key; }
  const pages = Math.max(1, Math.ceil(items.length / productsPerPage));
  productPage = Math.min(productPage, pages);
  document.getElementById('shoppingFilterStatus').textContent = `${items.length} sản phẩm phù hợp${shoppingFilters.size ? ' · Size: ' + shoppingFilters.size : ''}${shoppingFilters.color ? ' · Màu: ' + shoppingFilters.color : ''}`;
  const query = document.querySelector('.search-wrap input').value.trim();
  document.getElementById('searchResultTitle').textContent = query ? `${items.length} kết quả cho “${query}”` : 'Gợi ý cho bạn';
  document.getElementById('flashProducts').innerHTML = '';
  const start = (productPage - 1) * productsPerPage;
  renderProducts(items.slice(start, start + productsPerPage), 'recommendedProducts', false);
  const pagination = document.getElementById('productPagination');
  pagination.innerHTML = items.length ? `<button type="button" data-page="${productPage - 1}" ${productPage === 1 ? 'disabled' : ''}>← Trước</button><span role="status">${start + 1}–${Math.min(start + productsPerPage, items.length)} / ${items.length} sản phẩm · Trang ${productPage}/${pages}</span><button type="button" data-page="${productPage + 1}" ${productPage === pages ? 'disabled' : ''}>Sau →</button>` : '';
  pagination.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', () => {
    productPage = Number(button.dataset.page);
    renderProductsPanel();
    scrollToProducts();
  }));
}

function renderProducts(items, nodeId, showSale = false) {
  const node = document.getElementById(nodeId);
  if (!items.length) {
    node.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <h4>Không tìm thấy sản phẩm phù hợp</h4>
        <div>Hãy thử từ khóa khác hoặc chọn danh mục phổ biến.</div>
        <button type="button" id="resetFiltersBtn">Xem sản phẩm nổi bật</button>
      </div>
    `;
    const resetBtn = node.querySelector('#resetFiltersBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        selectedCategory = 'Tất cả';
        selectedGender = '';
        shoppingFilters.size = '';
        shoppingFilters.color = '';
        renderShoppingFilters();
        document.querySelector('.search-wrap input').value = '';
        renderFilterChips();
        renderProductsPanel();
      });
    }
    return;
  }

  node.innerHTML = items.map((p, index) => {
    const price = Number(p.price || 0);
    const productImage = getProductImage(p, index);
    const imageHtml = p.image || p.emoji
      ? `<img class="thumb-image" src="${esc(productImage)}" alt="${esc(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';" />`
      : `<div class="thumb-emoji">${esc(p.emoji || ['👕', '🎧', '👟', '🎒', '☕', '🖱️'][index % 6])}</div>`;

    return `
      <article class="product-card">
        <div class="thumb">
          <span class="thumb-badge">${p.stock > 0 ? esc(p.category) : 'Hết hàng'}</span>
          ${imageHtml}
        </div>
        <div class="product-info">
          <div class="product-name">${esc(p.name)}</div>
          <p class="product-description">${esc(p.description || 'Xem chi tiết để chọn màu và kích cỡ phù hợp.')}</p>
          <div class="product-options">Size: ${esc((p.sizes || []).join(' · '))}</div>
          <div class="product-options">Màu: ${esc((p.colors || []).join(' · '))}</div>
          <div class="rating-row">
            <span class="stock-label">${p.stock > 0 ? '● Có sẵn · ' + p.stock + ' sản phẩm' : 'Tạm hết hàng'}</span>
          </div>
          <div class="price-wrap">
            <span class="price">${price.toLocaleString('vi-VN')}đ</span>
          </div>
          <div class="product-actions">
            <button class="small-btn soft" data-wishlist="${p.id}" aria-label="Yêu thích ${esc(p.name)}" aria-pressed="${wishlist.includes(p.id)}">${wishlist.includes(p.id) ? '♥' : '♡'}</button>
            <button class="small-btn detail-btn" data-detail="${p.id}">Chi tiết</button>
            <button class="small-btn primary" data-add="${p.id}" ${p.stock <= 0 ? 'disabled' : ''}>${p.stock > 0 ? 'Chọn mua' : 'Hết hàng'}</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  node.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => addToCart(Number(btn.dataset.add)));
  });
  node.querySelectorAll('[data-detail]').forEach((btn) => {
    btn.addEventListener('click', () => openDetail(Number(btn.dataset.detail)));
  });
  node.querySelectorAll('[data-wishlist]').forEach((btn) => {
    btn.addEventListener('click', () => toggleWishlist(Number(btn.dataset.wishlist), btn));
  });
}

async function loadProducts() {
  try {
    const items = await api('/api/products');
    allProducts.length = 0;
    allProducts.push(...items);
    cart = cart.map(item => {
      const product = allProducts.find(p => p.id === item.id);
      return product ? { ...item, ...product, size: item.size, color: item.color, qty: item.qty } : item;
    });
    renderFilterChips();
    renderShoppingFilters();
    loadVouchers();
    renderFeaturedCollections();
    renderProductsPanel();
    renderWishlist();
    renderAccountSummary();
    renderOrderHistory();
    renderCart();
    updateUserBadge();
    await loadOrderHistory();

    try {
      const menSection = await api('/api/v1/vn/vi/products/section/men');
      if (menSection && Array.isArray(menSection.products) && menSection.products.length) {
        const suggestions = document.getElementById('searchSuggestions');
        suggestions.innerHTML = menSection.products.slice(0, 4).map((p, index) => `
          <div class="suggestion-item" data-suggestion="${p.id}">
            <img src="${esc(getProductImage(p, index))}" alt="${esc(p.name)}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';" />
            <div style="font-weight:700; margin-top:8px;">${esc(p.name)}</div>
            <div style="color:var(--sub); font-size:12px; margin-top:4px;">${Number(p.price).toLocaleString('vi-VN')}đ</div>
          </div>
        `).join('');

        suggestions.querySelectorAll('[data-suggestion]').forEach((item) => {
          item.addEventListener('click', () => openDetail(Number(item.dataset.suggestion)));
        });
      }
    } catch (error) {
      document.getElementById('searchSuggestions').innerHTML = '<div class="suggestion-item"><div>HEATTECH</div><div>Áo giữ ấm</div></div>';
    }
  } catch (error) {
    document.getElementById('flashProducts').innerHTML = '<div class="empty-state"><h4>Không tải được sản phẩm</h4><div>Vui lòng kiểm tra kết nối hoặc thử lại sau.</div></div>';
    document.getElementById('recommendedProducts').innerHTML = '';
  }
}
