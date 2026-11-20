'use strict';
(() => {
  const key = 'home-shopping-theme';
  const root = document.documentElement;
  const nav = document.querySelector('.docs-top nav');
  if (!nav) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'docs-theme-toggle';
  nav.prepend(button);

  const update = dark => {
    root.dataset.docsTheme = dark ? 'dark' : 'light';
    const label = dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối';
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-pressed', String(dark));
    button.title = label;
    button.textContent = `${dark ? '☀' : '☾'}  ${dark ? 'Giao diện sáng' : 'Giao diện tối'}`;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#111312' : '#f3f5ef';
  };

  update(root.dataset.docsTheme === 'dark');
  button.addEventListener('click', () => {
    const dark = root.dataset.docsTheme !== 'dark';
    update(dark);
    try { localStorage.setItem(key, dark ? 'dark' : 'light'); } catch {}
  });
  window.addEventListener('storage', event => {
    if (event.key === key) update(event.newValue === 'dark');
  });
})();
