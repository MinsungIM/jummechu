# 점심 메뉴 추천 시스템 - 기술 검토 리스트

> 작성: 2026-05-13
> 검토 도구: Playwright (공식 docs / 가격 페이지 / 데모 방문, 캡처·텍스트 추출)
> 원본 요구사항: `/home/ims/lunch-menu-requirements.md`

---

## 우선순위 1 — 결정 지연 시 설계 진행 불가

### T1. 지도 API: 네이버 vs 카카오
**관련 요구사항**: §2.1 음식점 정보(지도 표시), §4.1

**결정 (2026-05-13)**: **네이버 지도** 사용

**남은 확인 항목** (구현 단계에서 처리)
- 무료 호출 한도 / 초과 시 동작
- React 통합 (JS SDK or 래퍼 라이브러리)
- 길찾기 외부 딥링크 URL 스킴

**원본 확인 항목 (참고용)**
- 가격 정책 / 월 무료 호출 한도
- 인증 방식 (API 키 / OAuth / 도메인 제한)
- 제공 기능
  - 지도 표시·마커
  - 장소(POI) 검색
  - 길찾기(도보)
  - Geocoding (주소 → 좌표)
  - 주변 검색 (반경 내 식당)
- 식당 POI 데이터 정확도·신선도
- JavaScript SDK 사용성, React 통합 사례
- 사용 약관 — 사내 도구 / 비상업 / 상업 허용 범위
- 일/월 호출량 초과 시 동작

**방문 대상**
- 네이버 지도 JS API: https://navermaps.github.io/maps.js.ncp/
- 네이버 클라우드 Maps 가격: https://www.ncloud.com/product/applicationService/maps
- 카카오맵 API: https://apis.map.kakao.com/
- 카카오 개발자 콘솔: https://developers.kakao.com/product/map

**산출물**: 비교표 1장 (가격 / 기능 / 제약)

---

### T2. 인증·세션 모델 (이메일 기반 간단 회원가입)
**관련 요구사항**: §0 회원가입(이름/이메일/패스워드), §0.1 인증 미정/검토, §6.2 사용 범위(사내 전용)

**결정 (2026-05-13)**:
- 사용 범위: **사내 전용** 확정 (배포/공유 범위로 통제)
- 인증 방식: **이메일/패스워드 자체 회원가입**. SSO(Google/Slack OAuth)는 후순위
- 동명이인 문제는 이메일 식별로 해소
- **도메인 화이트리스트 강제 안 함**
- **이메일 인증(확인 메일) 제외** — 가입 즉시 사용
- **자유 가입** (관리자 초대 X)

**확정 추가 (2026-05-13)**:
- 패스워드 정책: **최소 8자 + 영문·숫자 조합** (특수문자 강제 X, 만료 X)
- 패스워드 재설정: **MVP 범위에서 제외** (관리자가 DB 직접 처리). F1에 재설정 링크 노출 X
- 세션 유지: **항상 로그인 유지** (명시적 로그아웃 전까지). rememberMe 토글 없음

**남은 확인 항목**
- 해싱 알고리즘 (bcrypt vs argon2 — 구현 단계에서 결정)
- 세션 토큰 저장 위치 (httpOnly 쿠키 vs localStorage) — 세션 만료가 없으므로 만료 정책은 N/A이나 토큰 저장 위치는 보안상 선택 필요

**방문 대상** (후순위/참고)
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- MDN — Web Storage / Cookies 보안 가이드
- ~~Google Identity OIDC~~ / ~~Slack Sign in with Slack~~ — 후순위 (자체 가입 선택으로 우선순위 하향)

**산출물**: 패스워드 정책 / 재설정 흐름 / 세션 만료 정책 1장, 도메인 화이트리스트 적용 여부 결정

---

## 우선순위 2 — MVP 직후 도입 예정

### T3. 슬랙 연동 방식
**관련 요구사항**: §4.2

**확인 항목**
- Incoming Webhook (단순·단방향) vs Slack App + Bot (양방향·인터랙션)
- 파티 카드 UI를 Block Kit으로 어떻게 그릴지
- 슬래시 커맨드 (`/lunch` 같은) 도입 여부
- 워크스페이스 OAuth 설치 흐름
- 알림 채널 — 개인 DM vs 공용 채널

**방문 대상**
- Incoming Webhooks: https://api.slack.com/messaging/webhooks
- Block Kit 개념: https://api.slack.com/block-kit
- Block Kit Builder (실사용): https://app.slack.com/block-kit-builder
- Slash Commands: https://api.slack.com/interactivity/slash-commands

**산출물**: Webhook vs App 선택 결정, 알림 메시지 mock 1장

---

### T4. 브라우저 알림 (출발 임박)
**관련 요구사항**: §추가제안 B4

**확인 항목**
- Web Push (Service Worker + Push API) 브라우저 지원 현황
- iOS Safari 푸시 제약 (PWA 설치 강제 여부)
- 푸시 서버 구축 비용 vs in-app 알림으로 충분한지
- 권한 요청 UX

**방문 대상**
- MDN Notifications API: https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API
- MDN Push API: https://developer.mozilla.org/en-US/docs/Web/API/Push_API
- caniuse Push API: https://caniuse.com/push-api

