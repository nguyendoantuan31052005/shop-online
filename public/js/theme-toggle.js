(() => {
  const button = document.getElementById('themeToggleBtn');
  const link = document.getElementById('darkThemeStylesheet');
  if (!button || !link) return;

  const meta = document.querySelector('meta[name="theme-color"]');
  const update = dark => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    link.disabled = !dark;
    button.setAttribute('aria-pressed', String(dark));
    const label = dark ? 'Bật giao diện sáng' : 'Bật giao diện tối';
    button.setAttribute('aria-label', label);
    button.title = label;
    button.innerHTML = `<span aria-hidden="true">${dark ? '☀' : '☾'}</span>`;
    if (meta) meta.content = dark ? '#101010' : '#f6f3ed';
  };

  update(document.documentElement.dataset.theme === 'dark');
  button.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme !== 'dark';
    update(dark);
    try { localStorage.setItem('home-shopping-theme', dark ? 'dark' : 'light'); } catch {}
  });

  window.addEventListener('storage', event => {
    if (event.key === 'home-shopping-theme') update(event.newValue === 'dark');
  });
})();
