// Storefront: state. Loaded in index.html order; shared state is in state.js.
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categories = [
  { name: 'Thời trang', icon: '👕' },
  { name: 'Phụ kiện', icon: '🎒' },
  { name: 'Điện tử', icon: '📱' },
  { name: 'Đồ ăn uống', icon: '☕' },
  { name: 'Gia dụng', icon: '🏠' },
  { name: 'Mẹ & Bé', icon: '🍼' },
  { name: 'Thể thao', icon: '🏀' },
  { name: 'Sức khỏe', icon: '💊' },
  { name: 'Nhà sách', icon: '📚' },
  { name: 'Xem thêm', icon: '✨' }
];

const categoryGrid = document.getElementById('categoryGrid');
categoryGrid.innerHTML = categories.map((cat) => `
  <button type="button" class="category-box" data-category="${esc(cat.name)}">
    <div class="category-icon">${cat.icon}</div>
    <div>${esc(cat.name)}</div>
  </button>
`).join('');

const sizePills = document.getElementById('sizePills');
const colorPills = document.getElementById('colorPills');
const couponGrid = document.getElementById('couponGrid');
const filterChips = document.getElementById('filterChips');
const sortSelect = document.getElementById('sortSelect');
const allProducts = [];
const state = { selectedColor: '', selectedSize: '' };
let selectedCategory = 'Tất cả';
let selectedGender = '';
const shoppingFilters = { size: '', color: '' };
let sortMode = 'featured';
let cart = readArray('shop_cart').filter(i => i && Number.isSafeInteger(i.id) && i.id > 0 && Number.isInteger(i.qty) && i.qty > 0 && i.qty <= 99);
let wishlist = readArray('shop_wishlist');
let orderHistory = [];
let checkoutQuote = null;
let quoteSequence = 0;
let submittingOrder = false;
function readArray(key) { try { const v=JSON.parse(localStorage.getItem(key)||'[]'); return Array.isArray(v)?v:[]; } catch { return []; } }
