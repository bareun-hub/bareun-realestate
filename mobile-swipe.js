/* One owner for vertical mobile movement: the browser cannot add a fling
   after the gesture, and menu links use the same final alignment. */
(() => {
  const root = document.documentElement;
  let gesture = null;
  let frame = 0;
  let dragFrame = 0;
  const pages = () => [...document.querySelectorAll('main > section, .site-footer')];
  const offset = (page) => Math.max(0, Math.min(
    document.documentElement.scrollHeight - document.documentElement.clientHeight,
    scrollY + page.getBoundingClientRect().top -
    (page.id === 'home' ? 0 : (document.querySelector('.site-header')?.offsetHeight || 70))));
  const enabled = () => innerWidth <= 900 && root.classList.contains('mobile-paging-ready') &&
    Math.abs((visualViewport?.scale || 1) - 1) < .01;

  function cancel() {
    cancelAnimationFrame(frame);
    cancelAnimationFrame(dragFrame);
    frame = dragFrame = 0;
    gesture = null;
    root.classList.remove('mobile-page-moving');
  }
  function updateMode() {
    root.classList.toggle('mobile-swipe-controlled', enabled());
    if (!enabled()) cancel();
  }
  function goTo(page) {
    cancel();
    const start = scrollY;
    const destination = offset(page);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo({ top: destination, behavior: 'instant' });
      return;
    }
    root.classList.add('mobile-page-moving');
    const started = performance.now();
    function step(now) {
      const t = Math.min(1, (now - started) / 550);
      const eased = 1 - (1 - t) ** 2;
      window.scrollTo({ top: start + (destination - start) * eased, behavior: 'instant' });
      if (t < 1) frame = requestAnimationFrame(step);
      else {
        // Resolve from the live section, rather than a stale touch-start offset.
        window.scrollTo({ top: offset(page), behavior: 'instant' });
        frame = 0;
        root.classList.remove('mobile-page-moving');
      }
    }
    frame = requestAnimationFrame(step);
  }
  window.MobilePaging = { goTo, cancel };
  requestAnimationFrame(updateMode);
  window.addEventListener('resize', () => requestAnimationFrame(updateMode));
  visualViewport?.addEventListener('resize', updateMode);

  document.addEventListener('touchstart', (event) => {
    cancel();
    if (!enabled() || event.touches.length !== 1 ||
        event.target.closest('.site-header, .naver-map, input, textarea, select, [contenteditable]') ||
        getSelection()?.toString()) return;
    const list = pages();
    const positions = list.map(offset);
    const index = positions.reduce((best, y, i) =>
      Math.abs(y - scrollY) < Math.abs(positions[best] - scrollY) ? i : best, 0);
    gesture = { x: event.touches[0].clientX, y: event.touches[0].clientY,
      start: scrollY, distance: 0, index, list, positions, time: performance.now(), dragging: false };
  }, { passive: true });
  document.addEventListener('touchmove', (event) => {
    if (!gesture) return;
    if (event.touches.length !== 1) { cancel(); return; }
    const dx = event.touches[0].clientX - gesture.x;
    const dy = gesture.y - event.touches[0].clientY;
    if (!gesture.dragging) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) { cancel(); return; }
      if (Math.abs(dy) < 8 || Math.abs(dy) < Math.abs(dx) * 1.2) return;
      gesture.dragging = true;
      root.classList.add('mobile-page-moving');
    }
    if (event.cancelable) event.preventDefault();
    gesture.distance = dy;
    if (!dragFrame) dragFrame = requestAnimationFrame(() => {
      dragFrame = 0;
      if (!gesture) return;
      const min = gesture.positions[Math.max(0, gesture.index - 1)];
      const max = gesture.positions[Math.min(gesture.list.length - 1, gesture.index + 1)];
      window.scrollTo({ top: Math.max(min, Math.min(max, gesture.start + gesture.distance)), behavior: 'instant' });
    });
  }, { passive: false });
  document.addEventListener('touchcancel', cancel, { passive: true });
  document.addEventListener('touchend', () => {
    if (!gesture?.dragging) { cancel(); return; }
    const current = gesture;
    const speed = Math.abs(current.distance) / Math.max(1, performance.now() - current.time);
    const advance = Math.abs(current.distance) >= 40 || (Math.abs(current.distance) >= 18 && speed >= .3);
    const next = Math.max(0, Math.min(current.list.length - 1,
      current.index + (advance ? Math.sign(current.distance) : 0)));
    goTo(current.list[next]);
  }, { passive: true });
})();
