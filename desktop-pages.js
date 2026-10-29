/* No desktop classes, DOM changes, or handlers are installed below 901px. */
(() => {
  const desktop = matchMedia('(min-width: 901px)');
  // Reveal the whole fitted page together, including bottom labels that would
  // otherwise remain translated below the observer's viewport margin.
  const observer = new IntersectionObserver((entries) => {
    if (!desktop.matches) return;
    entries.filter((entry) => entry.isIntersecting).forEach(({ target }) => {
      target.querySelectorAll('.fade-up, .stagger-item, .reveal-image').forEach((item) => item.classList.add('is-visible'));
    });
  }, { threshold: .15 });
  document.querySelectorAll('main > section').forEach((section) => observer.observe(section));
  const sync = () => document.documentElement.classList.toggle('desktop-pages-ready', desktop.matches);
  desktop.addEventListener('change', sync);
  sync();
})();
