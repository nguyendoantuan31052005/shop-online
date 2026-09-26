const $ = (s) => document.querySelector(s);
const vnd = (n) => n.toLocaleString('vi-VN') + '₫';
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let products = [];
let category = '';
let cart = loadCart();

function loadCart() {
  try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; }
}
function saveCart() {
  try { localStorage.setItem('cart', JSON.stringify(cart)); } catch { /* bỏ qua */ }
}
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.hidden = true), 2200);
}

async function api(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Có lỗi xảy ra');
  return data;
}

async function loadProducts() {
  const q = encodeURIComponent($('#search').value.trim());
  products = await api(`/api/products?q=${q}&category=${encodeURIComponent(category)}`);
  renderProducts();
}

function renderProducts() {
  const el = $('#products');
  if (!products.length) { el.innerHTML = '<p class="empty">Không tìm thấy sản phẩm phù hợp.</p>'; return; }
  el.innerHTML = products.map((p) => `
    <article class="card">
      <div class="emoji" aria-hidden="true">${esc(p.emoji)}</div>
      <h3>${esc(p.name)}</h3>
      <div class="desc">${esc(p.description)}</div>
      <div class="price">${vnd(p.price)}</div>
      <div class="stock">${p.stock > 0 ? `Còn ${p.stock} sản phẩm` : 'Hết hàng'}</div>
      <button class="btn primary" data-add="${p.id}" ${p.stock < 1 ? 'disabled' : ''}>Thêm vào giỏ</button>
    </article>`).join('');
}

async function loadCategories() {
  const cats = await api('/api/categories');
  const el = $('#categories');
  el.innerHTML = ['', ...cats].map((c) =>
    `<button class="chip ${c === category ? 'active' : ''}" data-cat="${esc(c)}">${c ? esc(c) : 'Tất cả'}</button>`).join('');
}

function cartLines() {
  return cart.map((i) => ({ ...i, product: products.find((p) => p.id === i.productId) || i.snapshot }));
}

function renderCart() {
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  $('#cart-count').textContent = count;
  const lines = cartLines();
  $('#cart-items').innerHTML = lines.length
    ? lines.map((l) => `
      <div class="line">
        <span aria-hidden="true">${esc(l.product.emoji)}</span>
        <div class="info"><div>${esc(l.product.name)}</div><div class="price">${vnd(l.product.price)}</div></div>
        <div class="qty">
          <button data-dec="${l.productId}" aria-label="Giảm">−</button>
          <span>${l.quantity}</span>
          <button data-inc="${l.productId}" aria-label="Tăng">+</button>
        </div>
      </div>`).join('')
    : '<p class="empty">Giỏ hàng đang trống.</p>';
  $('#cart-total').textContent = vnd(lines.reduce((s, l) => s + l.product.price * l.quantity, 0));
  saveCart();
}

function addToCart(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  const line = cart.find((i) => i.productId === id);
  if (line) { if (line.quantity < Math.min(p.stock, 99)) line.quantity++; else return toast('Đã đạt số lượng tối đa trong kho'); }
  else cart.push({ productId: id, quantity: 1, snapshot: { name: p.name, price: p.price, emoji: p.emoji } });
  renderCart();
  toast(`Đã thêm "${p.name}"`);
}

function changeQty(id, delta) {
  const line = cart.find((i) => i.productId === id);
  if (!line) return;
  line.quantity += delta;
  if (line.quantity <= 0) cart = cart.filter((i) => i !== line);
  renderCart();
}

document.addEventListener('click', (e) => {
  const t = e.target.closest('button');
  if (!t) return;
  if (t.dataset.add) addToCart(Number(t.dataset.add));
  if (t.dataset.inc) changeQty(Number(t.dataset.inc), 1);
  if (t.dataset.dec) changeQty(Number(t.dataset.dec), -1);
  if (t.dataset.cat !== undefined && t.classList.contains('chip')) {
    category = t.dataset.cat;
    loadCategories(); loadProducts();
  }
});

$('#cart-btn').onclick = () => { $('#cart').hidden = false; };
$('#cart-close').onclick = () => { $('#cart').hidden = true; };

let timer;
$('#search').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(loadProducts, 250); });

$('#checkout').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('#checkout-msg');
  msg.className = 'msg';
  if (!cart.length) { msg.textContent = 'Giỏ hàng đang trống'; return; }
  const f = new FormData(e.target);
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  try {
    const order = await api('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name: f.get('name'), phone: f.get('phone'), address: f.get('address') },
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      }),
    });
    cart = [];
    renderCart();
    e.target.reset();
    msg.className = 'msg ok';
    msg.textContent = `Đặt hàng thành công! Mã đơn #${order.id} – tổng ${vnd(order.total)}.`;
    loadProducts();
  } catch (err) {
    msg.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

(async function init() {
  try {
    await Promise.all([loadCategories(), loadProducts()]);
    // Cập nhật lại giỏ hàng theo dữ liệu mới nhất
    cart = cart.filter((i) => i && Number.isInteger(i.quantity) && i.snapshot);
    renderCart();
    const info = await api('/api/info');
    $('#ver').textContent = `v${String(info.version).slice(0, 7)} · container ${info.hostname}`;
  } catch (err) {
    $('#products').innerHTML = `<p class="empty">${esc(err.message)}</p>`;
  }
})();
