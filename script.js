const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-button');
const mobileNav = document.querySelector('.mobile-nav');
const mobileLinks = document.querySelectorAll('.mobile-nav a');
const naverPropertyLink = document.querySelector('#naver-property-link');

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 30);
});

menuButton.addEventListener('click', () => {
  const isOpen = mobileNav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
});

mobileLinks.forEach((link) => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', '메뉴 열기');
  });
});

naverPropertyLink.addEventListener('click', (event) => {
  if (naverPropertyLink.getAttribute('href') === '#') event.preventDefault();
});

const NAVER_MAP_CLIENT_ID = '7t7c9gatsd';
const BARUN_SITE_URL = 'https://parkhm750910-hue.github.io/bareun-realestate/';
const BARUN_PLACE = {
  name: '바른부동산공인중개사사무소',
  address: '경남 김해시 율하6로 61 성호루브루 102호',
  phone: '055-313-0222',
  // 율하6로 61 건물 위치. Geocoding 성공 시 네이버가 반환한 좌표로 다시 보정합니다.
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
  const query = encodeURIComponent(`${BARUN_PLACE.name} ${BARUN_PLACE.address}`);
  return `https://map.naver.com/p/search/${query}?c=${lng},${lat},17,0,0,0,dh`;
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

  // 지도와 길찾기는 Geocoding 설정과 무관하게 우선 정상 동작하도록 기본 좌표로 즉시 표시합니다.
  renderBarunMap(BARUN_PLACE.lat, BARUN_PLACE.lng);

  // Geocoding을 사용할 수 있으면 네이버가 주소로 확인한 좌표를 길찾기 목적지에 반영합니다.
  if (naver.maps.Service) {
    naver.maps.Service.geocode({ query: BARUN_PLACE.address }, (status, response) => {
      if (status === naver.maps.Service.Status.OK && response.v2.addresses.length) {
        const result = response.v2.addresses[0];
        setDirectionsUrl(Number(result.y), Number(result.x));
      }
    });
  }
}

function loadNaverMaps() {
  if (!mapElement) return;

  // 네이버 공식 인증 실패 콜백
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

// API가 로드되지 않아도 PC 길찾기 버튼은 처음부터 바른부동산을 목적지로 갖습니다.
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
