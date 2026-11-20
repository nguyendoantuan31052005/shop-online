const homeCategoryIcons = { 'Nhà bếp': '◒', 'Phòng khách': '⌑', 'Phòng ngủ': '☾', 'Phòng tắm': '◉', 'Trang trí': '✧', 'Lưu trữ': '▤', 'Gia dụng': '⌂' };
const homeSlides = [
  { image: '/images/products/lamp.jpg', eyebrow: 'KHÔNG GIAN SỐNG · HOME SHOPPING', title: 'Nhà là nơi<br><em>bạn muốn về.</em>', copy: 'Từ căn bếp nhỏ đến góc phòng yêu thích. Chọn những món đồ giúp mỗi ngày tiện nghi và dễ chịu hơn.', caption: 'Cảm hứng cho tổ ấm · Ảnh minh họa', category: 'Tất cả' },
  { image: '/images/products/storage.jpg', eyebrow: 'GỌN GÀNG MỖI NGÀY', title: 'Sắp xếp nhẹ nhàng,<br><em>thảnh thơi hơn.</em>', copy: 'Khám phá hộp lưu trữ và vật dụng thiết thực cho những góc nhà bạn thường dùng.', caption: 'Bộ sưu tập lưu trữ · Ảnh minh họa', category: 'Lưu trữ' },
  { image: '/images/products/planter.jpg', eyebrow: 'THÊM SẮC XANH CHO NHÀ', title: 'Một góc xanh nhỏ,<br><em>niềm vui lớn.</em>', copy: 'Chọn chậu cây, bình hoa và đồ trang trí để căn phòng mang dấu ấn riêng của bạn.', caption: 'Gợi ý trang trí · Ảnh minh họa', category: 'Trang trí' },
];
let homeSlideIndex = 0, homeSlideTimer;
function showHomeSlide(index) {
  homeSlideIndex = (index + homeSlides.length) % homeSlides.length;
  const slide = homeSlides[homeSlideIndex], hero = document.querySelector('.hero-main');
  hero.querySelector('.hero-editorial-image').src = slide.image;
  hero.querySelector('.mini-label').textContent = slide.eyebrow;
  hero.querySelector('h1').innerHTML = slide.title;
  hero.querySelector('.hero-copy p').textContent = slide.copy;
  document.getElementById('heroCaption').textContent = slide.caption;
  document.getElementById('heroDots').innerHTML = homeSlides.map((_, i) => `<button type="button" data-hero-slide="${i}" aria-label="Banner ${i + 1}" aria-current="${i === homeSlideIndex ? 'true' : 'false'}"></button>`).join('');
}
function restartHomeSlides() { clearInterval(homeSlideTimer); homeSlideTimer = setInterval(() => showHomeSlide(homeSlideIndex + 1), 6500); }
document.getElementById('heroPrevious').onclick = () => { showHomeSlide(homeSlideIndex - 1); restartHomeSlides(); };
document.getElementById('heroNext').onclick = () => { showHomeSlide(homeSlideIndex + 1); restartHomeSlides(); };
document.getElementById('heroDots').onclick = event => { const button = event.target.closest('[data-hero-slide]'); if (button) { showHomeSlide(Number(button.dataset.heroSlide)); restartHomeSlides(); } };
showHomeSlide(0); restartHomeSlides();
function renderHomeCategories() {
  const names = [...new Set(allProducts.map(p => p.category))];
  const sorted = ['Tất cả', ...Object.keys(homeCategoryIcons).filter(name => names.includes(name))];
  document.getElementById('homeCategories').innerHTML = sorted.map(name => `<button type="button" data-home-category="${esc(name)}"><span aria-hidden="true">${homeCategoryIcons[name] || '▦'}</span><strong>${esc(name)}</strong><small>${name === 'Tất cả' ? allProducts.length : allProducts.filter(p => p.category === name).length} sản phẩm</small></button>`).join('');
}
function chooseHomeCategory(category) {
  selectedCategory = category; selectedGender = '';
  document.querySelector('.search-wrap input').value = '';
  renderFilterChips(); renderProductsPanel(); scrollToProducts();
}
for (const id of ['minPrice', 'maxPrice', 'inStockOnly']) {
  document.getElementById(id).addEventListener('input', () => {
    const min = Number(document.getElementById('minPrice').value), max = document.getElementById('maxPrice');
    max.setCustomValidity(max.value && Number(max.value) < min ? 'Giá tối đa cần lớn hơn hoặc bằng giá tối thiểu.' : '');
    renderShoppingFilters(); renderProductsPanel();
  });
}
document.addEventListener('click', async event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.homeCategory) chooseHomeCategory(button.dataset.homeCategory);
  const action = button.dataset.homeAction;
  if (action) {
    document.querySelectorAll('[data-home-action]').forEach(item => item.classList.toggle('active', item === button));
    if (action === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
    if (action === 'catalog') document.getElementById('homeCategoryTitle').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (action === 'deals') applyQuickNavFilter('Khuyến mãi');
    if (action === 'cart') openCart();
    if (action === 'account') document.getElementById('accountSummary').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (button.dataset.viewCustomerOrder) openCustomerOrder(Number(button.dataset.viewCustomerOrder));
  if (button.dataset.cancelCustomerOrder) {
    button.disabled = true;
    try {
      await api('/api/orders/' + Number(button.dataset.cancelCustomerOrder) + '/cancel', { method: 'POST' });
      await loadOrderHistory();
      openCustomerOrder(Number(button.dataset.cancelCustomerOrder));
      await loadProducts();
      showToast('Đã hủy đơn hàng.');
    } catch (error) { showToast(error.message, 'error'); }
    finally { button.disabled = false; }
  }
});
document.body.insertAdjacentHTML('beforeend', '<dialog id="customerOrderDialog" class="experience-dialog" aria-labelledby="customerOrderTitle"><div class="experience-heading"><div><span class="service-eyebrow">HOME SHOPPING · ĐƠN HÀNG CỦA BẠN</span><h2 id="customerOrderTitle">Chi tiết đơn</h2></div><button type="button" data-close-experience aria-label="Đóng chi tiết đơn">×</button></div><div id="customerOrderContent"></div></dialog>');
function openCustomerOrder(id) {
  const order = orderHistory.find(item => item.id === id);
  if (!order) return;
  document.getElementById('customerOrderTitle').textContent = 'Đơn hàng #' + id;
  const steps = ['new', 'confirmed', 'shipping', 'done'];
  const step = steps.indexOf(order.status);
  document.getElementById('customerOrderContent').innerHTML = `${order.status === 'cancelled' ? '<p class="order-cancelled">Đơn hàng đã hủy</p>' : `<ol class="order-progress">${steps.map((status, index) => `<li class="${index <= step ? 'reached' : ''}"><span aria-hidden="true">${index < step ? '✓' : index + 1}</span>${esc(ADMIN_STATUS_LABELS[status])}</li>`).join('')}</ol>`}<p><strong>${esc(order.customer_name)}</strong><br>${esc(order.phone)}<br>${esc(order.address)}</p>${order.shipment ? `<p class="shipment-details">Vận chuyển: <strong>${esc(order.shipment.carrier)}</strong> · Mã vận đơn <strong>${esc(order.shipment.trackingNumber)}</strong>${order.shipment.trackingUrl ? ` · <a href="${esc(order.shipment.trackingUrl)}" target="_blank" rel="noopener">Theo dõi giao hàng</a>` : ''}</p>` : ''}<div class="customer-order-lines">${order.items.map(item => `<div><span><strong>${esc(item.name)}</strong><small>${esc(item.size)} · ${esc(item.color)} · SL ${item.quantity}</small></span><b>${experienceMoney(item.price * item.quantity)}</b></div>`).join('')}</div><div class="order-totals"><p><span>Tiền hàng</span><strong>${experienceMoney(order.subtotal)}</strong></p><p><span>Phí giao hàng</span><strong>${experienceMoney(order.shippingFee)}</strong></p><p><span>Giảm giá</span><strong>−${experienceMoney(order.discount)}</strong></p><p><span>Tổng thanh toán · COD</span><strong>${experienceMoney(order.total)}</strong></p></div>${order.status === 'new' ? `<p class="service-description">Bạn có thể hủy đơn khi shop chưa xác nhận.</p><button type="button" class="customer-cancel" data-cancel-customer-order="${id}">Hủy đơn hàng này</button>` : ''}`;
  const dialog = document.getElementById('customerOrderDialog');
  decorateCustomerOrder(order);
  if (!dialog.open) dialog.showModal();
}
// The two editorial banners open their respective collections.
document.querySelectorAll('.small-banner').forEach((banner, index) => {
  banner.setAttribute('role', 'button'); banner.tabIndex = 0;
  const open = () => chooseHomeCategory(index ? 'Trang trí' : 'Nhà bếp');
  banner.addEventListener('click', open);
  banner.addEventListener('keydown', event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); open(); } });
});
document.getElementById('checkoutBtn').addEventListener('click', () => {
  const user = getStoredUser();
  if (!user) return;
  const form = document.getElementById('checkoutForm');
  for (const key of ['name', 'phone', 'email']) if (!form.elements[key].value) form.elements[key].value = user[key] || '';
});
