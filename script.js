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

naverPropertyLink.addEventListener('click', (event) => {
  if (naverPropertyLink.getAttribute('href') === '#') {
    event.preventDefault();
  }
});

// NAVER Cloud Platform Maps의 Web Dynamic Map Client ID입니다.
const NAVER_MAP_CLIENT_ID = '7t7c9gatsd';
const BARUN_PLACE = {
  name: '바른부동산공인중개사사무소',
  address: '경남 김해시 율하6로 61 성호루브루 102호',
  phone: '055-313-0222'
};

const BARUN_SITE_URL = 'https://parkhm750910-hue.github.io/bareun-realestate/';
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
  const query = encodeURIComponent(`${BARUN_PLACE.name} ${BARUN_PLACE.address}`);
  return `https://map.naver.com/p/search/${query}?c=${lng},${lat},17,0,0,0,dh`;
}

function buildNaverWebDirectionsUrl(lat, lng) {
  const placeName = encodeURIComponent(BARUN_PLACE.name);
  return `https://map.naver.com/p/directions/-/${lng},${lat},${placeName},,/-/car`;
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

  const userAgent = navigator.userAgent || '';
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

  if (isAndroid) {
    event.preventDefault();
    window.location.href = barunRouteState.androidIntentUrl;
    return;
  }

  if (isIOS) {
    event.preventDefault();
    const fallbackTimer = window.setTimeout(() => {
      window.location.href = barunRouteState.webDirectionsUrl;
    }, 1400);

    const stopFallback = () => {
      if (document.hidden) window.clearTimeout(fallbackTimer);
    };
    document.addEventListener('visibilitychange', stopFallback, { once: true });
    window.location.href = barunRouteState.appRouteUrl;
  }
}

if (directionsLink) {
  directionsLink.addEventListener('click', handleDirectionsClick);
}

function initBarunNaverMap() {
  if (!window.naver?.maps?.Service || !mapElement) {
    setMapMessage('네이버지도 API를 불러오지 못했습니다. Client ID, Web 서비스 URL 등록 및 Geocoding 사용 설정을 확인해 주세요.', true);
    return;
  }

  naver.maps.Service.geocode({ query: BARUN_PLACE.address }, (status, response) => {
    if (status !== naver.maps.Service.Status.OK || !response.v2.addresses.length) {
      setMapMessage('바른부동산 주소의 좌표를 확인하지 못했습니다. Geocoding API 사용 설정과 Web 서비스 URL 등록을 확인해 주세요.', true);
      return;
    }

    const result = response.v2.addresses[0];
    const lng = Number(result.x);
    const lat = Number(result.y);
    const position = new naver.maps.LatLng(lat, lng);
    const placeUrl = buildNaverWebPlaceUrl(lat, lng);

    const map = new naver.maps.Map(mapElement, {
      center: position,
      zoom: 17,
      minZoom: 10,
      zoomControl: true,
      zoomControlOptions: { position: naver.maps.Position.TOP_RIGHT },
      mapTypeControl: false,
      scaleControl: true,
      logoControl: true,
      mapDataControl: true
    });

    const marker = new naver.maps.Marker({
      position,
      map,
      title: BARUN_PLACE.name
    });

    const infoWindow = new naver.maps.InfoWindow({
      content: `<div class="naver-info-window"><strong>${BARUN_PLACE.name}</strong><span>${BARUN_PLACE.address}</span><span>대표전화 ${BARUN_PLACE.phone}</span><a href="${placeUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:8px;color:#03a94f;font-size:12px;font-weight:700;">네이버지도에서 보기 →</a></div>`,
      borderWidth: 0,
      backgroundColor: '#ffffff',
      anchorSize: new naver.maps.Size(12, 12)
    });

    naver.maps.Event.addListener(marker, 'click', () => {
      if (infoWindow.getMap()) infoWindow.close();
      else infoWindow.open(map, marker);
    });

    infoWindow.open(map, marker);
    setDirectionsUrl(lat, lng);
    if (mapStatus) mapStatus.remove();
  });
}

function loadNaverMaps() {
  if (!mapElement) return;

  window.initBarunNaverMap = initBarunNaverMap;
  const script = document.createElement('script');
  script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(NAVER_MAP_CLIENT_ID)}&submodules=geocoder&callback=initBarunNaverMap`;
  script.async = true;
  script.onerror = () => setMapMessage('네이버지도 API를 불러오지 못했습니다. Client ID 또는 Web 서비스 URL 등록 상태를 확인해 주세요.', true);
  document.head.appendChild(script);
}

loadNaverMaps();

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
