/* Native compositor scrolling: no touchmove cancellation, per-frame geometry,
   or JavaScript scrolling while the finger is down. Assist short swipes only. */
(() => {
  const root = document.documentElement;
  let gesture;
  let settleFrame = 0;
  // Leave finger tracking native; soften only the final, single alignment.
  function settleTo(top) {
    cancelAnimationFrame(settleFrame);
    const start = scrollY;
    window.scrollTo({ top: start, behavior: 'instant' });
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo({ top, behavior: 'instant' });
      return;
    }
    const started = performance.now();
    function step(now) {
      const progress = Math.min(1, (now - started) / 400);
      const eased = Math.sin(progress * Math.PI / 2);
      window.scrollTo({ top: start + (top - start) * eased, behavior: 'instant' });
      settleFrame = progress < 1 ? requestAnimationFrame(step) : 0;
    }
    settleFrame = requestAnimationFrame(step);
  }
  const enabled = () => innerWidth <= 900 && root.classList.contains('mobile-paging-ready');
  const offset = (page) => Math.max(0, scrollY + page.getBoundingClientRect().top -
    (page.id === 'home' ? 0 : (document.querySelector('.site-header')?.offsetHeight || 70)));
  document.addEventListener('touchstart', (event) => {
    cancelAnimationFrame(settleFrame);
    settleFrame = 0;
    gesture = null;
    if (!enabled() || event.touches.length !== 1 ||
        event.target.closest('.site-header, .naver-map, input, textarea, select, [contenteditable]') ||
        getSelection()?.toString()) return;
    const pages = [...document.querySelectorAll('main > section, .site-footer')];
    const positions = pages.map(offset);
    const index = positions.reduce((best, y, i) =>
      Math.abs(y - scrollY) < Math.abs(positions[best] - scrollY) ? i : best, 0);
    if (pages[index].matches('.site-footer')) return;
    const touch = event.touches[0];
    gesture = { x: touch.clientX, y: touch.clientY, index, pages, positions, time: performance.now() };
  }, { passive: true });
  document.addEventListener('touchmove', (event) => {
    if (event.touches.length !== 1) gesture = null;
  }, { passive: true });
  document.addEventListener('touchcancel', () => { gesture = null; }, { passive: true });
  document.addEventListener('touchend', (event) => {
    if (!gesture || event.touches.length || !event.changedTouches.length) return;
    const current = gesture;
    gesture = null;
    const dx = event.changedTouches[0].clientX - current.x;
    const dy = current.y - event.changedTouches[0].clientY;
    const speed = Math.abs(dy) / Math.max(1, performance.now() - current.time);
    if (Math.abs(dy) < 8 || Math.abs(dy) <= Math.abs(dx) * 1.2) return;
    const advance = Math.abs(dy) >= 40 || (Math.abs(dy) >= 18 && speed >= .3);
    const next = Math.max(0, Math.min(current.pages.length - 1,
      current.index + (advance ? Math.sign(dy) : 0)));
    settleTo(current.positions[next]);
  }, { passive: true });
})();
