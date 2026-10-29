/* One vertical gesture advances one page. Do not capture maps, controls,
   pinch zoom, text selection, or horizontal gestures. Desktop stays native. */
(() => {
  const root = document.documentElement;
  let gesture = null;
  let settleFrame = 0;
  let dragFrame = 0;
  // Cache geometry at gesture start; move at most once per display frame.
  function settleTo(end) {
    cancelAnimationFrame(settleFrame);
    const start = scrollY;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo({ top: end, behavior: 'instant' });
      root.classList.remove('mobile-paging-drag');
      return;
    }
    root.classList.add('mobile-paging-drag');
    const started = performance.now();
    const duration = Math.min(320, Math.max(180, Math.abs(end - start) * .45));
    function step(now) {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - (1 - progress) ** 3;
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
    cancelAnimationFrame(dragFrame);
    dragFrame = 0;
    settleFrame = 0;
    gesture = null;
    if (!isEnabled() || event.touches.length !== 1 ||
        event.target.closest('.site-header, .naver-map, a, button, input, textarea, select, [contenteditable]') ||
        window.getSelection()?.toString()) {
      root.classList.remove('mobile-paging-drag');
      return;
    }
    const list = pages();
    const positions = list.map(offset);
    const index = list.reduce((best, page, i) =>
      Math.abs(positions[i] - scrollY) < Math.abs(positions[best] - scrollY) ? i : best, 0);
    if (list[index].matches('.site-footer')) {
      root.classList.remove('mobile-paging-drag');
      return;
    }
    const touch = event.touches[0];
    gesture = { x: touch.clientX, y: touch.clientY, start: scrollY,
      time: performance.now(), index, list, positions,
      min: positions[Math.max(0, index - 1)],
      max: positions[Math.min(list.length - 1, index + 1)],
      dragging: false, distance: 0 };
  }, { passive: true });

  document.addEventListener('touchmove', (event) => {
    if (!gesture) return;
    if (event.touches.length !== 1) { cancel(); return; }
    const dx = event.touches[0].clientX - gesture.x;
    const dy = gesture.y - event.touches[0].clientY;
    if (!gesture.dragging) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) { cancel(); return; }
      if (Math.abs(dy) < 10 || Math.abs(dy) < Math.abs(dx) * 1.2) return;
      gesture.dragging = true;
      root.classList.add('mobile-paging-drag');
    }
    if (event.cancelable) event.preventDefault();
    gesture.distance = dy;
    if (!dragFrame) dragFrame = requestAnimationFrame(() => {
      dragFrame = 0;
      if (!gesture?.dragging) return;
      window.scrollTo({ top: Math.max(gesture.min, Math.min(gesture.max,
        gesture.start + gesture.distance)), behavior: 'instant' });
    });
  }, { passive: false });

  function cancel() {
    cancelAnimationFrame(dragFrame);
    dragFrame = 0;
    gesture = null;
    root.classList.remove('mobile-paging-drag');
  }
  document.addEventListener('touchcancel', cancel, { passive: true });
  document.addEventListener('touchend', () => {
    if (!gesture?.dragging) { cancel(); return; }
    const { distance, time, index, list, positions } = gesture;
    const speed = Math.abs(distance) / Math.max(1, performance.now() - time);
    const advance = Math.abs(distance) >= 40 || (Math.abs(distance) >= 18 && speed >= .3);
    const next = Math.max(0, Math.min(list.length - 1, index + (advance ? Math.sign(distance) : 0)));
    gesture = null;
    cancelAnimationFrame(dragFrame);
    dragFrame = 0;
    settleTo(positions[next]);
  }, { passive: true });
})();