**산출물**: 알림 채널 매트릭스 (브라우저 / 슬랙 / 이메일), MVP에 포함할 채널 결정

---

### T5. 날씨 API
**관련 요구사항**: §3.4.3 날씨/계절 추천

**확인 항목**
- 기상청 단기예보 API 인증·호출 한도 (공공데이터포털)
- OpenWeather 무료 한도·정확도
- 카카오/네이버 날씨 API 제공 여부
- 응답 포맷·SLA

**방문 대상**
- 공공데이터포털 기상청 단기예보: https://www.data.go.kr/data/15084084/openapi.do
- OpenWeather API: https://openweathermap.org/api

**산출물**: 추천 룰에 쓸 최소 필드 정의 (강수 / 기온 / 체감온도)

---

## 우선순위 3 — 방향성 참고 / 디자인 레퍼런스

### T6. 유사 서비스 레퍼런스
**관련 요구사항**: 전반적 UX

**목적**: 파티 카드 / 모집 흐름 / 평가 UX 벤치마크

**검색·방문 대상**
- 국내: "런치메이트", "점심 같이", "사내 점심" 키워드 서비스
- 소셜다이닝: 남의집, 트레바리, 문토 (모집 카드 UI 참고)
- 해외: Lunchclub, Never Eat Alone, Bumble Bizz

**산출물**: 화면 캡처 모음 + 우리 시스템에 가져올 패턴 메모

---

### T7. 해시태그 자동완성 UX
**관련 요구사항**: §3.5

**방문 대상**
- GitHub Issues 라벨/태그 입력
- 인스타그램 해시태그 입력
- Notion 멀티셀렉트 태그 입력
- Stack Overflow 태그 입력

**산출물**: 컴포넌트 동작 캡처 + 채택 패턴 결정 (콤보박스 / 칩 / 인라인)

---

### T8. 반응형 베이스라인
**관련 요구사항**: §5.1

**확인 항목**
- 표준 브레이크포인트 (Tailwind / Material / Bootstrap)
- 터치 타깃 크기 가이드
- 모바일 네비게이션 패턴 (하단 탭 vs 햄버거)

**방문 대상**
- Tailwind 브레이크포인트: https://tailwindcss.com/docs/responsive-design
- Material Design Layout: https://m3.material.io/foundations/layout/applying-layout/window-size-classes
- WCAG 터치 타깃 크기 권고

**산출물**: 우리 시스템 브레이크포인트 / 그리드 결정 1장

---

## 우선순위 4 — Stretch (보류)

### T9. 캘린더 연동
**관련 요구사항**: §추가제안 D2

- Google Calendar API `events.insert` 흐름·스코프
- OAuth 동의 화면 검증 절차

**방문 대상**
- https://developers.google.com/calendar/api/v3/reference/events/insert

---

### T10. 백엔드 스택·DB 선택
**관련 요구사항**: §5 전반

**결정 (2026-05-13)**:
- **스택: Next.js 풀스택 (App Router + API Routes) + better-sqlite3 + SQLite 단일 파일**
- 프론트/백엔드 동일 리포·동일 언어 (TypeScript), 배포는 단일 Node 서버 (Vercel 또는 자체 호스팅)
- DB: SQLite — 운영·백업 단순, 단일 파일

**확정 추가 (2026-05-13)**:
- **ORM**: Drizzle (better-sqlite3 어댑터)
- **인증**: NextAuth (Auth.js) + Credentials Provider
- **API 표면**: Route Handlers (`app/api/*/route.ts`) 위주
- 호스팅: 자체 Node 서버 (단일 인스턴스, SQLite 단일 파일 운영 전제)

**남은 확인 항목**
- 백업 전략 (파일 복사 + 정기 스냅샷 / SQLite VACUUM)
- 동시 접속 한계 가늠 (점심 시간대 사내 인원 동시 접속)

---

## 검토 산출물 공통 형식

각 항목당 1페이지 요약 권장:
- **결정안** (1줄)
- **근거 링크** (3개 이내)
- **비용 추정** (월 / 년)
- **리스크** (3개 이내)

Playwright는 페이지 캡처·핵심 텍스트 추출용으로만. 의사결정은 사람이.

---

## 진행 체크리스트

- [x] T1. 지도 API 비교 — **네이버 지도 확정**
- [~] T2. 인증·세션 모델 — 큰 방향 결정 (사내 전용 + 이메일/패스워드 자체 가입). 패스워드 정책·재설정·세션 만료·도메인 화이트리스트는 잔여 검토
- [ ] T3. 슬랙 연동 방식
- [ ] T4. 브라우저 알림
- [ ] T5. 날씨 API
- [ ] T6. 유사 서비스 레퍼런스
- [ ] T7. 해시태그 자동완성 UX
- [ ] T8. 반응형 베이스라인
- [ ] T9. 캘린더 연동 (Stretch)
- [x] T10. 백엔드 스택·DB — **Next.js 풀스택 + better-sqlite3 + SQLite 확정** (호스팅·ORM·인증 라이브러리는 잔여)
