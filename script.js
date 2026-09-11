const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-button');
const mobileNav = document.querySelector('.mobile-nav');
const mobileLinks = document.querySelectorAll('.mobile-nav a');
const naverPropertyLink = document.querySelector('#naver-property-link');

// 스크롤 시 상단 메뉴를 짙은 네이비 배경으로 전환합니다.
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 30);
});

// 모바일 햄버거 메뉴를 열고 닫습니다.
menuButton.addEventListener('click', () => {
  const isOpen = mobileNav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
});

// 모바일 메뉴에서 항목을 선택하면 메뉴를 자동으로 닫습니다.
mobileLinks.forEach((link) => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', '메뉴 열기');
  });
});

// 네이버부동산 실제 주소가 아직 없으므로 임의의 외부 링크로 이동하지 않도록 막아 둡니다.
// 추후 주소를 받으면 index.html의 #naver-property-link href 값만 실제 URL로 교체하면 됩니다.
naverPropertyLink.addEventListener('click', (event) => {
  if (naverPropertyLink.getAttribute('href') === '#') {
    event.preventDefault();
  }
});

// 각 섹션이 화면에 들어올 때 자연스럽게 나타나는 효과입니다.
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal').forEach((element) => {
  revealObserver.observe(element);
});
