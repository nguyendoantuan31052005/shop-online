// Storefront: main. Loaded in index.html order; shared state is in state.js.
localStorage.removeItem('shop_admin_token');
if(localStorage.getItem('shop_token')==='admin-demo-token'){localStorage.removeItem('shop_token');localStorage.removeItem('shop_user');}
loadProducts();
hydrateUserSession();
loadOrderHistory();
document.getElementById('heroShopBtn').onclick = scrollToProducts;
document.getElementById('heroExploreBtn').onclick = () => document.getElementById('categoryGrid').scrollIntoView({ behavior: 'smooth' });
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  document.querySelectorAll('.modal.show').forEach(modal => modal.classList.remove('show'));
  closeCart();
  document.getElementById('mobileMenuPanel').classList.remove('open');
});
renderCart();
