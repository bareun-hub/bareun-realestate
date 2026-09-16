// 모바일 접근성을 위해 사용자의 두 손가락 확대/축소를 허용합니다.
const viewportMeta = document.querySelector('meta[name="viewport"]');
if (viewportMeta) {
  viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
}

// 시각 디자인에는 영향을 주지 않고 모바일 터치 동작만 안정화합니다.
const mobileInteractionStyles = document.createElement('style');
mobileInteractionStyles.textContent = `
@media (max-width: 900px) {
  html, body, main { touch-action: auto; }
  a, button, .menu-button, .mobile-nav { touch-action: manipulation; }
  .site-header {
    pointer-events: auto !important;
    z-index: 2147483000 !important;
  }
  .site-header .menu-button {
    position: relative;
    z-index: 2147483002 !important;
    pointer-events: auto !important;
  }
  .site-header .mobile-nav {
    z-index: 2147483001 !important;
  }
}
`;
document.head.appendChild(mobileInteractionStyles);

const mobileFixStyles = document.createElement('link');
mobileFixStyles.rel = 'stylesheet';
mobileFixStyles.href = 'mobile-fix.css?v=20260913-0100';
document.head.appendChild(mobileFixStyles);

const mobileAnchorFixStyles = document.createElement('link');
mobileAnchorFixStyles.rel = 'stylesheet';
mobileAnchorFixStyles.href = 'mobile-anchor-fix.css?v=20260913-0242';
document.head.appendChild(mobileAnchorFixStyles);

const desktopPropertyFitStyles = document.createElement('link');
desktopPropertyFitStyles.rel = 'stylesheet';
desktopPropertyFitStyles.href = 'desktop-property-fit.css?v=20260913-0154';
document.head.appendChild(desktopPropertyFitStyles);

const desktopContentsFitStyles = document.createElement('link');
desktopContentsFitStyles.rel = 'stylesheet';
desktopContentsFitStyles.href = 'desktop-contents-fit.css?v=20260913-2310';
document.head.appendChild(desktopContentsFitStyles);

// 가장 마지막에 적용되는 모바일 전용 전체화면 보정 CSS입니다.
const mobileFullscreenFitStyles = document.createElement('link');
mobileFullscreenFitStyles.rel = 'stylesheet';
mobileFullscreenFitStyles.href = 'mobile-fullscreen-fit.css?v=20260913-2247';
document.head.appendChild(mobileFullscreenFitStyles);

const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-button');
const mobileNav = document.querySelector('.mobile-nav');
const naverPropertyLink = document.querySelector('#naver-property-link');
const youtubeLinks = document.querySelectorAll('a[href*="youtube.com"]');

const BARUN_YOUTUBE_WEB_URL = 'https://www.youtube.com/channel/UCxsdH8u99B_-tY8d_ha5Fyw';
const BARUN_YOUTUBE_CHANNEL_PATH = 'youtube.com/channel/UCxsdH8u99B_-tY8d_ha5Fyw';

function getMobileOperatingSystem() {
  const userAgent = navigator.userAgent || navigator.vendor || '';

  if (/android/i.test(userAgent)) return 'android';
  if (/iPhone|iPod/i.test(userAgent)) return 'ios';
  // iPadOS 13+는 데스크톱 형태의 user agent를 사용할 수 있습니다.
  if (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1) return 'ios';

  return null;
}

function openYoutubeApp(event) {
  event.preventDefault();
  const mobileOperatingSystem = getMobileOperatingSystem();

  if (mobileOperatingSystem === 'android') {
    // 네이버 인앱 브라우저의 웹 fallback을 거치지 않고 유튜브 공식 앱을 직접 지정합니다.
    window.location.href = `intent://${BARUN_YOUTUBE_CHANNEL_PATH}#Intent;scheme=https;package=com.google.android.youtube;end`;
    return;
  }

  if (mobileOperatingSystem === 'ios') {
    window.location.href = `youtube://${BARUN_YOUTUBE_CHANNEL_PATH}`;
    return;
  }

  window.open(BARUN_YOUTUBE_WEB_URL, '_blank', 'noopener,noreferrer');
}

youtubeLinks.forEach((link) => {
  link.addEventListener('click', openYoutubeApp);
});

