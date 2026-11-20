const supportLabels = { open: 'Đã tiếp nhận', reviewing: 'Đang xử lý', resolved: 'Đã giải quyết', rejected: 'Từ chối' };
let savedAddresses = [];
document.body.insertAdjacentHTML('beforeend', `<dialog id="addressesDialog" class="experience-dialog" aria-labelledby="addressesTitle"><div class="experience-heading address-dialog-heading"><div><span class="address-dialog-eyebrow">HOME SHOPPING · TÀI KHOẢN</span><h2 id="addressesTitle">Sổ địa chỉ</h2><p>Lưu nơi nhận hàng yêu thích để đặt đơn nhanh hơn.</p></div><button type="button" data-close-experience aria-label="Đóng">×</button></div><div id="addressBook"></div><form id="addressBookForm" class="experience-form"><input name="id" type="hidden"><label>Người nhận<input name="name" required maxlength="200" autocomplete="name" placeholder="Tên người nhận"></label><label>Điện thoại<input name="phone" type="tel" required pattern="0[0-9]{9,10}" autocomplete="tel" placeholder="Số điện thoại"></label><label>Tỉnh/thành phố<div class="address-inline-search"><input id="addressBookCity" name="city" required maxlength="200" autocomplete="off" aria-autocomplete="list" aria-controls="addressBookCityResults" placeholder="Gõ tên tỉnh/thành…"><small id="addressBookCityStatus" role="status"></small><div id="addressBookCityResults" class="address-search-results" hidden></div></div></label><label>Phường/xã<div class="address-inline-search"><input id="addressBookWard" name="ward" required maxlength="200" autocomplete="off" aria-autocomplete="list" aria-controls="addressBookWardResults" placeholder="Gõ tên phường/xã…"><small id="addressBookWardStatus" role="status"></small><div id="addressBookWardResults" class="address-search-results" hidden></div></div></label><label>Quận/huyện (nếu có)<input name="district" maxlength="200" autocomplete="off" placeholder="Có thể để trống"></label><label class="address-line-field">Số nhà, tên đường<input name="address" required maxlength="500" autocomplete="street-address" placeholder="Số nhà, tên đường, tòa nhà…"></label><label class="shopper-check address-default-check"><input name="isDefault" type="checkbox"> Địa chỉ mặc định</label><div class="address-form-actions"><button type="submit">Lưu địa chỉ</button><button type="reset">Nhập địa chỉ mới</button></div><p id="addressBookFeedback" role="status"></p></form></dialog><dialog id="reviewDialog" class="experience-dialog" aria-labelledby="reviewTitle"><div class="experience-heading"><h2 id="reviewTitle">Đánh giá sản phẩm đã mua</h2><button type="button" data-close-experience aria-label="Đóng">×</button></div><form id="reviewForm" class="experience-form"><input name="productId" type="hidden"><label>Số sao<select name="rating" required><option value="5">★★★★★ · Rất hài lòng</option><option value="4">★★★★☆ · Hài lòng</option><option value="3">★★★☆☆ · Bình thường</option><option value="2">★★☆☆☆ · Chưa hài lòng</option><option value="1">★☆☆☆☆ · Không hài lòng</option></select></label><label>Trải nghiệm của bạn<textarea name="comment" required maxlength="2000" rows="4"></textarea></label><label>Ảnh đánh giá (tối đa 3 ảnh, JPG/PNG/WebP)<input id="reviewImages" type="file" accept="image/jpeg,image/png,image/webp" multiple></label><button type="submit">Gửi đánh giá</button><p id="reviewFeedback" role="status"></p></form></dialog><dialog id="supportDialog" class="experience-dialog" aria-labelledby="supportTitle"><div class="experience-heading"><h2 id="supportTitle">Hỗ trợ sau mua</h2><button type="button" data-close-experience aria-label="Đóng">×</button></div><p class="service-description">Shop sẽ xem xét và phản hồi tại đây. Phiếu yêu cầu chưa phải xác nhận đổi trả hoặc hoàn tiền.</p><div id="mySupport"></div><form id="supportForm" class="experience-form"><input name="orderId" type="hidden"><label>Loại yêu cầu<select name="type"><option value="question">Hỏi về đơn hàng</option><option value="return">Yêu cầu đổi trả (đơn hoàn thành)</option></select></label><label>Nội dung<textarea name="message" required maxlength="3000" rows="4"></textarea></label><button type="submit">Gửi yêu cầu</button><p id="supportFeedback" role="status"></p></form></dialog>`);
function matchesOrderHub(order) {
  const status = document.getElementById('myOrderStatus').value;
  const query = document.getElementById('myOrderSearch').value.trim().toLowerCase();
  return (!status || order.status === status) && `${order.id} ${order.items.map(item => item.name).join(' ')}`.toLowerCase().includes(query);
}
document.getElementById('orderHistoryList').insertAdjacentHTML('beforebegin', '<div class="shopper-order-filters"><label>Tìm đơn mua<input id="myOrderSearch" type="search" placeholder="Mã đơn hoặc tên sản phẩm"></label><label>Trạng thái<select id="myOrderStatus"><option value="">Tất cả đơn</option><option value="new">Chờ xác nhận</option><option value="confirmed">Đã xác nhận</option><option value="shipping">Đang giao</option><option value="done">Hoàn thành</option><option value="cancelled">Đã hủy</option></select></label><button type="button" id="openAddresses">Sổ địa chỉ</button></div>');
document.getElementById('myOrderSearch').oninput = renderOrderHistory;
document.getElementById('myOrderStatus').onchange = renderOrderHistory;
document.querySelector('.checkout-details .form-grid').insertAdjacentHTML('beforebegin', '<div class="checkout-address-book"><label for="checkoutSavedAddress">Địa chỉ đã lưu</label><div class="checkout-address-book-row"><select id="checkoutSavedAddress"><option value="">Nhập địa chỉ mới</option></select><button type="button" id="checkoutManageAddresses">+ Thêm địa chỉ</button></div></div>');
function renderAddressBook() {
  refreshCustomerOverview();
  document.getElementById('addressBook').innerHTML = savedAddresses.map(item => `<article class="shopper-note"><strong>${esc(item.name)} · ${esc(item.phone)}</strong>${item.isDefault ? '<span class="variant-tag">Mặc định</span>' : ''}<p>${esc([item.address, item.ward, item.district, item.city].filter(Boolean).join(', '))}</p><button type="button" data-edit-address="${esc(item.id)}">Sửa</button><button type="button" data-delete-address="${esc(item.id)}">Xóa</button></article>`).join('') || '<p class="service-description">Chưa có địa chỉ. Lưu để thanh toán nhanh hơn.</p>';
}
async function loadAddresses() { savedAddresses = (await api('/api/addresses')).items; renderAddressBook(); }
function renderCheckoutAddressOptions(selectedId = '') {
  const select = document.getElementById('checkoutSavedAddress');
  if (!select) return;
  select.innerHTML = '<option value="">Nhập địa chỉ mới</option>' + savedAddresses.map(item => `<option value="${esc(item.id)}">${esc(item.name + ' · ' + item.address)}${item.isDefault ? ' (Mặc định)' : ''}</option>`).join('');
  if (selectedId && savedAddresses.some(item => item.id === selectedId)) select.value = selectedId;
}
let addressBookOpenedFromCheckout = false;
async function openAddressBook(fromCheckout = false) {
  if (!requireShoppingLogin()) return;
  try {
    addressBookOpenedFromCheckout = fromCheckout;
    await loadAddresses();
    const form = document.getElementById('addressBookForm');
    form.reset();
    form.elements.id.value = '';
    document.getElementById('addressBookFeedback').textContent = '';
    document.getElementById('addressesDialog').showModal();
  }
  catch (error) { showToast(error.message, 'error'); }
}
document.getElementById('openAddresses').onclick = () => openAddressBook(false);
document.getElementById('checkoutManageAddresses').onclick = () => openAddressBook(true);
const addressBookForm = document.getElementById('addressBookForm');
const addressBookCity = addressBookForm.elements.city;
const addressBookWard = addressBookForm.elements.ward;
const fillSavedAddressRegion = selected => {
  addressBookCity.value = selected.city;
  addressBookWard.value = selected.ward;
  addressBookForm.elements.district.value = '';
};
window.installAddressAutocomplete({
  input: addressBookCity,
  results: document.getElementById('addressBookCityResults'),
  status: document.getElementById('addressBookCityStatus'),
  onSelect: fillSavedAddressRegion,
  displaySelection: item => item.city,
  selectedMessage: 'Đã điền tỉnh/thành và phường/xã.'
});
window.installAddressAutocomplete({
  input: addressBookWard,
  results: document.getElementById('addressBookWardResults'),
  status: document.getElementById('addressBookWardStatus'),
  getQuery: input => [addressBookCity.value, input.value].filter(Boolean).join(' '),
  onSelect: fillSavedAddressRegion,
  displaySelection: item => item.ward,
  searchOnFocus: true,
  selectedMessage: 'Đã chọn phường/xã thuộc tỉnh/thành này.'
});
addressBookCity.addEventListener('input', () => { addressBookWard.value = ''; });
document.getElementById('addressBookForm').onsubmit = async event => {
  event.preventDefault(); const form = event.currentTarget, button = form.querySelector('[type=submit]');
  if (button.disabled) return; button.disabled = true;
  const item = Object.fromEntries(new FormData(form)); item.id ||= crypto.randomUUID(); item.isDefault = form.elements.isDefault.checked;
  const next = savedAddresses.filter(address => address.id !== item.id).map(address => ({ ...address, isDefault: item.isDefault ? false : address.isDefault })); next.push(item);
  try {
    savedAddresses = (await api('/api/addresses', { method: 'PUT', body: JSON.stringify({ items: next }) })).items;
    const savedId = item.id;
    form.reset();
    renderAddressBook();
    renderCheckoutAddressOptions(savedId);
    if (addressBookOpenedFromCheckout) {
      document.getElementById('checkoutSavedAddress').dispatchEvent(new Event('change'));
      document.getElementById('addressesDialog').close();
      showToast('Đã lưu và chọn địa chỉ giao hàng.');
      addressBookOpenedFromCheckout = false;
    } else document.getElementById('addressBookFeedback').textContent = 'Đã lưu địa chỉ.';
  }
  catch (error) { document.getElementById('addressBookFeedback').textContent = error.message; }
  finally { button.disabled = false; }
};
document.getElementById('checkoutBtn').addEventListener('click', async () => {
  if (!localStorage.getItem('shop_token')) return;
  try {
    await loadAddresses();
    renderCheckoutAddressOptions();
    const defaultAddress = savedAddresses.find(item => item.isDefault);
    if (defaultAddress) { select.value = defaultAddress.id; select.dispatchEvent(new Event('change')); }
  } catch (error) { showToast(error.message, 'error'); }
});
document.getElementById('checkoutSavedAddress').onchange = event => {
  const address = savedAddresses.find(item => item.id === event.target.value);
  if (!address) return;
  const form = document.getElementById('checkoutForm');
  for (const key of ['name', 'phone', 'city', 'ward', 'district', 'address']) form.elements[key].value = address[key];
};
async function loadProductReviews(id) {
  const detail = document.getElementById('productDetailContent');
  detail.insertAdjacentHTML('beforeend', `<section class="product-reviews" data-review-product="${id}"><h3>Đánh giá từ khách đã mua</h3><div class="review-list">Đang tải…</div></section>`);
  const section = detail.querySelector('[data-review-product]');
  try {
    const result = await api('/api/products/' + id + '/reviews');
    section.querySelector('.review-list').innerHTML = `<p>${result.count ? `<strong>${result.average}/5</strong> · ${result.count} đánh giá đã xác thực` : 'Chưa có đánh giá. Khách hoàn thành đơn có thể đánh giá từ chi tiết đơn mua.'}</p>` + result.items.map(item => `<article class="shopper-note"><strong>${esc(item.name)}</strong><span class="review-stars">${'★'.repeat(item.rating)}${'☆'.repeat(5 - item.rating)}</span><small>Đã mua hàng · ${new Date(item.createdAt).toLocaleDateString('vi-VN')}</small><p>${esc(item.comment)}</p>${(item.images || []).map(image => `<a href="${esc(image)}" target="_blank" rel="noopener"><img class="review-photo" src="${esc(image)}" alt="Ảnh đánh giá của ${esc(item.name)}" loading="lazy"></a>`).join('')}</article>`).join('');
  } catch (error) { section.querySelector('.review-list').textContent = error.message; }
}
function decorateCustomerOrder(order) {
  document.getElementById('customerOrderContent').insertAdjacentHTML('beforeend', `<div class="shopper-order-actions"><button type="button" data-reorder="${order.id}">Mua lại đơn này</button><button type="button" data-open-support="${order.id}">Liên hệ về đơn / đổi trả</button></div>${order.status === 'done' ? '<div class="shopper-review-actions"><h3>Chia sẻ trải nghiệm sau mua</h3>' + [...new Map(order.items.map(item => [item.product_id, item])).values()].map(item => `<button type="button" data-write-review="${item.product_id}">Đánh giá ${esc(item.name)}</button>`).join('') + '</div>' : ''}`);
}
document.addEventListener('click', async event => {
  const button = event.target.closest('button'); if (!button) return;
  try {
    if (button.dataset.editAddress) {
      const item = savedAddresses.find(address => address.id === button.dataset.editAddress), form = document.getElementById('addressBookForm');
      for (const [key, value] of Object.entries(item)) if (key !== 'isDefault') form.elements[key].value = value;
      form.elements.isDefault.checked = item.isDefault;
    }
    if (button.dataset.deleteAddress) {
      button.disabled = true;
      savedAddresses = (await api('/api/addresses', { method: 'PUT', body: JSON.stringify({ items: savedAddresses.filter(item => item.id !== button.dataset.deleteAddress) }) })).items; renderAddressBook();
    }
    if (button.dataset.reorder) {
      button.disabled = true; await cartSaveQueue;
      await api('/api/orders/' + button.dataset.reorder + '/reorder', { method: 'POST' });
      await loadCustomerShopping(); document.getElementById('customerOrderDialog').close(); openCart(); showToast('Đã thêm vào giỏ theo giá và tồn kho hiện tại.');
    }
    if (button.dataset.writeReview) {
      const form = document.getElementById('reviewForm'); form.reset(); form.elements.productId.value = button.dataset.writeReview;
      document.getElementById('reviewFeedback').textContent = ''; document.getElementById('reviewDialog').showModal();
    }
    if (button.dataset.openSupport) {
      const form = document.getElementById('supportForm'); form.reset(); form.elements.orderId.value = button.dataset.openSupport;
      const result = await api('/api/support');
      document.getElementById('mySupport').innerHTML = result.items.filter(item => item.orderId === Number(button.dataset.openSupport)).map(item => `<article class="shopper-note"><strong>${esc(supportLabels[item.status])}</strong><p>${esc(item.message)}</p><p><strong>Shop phản hồi:</strong> ${esc(item.reply || 'Đang chờ phản hồi')}</p></article>`).join('');
      document.getElementById('supportFeedback').textContent = ''; document.getElementById('supportDialog').showModal();
    }
  } catch (error) { showToast(error.message, 'error'); }
  finally { button.disabled = false; }
});
for (const [formId, feedbackId, submit] of [
  ['reviewForm', 'reviewFeedback', async values => {
    const files = [...document.getElementById('reviewImages').files];
    if (files.length > 3) throw new Error('Mỗi đánh giá được gửi tối đa 3 ảnh.');
    const images = [];
    for (const file of files) {
      if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Ảnh cần là JPG, PNG hoặc WebP và không quá 5 MB.');
      const result = await api('/api/products/' + values.productId + '/reviews/images', { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
      images.push(result.image);
    }
    return api('/api/products/' + values.productId + '/reviews', { method: 'POST', body: JSON.stringify({ rating: Number(values.rating), comment: values.comment, images }) });
  }],
  ['supportForm', 'supportFeedback', async values => api('/api/support', { method: 'POST', body: JSON.stringify({ orderId: Number(values.orderId), type: values.type, message: values.message }) })],
]) document.getElementById(formId).onsubmit = async event => {
  event.preventDefault(); const form = event.currentTarget, button = form.querySelector('[type=submit]');
  if (button.disabled) return; button.disabled = true;
  try { await submit(Object.fromEntries(new FormData(form))); document.getElementById(feedbackId).textContent = 'Đã gửi thành công.'; form.querySelector('textarea').value = ''; if (form.elements.images) form.elements.images.value = ''; if (form.querySelector('input[type=file]')) form.querySelector('input[type=file]').value = ''; }
  catch (error) { document.getElementById(feedbackId).textContent = error.message; }
  finally { button.disabled = false; }
};
