// Storefront: checkout. Loaded in index.html order; shared state is in state.js.
async function loadVouchers() {
  try {
    const vouchers = await api('/api/vouchers');
    couponGrid.innerHTML = vouchers.map(v => '<div class="coupon-card"><h4>'+esc(v.code)+'</h4><p>'+esc(v.description || (v.type==='shipping'?'Miễn phí vận chuyển':v.type==='percent'?'Giảm '+v.value+'%':'Giảm '+Number(v.value).toLocaleString('vi-VN')+'đ'))+'</p><small>Đơn từ '+Number(v.minOrder).toLocaleString('vi-VN')+'đ</small></div>').join('') || '<p>Hiện chưa có mã ưu đãi.</p>';
  } catch { couponGrid.textContent = 'Chưa tải được ưu đãi.'; }
}
function cartPayload() { return {items:cart.map(i=>({productId:i.id,quantity:i.qty,size:i.size,color:i.color})),voucherCode:document.getElementById('voucherCode').value.trim()}; }
function renderCheckoutItems() {
  document.getElementById('checkoutItems').innerHTML = cart.map(item => `<div class="checkout-item"><div><strong>${esc(item.name)}</strong><small>${esc(item.size)} · ${esc(item.color)} · SL: ${item.qty}</small></div><span>${(Number(item.price) * item.qty).toLocaleString('vi-VN')}đ</span></div>`).join('');
}
async function refreshQuote() {
  renderCheckoutItems();
  const sequence=++quoteSequence; checkoutQuote=null;
  const button=document.querySelector('#checkoutForm button[type="submit"]'); button.disabled=true;
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
  } catch(e) { if(sequence!==quoteSequence)return; document.getElementById('checkoutTotal').textContent='—'; document.getElementById('quoteMessage').textContent=e.message; }
}

function updateCheckoutSummary() { return refreshQuote(); }
document.getElementById('applyVoucher').addEventListener('click', refreshQuote);
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
  const phone = form.querySelector('[name="phone"]').value.trim();
  const email = form.querySelector('[name="email"]').value.trim();
  const address = form.querySelector('[name="address"]').value.trim();
  const city = form.querySelector('#checkoutCity').value.trim();
  const district = form.querySelector('#checkoutDistrict').value.trim();
  const ward = form.querySelector('#checkoutWard').value.trim();

  if (!name || !phone || !address || !city || !ward) {
    showToast('Vui lòng điền đầy đủ thông tin giao hàng.', 'error');
    return;
  }
  if (!/^0\d{9,10}$/.test(phone)) {
    showToast('Số điện thoại không hợp lệ.', 'error');
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
    document.getElementById('lookupResult').textContent = `Đã đặt đơn #${order.id} — ${order.total.toLocaleString('vi-VN')}đ. Bạn có thể tra cứu bằng mã đơn và số điện thoại.`;
    await loadProducts();
  } catch (error) {
    showToast(error.message, 'error');
    await refreshQuote();
  } finally { submittingOrder=false; form.querySelector('button[type="submit"]').disabled=!checkoutQuote; }
});
