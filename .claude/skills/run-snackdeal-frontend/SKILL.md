---
name: run-snackdeal-frontend
description: SnackDeal React 프론트엔드(Vite + React + TS, mock 데이터 전용, 백엔드 없음)를 빌드/실행/조작한다. SnackDeal 앱을 실행하거나, dev 서버를 띄우거나, 사용자/관리자 화면 스크린샷을 찍거나, UI 변경이 실제로 렌더링되는지 확인할 때 사용.
---

SnackDeal은 mock 데이터로 동작하는 Vite + React + TypeScript SPA다(백엔드 없음). Vite dev
서버를 띄운 뒤, `.claude/skills/run-snackdeal-frontend/driver.mjs`의 Playwright 드라이버로
조작한다 — 지정된 라우트들을 순서대로 방문하며 각 단계마다 스크린샷, 콘솔 에러, 본문 텍스트
스니펫을 남긴다.

아래 경로는 모두 저장소 루트(`c:\work\SnackDeal\react`) 기준이다 — 이 루트 자체가 앱이다.
`CLAUDE.md`에서 과거 `frontend/` 하위 디렉터리를 언급한 적이 있지만, Vite 앱
(`package.json`, `src/`, `index.html`)은 저장소 루트에 있다.

## 준비 (Setup)

의존성은 이미 `package.json`에 있다. 이 드라이버를 위해 Playwright와 Chromium 바이너리를
devDependency로 추가해뒀다 — 새로 클론한 환경이라면 한 번만 설치/다운로드한다:

```bash
npm install
node ./node_modules/playwright/cli.js install chromium
```

(`npx playwright install`도 동작하지만, 이 환경에서는 `cli.js`를 직접 실행하는 방식이 안정적으로
동작했다 — Windows Git Bash에서 `.bin/playwright` 셸 스크립트가 구문 오류로 실패한다.)

앱 실행 자체에는 별도 빌드 단계가 필요 없다 — Vite가 dev 모드에서 `src/`를 바로 서빙한다.

## 실행 (에이전트 경로)

dev 서버를 백그라운드로 띄우고 포트가 열릴 때까지 기다린 뒤, 드라이버를 실행한다:

```bash
(npm run dev > /tmp/snackdeal-dev.log 2>&1 &)
timeout 30 bash -c 'until curl -sf http://localhost:5173 >/dev/null; do sleep 1; done'

node .claude/skills/run-snackdeal-frontend/driver.mjs http://localhost:5173 /tmp/shots
```

작업이 끝나면 서버를 종료한다 — 5173 포트를 리스닝하는 PID를 찾아 종료한다
(이 Windows Git Bash 환경에는 일반 `pkill`/`kill`이 없다):

```bash
netstat -ano | grep 5173   # LISTENING 줄에서 PID 확인
taskkill //F //PID <pid>
```

스크린샷과 각 단계별 콘솔/텍스트 로그는 2번째 인자로 넘긴 디렉터리(위 예시에서는
`/tmp/shots`)에 저장된다. 드라이버에 내장된 기본 단계:

| 단계 | 라우트 | 확인하는 내용 |
|---|---|---|
| `01-home` | `/` | 앱 셸이 렌더링되는지 (홈 페이지 자체는 아직 "준비중" placeholder) |
| `02-products` | `/products` | mock 데이터로 상품 목록이 렌더링되는지, 필터/정렬 UI 노출 여부 |
| `03-product-detail` | 목록에서 "아몬드 초콜릿" 클릭 | 클라이언트 라우팅 + 상세 페이지(`/products/:id`) 동작 여부 |
| `04-cart` | `/cart` | 비로그인 시 로그인으로 리다이렉트됨 — Gotchas 참고 |
| `05-admin-products` | `/admin/products` | 관리자 레이아웃 + 내비게이션 렌더링 여부 |
| `06-admin-orders` | `/admin/orders` | 관리자 라우트 전환 동작 여부 |

다른 라우트나 상호작용을 확인하려면 `driver.mjs` 상단의 `STEPS` 배열을 수정한다 — 각 항목은
`{ name, goto: '/경로' }` 또는 `{ name, click: 'text=...' }`(Playwright 셀렉터) 형태이며,
드라이버가 자동으로 이동/클릭 → network idle 대기 → 스크린샷 → 콘솔 에러 로깅을 수행한다.

## 실행 (사람 경로)

```bash
npm run dev   # → http://localhost:5173, Ctrl-C로 종료
```

## 테스트

아직 테스트 스위트가 구성되어 있지 않다 (`package.json`에 `test` 스크립트 없음).

---

## 주의할 점 (Gotchas)

- **`/cart`(그리고 인증이 필요한 다른 사용자 페이지)는 로그인 페이지로 리다이렉트된다.**
  드라이버의 `04-cart` 단계는 장바구니 내용 대신 `리디렉션중...`이라는 본문 텍스트를 보여준다 —
  아직 mock 로그인 헬퍼가 연결되어 있지 않아, `authStore`로 보호되는 라우트는 비로그인 상태면
  `/login`으로 튕긴다. 인증이 필요한 플로우를 테스트하려면, 보호된 라우트로 이동하기 전에
  `/login`에서 먼저 로그인 폼을 `fill`/`click`으로 채워야 한다.
- **모든 네비게이션마다 뜨는 `ERR_CONNECTION_CLOSED` 콘솔 에러는 무시해도 된다.** 이는 앱
  코드가 아니라 Vite의 HMR/dev 서버 클라이언트에서 발생하는 것이다 — 실패로 취급하지 말 것.
  대신 React 에러나 데이터 렌더링 실패 여부를 확인할 것.
- **`node_modules/.bin/playwright`는 Windows Git Bash에서 실패한다**
  (`SyntaxError: missing ) after argument list` — 셸 스크립트 shim의 `sh` 스타일 헤더가
  Windows node 런처와 충돌한다). 대신 `node ./node_modules/playwright/cli.js <인자>`를
  직접 실행할 것.
- **이 Git Bash 환경에는 `pkill`/일반 `kill`이 없다.** `netstat -ano | grep <포트>`로 PID를
  찾은 뒤 `taskkill //F //PID <pid>`를 사용할 것 (`//`에 주의 — 슬래시 하나만 쓰면 Git Bash의
  경로 변환 때문에 깨진다).
