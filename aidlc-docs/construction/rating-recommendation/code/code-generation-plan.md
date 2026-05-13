# M4 rating + M5 recommendation — Code Generation Plan

> Stage: CONSTRUCTION → T-D Per-Unit Loop → Code Generation
> 입력: `functional-design.md` (같은 폴더 위)
> 한 배치로 작성 (M2 의 sub-batch 3분할 대신 본 트랙은 표면 작아 일괄 처리). 단 step별 체크리스트로 추적.

---

## Phase 1: M4 rating 도메인·서버 함수

- [x] `features/rating/server/_lib/errors.ts` — `ValidationError`, `NotEligibleError`, `RestaurantNotFoundError`, `MenuNotFoundError`
- [x] `features/rating/server/_lib/validation.ts` — `validateStars`, `validateTagLabels`, `validateComment`
- [x] `features/rating/types.ts` — `RatingForRestaurant`, `RatingForMenu`, `RestaurantRatingStats`, `MenuRatingStats`
- [x] `features/rating/server/canRateRestaurant.ts` — M2 `getUserVisitHistory` 활용
- [x] `features/rating/server/canRateMenu.ts` — menus 테이블 SELECT → canRateRestaurant
- [x] `features/rating/server/rateRestaurant.ts` — upsert (SELECT-then-UPDATE/INSERT) in transaction
- [x] `features/rating/server/rateMenu.ts` — upsert
- [x] `features/rating/server/getRestaurantRatingStats.ts` — AVG + tag JSON 파싱
- [x] `features/rating/server/getMenuRatingStats.ts` — AVG
- [x] `features/rating/server/listMyRatings.ts` — 양쪽 SELECT DESC

## Phase 2: M4 rating 컴포넌트

- [x] `features/rating/components/RatingStars.tsx` — value, onChange?, size?, readOnly
- [x] `features/rating/components/RatingForm.tsx` — Client Component
- [x] `features/rating/components/RatingItem.tsx`
- [x] `features/rating/components/RatingList.tsx`

## Phase 3: M4 rating Public API + API routes

- [x] `features/rating/index.ts` 재작성 — 위 server 함수 + 컴포넌트 + 타입 + 에러 export
- [x] `app/api/restaurants/[id]/ratings/route.ts` — GET stats / POST rate
- [x] `app/api/menus/[id]/ratings/route.ts` — GET stats / POST rate

## Phase 4: M5 recommendation 도메인·서버 함수

- [x] `features/recommendation/server/_lib/constants.ts` — `RECENT_VISIT_WINDOW_DAYS = 7`
- [x] `features/recommendation/types.ts` — `RecommendationItem`, `Satisfaction`
- [x] `features/recommendation/server/recommendForUser.ts` — 알고리즘 (high_rated 70 + unvisited 30 + random fallback)
- [x] `features/recommendation/server/getDailySatisfaction.ts` — UNION ALL 평균
- [x] `features/recommendation/server/listPopularThisWeek.ts` — TOP avgStars + count>=2

## Phase 5: M5 recommendation 컴포넌트 + Public API

- [x] `features/recommendation/components/SatisfactionGauge.tsx`
- [x] `features/recommendation/components/DashboardWidget.tsx` — Server Component
- [x] `features/recommendation/index.ts` 재작성 — 새 시그니처. (RestaurantRatingSummary import 제거)
- [x] `app/api/recommendations/route.ts` — GET 통합 응답

## Phase 6: 테스트

- [x] `tests/_helpers/rating-factories.ts` — `makeRestaurant`, `makeMenu`, `makeRatedParty`
- [x] `tests/integration/rating.test.ts` — rate upsert + canRate 권한 + stats
- [x] `tests/integration/recommendation.test.ts` — recent_avoid 필터 + 빈 식당 + satisfaction + popular

## Phase 7: 검증

- [x] `pnpm install` (필요시)
- [x] `pnpm test` 통과
- [x] `pnpm lint` 통과
- [x] `pnpm build` 통과

## Phase 8: aidlc 트래킹

- [x] `aidlc-docs/aidlc-state.md` 업데이트 — T-D 트랙 [x] 마킹
- [x] `aidlc-docs/audit.md` 추가 — 본 작업 entry
- [x] git commit (push 금지)

---

## 정책 — 사용자 task 요구사항 ⇄ functional-design.md 차이

| 항목 | 사용자 요구 | functional-design 결정 |
|---|---|---|
| `rateRestaurant` 시그니처 | `(userId, restaurantId, stars, comment?, tagLabels?)` | `partyId` 추가 (스키마 NOT NULL) |
| `canRate(userId, restaurantId|menuId)` | 단일 함수 | `canRateRestaurant` + `canRateMenu` 분리 (TS 타입 안전) |
| upsert 단위 | `(user, restaurant)` 1건 | application-layer SELECT-then-UPDATE/INSERT |
| `comment` for restaurant | 받음 | 스키마 컬럼 없음 → silent drop (메뉴만 사용) |

→ 본 차이는 functional-design.md §0에 명시. 사용자 spec의 "DB 스키마 수정 X"·"M3 미완성 시 graceful"·"기존 코드 재사용" 제약을 충족하기 위한 의도적 deviation.
