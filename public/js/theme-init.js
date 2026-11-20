(() => {
  const link = document.getElementById('darkThemeStylesheet');
  if (!link) return;
  let dark = false;
  try { dark = localStorage.getItem('home-shopping-theme') === 'dark'; } catch {}
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  link.disabled = !dark;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = dark ? '#101010' : '#f6f3ed';
})();
