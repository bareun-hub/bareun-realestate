# 배포 및 수정

이 프로젝트는 서버/프레임워크 없이 동작하는 정적 홈페이지입니다.
PC·모바일 화면 소스는 기존 HTML/CSS/JS에서 수정합니다. `dist/`는 생성 결과이므로 직접 수정하지 않습니다.

## Vercel

저장소 `bareun-hub/bareun-realestate`를 Import하고 `main`을 Production Branch로 선택합니다.
`vercel.json`에 다음 설정이 포함돼 있습니다.

- Framework Preset: Other
- Node.js: 24.x
- Build Command: `npm run build`
- Output Directory: `dist`
- 외부 npm 의존성 없음

빌드 시 CSS 순서와 미디어 조건을 유지해 하나로 묶고 JS도 실행 순서대로 묶습니다.
배포 파일만 `dist/`에 복사하고, 파일명에 내용 해시를 넣어 수정 시 캐시가 갱신됩니다.
`assets/`는 Vercel CDN에서 장기 캐시합니다. HTML에는 장기 캐시를 설정하지 않습니다.

명함 페이지의 공유 주소는 `SITE_URL` 환경변수를 우선 사용합니다(예: `https://example.com/`).
없으면 Vercel의 `VERCEL_PROJECT_PRODUCTION_URL`을 사용하고, 둘 다 없으면 기존 GitHub Pages 주소를 유지합니다.
GitHub Pages의 하위 폴더 주소를 지정할 때는 `/bareun-realestate/`까지 포함합니다.

네이버 클라우드 콘솔의 현재 Maps 애플리케이션 **Web 서비스 URL**에 새 Vercel 도메인과
사용할 사용자 도메인을 등록해야 지도가 정상 인증됩니다. 기존 GitHub Pages 도메인은 계속 유지해도 됩니다.
Maps 클라이언트 ID는 브라우저용 공개 식별자이며, 인증은 등록한 도메인을 기준으로 합니다.

## 로컬 빌드 및 GitHub Pages

```sh
npm run build
```

생성된 `dist/`를 정적 서버로 열어 확인합니다. 기존 루트 폴더도 개발용으로 바로 열 수 있습니다.
GitHub Pages 워크플로도 같은 빌드를 수행해 `dist/`만 배포합니다.
Vercel 실제 프로젝트 생성/도메인 연결은 별도로 진행해야 합니다.
