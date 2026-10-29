/* One owner for vertical mobile movement: the browser cannot add a fling
   after the gesture, and menu links use the same final alignment. */
(() => {
  const root = document.documentElement;
  let gesture = null;
  let frame = 0;
  let dragFrame = 0;
  let activePage = null;
  let lastViewportHeight = '';
  const pages = () => [...document.querySelectorAll('main > section, .site-footer')];
  const offset = (page) => Math.max(0, Math.min(
    document.documentElement.scrollHeight - document.documentElement.clientHeight,
    scrollY + page.getBoundingClientRect().top -
    (page.id === 'home' ? 0 : (document.querySelector('.site-header')?.offsetHeight || 70))));
  const enabled = () => innerWidth <= 900 && root.classList.contains('mobile-paging-ready') &&
    Math.abs((visualViewport?.scale || 1) - 1) < .01;

  // Touch samples can arrive much less often than display frames. Follow the
  // latest sample continuously instead of jumping once for every touch event.
  function drawDrag(now) {
    if (!gesture?.dragging) { dragFrame = 0; return; }
    const elapsed = Math.min(48, Math.max(1, now - gesture.lastDraw));
    gesture.lastDraw = now;
    const target = Math.max(gesture.min, Math.min(gesture.max, gesture.start + gesture.distance));
    const blend = 1 - Math.exp(-elapsed / 32);
    const previousPosition = gesture.drawPosition;
    gesture.drawPosition += (target - gesture.drawPosition) * blend;
    gesture.drawVelocity = (gesture.drawPosition - previousPosition) / elapsed;
    window.scrollTo({ top: gesture.drawPosition, behavior: 'instant' });
    dragFrame = requestAnimationFrame(drawDrag);
  }

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
    const height = root.style.getPropertyValue('--mobile-vh');
    if (enabled() && height !== lastViewportHeight && activePage && !gesture && !frame) {
      window.scrollTo({ top: offset(activePage), behavior: 'instant' });
    }
    lastViewportHeight = height;
  }
  function goTo(page, releaseVelocity) {
    cancel();
    activePage = page;
    const start = scrollY;
    let destination = offset(page);
    let viewportHeight = root.style.getPropertyValue('--mobile-vh');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo({ top: destination, behavior: 'instant' });
      return;
    }
    root.classList.add('mobile-page-moving');
    const started = performance.now();
    let segmentStart = start, segmentStarted = started, segmentDuration = 650;
    let velocity = releaseVelocity === undefined ? (destination - start) * .7 / 650 : releaseVelocity;
    let previousPosition = start, previousTime = started;
    let initialSlope = releaseVelocity === undefined ? .7 :
      (destination !== start && releaseVelocity * (destination - start) > 0 ? Math.min(2, releaseVelocity * 650 / (destination - start)) : 0);
    function step(now) {
      const visibleHeight = root.style.getPropertyValue('--mobile-vh');
      if (visibleHeight !== viewportHeight) {
        destination = offset(page);
        viewportHeight = visibleHeight;
        segmentStart = scrollY;
        segmentStarted = now;
        segmentDuration = Math.max(160, 650 - (now - started));
        const distance = destination - segmentStart;
        initialSlope = distance && velocity * distance > 0 ? Math.min(2, velocity * segmentDuration / distance) : 0;
        previousPosition = segmentStart;
        previousTime = now;
      }
      const t = Math.min(1, (now - segmentStarted) / segmentDuration);
      // Match the release speed and finish at zero speed, avoiding a sudden
      // acceleration when finger tracking hands over to page settling.
      const eased = (-2 * t ** 3 + 3 * t ** 2) + initialSlope * (t ** 3 - 2 * t ** 2 + t);
      const position = segmentStart + (destination - segmentStart) * eased;
      velocity = (position - previousPosition) / Math.max(1, now - previousTime);
      previousPosition = position;
      previousTime = now;
      window.scrollTo({ top: position, behavior: 'instant' });
      if (t < 1) frame = requestAnimationFrame(step);
      else {
        // Resolve from the live section, rather than a stale touch-start offset.
        window.scrollTo({ top: offset(page), behavior: 'instant' });
        frame = 0;
        root.classList.remove('mobile-page-moving');
        document.dispatchEvent(new Event('mobile-page-settled'));
      }
    }
    frame = requestAnimationFrame(step);
  }
  window.MobilePaging = { goTo, cancel, getAnchor: () => activePage,
    adjustViewport: (shift) => {
      if (!gesture) return;
      gesture.start += shift;
      gesture.drawPosition += shift;
      gesture.positions = gesture.list.map(offset);
      gesture.min = gesture.positions[Math.max(0, gesture.index - 1)];
      gesture.max = gesture.positions[Math.min(gesture.list.length - 1, gesture.index + 1)];
    }
  };
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
    activePage = list[index];
    gesture = { x: event.touches[0].clientX, y: event.touches[0].clientY,
      start: scrollY, drawPosition: scrollY, lastDraw: performance.now(),
      min: positions[Math.max(0, index - 1)], max: positions[Math.min(list.length - 1, index + 1)],
      distance: 0, index, list, positions, time: performance.now(), dragging: false };
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
    if (!dragFrame) dragFrame = requestAnimationFrame(drawDrag);
  }, { passive: false });
  document.addEventListener('touchcancel', cancel, { passive: true });
  document.addEventListener('touchend', () => {
    if (!gesture?.dragging) { cancel(); return; }
    const current = gesture;
    const speed = Math.abs(current.distance) / Math.max(1, performance.now() - current.time);
    const advance = Math.abs(current.distance) >= 40 || (Math.abs(current.distance) >= 18 && speed >= .3);
    const next = Math.max(0, Math.min(current.list.length - 1,
      current.index + (advance ? Math.sign(current.distance) : 0)));
    goTo(current.list[next], current.drawVelocity || 0);
  }, { passive: true });
})();
