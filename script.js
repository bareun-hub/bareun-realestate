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

// 네이버지도 JavaScript API 설정
// 실제 인터랙티브 네이버지도를 표시하려면 NAVER_MAP_CLIENT_ID에
// NAVER Cloud Platform Maps에서 발급한 Web Dynamic Map Client ID를 입력하세요.
// Geocoding 서브모듈을 사용해 아래 주소를 좌표로 변환한 뒤 그 정확한 결과에 마커를 표시합니다.
const NAVER_MAP_CLIENT_ID = 'YOUR_NAVER_MAP_CLIENT_ID';
const BARUN_PLACE = {
  name: '바른부동산공인중개사사무소',
  address: '경남 김해시 율하6로 61 성호루브루 102호',
  phone: '055-313-0222'
};

const mapElement = document.querySelector('#naver-map');
const mapStatus = document.querySelector('#naver-map-status');
const directionsLink = document.querySelector('#naver-directions-link');

function setMapMessage(message, isError = false) {
  if (!mapStatus) return;
  mapStatus.textContent = message;
  mapStatus.classList.toggle('is-error', isError);
}

function setDirectionsUrl(lat, lng) {
  if (!directionsLink) return;
  const placeName = encodeURIComponent(BARUN_PLACE.name);
  // 네이버지도 공식 웹 길찾기 형식: 출발지는 비워 두고 목적지만 좌표/장소명으로 지정합니다.
  directionsLink.href = `https://map.naver.com/p/directions/-/${lng},${lat},${placeName},,/-/car`;
}

function initBarunNaverMap() {
  if (!window.naver?.maps?.Service || !mapElement) {
    setMapMessage('네이버지도 API를 불러오지 못했습니다. Client ID와 Web 서비스 URL 등록을 확인해 주세요.', true);
    return;
  }

  naver.maps.Service.geocode({ query: BARUN_PLACE.address }, (status, response) => {
    if (status !== naver.maps.Service.Status.OK || !response.v2.addresses.length) {
      setMapMessage('바른부동산 주소의 지도 좌표를 확인하지 못했습니다.', true);
      return;
    }

    const result = response.v2.addresses[0];
    const lng = Number(result.x);
    const lat = Number(result.y);
    const position = new naver.maps.LatLng(lat, lng);

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
      content: `<div class="naver-info-window"><strong>${BARUN_PLACE.name}</strong><span>${BARUN_PLACE.address}</span><span>대표전화 ${BARUN_PLACE.phone}</span></div>`,
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

  if (NAVER_MAP_CLIENT_ID === 'YOUR_NAVER_MAP_CLIENT_ID') {
    setMapMessage('실제 네이버지도를 표시하려면 네이버 지도 Client ID 등록이 필요합니다. Client ID를 발급받은 뒤 script.js의 NAVER_MAP_CLIENT_ID에 입력해 주세요.', true);
    return;
  }

  window.initBarunNaverMap = initBarunNaverMap;
  const script = document.createElement('script');
  script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(NAVER_MAP_CLIENT_ID)}&submodules=geocoder&callback=initBarunNaverMap`;
  script.async = true;
  script.onerror = () => setMapMessage('네이버지도 API를 불러오지 못했습니다. Client ID 설정을 확인해 주세요.', true);
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
