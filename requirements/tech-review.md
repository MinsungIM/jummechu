# 점심 메뉴 추천 시스템 - 기술 검토 리스트

> 작성: 2026-05-13
> 검토 도구: Playwright (공식 docs / 가격 페이지 / 데모 방문, 캡처·텍스트 추출)
> 원본 요구사항: `/home/ims/lunch-menu-requirements.md`

---

## 우선순위 1 — 결정 지연 시 설계 진행 불가

### T1. 지도 API: 네이버 vs 카카오
**관련 요구사항**: §2.1 음식점 정보(지도 표시), §4.1

**확인 항목**
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

### T2. 인증·세션 모델 (실명 입장)
**관련 요구사항**: §0 이름만 치고 입장, §2.3 동명이인 처리, §5.2 사용 범위

**확인 항목**
- "회원가입 없이 실명만"의 보안 한계
  - 본인 확인 불가 → 사칭 가능성
  - 동명이인 구분
  - 세션 영속성(브라우저 닫으면?)
- 사용 범위에 따라 갈리는 분기
  - 사내 전용이면 SSO 후보: Google Workspace / SAML / 슬랙 OAuth
  - 공개라면 익명 + 닉네임 정책
- 게스트 세션을 쿠키/localStorage만으로 유지할 때 trade-off

**방문 대상**
- Google Identity OIDC 가이드: https://developers.google.com/identity/openid-connect/openid-connect
- Slack Sign in with Slack: https://api.slack.com/authentication/sign-in-with-slack
- MDN — Web Storage / Cookies 보안 가이드

**산출물**: 분기별 인증 전략 결정 (사내 vs 공개), 동명이인 보조 필드 정의

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

- 사내 소규모 도구 기준 후보: Supabase / Firebase / 자체 Node·Spring + Postgres
- Playwright 비중 낮음 — 별도 코드·문서 비교 위주

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

- [ ] T1. 지도 API 비교
- [ ] T2. 인증·세션 모델
- [ ] T3. 슬랙 연동 방식
- [ ] T4. 브라우저 알림
- [ ] T5. 날씨 API
- [ ] T6. 유사 서비스 레퍼런스
- [ ] T7. 해시태그 자동완성 UX
- [ ] T8. 반응형 베이스라인
- [ ] T9. 캘린더 연동 (Stretch)
- [ ] T10. 백엔드 스택·DB (Playwright 비중 낮음)
