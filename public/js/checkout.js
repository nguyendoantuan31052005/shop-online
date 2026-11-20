// Storefront: checkout. Loaded in index.html order; shared state is in state.js.
async function loadVouchers() {
  try {
    const vouchers = await api('/api/vouchers');
    couponGrid.innerHTML = vouchers.map(v => {
      const benefit = v.type === 'shipping' ? 'Miễn phí giao hàng' : v.type === 'percent' ? 'Giảm ' + v.value + '%' : 'Giảm ' + Number(v.value).toLocaleString('vi-VN') + 'đ';
      return '<article class="coupon-card"><div class="coupon-stub"><span>MÃ ƯU ĐÃI</span><h4>'+esc(v.code)+'</h4></div><div class="coupon-benefit"><strong>'+esc(benefit)+'</strong>'+(v.description ? '<p>'+esc(v.description)+'</p>' : '')+'<small>Đơn từ '+Number(v.minOrder).toLocaleString('vi-VN')+'đ · Nhập mã khi thanh toán</small></div><button type="button" class="coupon-copy" data-copy-voucher="'+esc(v.code)+'" aria-label="Sao chép mã '+esc(v.code)+'">Sao chép <span aria-hidden="true">↗</span></button></article>';
    }).join('') || '<p>Hiện chưa có mã ưu đãi. Bạn có thể quay lại sau.</p>';
  } catch { couponGrid.textContent = 'Chưa tải được ưu đãi.'; }
}
couponGrid.addEventListener('click', async event => {
  const button = event.target.closest('[data-copy-voucher]');
  if (!button) return;
  try {
    await navigator.clipboard.writeText(button.dataset.copyVoucher);
    button.textContent = 'Đã sao chép ✓';
    setTimeout(() => { if (button.isConnected) button.textContent = 'Sao chép ↗'; }, 2000);
  } catch {
    button.textContent = 'Mã: ' + button.dataset.copyVoucher;
  }
});
function cartPayload() { return {items:cart.map(i=>({productId:i.id,quantity:i.qty,size:i.size,color:i.color})),voucherCode:document.getElementById('voucherCode').value.trim()}; }
function normalizeCheckoutPhone(value) {
  const compact = String(value || '').trim().replace(/[^\d+]/g, '');
  const international = compact.match(/^(?:\+?84|0084)(\d{9,10})$/);
  return international ? `0${international[1]}` : compact;
}
function renderCheckoutItems() {
  document.getElementById('checkoutItems').innerHTML = cart.map(item => `<div class="checkout-item"><div><strong>${esc(item.name)}</strong><small>${esc(item.size)} · ${esc(item.color)} · SL: ${item.qty}</small></div><span>${(Number(item.price) * item.qty).toLocaleString('vi-VN')}đ</span></div>`).join('');
}
async function refreshQuote() {
  renderCheckoutItems();
  const sequence=++quoteSequence; checkoutQuote=null;
  const button=document.querySelector('#checkoutForm button[type="submit"]'); button.disabled=true;
  for (const id of ['checkoutSubtotal', 'shippingFee', 'checkoutDiscount', 'checkoutTotal']) document.getElementById(id).textContent = '—';
  const message = document.getElementById('quoteMessage');
  message.setAttribute('role', 'status');
  message.textContent = '';
  if (!cart.length) {
    message.textContent = 'Giỏ hàng đang trống. Vui lòng thêm sản phẩm trước khi thanh toán.';
    return;
  }
  const invalid = cart.find(item => !Number.isSafeInteger(item.id) || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 99);
  if (invalid) {
    message.setAttribute('role', 'alert');
    message.textContent = 'Giỏ hàng có số lượng hoặc mã sản phẩm không hợp lệ. Mở giỏ để xóa sản phẩm và chọn lại.';
    return;
  }
  if (allProducts.length) {
    const stale = cart.find(item => {
      const product = allProducts.find(product => product.id === item.id);
      return !product || (item.size != null && !product.sizes.includes(item.size)) || (item.color != null && !product.colors.includes(item.color));
    });
    if (stale) {
      message.setAttribute('role', 'alert');
      message.textContent = `Sản phẩm “${stale.name}” hoặc quy cách/màu đã thay đổi. Mở giỏ để xóa và chọn lại sản phẩm.`;
      return;
    }
  }
  document.getElementById('checkoutTotal').textContent='Đang tính...';
  try {
    const quote=await api('/api/checkout/quote',{method:'POST',body:JSON.stringify(cartPayload())});
    if(sequence!==quoteSequence)return;
    checkoutQuote=quote;
    document.getElementById('checkoutSubtotal').textContent=quote.subtotal.toLocaleString('vi-VN')+'đ';
    document.getElementById('shippingFee').textContent=quote.shippingFee.toLocaleString('vi-VN')+'đ';
    document.getElementById('checkoutDiscount').textContent=quote.discount.toLocaleString('vi-VN')+'đ';
    document.getElementById('checkoutTotal').textContent=quote.total.toLocaleString('vi-VN')+'đ';
    document.getElementById('quoteMessage').textContent=quote.voucherCode?'Đã áp dụng '+quote.voucherCode:'';
    button.disabled=submittingOrder;
  } catch(e) {
    if(sequence!==quoteSequence)return;
    document.getElementById('checkoutTotal').textContent='—';
    message.setAttribute('role', 'alert');
    message.textContent = e.message + (document.getElementById('voucherCode').value.trim() ? ' Bạn có thể bỏ mã ưu đãi rồi tính lại.' : ' Mở giỏ hàng để kiểm tra sản phẩm hoặc thử tính lại.');
  }
}

