(() => {
  const setup = panel => {
    const update = () => {
      const shouldShow = window.scrollY > 320;
      panel.toggleAttribute('data-visible', shouldShow);
      if (!shouldShow) panel.open = false;
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
  };

  const existing = document.querySelector('.contact-float');
  if (existing) {
    setup(existing);
    return;
  }

  const observer = new MutationObserver(() => {
    const panel = document.querySelector('.contact-float');
    if (!panel) return;
    observer.disconnect();
    setup(panel);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