window.addEventListener('scroll', () => {
  header?.classList.toggle('scrolled', window.scrollY > 30);
});

function setMobileMenuOpen(open) {
  if (!menuButton || !mobileNav) return;

  mobileNav.classList.toggle('open', open);
  mobileNav.style.pointerEvents = open ? 'auto' : 'none';
  menuButton.style.pointerEvents = 'auto';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  mobileNav.setAttribute('aria-hidden', String(!open));
}

function closeMobileMenu() {
  setMobileMenuOpen(false);
}

// 최초 상태를 확실히 닫힌 상태로 맞춥니다.
setMobileMenuOpen(false);

const MOBILE_FIT_SECTION_IDS = ['intro', 'properties', 'analysis', 'contents', 'contact'];
let mobileFitFrame = 0;

function ensureMobileFitWrappers() {
  MOBILE_FIT_SECTION_IDS.forEach((id) => {
    const section = document.getElementById(id);
    if (!section || section.querySelector(':scope > .mobile-fit-inner')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'mobile-fit-inner';
    while (section.firstChild) wrapper.appendChild(section.firstChild);
    section.appendChild(wrapper);
  });
}

function getVisibleMobileHeight() {
  return Math.round(window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight);
}

function fitOneMobileSection(section, availableHeight) {
  const inner = section.querySelector(':scope > .mobile-fit-inner');
  if (!inner) return;

  section.style.setProperty('--mobile-fit-scale', '1');

  const naturalHeight = Math.max(inner.scrollHeight, inner.getBoundingClientRect().height || 0);
  let scale = naturalHeight > availableHeight ? availableHeight / naturalHeight : 1;
  scale = Math.min(1, Math.max(0.35, scale));
  section.style.setProperty('--mobile-fit-scale', scale.toFixed(4));

  requestAnimationFrame(() => {
    const secondHeight = Math.max(inner.scrollHeight, 1);
    let secondScale = secondHeight > availableHeight ? availableHeight / secondHeight : 1;
    secondScale = Math.min(1, Math.max(0.35, secondScale));
    section.style.setProperty('--mobile-fit-scale', secondScale.toFixed(4));
  });
}

function fitMobileSections() {
  cancelAnimationFrame(mobileFitFrame);
  mobileFitFrame = requestAnimationFrame(() => {
    ensureMobileFitWrappers();

    if (window.innerWidth > 900) {
      document.documentElement.style.removeProperty('--mobile-vh');
      MOBILE_FIT_SECTION_IDS.forEach((id) => {
        document.getElementById(id)?.style.removeProperty('--mobile-fit-scale');
      });
      return;
    }

    const viewportHeight = getVisibleMobileHeight();
    const headerHeight = Math.round(header?.getBoundingClientRect().height || 70);
    const availableHeight = Math.max(320, viewportHeight - headerHeight);
    document.documentElement.style.setProperty('--mobile-vh', `${viewportHeight}px`);

    MOBILE_FIT_SECTION_IDS.forEach((id) => {
      const section = document.getElementById(id);
      if (section) fitOneMobileSection(section, availableHeight);
    });
  });
}

function goToMobileSection(hash) {
  const target = document.querySelector(hash);
  if (!target) return;

  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function moveToMobileHash(hash) {
  if (!hash || !hash.startsWith('#')) return;
  const target = document.querySelector(hash);
  if (!target) return;

  history.pushState(null, '', hash);

  if (hash === '#home' || hash === '#top') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  goToMobileSection(hash);
}

// 모바일에서는 pointerup을 우선 사용해 섹션 이동 후에도 햄버거 터치를 안정적으로 받습니다.
// 뒤이어 발생하는 synthetic click은 시간값으로 무시하여 한 번 터치에 두 번 토글되지 않게 합니다.
let lastHamburgerPointerUp = 0;

document.addEventListener('pointerup', (event) => {
  if (window.innerWidth > 900) return;
  const hamburger = event.target.closest?.('.menu-button');
  if (!hamburger) return;

  event.preventDefault();
  event.stopPropagation();
  lastHamburgerPointerUp = Date.now();
  setMobileMenuOpen(!mobileNav?.classList.contains('open'));
}, true);

// 메뉴 링크와 click fallback은 이벤트 위임으로 한 번만 등록합니다.
document.addEventListener('click', (event) => {
  if (window.innerWidth > 900) return;

  const hamburger = event.target.closest?.('.menu-button');
  if (hamburger) {
    event.preventDefault();
    event.stopPropagation();
    if (Date.now() - lastHamburgerPointerUp < 700) return;
    setMobileMenuOpen(!mobileNav?.classList.contains('open'));
    return;
  }

  const mobileMenuLink = event.target.closest?.('.mobile-nav a[href^="#"]');
  if (mobileMenuLink) {
    const hash = mobileMenuLink.getAttribute('href');
    if (!hash || !document.querySelector(hash)) return;

    event.preventDefault();
    event.stopPropagation();
    closeMobileMenu();
    moveToMobileHash(hash);
    return;
  }

  const link = event.target.closest?.('a[href^="#"]');
  if (!link) return;

  const hash = link.getAttribute('href');
  if (!hash || hash === '#' || !document.querySelector(hash)) return;

  event.preventDefault();
  closeMobileMenu();
  moveToMobileHash(hash);
}, true);

// 메뉴 이동, 브라우저 뒤로/앞으로 이동 뒤에도 메뉴 상태를 항상 초기화합니다.
window.addEventListener('hashchange', () => {
  if (window.innerWidth > 900) return;
  closeMobileMenu();
  const hash = window.location.hash;
  if (hash && hash !== '#home' && hash !== '#top') goToMobileSection(hash);
});

window.addEventListener('popstate', () => {
  if (window.innerWidth <= 900) closeMobileMenu();
});

window.addEventListener('pageshow', () => {
  if (window.innerWidth <= 900) closeMobileMenu();
});

// 브라우저 주소창이 접히고 펴질 때 visualViewport 높이가 계속 변하면서 화면 전체가
// 재축소/재확대되던 원인이므로 스크롤 중 resize에는 재계산하지 않습니다.
window.addEventListener('orientationchange', () => setTimeout(fitMobileSections, 180));
window.addEventListener('load', () => {
  fitMobileSections();
  setTimeout(fitMobileSections, 300);
});

ensureMobileFitWrappers();
fitMobileSections();

if (naverPropertyLink) {
  naverPropertyLink.addEventListener('click', (event) => {
    if (naverPropertyLink.getAttribute('href') === '#') event.preventDefault();
  });
}

const NAVER_MAP_CLIENT_ID = '7t7c9gatsd';
const BARUN_SITE_URL = 'https://parkhm750910-hue.github.io/bareun-realestate/';
const BARUN_PLACE = {
  name: '바른부동산공인중개사사무소',
  address: '경남 김해시 율하6로 61 성호루브루 102호',
  mapAddress: '경남 김해시 율하6로 61',
  phone: '055-313-0222',
  lat: 35.17156,
  lng: 128.82298
};

const mapElement = document.querySelector('#naver-map');
const mapStatus = document.querySelector('#naver-map-status');
const directionsLink = document.querySelector('#naver-directions-link');
let barunRouteState = null;

function setMapMessage(message, isError = false) {
  if (!mapStatus) return;
  mapStatus.textContent = message;
  mapStatus.classList.toggle('is-error', isError);
}

function buildNaverWebPlaceUrl(lat, lng) {
  const address = encodeURIComponent(BARUN_PLACE.mapAddress);
  return `https://map.naver.com/p/search/${address}?c=${lng},${lat},17,0,0,0,dh`;
}

function buildNaverWebDirectionsUrl(lat, lng) {
  const name = encodeURIComponent(BARUN_PLACE.name);
  return `https://map.naver.com/p/directions/-/${lng},${lat},${name},,PLACE_POI/-/car`;
}

function buildNaverAppRouteUrl(lat, lng) {
  const params = new URLSearchParams({
    dlat: String(lat),
    dlng: String(lng),
    dname: BARUN_PLACE.name,
    appname: BARUN_SITE_URL
  });
  return `nmap://route/car?${params.toString()}`;
}

function buildAndroidIntentRouteUrl(lat, lng, fallbackUrl) {
  const params = new URLSearchParams({
    dlat: String(lat),
    dlng: String(lng),
    dname: BARUN_PLACE.name,
    appname: BARUN_SITE_URL
  });
  return `intent://route/car?${params.toString()}#Intent;scheme=nmap;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.nhn.android.nmap;S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end`;
}

function setDirectionsUrl(lat, lng) {
  if (!directionsLink) return;
  const webDirectionsUrl = buildNaverWebDirectionsUrl(lat, lng);
  const appRouteUrl = buildNaverAppRouteUrl(lat, lng);
  const androidIntentUrl = buildAndroidIntentRouteUrl(lat, lng, webDirectionsUrl);
  barunRouteState = { webDirectionsUrl, appRouteUrl, androidIntentUrl };
  directionsLink.href = webDirectionsUrl;
}

function handleDirectionsClick(event) {
  if (!barunRouteState) return;
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  if (isAndroid) {
    event.preventDefault();
    window.location.href = barunRouteState.androidIntentUrl;
    return;
  }

  if (isIOS) {
    event.preventDefault();
    const timer = window.setTimeout(() => {
      window.location.href = barunRouteState.webDirectionsUrl;
    }, 1400);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) window.clearTimeout(timer);
    }, { once: true });
    window.location.href = barunRouteState.appRouteUrl;
  }
}