function updateCheckoutSummary() { return refreshQuote(); }
document.getElementById('applyVoucher').addEventListener('click', refreshQuote);
document.getElementById('quoteMessage').insertAdjacentHTML('afterend', '<div class="quote-recovery"><button type="button" id="clearCheckoutVoucher">Bỏ mã ưu đãi</button><button type="button" id="reviewCheckoutCart">Kiểm tra giỏ hàng</button></div>');
document.getElementById('clearCheckoutVoucher').onclick = () => { document.getElementById('voucherCode').value = ''; refreshQuote(); };
document.getElementById('reviewCheckoutCart').onclick = () => { document.getElementById('checkoutModal').classList.remove('show'); openCart(); };
document.getElementById('voucherCode').addEventListener('input', () => {quoteSequence++; checkoutQuote=null; document.querySelector('#checkoutForm button[type="submit"]').disabled=true; document.getElementById('quoteMessage').textContent='Bấm Áp dụng để cập nhật tổng tiền.';});

document.getElementById('closeCheckoutBtn').addEventListener('click', () => document.getElementById('checkoutModal').classList.remove('show'));
document.getElementById('cancelCheckoutBtn').addEventListener('click', () => document.getElementById('checkoutModal').classList.remove('show'));

document.getElementById('checkoutBtn').addEventListener('click', () => {
  if (!requireShoppingLogin()) return;
  if (!cart.length) {
    showToast('Giỏ hàng của bạn đang trống.', 'error');
    return;
  }
  updateCheckoutSummary();
  document.getElementById('checkoutModal').classList.add('show');
});

document.getElementById('checkoutForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!requireShoppingLogin()) return;
  const form = event.currentTarget;
  if(submittingOrder||!checkoutQuote)return;
  const name = form.querySelector('[name="name"]').value.trim();
  const phone = normalizeCheckoutPhone(form.querySelector('[name="phone"]').value);
  const email = form.querySelector('[name="email"]').value.trim();
  const address = form.querySelector('[name="address"]').value.trim();
  const city = form.querySelector('#checkoutCity').value.trim();
  const district = form.querySelector('#checkoutDistrict').value.trim();
  const ward = form.querySelector('#checkoutWard').value.trim();

  if (!name || !phone || !address || !city || !ward) {
    showToast('Vui lòng điền đầy đủ thông tin giao hàng.', 'error');
    return;
  }
  if (!/^0[35789]\d{8}$/.test(phone)) {
    showToast('Số nhận hàng cần là số di động Việt Nam 10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.', 'error');
    return;
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('Email không đúng định dạng.', 'error');
    return;
  }

  submittingOrder=true; form.querySelector('button[type="submit"]').disabled=true;
  try {
    await cartSaveQueue;
    const order = await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: {
          name,
          phone,
          email,
          address: [address,ward,district,city].filter(Boolean).join(', '),
          addressLine: address,
          city,
          district,
          ward,
        },
        ...cartPayload(),
        expectedTotal: checkoutQuote.total,
        paymentMethod: 'cod'
      })
    });

    await loadOrderHistory();
    cart = [];
    localStorage.setItem('shop_cart', JSON.stringify(cart));
    renderCart();
    renderOrderHistory();
    renderAccountSummary();
    form.reset();
    document.getElementById('checkoutModal').classList.remove('show');
    showToast(`Đặt hàng thành công! Mã đơn: #${order.id}. Tổng: ${order.total.toLocaleString('vi-VN')}đ`);
    window.dispatchEvent(new Event('shop:order-success'));
    document.getElementById('lookupResult').textContent = `Đã đặt đơn #${order.id} — ${order.total.toLocaleString('vi-VN')}đ. Bạn có thể tra cứu bằng mã đơn và số điện thoại.`;
    await loadProducts();
  } catch (error) {
    showToast(error.message, 'error');
    await refreshQuote();
  } finally { submittingOrder=false; form.querySelector('button[type="submit"]').disabled=!checkoutQuote; }
});
