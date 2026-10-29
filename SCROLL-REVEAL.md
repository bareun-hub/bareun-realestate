# 공통 타이포그래피와 스크롤 모션

`global-experience.css`의 `:root`에서 제목 줄간격(1.4), 본문 줄간격(1.7),
제목 자간(-0.025em), 하단 여백, 모션 시간과 곡선을 조정합니다.
기존 화면 맞춤 CSS보다 우선하도록 중요한 규칙은 공통 cascade layer에 있습니다.
PC에서는 섹션이 콘텐츠 높이를 허용합니다. 모바일에서는 모든 섹션을 같은
화면 높이에 맞추고, compact 여백과 실제 콘텐츠 높이 측정으로 하단 버튼까지
보이도록 조정합니다. CSS scroll snap으로 한 번의 스와이프마다 한 섹션에 멈춥니다.
`script.js`의 `fitMobilePage`가 글꼴/콘텐츠 크기와 화면 방향 변화에 대응합니다.
높이는 `100svh`로 측정해 주소창 움직임이나 확대 배율 변화로 글자 크기가 재계산되지 않습니다.
`mobile-swipe.js`는 세로 드래그 거리가 40px 이상이거나 짧고 빠른 제스처일 때
인접한 한 섹션으로 이동합니다. 지도, 링크/버튼, 가로 제스처와 두 손가락 확대는
가로채지 않습니다. 드래그 중에는 기본 터치 스크롤을 그대로 사용하며,
손을 뗄 때 짧은 스와이프의 도착 위치만 보정합니다. 콘텐츠는 화면 안에서 수직 중앙에 배치합니다.
모바일 이중 탭 확대와 글자 자동 확대는 제한하며 두 손가락 확대는 유지합니다.

`scroll-reveal.js`는 메인 제목/본문, 기존 카드 그리드와 이미지를 자동 등록합니다.
각 요소는 첫 스크롤 진입에 한 번 나타납니다. 다시 방문해도 읽던 내용이 사라지지 않습니다.

```html
<h2 class="fade-up">새 섹션 제목</h2>
<div class="stagger-group">
  <article class="stagger-item">첫 카드</article>
  <article class="stagger-item">두 번째 카드</article>
</div>
<img class="reveal-image" src="assets/example.jpg" alt="이미지 설명">
```

카드는 0.12초씩 지연되며 네 개 단위로 지연을 초기화합니다.
카드 내부 텍스트는 중복 모션을 피하도록 카드와 함께 움직입니다.
이미지를 확대할 때 경계를 유지하려면 이미지를 `overflow: hidden`인 컨테이너에 넣습니다.
동적으로 섹션을 추가한 뒤 `window.ScrollReveal.refresh()`를 호출합니다.

JavaScript 또는 Intersection Observer가 없으면 콘텐츠는 기본으로 표시됩니다.
`prefers-reduced-motion: reduce`에서는 등장 모션과 부드러운 스크롤을 끕니다.
