# M3 restaurant + M6 map — Code Generation Plan (T-B 트랙)

> Stage: CONSTRUCTION → T-B → Code Generation (Part 1: Plan)
> 작성: 2026-05-13
> 입력: 본 단위의 `functional-design.md`

## 작성 순서·체크리스트

### 1. 도메인 헬퍼 / 타입
- [x] `features/restaurant/server/_lib/errors.ts` — `ValidationError`, `RestaurantNotFoundError`, `MenuNotFoundError`
- [x] `features/restaurant/server/_lib/normalizeTag.ts` — 단일 정규화 함수 + 단위 테스트 입력 노출
- [x] `features/restaurant/types.ts` — Public 타입 (dep doc 동일)

### 2. M3 server 함수 (Read path)
- [x] `features/restaurant/server/getRestaurant.ts`
- [x] `features/restaurant/server/getRestaurantSummary.ts`
- [x] `features/restaurant/server/listRestaurantsByTags.ts`
- [x] `features/restaurant/server/searchRestaurantsByTag.ts`
- [x] `features/restaurant/server/getMenu.ts`
- [x] `features/restaurant/server/getMenusByRestaurant.ts`
- [x] `features/restaurant/server/suggestTags.ts`
- [x] `features/restaurant/server/getPopularTags.ts`
- [x] `features/restaurant/server/getAllRestaurantsForMap.ts`

### 3. M3 server 함수 (Write path)
- [x] `features/restaurant/server/addMenu.ts`
- [x] `features/restaurant/server/tagRestaurant.ts`

### 4. M3 Public API
- [x] `features/restaurant/index.ts` — stub 교체. 함수·타입 re-export + 에러 export

### 5. M3 컴포넌트
- [x] `features/restaurant/components/RestaurantCard.tsx`
- [x] `features/restaurant/components/RestaurantList.tsx`
- [x] `features/restaurant/components/SearchInput.tsx`
- [x] `features/restaurant/components/TagChip.tsx`

### 6. M6 lib + 컴포넌트
- [x] `features/map/lib/buildNaverDirectionsUrl.ts` — 순수 URL 빌더
- [x] `features/map/components/NaverMap.tsx` — 'use client', SDK 싱글톤 로더, 미설정 시 placeholder
- [x] `features/map/components/RestaurantMarker.tsx` — 마커 helper (현 단계는 단순)
- [x] `features/map/index.ts` — stub 교체

### 7. API Route Handler (501 → 실제)
- [x] `app/api/restaurants/route.ts` — GET (listRestaurantsByTags? 또는 getAllRestaurantsForMap)
  - GET 시그니처: `?tag=가성비` → searchRestaurantsByTag / 그 외 → getAllRestaurantsForMap
- [x] `app/api/restaurants/[id]/route.ts` — GET getRestaurant
- [x] `app/api/restaurants/[id]/menus/route.ts` — GET getMenusByRestaurant / POST addMenu
- [x] `app/api/restaurants/[id]/tags/route.ts` — POST tagRestaurant
- [x] `app/api/tags/route.ts` — GET (prefix 있으면 suggestTags / 없으면 getPopularTags)

### 8. 페이지 교체
- [x] `app/(main)/restaurants/[restaurantId]/page.tsx` — S1 식당 상세
- [x] `app/(main)/restaurants/search/page.tsx` — S8 해시태그 검색 (`?tag=…`)
- [x] `app/(main)/map/page.tsx` — T2 지도

### 9. 테스트
- [x] `tests/unit/normalize-tag.test.ts`
- [x] `tests/unit/build-naver-directions-url.test.ts`
- [x] `tests/integration/restaurant-read.test.ts`
- [x] `tests/integration/restaurant-write.test.ts`
- [x] `tests/integration/restaurant-tag-concurrency.test.ts`
- [x] `tests/integration/map.test.ts`

### 10. seed (선택, dev 편의)
- [x] `scripts/seed-restaurants.ts` — dev 환경에서 식당 3~5개 + 메뉴 + 태그 시드

### 11. 검증
- [x] `pnpm install` (필요 시)
- [x] `pnpm db:migrate` (in-memory 테스트라 필요 없음 — production 시 사용자가 실행)
- [x] `pnpm test` 통과
- [x] `pnpm build` 통과
- [x] `pnpm lint` 통과 (Public API 강제 + Next 기본)

### 12. 커밋
- [x] 한 커밋으로 묶어 push 없이 마무리
