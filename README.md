# SnackDeal Frontend

SnackDeal(과자 쇼핑몰) 프로토타입입니다. 사용자 쇼핑몰 화면과 관리자 화면을 한 앱에서 제공하며,
**백엔드 없이 mock 데이터로만 동작**합니다. 발표 시연을 목표로 하는 UI 프로토타입으로, 실제 결제와
이메일 발송은 콘솔 로그로 mock 처리합니다.

## 주요 기능

- **사용자**: 회원가입/로그인, 상품 목록/상세/검색/필터, 장바구니, 주문/결제(mock)/배송지 관리,
  쿠폰함, 이벤트, 고객센터(공지/1:1문의)
- **관리자**: 대시보드, 상품/카테고리 관리, 주문 관리, 쿠폰/이벤트게시판 관리, 회원 관리,
  문의 답변

## 스택

- Vite + React + TypeScript
- Tailwind CSS
- React Router v6
- Zustand (전역 상태)
- lucide-react (아이콘)

## 실행 방법

이 저장소 루트가 곧 프론트엔드 앱입니다 (`cd frontend` 불필요).

```bash
npm install       # 의존성 설치
npm run dev       # 개발 서버 실행 → http://localhost:5173
```

그 외 명령어:

```bash
npm run build      # 타입체크(tsc) + 프로덕션 빌드
npm run preview    # 빌드 결과 로컬 프리뷰
```

## 폴더 구조

```
src/
  pages/user/         사용자 화면
  pages/admin/        관리자 화면
  components/ui/      Button, Input, Select, Badge, Table, Card, Modal, Toast
  components/layout/  UserLayout, AdminLayout
  components/common/  Placeholder
  mocks/               mock 데이터 (스키마 기준)
  types/               DB 스키마 반영 타입 정의
  stores/               zustand 스토어
  lib/                  포맷터/유틸
docs/                  도메인별 명세 개요 (아래 참고)
```

## 문서 (`docs/`)

도메인별 데이터 모델과 화면 구성은 `docs/<도메인>/_개요.md`에 정리되어 있습니다.

- 회원/인증 → [`docs/1_회원_인증/_개요.md`](docs/1_회원_인증/_개요.md)
- 상품/카테고리 → [`docs/2_상품_카테고리/_개요.md`](docs/2_상품_카테고리/_개요.md)
- 장바구니 → [`docs/3_장바구니/_개요.md`](docs/3_장바구니/_개요.md)
- 주문/결제/배송/주소록 → [`docs/4_주문_결제_배송/_개요.md`](docs/4_주문_결제_배송/_개요.md)
- 쿠폰/이벤트 → [`docs/5_쿠폰_이벤트/_개요.md`](docs/5_쿠폰_이벤트/_개요.md)
- 고객센터/문의 → [`docs/6_고객센터_문의/_개요.md`](docs/6_고객센터_문의/_개요.md)
- 관리자 공통 → [`docs/7_관리자_공통/_개요.md`](docs/7_관리자_공통/_개요.md)

## 현재 상태

- 전 라우트 연결 완료, 도메인별 실제 화면 구현이 진행 중입니다.
- 타입/enum은 `docs/`의 각 `_개요.md`가 근거로 삼는 DB 스키마를 그대로 반영합니다
  (대문자 enum, BIGINT id, 상품 옵션 없음, 상품 이미지 1장).

## 규칙

- 스펙 확인은 `docs/<도메인>/_개요.md`부터.
- 필드명·타입·enum은 DB 스키마와 일치시킬 것 (지어내지 말 것).
- 문서에 없는 정보가 필요하면 코드에 `// TODO: 팀 확인 필요` 주석을 남길 것.
