/* One vertical gesture advances one page. Do not capture maps, controls,
   pinch zoom, text selection, or horizontal gestures. Desktop stays native. */
(() => {
  const root = document.documentElement;
  let gesture = null;
  let settleFrame = 0;
  // Give every page the same unhurried finish instead of the browser's
  // distance-dependent smooth-scroll speed. Snap resumes only after settling.
  function settleTo(page) {
    cancelAnimationFrame(settleFrame);
    const start = scrollY;
    const end = offset(page);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo({ top: end, behavior: 'instant' });
      root.classList.remove('mobile-paging-drag');
      return;
    }
    root.classList.add('mobile-paging-drag');
    const started = performance.now();
    const duration = 820;
    function step(now) {
      const progress = Math.min(1, (now - started) / duration);
      const eased = (1 - Math.cos(Math.PI * progress)) / 2;
      window.scrollTo({ top: start + (end - start) * eased, behavior: 'instant' });
      if (progress < 1) settleFrame = requestAnimationFrame(step);
      else {
        settleFrame = 0;
        root.classList.remove('mobile-paging-drag');
      }
    }
    settleFrame = requestAnimationFrame(step);
  }
  const pages = () => [...document.querySelectorAll('main > section, .site-footer')];
  const offset = (page) => Math.max(0, scrollY + page.getBoundingClientRect().top -
    (page.id === 'home' ? 0 : (document.querySelector('.site-header')?.offsetHeight || 70)));
  const isEnabled = () => innerWidth <= 900 && root.classList.contains('mobile-paging-ready');

  document.addEventListener('touchstart', (event) => {
    cancelAnimationFrame(settleFrame);
    settleFrame = 0;
    gesture = null;
    if (!isEnabled() || event.touches.length !== 1 ||
        event.target.closest('.site-header, .naver-map, a, button, input, textarea, select, [contenteditable]') ||
        window.getSelection()?.toString()) {
      root.classList.remove('mobile-paging-drag');
      return;
    }
    const list = pages();
    const index = list.reduce((best, page, i) =>
      Math.abs(offset(page) - scrollY) < Math.abs(offset(list[best]) - scrollY) ? i : best, 0);
    if (list[index].matches('.site-footer')) {
      root.classList.remove('mobile-paging-drag');
      return;
    }
    const touch = event.touches[0];
    gesture = { x: touch.clientX, y: touch.clientY, start: scrollY,
      time: performance.now(), index, list, dragging: false, distance: 0 };
  }, { passive: true });

  document.addEventListener('touchmove', (event) => {
    if (!gesture) return;
    if (event.touches.length !== 1) { cancel(); return; }
    const dx = event.touches[0].clientX - gesture.x;
    const dy = gesture.y - event.touches[0].clientY;
    if (!gesture.dragging) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) { gesture = null; return; }
      if (Math.abs(dy) < 10 || Math.abs(dy) < Math.abs(dx) * 1.2) return;
      gesture.dragging = true;
      root.classList.add('mobile-paging-drag');
    }
    if (event.cancelable) event.preventDefault();
    gesture.distance = dy;
    const min = offset(gesture.list[Math.max(0, gesture.index - 1)]);
    const max = offset(gesture.list[Math.min(gesture.list.length - 1, gesture.index + 1)]);
    window.scrollTo({ top: Math.max(min, Math.min(max, gesture.start + dy)), behavior: 'instant' });
  }, { passive: false });

  function cancel() {
    gesture = null;
    root.classList.remove('mobile-paging-drag');
  }
  document.addEventListener('touchcancel', cancel, { passive: true });
  document.addEventListener('touchend', () => {
    if (!gesture?.dragging) { cancel(); return; }
    const { distance, time, index, list } = gesture;
    const speed = Math.abs(distance) / Math.max(1, performance.now() - time);
    const advance = Math.abs(distance) >= 40 || (Math.abs(distance) >= 18 && speed >= .3);
    const next = Math.max(0, Math.min(list.length - 1, index + (advance ? Math.sign(distance) : 0)));
    gesture = null;
    settleTo(list[next]);
  }, { passive: true });
})();
