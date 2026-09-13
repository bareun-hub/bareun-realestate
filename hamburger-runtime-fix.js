// Mobile hamburger reliability fix.
// Keeps the existing header/nav DOM and visual design unchanged.
(() => {
  const MOBILE_MAX_WIDTH = 900;
  let lastToggleAt = 0;

  function getCurrentMenuElements() {
    const header = document.querySelector('.site-header');
    return {
      header,
      button: header?.querySelector('.menu-button') || null,
      nav: header?.querySelector('.mobile-nav') || null
    };
  }

  function setMenuOpen(open) {
    const { button, nav } = getCurrentMenuElements();
    if (!button || !nav) return;

    nav.classList.toggle('open', open);
    nav.style.pointerEvents = open ? 'auto' : 'none';
    button.style.pointerEvents = 'auto';
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    nav.setAttribute('aria-hidden', String(!open));
  }

  function pointInsideButton(x, y, button) {
    if (!button || !Number.isFinite(x) || !Number.isFinite(y)) return false;
    const rect = button.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function eventHitsHamburger(event) {
    const { button } = getCurrentMenuElements();
    if (!button) return false;

    const directTarget = event.target instanceof Element
      ? event.target.closest('.menu-button')
      : null;
    if (directTarget === button) return true;

    return pointInsideButton(event.clientX, event.clientY, button);
  }

  function toggleMenu() {
    const { nav } = getCurrentMenuElements();
    if (!nav) return;
    setMenuOpen(!nav.classList.contains('open'));
    lastToggleAt = Date.now();
  }

  // Window capture runs before the existing document handlers. Even if a transformed
  // section becomes the hit-test target, a tap inside the visible hamburger bounds is caught.
  window.addEventListener('pointerup', (event) => {
    if (window.innerWidth > MOBILE_MAX_WIDTH || !eventHitsHamburger(event)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (Date.now() - lastToggleAt < 250) return;
    toggleMenu();
  }, true);

  // Fallback for environments where a click is delivered without a pointer event.
  window.addEventListener('click', (event) => {
    if (window.innerWidth > MOBILE_MAX_WIDTH) return;

    if (eventHitsHamburger(event)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (Date.now() - lastToggleAt >= 700) toggleMenu();
      return;
    }

    const menuLink = event.target instanceof Element
      ? event.target.closest('.mobile-nav a[href^="#"]')
      : null;
    if (menuLink) setMenuOpen(false);
  }, true);

  // Touch fallback for older iOS/WebView paths. Duplicate pointer/touch delivery is ignored.
  window.addEventListener('touchend', (event) => {
    if (window.innerWidth > MOBILE_MAX_WIDTH) return;
    const touch = event.changedTouches?.[0];
    const { button } = getCurrentMenuElements();
    if (!touch || !button || !pointInsideButton(touch.clientX, touch.clientY, button)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (Date.now() - lastToggleAt < 500) return;
    toggleMenu();
  }, { capture: true, passive: false });

  ['hashchange', 'popstate', 'pageshow'].forEach((eventName) => {
    window.addEventListener(eventName, () => {
      if (window.innerWidth <= MOBILE_MAX_WIDTH) setMenuOpen(false);
    });
  });

  // Start from one consistent state on every load.
  if (window.innerWidth <= MOBILE_MAX_WIDTH) setMenuOpen(false);
})();
