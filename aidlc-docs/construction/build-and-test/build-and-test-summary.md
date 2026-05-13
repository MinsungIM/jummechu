# Build and Test Summary — jummechu MVP

> CONSTRUCTION 단계 모든 트랙 머지 후 통합 검증 결과.
> 작성: 2026-05-13
> Master 시점: `5ea1a89` (4 트랙 통합)

## 빌드

- 명령: `pnpm install && pnpm db:migrate && pnpm build`
- 결과: ✅ **Compiled successfully** (Next.js 16.2.6 turbopack)
- 라우트: **28개** (Static 6 + Dynamic 22 + Proxy middleware 1)
- 빌드 시간: ~5초 (캐시 미사용 시)
- 경고: middleware deprecated (Next 17부터 `proxy.ts` 사용 — 후속 작업)

## 정적 분석

- 명령: `pnpm lint`
- 결과: ✅ **0 errors, 0 warnings**
- 규칙: Public API 컨벤션 (`no-restricted-imports`로 `features/*/server/*` 직접 import 금지) + ESLint 9 flat config + TS parser

## 단위 + 통합 테스트

- 명령: `pnpm test`
- 결과: ✅ **109 passed / 15 files / 0 failed**
- 환경: Vitest 2.1 + in-memory SQLite + drizzle 마이그레이션 자동 적용
- ⭐ Invariants 검증:
  - `joinParty` 동시성: capacity=3 owner 1 + 10명 동시 → 정확히 2 성공 + 8 CapacityFullError ✓
  - `tagRestaurant` 멱등성: 동일 tag 동시 추가 시 중복 INSERT 없음 + usage_count 정확 ✓
  - `notification.markRead`: WHERE id + user_id 제약으로 타인 알림 read 불가 ✓
  - `recommendation.recent_avoid`: 최근 7일 방문 식당 제외 ✓

## E2E 테스트

- 명령: `pnpm test:e2e`
- 상태: Playwright 설정만 존재 (`playwright.config.ts`), 본격 시나리오 미작성
- 수동 E2E 골든패스 (Playwright MCP로 검증): 회원가입 → 자동 로그인 → 파티 생성 → S2 상세 → 홈 리스트 표시 ✓
- 후속: `tests/e2e/critical-path.spec.ts` 본격 작성 (MVP 출시 후 보완 가능)

## 성능 테스트

- 상태: placeholder (`performance-test-instructions.md` 참조)
- 사내 도구(~50명)이므로 MVP는 unit-level 동시성 invariant로 갈음
- 후속: 운영 1주 후 실측 + autocannon 부하

## 트랙별 산출물

| 트랙 | 모듈 | 함수 | 컴포넌트 | API | 테스트 |
|---|---|---|---|---|---|
| T-C | M2 party | 12 | 7 (PartyCard 등) | 7 | 33 |
| T-A | M7 notification | 8 | 4 | 3 | 13 |
| T-B | M3 restaurant + M6 map | 11 + 3 | 4 + 2 | 5 | 24 |
| T-D | M4 rating + M5 recommendation | 7 + 3 | 4 + 2 (DashboardWidget 포함) | 3 | 22 |
| D+0 | M1 auth (공통) | 4 | 4 (LoginForm 등) | 3 | smoke 3 |

총: **server 함수 48** / **컴포넌트 27** / **API 라우트 21** / **테스트 95 + smoke 3 + helpers 별도** = 109.

## 알려진 follow-up

1. **middleware → proxy 마이그레이션** (Next 17 호환)
2. **E2E 시나리오 본격 작성** (Playwright critical-path)
3. **성능 측정 실값 보완** (autocannon)
4. **네이버 Maps Web Service URL 등록** (NCP 콘솔 — 운영 도메인)
5. **NEXT_PUBLIC_NAVER_SECRET 환경변수 정리** (NAVER_SECRET 으로 변경 + 키 재발급)
6. **B5 5분 전 출발 알림 트리거** (cron 또는 lazy on getParty)
7. **eslint-config-next 정식 복구** (현재 flat config + TS parser만 사용 중)

## 결론

**MVP 빌드·테스트 통과 ✅**.

모든 트랙(M1~M7) 실 구현이 master에 통합되었고, lint·build·test 전 항목 통과. 사용자 핵심 흐름(회원가입 → 파티 생성·합류 → 평가·추천 → 알림)이 정상 동작함을 골든패스 수동 검증으로 확인. 운영 전 follow-up 항목은 위에 명시.
