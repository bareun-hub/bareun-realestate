/* Automatic section coverage plus reusable utilities; no animation dependency. */
(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const items = new Set();
  let observer;

  function register(scope = document) {
    const groups = scope.querySelectorAll('.strength-grid, .analysis-grid, .content-topic-grid, .platform-grid, .stagger-group');
    groups.forEach((group) => {
      [...group.children].forEach((item, index) => {
        item.classList.add('stagger-item');
        // Reset the sequence per row; long lists never accumulate long delays.
        item.style.setProperty('--reveal-delay', `${(index % 4) * .12}s`);
      });
    });

    scope.querySelectorAll('main .hero, main h1, main h2, main p, main .property-panel h3, main .contact-panel h3, main .hero-actions, main .analysis-note, .fade-up, .stagger-item, .reveal-image, main .property-image, main img:not(.brand-logo)').forEach((item) => {
      // Cards animate as units. Avoid compounded opacity/motion on children.
      if (item.parentElement.closest('.stagger-item, .reveal-image, .fade-up')) return;
      if (!item.matches('.hero, .stagger-item, .reveal-image')) {
        item.classList.add(item.matches('img, .property-image') ? 'reveal-image' : 'fade-up');
      }
      if (items.has(item)) return;
      items.add(item);
      if (reducedMotion.matches || !observer) item.classList.add('is-visible');
      else observer.observe(item);
    });
  }

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        target.classList.add('is-visible');
        observer.unobserve(target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
  }
  register();
  root.classList.add('motion-ready');
  // Keyboard navigation must never land on a visually hidden control.
  document.addEventListener('focusin', ({ target }) => {
    target.closest('.fade-up, .stagger-item, .reveal-image')?.classList.add('is-visible');
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      items.forEach((item) => item.classList.add('is-visible'));
      observer?.disconnect();
    }
  });
  // Call after adding sections/cards dynamically. Existing elements are skipped.
  window.ScrollReveal = { refresh: register };
})();

// Observe headings separately so section snapping remains browser-controlled.
(() => {
  if (!('IntersectionObserver' in window)) return;
  const mobileMotion = matchMedia('(max-width: 900px) and (prefers-reduced-motion: no-preference)');
  const headings = document.querySelectorAll('main > section :is(.hero-content > h1, .section-heading > h2, .contact-visual > h2)');
  const cardsBySection = new Map();
  for (const heading of headings) {
    const section = heading.closest('section');
    const cards = section.querySelectorAll(':is(.strength-grid, .analysis-grid, .content-topic-grid, .platform-grid, .stagger-group) > .stagger-item, .property-feature');
    if (cards.length) cardsBySection.set(section, cards);
  }
  const hiddenText = window.CSS?.highlights && typeof Highlight === 'function'
    ? new Highlight()
    : null;
  const typing = new Map();
  const segmenter = typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter('ko', { granularity: 'grapheme' })
    : null;
  if (hiddenText) CSS.highlights.set('mobile-heading-untyped', hiddenText);

  function stopTyping(heading) {
    const state = typing.get(heading);
    if (!state) return;
    cancelAnimationFrame(state.frame);
    clearTimeout(state.timer);
    for (const { range } of state.parts) hiddenText.delete(range);
    typing.delete(heading);
  }

  function typeHeading(heading, onComplete) {
    if (!hiddenText) {
      typing.set(heading, { parts: [], frame: 0, timer: setTimeout(() => {
        typing.delete(heading);
        onComplete();
      }, 360) });
      return;
    }
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const parts = [];
    let total = 0;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.data.trim()) continue;
      const segments = segmenter
        ? Array.from(segmenter.segment(node.data), ({ segment }) => segment)
        : Array.from(node.data);
      const offsets = [0];
      for (const segment of segments) offsets.push(offsets.at(-1) + segment.length);
      const range = new Range();
      range.selectNodeContents(node);
      hiddenText.add(range);
      parts.push({ node, range, offsets, start: total });
      total += segments.length;
    }
    if (!total) {
      onComplete();
      return;
    }

    const state = { parts, frame: 0 };
    const started = performance.now();
    const duration = Math.min(1800, Math.max(480, total * 48));
    typing.set(heading, state);
    function reveal(now) {
      const count = Math.floor(total * Math.max(0, now - started) / duration);
      if (count >= total) {
        stopTyping(heading);
        onComplete();
        return;
      }
      for (const { node, range, offsets, start } of parts) {
        const offset = offsets[Math.min(offsets.length - 1, Math.max(0, count - start))];
        if (range.startOffset !== offset) {
          hiddenText.delete(range);
          range.setStart(node, offset);
          if (!range.collapsed) hiddenText.add(range);
        }
      }
      state.frame = requestAnimationFrame(reveal);
    }
    state.frame = requestAnimationFrame(reveal);
  }

  const observer = new IntersectionObserver((entries) => {
    if (!mobileMotion.matches) return;
    for (const { target, isIntersecting, intersectionRatio } of entries) {
      if (intersectionRatio >= .65 && !target.classList.contains('mobile-heading-entered')) {
        const section = target.closest('section');
        typeHeading(target, () => section.classList.add('mobile-cards-ready'));
        target.classList.add('mobile-heading-entered');
      } else if (!isIntersecting) {
        if (typing.has(target)) target.closest('section').classList.add('mobile-cards-ready');
        stopTyping(target);
        target.classList.remove('mobile-heading-entered');
      }
    }
  }, { rootMargin: '-70px 0px 0px 0px', threshold: [0, .65] });

  const sectionObserver = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) target.classList.remove('mobile-cards-ready');
    }
  });

  function updateHeadingObserver() {
    observer.disconnect();
    sectionObserver.disconnect();
    for (const [section, cards] of cardsBySection) {
      section.classList.remove('mobile-cards-ready');
      cards.forEach((card, index) => {
        card.classList.toggle('mobile-stagger-card', mobileMotion.matches);
        if (mobileMotion.matches) card.style.setProperty('--mobile-card-delay', `${index * 110}ms`);
        else card.style.removeProperty('--mobile-card-delay');
      });
      if (mobileMotion.matches) sectionObserver.observe(section);
    }
    for (const heading of headings) {
      stopTyping(heading);
      heading.classList.remove('mobile-heading-entered');
      if (mobileMotion.matches) observer.observe(heading);
    }
  }

  mobileMotion.addEventListener('change', updateHeadingObserver);
  updateHeadingObserver();
})();