if (directionsLink) directionsLink.addEventListener('click', handleDirectionsClick);

function renderBarunMap(lat, lng) {
  if (!window.naver?.maps || !mapElement) return;
  const position = new naver.maps.LatLng(lat, lng);
  const placeUrl = buildNaverWebPlaceUrl(lat, lng);

  const map = new naver.maps.Map(mapElement, {
    center: position,
    zoom: 17,
    minZoom: 10,
    zoomControl: true,
    zoomControlOptions: { position: naver.maps.Position.TOP_RIGHT },
    scaleControl: true,
    logoControl: true,
    mapDataControl: true
  });

  const marker = new naver.maps.Marker({ position, map, title: BARUN_PLACE.name });
  const infoWindow = new naver.maps.InfoWindow({
    content: `<div class="naver-info-window"><strong>${BARUN_PLACE.name}</strong><span>${BARUN_PLACE.address}</span><span>대표전화 ${BARUN_PLACE.phone}</span><a href="${placeUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:8px;color:#03a94f;font-size:12px;font-weight:700;">네이버지도에서 보기 →</a></div>`,
    borderWidth: 0,
    backgroundColor: '#fff',
    anchorSize: new naver.maps.Size(12, 12)
  });

  naver.maps.Event.addListener(marker, 'click', () => {
    if (infoWindow.getMap()) infoWindow.close();
    else infoWindow.open(map, marker);
  });
  infoWindow.open(map, marker);
  setDirectionsUrl(lat, lng);
  if (mapStatus) mapStatus.remove();
}

