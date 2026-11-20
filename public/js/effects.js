(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let enabled = true;
  try { enabled = localStorage.getItem('shop_effects') !== 'off'; } catch { /* Optional preference. */ }
  document.documentElement.dataset.effects = enabled ? 'on' : 'off';
  const active = () => enabled && !reduceMotion.matches;
  document.body.insertAdjacentHTML('beforeend', '<div class="page-progress" aria-hidden="true"></div><div class="effects-controls"><button type="button" id="toggleEffects" aria-pressed="true">✧ Hiệu ứng</button><button type="button" id="backToTop" hidden aria-label="Về đầu trang">↑</button></div>');
  document.querySelector('.hero-main')?.insertAdjacentHTML('afterbegin', '<div class="hero-ambient" aria-hidden="true"></div>');
  const toggle = document.getElementById('toggleEffects');
  function updatePreference() { toggle.setAttribute('aria-pressed', String(enabled)); toggle.textContent = enabled ? '✧ Hiệu ứng: bật' : '✧ Hiệu ứng: tắt'; }
  updatePreference();
  toggle.onclick = () => {
    enabled = !enabled; document.documentElement.dataset.effects = enabled ? 'on' : 'off';
    try { localStorage.setItem('shop_effects', enabled ? 'on' : 'off'); } catch { /* Preference remains in memory. */ }
    document.querySelectorAll('[data-tilt]').forEach(card => card.removeAttribute('data-tilt'));
    updatePreference();
  };
  document.getElementById('backToTop').onclick = () => window.scrollTo({ top: 0, behavior: active() ? 'smooth' : 'instant' });
  let scrollFrame = 0;
  const progress = document.querySelector('.page-progress');
  function updateScroll() {
    scrollFrame = 0;
    const range = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${range > 0 ? Math.min(1, scrollY / range) : 0})`;
    document.querySelector('.header-main')?.classList.toggle('is-scrolled', scrollY > 30);
    document.getElementById('backToTop').hidden = scrollY < 500;
  }
  addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll); }, { passive: true });
  updateScroll();
  const observed = new WeakSet();
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    if (active()) entry.target.classList.add('motion-reveal');
    observer.unobserve(entry.target);
  }), { threshold: .08 });
  function observeSections() {
    document.querySelectorAll('.main-shell>.section,.home-category-section,.feature-strip').forEach(section => {
      if (!observed.has(section)) { observed.add(section); observer.observe(section); }
    });
  }
  observeSections();
  let tiltFrame = 0;
  document.addEventListener('pointermove', event => {
    if (!active() || !finePointer.matches || event.pointerType === 'touch') return;
    const card = event.target.closest('.product-card'); if (!card || tiltFrame) return;
    const x = event.clientX, y = event.clientY;
    tiltFrame = requestAnimationFrame(() => {
      tiltFrame = 0; if (!card.isConnected || !active() || !card.matches(':hover')) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--tilt-x', `${Math.max(-3, Math.min(3, (rect.top + rect.height / 2 - y) / rect.height * 6))}deg`);
      card.style.setProperty('--tilt-y', `${Math.max(-3, Math.min(3, (x - rect.left - rect.width / 2) / rect.width * 6))}deg`);
      card.setAttribute('data-tilt', '');
    });
  }, { passive: true });
  document.addEventListener('pointerout', event => {
    const card = event.target.closest?.('.product-card');
    if (card && !card.contains(event.relatedTarget)) card.removeAttribute('data-tilt');
  });
  document.addEventListener('click', event => {
    if (!active()) return;
    const button = event.target.closest('button'); if (!button || button.disabled) return;
    if (button.matches('[data-wishlist],[data-wishlist-detail]')) {
      button.classList.remove('motion-pop'); requestAnimationFrame(() => button.classList.add('motion-pop'));
      setTimeout(() => button.classList.remove('motion-pop'), 500);
    }
    if (!button.matches('.primary-btn,.secondary-btn,[data-add],.home-categories button,.account-hub-tabs button')) return;
    const rect = button.getBoundingClientRect(), ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    button.classList.add('motion-ripple-target'); ripple.className = 'tap-ripple'; ripple.setAttribute('aria-hidden', 'true');
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = ((event.detail ? event.clientX - rect.left : rect.width / 2) - size / 2) + 'px';
    ripple.style.top = ((event.detail ? event.clientY - rect.top : rect.height / 2) - size / 2) + 'px';
    button.append(ripple); setTimeout(() => ripple.remove(), 700);
  });
  addEventListener('shop:order-success', () => {
    if (!active()) return;
    const layer = document.createElement('div'); layer.className = 'celebration'; layer.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 22; i++) {
      const spark = document.createElement('span');
      spark.style.setProperty('--spark-color', ['#89b89a', '#d8bc83', '#4f947e', '#becf8f'][i % 4]);
      spark.style.setProperty('--spark-x', (Math.random() - .5) * Math.min(innerWidth, 850) + 'px');
      spark.style.setProperty('--spark-y', 150 + Math.random() * 400 + 'px');
      spark.style.setProperty('--spark-rotate', (Math.random() - .5) * 1000 + 'deg');
      layer.append(spark);
    }
    document.body.append(layer); setTimeout(() => layer.remove(), 2000);
  });
})();
