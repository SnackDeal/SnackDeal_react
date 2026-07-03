# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 이 저장소

- 저장소 루트 자체가 프론트엔드 앱이다 (`package.json`, `src/`, `index.html`이 루트에 있다). `docs/`는 도메인별 명세를 정리한 참고 문서다.
- SnackDeal(과자 쇼핑몰) 프로토타입 — 사용자 + 관리자 화면. **백엔드 없이 mock 데이터로만 동작.**
- 발표 시연 가능한 수준이 목표. 실제 결제는 mock, 실제 이메일 발송도 mock(콘솔 로그)으로 처리한다.

## 명령어

```bash
npm install       # 의존성 설치
npm run dev       # Vite 개발 서버 (http://localhost:5173)
npm run build     # tsc 타입체크 + vite build
npm run preview   # 빌드 결과 프리뷰
```

- 테스트 스위트는 아직 구성되어 있지 않다 (`package.json`에 `test` 스크립트 없음).
- 별도의 lint 스크립트는 없다. 타입 오류는 `npm run build`(내부적으로 `tsc`)로 확인한다.

## 아키텍처

**라우팅 (`src/App.tsx`)** — 모든 라우트가 한 파일에 선언되어 있다. 세 그룹으로 나뉜다:
- 레이아웃 없음: `/login`, `/signup`, `/admin/login`
- `UserLayout` 하위: `/`, `/products`, `/cart`, `/checkout`, `/mypage/*`, `/event/*`, `/cs/*` 등 사용자 화면
- `AdminLayout` 하위: `/admin`, `/admin/products`, `/admin/orders` 등 관리자 화면

**페이지 구조 (`src/pages/`)** — `user/`, `admin/`으로 분리. 일부 페이지는 `XxxPage.tsx`(라우트에 연결되는 얇은 wrapper)와 `Xxx.tsx`(실제 화면 컴포넌트)로 나뉘어 있다 (예: `CartPage.tsx`/`Cart.tsx`, `ProductDetailPage.tsx`/`ProductDetail.tsx`). 새 페이지를 추가할 때 기존 페어링 방식이 있는지 먼저 확인할 것.

**상태 관리 (`src/stores/`)** — zustand 스토어를 도메인별로 분리 (`authStore`, `adminAuthStore`, `cartStore`, `orderStore`, `couponStore`, `deliveryStore`, `csStore`, `productStore`, `toastStore`). `authStore`/`adminAuthStore`는 `persist` 미들웨어로 로컬스토리지에 세션을 저장한다. 인증이 필요한 사용자 라우트(`/cart` 등)는 비로그인 시 리다이렉트된다.

**타입 (`src/types/`)** — DB 스키마를 그대로 반영한 도메인 타입 (`common`, `member`, `product`, `cart`, `order`, `coupon`, `cs`). enum은 대문자 문자열 리터럴(`'ACTIVE' | 'INACTIVE' | 'DELETED'` 등), id는 `ID`(BIGINT 대응), 상품 옵션 없음, 상품 이미지는 1장(`image_url`)만 존재 — 필드명/타입을 지어내지 말고 이 규칙을 따를 것.

**mock 데이터 (`src/mocks/`)** — 실제 API 대신 사용하는 정적 데이터. `products`, `members`, `orders`, `coupons`, `cs`로 분리되어 `src/mocks/index.ts`에서 배럴 export.

**UI 컴포넌트 (`src/components/ui/`)** — Button, Input, Select, Badge, Table, Card, Modal, Toast 등 공용 프리미티브. `src/components/layout/`에 `UserLayout`/`AdminLayout`, `src/components/common/`에 `Placeholder`(미구현 화면 표시용).

**경로 별칭** — `@/*`가 `src/*`로 매핑된다 (`tsconfig.json`, `vite.config.ts`).

## 작업 방식

- 스펙 질문이 생기면 먼저 `docs/`의 해당 도메인 `_개요.md`를 읽는다.
- SQL 스키마 기준 필드명/enum/타입을 그대로 사용한다. 지어내지 않는다.
- 문서에 없는 정보를 만들어야 하면 코드에 `// TODO: 팀 확인 필요` 주석을 남긴다.
- 스타일링은 Tailwind CSS. `brand` 색상 팔레트는 `tailwind.config.js`에 정의되어 있다.

## 도메인별 참고 위치

- 회원/인증 → `docs/1_회원_인증/_개요.md`
- 상품/카테고리 → `docs/2_상품_카테고리/_개요.md`
- 장바구니 → `docs/3_장바구니/_개요.md`
- 주문/결제/배송/주소록 → `docs/4_주문_결제_배송/_개요.md`
- 쿠폰/이벤트 → `docs/5_쿠폰_이벤트/_개요.md`
- 고객센터/문의/챗봇 → `docs/6_고객센터_문의/_개요.md`
- 관리자 공통 → `docs/7_관리자_공통/_개요.md`
