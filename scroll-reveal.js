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

// Use static headings as visibility triggers for mobile card groups.
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
  const observer = new IntersectionObserver((entries) => {
    if (!mobileMotion.matches) return;
    for (const { target, intersectionRatio } of entries) {
      if (intersectionRatio >= .65) {
        target.closest('section').classList.add('mobile-cards-ready');
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
        if (mobileMotion.matches) card.style.setProperty('--mobile-card-delay', `${150 + index * 95}ms`);
        else card.style.removeProperty('--mobile-card-delay');
      });
      if (mobileMotion.matches) sectionObserver.observe(section);
    }
    for (const heading of headings) {
      if (mobileMotion.matches && cardsBySection.has(heading.closest('section'))) observer.observe(heading);
    }
  }

  mobileMotion.addEventListener('change', updateHeadingObserver);
  updateHeadingObserver();
})();
