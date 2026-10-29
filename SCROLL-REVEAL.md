# 공통 타이포그래피와 스크롤 모션

`global-experience.css`의 `:root`에서 제목 줄간격(1.4), 본문 줄간격(1.7),
제목 자간(-0.025em), 하단 여백, 모션 시간과 곡선을 조정합니다.
기존 화면 맞춤 CSS보다 우선하도록 중요한 규칙은 공통 cascade layer에 있습니다.
본문이 늘어나도 잘리지 않게 섹션은 콘텐츠 높이를 허용합니다.

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