function initBarunNaverMap() {
  if (!window.naver?.maps || !mapElement) {
    setMapMessage('네이버지도 인증에 실패했습니다. Web 서비스 URL과 Dynamic Map 사용 설정을 확인해 주세요.', true);
    return;
  }

  renderBarunMap(BARUN_PLACE.lat, BARUN_PLACE.lng);

  if (naver.maps.Service) {
    naver.maps.Service.geocode({ query: BARUN_PLACE.mapAddress }, (status, response) => {
      if (status === naver.maps.Service.Status.OK && response.v2.addresses.length) {
        const result = response.v2.addresses[0];
        setDirectionsUrl(Number(result.y), Number(result.x));
      }
    });
  }
}

function loadNaverMaps() {
  if (!mapElement) return;

  window.navermap_authFailure = function () {
    setMapMessage('네이버지도 인증이 거부되었습니다. 네이버 클라우드에서 Dynamic Map 사용 여부와 Web 서비스 URL(parkhm750910-hue.github.io)을 확인해 주세요.', true);
  };

  window.initBarunNaverMap = initBarunNaverMap;
  const script = document.createElement('script');
  script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(NAVER_MAP_CLIENT_ID)}&submodules=geocoder&callback=initBarunNaverMap`;
  script.async = true;
  script.onerror = () => setMapMessage('네이버지도 API 파일을 불러오지 못했습니다. Client ID와 Web 서비스 URL 등록을 확인해 주세요.', true);
  document.head.appendChild(script);
}

setDirectionsUrl(BARUN_PLACE.lat, BARUN_PLACE.lng);
loadNaverMaps();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

