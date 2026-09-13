// Mobile navigation structural fix.
// The header is persistent on every section. When .site-header becomes .scrolled,
// backdrop-filter creates a containing block; a fixed .mobile-nav then gets laid out
// against the 70px header instead of the viewport. Keep the same visual menu, but
// position it absolutely from the persistent header so its geometry is stable.
(() => {
  const style = document.createElement('style');
  style.id = 'mobile-nav-containing-block-fix';
  style.textContent = `
@media (max-width: 900px) {
  .site-header .mobile-nav {
    position: absolute !important;
    top: 100% !important;
    left: 0 !important;
    right: 0 !important;
    bottom: auto !important;
    height: calc(var(--mobile-vh, 100dvh) - 70px) !important;
    max-height: calc(var(--mobile-vh, 100dvh) - 70px) !important;
    overflow-y: auto !important;
  }
}
`;
  document.head.appendChild(style);
})();
