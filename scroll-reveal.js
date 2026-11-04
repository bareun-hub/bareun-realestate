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

// Desktop cards stay observed so a later visit can replay their entrance.
(() => {
  if (!('IntersectionObserver' in window)) return;
  const desktopMotion = matchMedia('(min-width: 901px) and (prefers-reduced-motion: no-preference)');
  const cards = document.querySelectorAll('main :is(.stagger-item, .property-panel, .contact-panel)');
  const groups = new Map();
  for (const card of cards) {
    const group = card.parentElement;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(card);
  }
  const observer = new IntersectionObserver((entries) => {
    if (!desktopMotion.matches) return;
    for (const { target, intersectionRatio } of entries) {
      for (const card of groups.get(target)) {
        card.classList.toggle('desktop-card-active', intersectionRatio >= .01);
      }
    }
  }, { rootMargin: '-82px 0px 0px', threshold: .01 });

  function updateDesktopCards() {
    observer.disconnect();
    for (const card of cards) {
      card.classList.remove('desktop-card-active');
      card.classList.toggle('desktop-card-reveal', desktopMotion.matches);
    }
    // The stationary group avoids feedback from the cards' own translation.
    if (desktopMotion.matches) groups.forEach((_, group) => observer.observe(group));
  }

  document.querySelector('.desktop-nav')?.addEventListener('click', (event) => {
    if (!desktopMotion.matches || event.defaultPrevented || event.metaKey ||
        event.ctrlKey || event.shiftKey || event.altKey) return;
    const hash = event.target.closest('a[href^="#"]')?.hash;
    const section = hash && document.getElementById(hash.slice(1));
    if (!section) return;
    const active = section.querySelectorAll('.desktop-card-active');
    if (!active.length) return;
    active.forEach(card => card.classList.remove('desktop-card-active'));
    // Commit the reset before replaying cards already visible on a repeat click.
    void section.offsetWidth;
    active.forEach(card => card.classList.add('desktop-card-active'));
  });

  desktopMotion.addEventListener('change', updateDesktopCards);
  updateDesktopCards();
})();

// The desktop property photo doubles as a selector for the existing services.
(() => {
  const feature = document.querySelector('#properties .property-feature');
  const panel = feature?.querySelector('.property-panel');
  if (!panel) return;

  const desktop = matchMedia('(min-width: 901px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const fields = [...panel.querySelectorAll('.panel-index, h3, p')];
  const original = fields.map(field => [...field.childNodes]);
  const visit = ['02 / CONSULTATION', '방문 상담으로 매물을 찾아보세요.',
    '온라인에 공개되지 않은 매물은 대표전화 055-313-0222로 문의해 주세요.'];
  const link = panel.querySelector('#naver-property-link');
  const originalLink = [...link.childNodes];
  const linkAttributes = ['href', 'target', 'aria-label'].map(name => [name, link.getAttribute(name)]);
  const options = document.createElement('div');
  options.className = 'desktop-property-options';
  options.setAttribute('role', 'group');
  options.setAttribute('aria-label', '상가 매물 안내 선택');
  let selection;
  let animations = [];

  function select(index, animate = true) {
    if (index === selection) return;
    selection = index;
    animations.forEach(animation => animation.cancel());
    animations = [];
    fields.forEach((field, i) => field.replaceChildren(...(index ? [visit[i]] : original[i])));
    if (index) {
      link.href = 'tel:0553130222';
      link.removeAttribute('target');
      link.setAttribute('aria-label', '대표전화로 방문 상담 문의');
      link.textContent = '대표전화로 상담 문의 →';
    } else {
      for (const [name, value] of linkAttributes) {
        if (value === null) link.removeAttribute(name);
        else link.setAttribute(name, value);
      }
      link.replaceChildren(...originalLink);
    }
    [...options.children].forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));

    if (animate && !reducedMotion.matches && typeof panel.animate === 'function') {
      animations = [...fields, link].map(field => field.animate(
        [{ opacity: 0, translate: '0 10px' }, { opacity: 1, translate: 'none' }],
        { duration: 280, easing: 'ease-out' }
      ));
    }
  }

  ['공개 매물', '방문 상담'].forEach((label, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => select(index));
    button.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse' && !panel.contains(document.activeElement)) select(index);
    });
    options.append(button);
  });

  function updateOptions() {
    if (desktop.matches) {
      select(0, false);
      feature.append(options);
    } else {
      if (selection !== undefined) select(0, false);
      options.remove();
    }
  }
  desktop.addEventListener('change', updateOptions);
  updateOptions();
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
