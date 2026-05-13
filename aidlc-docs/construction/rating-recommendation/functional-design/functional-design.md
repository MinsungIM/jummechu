# M4 rating + M5 recommendation — Functional Design

> Stage: CONSTRUCTION → T-D Per-Unit Loop → Functional Design (M4 + M5 묶음)
> 작성: 2026-05-13
> 입력: `requirements/lunch.md §1.4 / §3 / §3.4`, `requirements/UI.md §3.2.C·§3.2.D / T1 / M1·M2 / S6`, `requirements/design.md §3`, `aidlc-docs/inception/application-design/unit-of-work-dependency.md` M4·M5 시그니처, 기존 `drizzle/schema/ratings.ts`
> 비고: NFR Requirements / NFR Design / Infrastructure Design은 inline 요약(§7)으로 대체.

---

## 0. 사용자 요청 시그니처 vs Unit-of-Work 시그니처

본 트랙은 사용자가 명시한 새 시그니처(아래)를 **유일한 진실**로 채택한다. `unit-of-work-dependency.md` M4·M5 섹션과 다른 부분은 본 문서가 우선한다.

### 0.1 채택 시그니처

```ts
// M4 rating
async function rateRestaurant(userId, restaurantId, partyId, stars, comment?, tagLabels?): Promise<RatingForRestaurant>
async function rateMenu(userId, menuId, partyId, stars, comment?): Promise<RatingForMenu>
async function getRestaurantRatingStats(restaurantId): Promise<RestaurantRatingStats>
async function getMenuRatingStats(menuId): Promise<MenuRatingStats>
async function listMyRatings(userId): Promise<{ restaurants: RatingForRestaurant[]; menus: RatingForMenu[] }>
async function canRateRestaurant(userId, restaurantId): Promise<boolean>   // canRate를 분리 (TS 타입 안전)
async function canRateMenu(userId, menuId): Promise<boolean>

// M5 recommendation
async function recommendForUser(userId, limit = 5): Promise<RecommendationItem[]>
async function getDailySatisfaction(userId): Promise<{ avgStars: number; count: number } | null>
async function listPopularThisWeek(): Promise<RecommendationItem[]>
```

### 0.2 사용자 명세에서 변경한 점 (의도적 deviation)

| 변경 | 이유 |
|---|---|
| `rateRestaurant` / `rateMenu` 인자에 `partyId` 추가 | DB 스키마 `restaurant_ratings.party_id NOT NULL` + `menu_ratings.party_id NOT NULL`. M9 평가 모달은 항상 파티 컨텍스트에서 진입하므로 `partyId`는 호출 시점에 알려져 있음. 스키마 수정 금지 + 사용자 시그니처 충족을 동시에 만족시키는 유일한 방법. |
| `canRate(userId, restaurantId | menuId)` → `canRateRestaurant` + `canRateMenu` 두 함수로 분리 | 단일 number 인자로 식당·메뉴를 구분할 수 없음 (TS 타입 안전 + 호출 명료). |

### 0.3 사용자 명세에 명시되어 있지만 보강한 invariant

- **"동일 user+restaurant 1건만 (upsert)"** — 스키마 unique는 `(restaurantId, raterUserId, partyId)`이라 partyId가 다르면 여러 행 허용. 본 트랙은 application-layer에서 `(restaurantId, raterUserId)`로 SELECT → UPDATE/INSERT. partyId는 *가장 최근 평가 시점*의 파티로 덮어쓴다.
- **"동일 user+menu 1건만 (upsert)"** — 메뉴 평가도 같은 방식. `(menuId, raterUserId)`로 SELECT → UPDATE/INSERT.

---

## 1. 도메인 모델

```
RestaurantRating
  ├─ id (auto)
  ├─ restaurantId  → restaurants.id
  ├─ userId        → users.id              (raterUserId 컬럼)
  ├─ partyId       → parties.id            (가장 최근 평가 파티)
  ├─ stars         (1..5 정수, 옵션)         (현재 스키마는 nullable, 본 트랙은 항상 보내도록 권장)
  ├─ tagsJson      (JSON 배열, "#가성비" 등)
  └─ createdAt

MenuRating
  ├─ id (auto)
  ├─ menuId        → menus.id
  ├─ userId        → users.id              (raterUserId 컬럼)
  ├─ partyId       → parties.id
  ├─ stars         (1..5 정수, 필수)
  ├─ comment       (≤200자, 옵션)
  └─ createdAt

RestaurantRatingStats  (집계 view, 저장 X)
  ├─ restaurantId
  ├─ avgStars      (NULL 가능 — 별점이 한 건도 없는 경우)
  ├─ count
  └─ tagFrequency  [{ tagLabel, count }]

RecommendationItem
  ├─ restaurantId
  ├─ restaurantName
  ├─ reason   'recent_avoid' | 'high_rated' | 'random' | 'unvisited'
  └─ score    (정렬용 내부 점수)
```

### 1.1 핵심 불변식 (Invariants)

| # | Invariant |
|---|---|
| R-1 | `stars` 보내면 정수, 1 ≤ stars ≤ 5 |
| R-2 | `comment` 길이 ≤ 200자 |
| R-3 | `tagLabels` 각 라벨 길이 ≤ 30자, 최대 10개 |
| R-4 | 동일 `(userId, restaurantId)` → 1행만 (application-layer upsert) |
| R-5 | 동일 `(userId, menuId)` → 1행만 (application-layer upsert) |
| R-6 | `canRateRestaurant`: M2 `getUserVisitHistory(userId, 0)` 결과에 `restaurantId` 포함 (= 다녀온 파티가 있음) |
| R-7 | `canRateMenu`: 메뉴가 속한 식당에 대해 R-6 만족. 메뉴 단위 추가 검증은 MVP OUT (식당 다녀왔으면 모든 메뉴 평가 가능) |

### 1.2 추천 알고리즘 핵심 결정

- **최근성 + 랜덤** — `requirements/lunch.md §1.4` 확정.
- N일 윈도우: **7일** (내부 상수 `RECENT_VISIT_WINDOW_DAYS = 7`)
- 후보 선정:
  1. 모든 식당 SELECT
  2. M2 `getUserVisitHistory(userId, now - 7d)` 호출 → 최근 방문 식당 set 추출
  3. `high_rated` 풀: `avgStars ≥ 4` AND `count ≥ 1` AND (최근 방문 X)
  4. `unvisited` 풀: 평가 없음 AND (최근 방문 X)
  5. 가중 랜덤 추출: `high_rated`에서 70% 비중, `unvisited`에서 30%
  6. 두 풀 모두 비면 `random` 풀(전체 - 최근방문)에서 랜덤 추출
  7. 모든 풀이 비면 빈 배열 (graceful)
- emit되는 `reason`: `'high_rated' | 'unvisited' | 'random'` — `recent_avoid`는 *exclusion 기준*이지 inclusion 사유 아님. (타입은 받지만 emit 안 함, 미래 확장용)

---

## 2. Public API 함수별 명세

### 2.1 `rateRestaurant(userId, restaurantId, partyId, stars?, comment?, tagLabels?)`

> 시그니처 deviation: `partyId` 추가. 자세한 사유는 §0.2 참조. 사용자 spec의 `comment` 파라미터는 현재 스키마(`restaurant_ratings.comment` 컬럼 없음)에 매칭되지 않음 → **MVP에서 무시(silent drop)**. menu 평가에서만 사용.

- **권한**: 호출자(server function)는 인자 `userId`를 신뢰. Route Handler가 `requireUser` 후 자기 자신의 userId만 전달해야 함.
- **검증**:
  - `stars` 주어졌으면 정수 1..5 (R-1)
  - `tagLabels` 각 라벨 길이 1..30자, 최대 10개 (R-3)
  - `canRateRestaurant(userId, restaurantId)` true여야 함 — 아니면 `NotEligibleError(code='NOT_ELIGIBLE', status=403)`
- **트랜잭션** (`db.transaction`):
  1. SELECT `restaurant_ratings WHERE restaurant_id=? AND rater_user_id=?` LIMIT 1
  2. 행 있음 → UPDATE (`stars`, `tags_json`, `party_id`, `created_at = now`)
  3. 행 없음 → INSERT
  4. (옵션) `tagLabels`가 있으면 `restaurant_tags` 테이블에도 라벨 upsert + `tags` 테이블 카운트 증가 — **MVP OUT**: 평가의 `tagsJson`만 저장. 식당 태그 일반 관리는 M3 트랙(T-B).
- **반환**: `RatingForRestaurant` (upsert 결과 row를 도메인 형태로 변환)
- **에러**: `VALIDATION_ERROR`(400), `NOT_ELIGIBLE`(403), `UNAUTHORIZED`(401, Route Handler에서)

### 2.2 `rateMenu(userId, menuId, partyId, stars, comment?)`

- **검증**:
  - `stars` 정수 1..5 (R-1, 필수)
  - `comment` ≤200자 (R-2)
  - `canRateMenu(userId, menuId)` true여야 함
- **트랜잭션**: SELECT by `(menu_id, rater_user_id)` → UPDATE or INSERT (createdAt 갱신 포함)
- **반환**: `RatingForMenu`
- **에러**: 위와 동일

### 2.3 `getRestaurantRatingStats(restaurantId)`

- **권한**: 인증된 user (Route Handler에서 `requireUser`)
- **동작**:
  - `SELECT AVG(stars), COUNT(*) FROM restaurant_ratings WHERE restaurant_id = ?` (stars NULL 행은 AVG 계산에서 제외)
  - `tagsJson` JSON 파싱하여 라벨별 빈도 집계 — application-layer (SQLite JSON1 사용 가능하지만 단순화)
- **반환**: `{ restaurantId, avgStars, count, tagFrequency: [{ tagLabel, count }] }`
  - 평가 없으면 `{ restaurantId, avgStars: 0, count: 0, tagFrequency: [] }` (null 대신 0 — UI에서 N/A 표시는 count==0으로 판단)

### 2.4 `getMenuRatingStats(menuId)`

- `SELECT AVG(stars), COUNT(*) FROM menu_ratings WHERE menu_id = ?`
- 반환: `{ menuId, avgStars, count }`. 평가 없으면 `avgStars: 0, count: 0`.

### 2.5 `listMyRatings(userId)`

- 식당 평가, 메뉴 평가 두 리스트 반환 (`createdAt DESC`)
- 사용처: 마이페이지(향후), 만족도 위젯 평균 계산 등

### 2.6 `canRateRestaurant(userId, restaurantId)` / `canRateMenu(userId, menuId)`

- M2 `getUserVisitHistory(userId, 0)` 호출 → 결과에 `restaurantId` 포함 여부 확인
- `canRateMenu`: menu의 `restaurantId`를 M3 `getMenu(menuId)`로 확인 후 canRateRestaurant 호출
- **M3 미구현이라 graceful**: `getMenu` 호출 실패 시 false 반환 (try/catch). 통합 테스트는 menus 테이블 직접 insert 후 import를 회피하기 위해 `getDb()` 사용한 직접 SELECT 사용.

### 2.7 `recommendForUser(userId, limit = 5)`

§1.2 알고리즘 그대로. `M3` 미구현(restaurants 테이블 비어있음) 시 빈 배열 반환.

### 2.8 `getDailySatisfaction(userId)`

- "오늘의 만족도" — 사용자 평가 입력 활동 기반.
- **결정**: *최근 7일 내 사용자가 직접 입력한 별점 (식당+메뉴 통합)의 평균*. count=0이면 null.
- 쿼리: `SELECT stars FROM (restaurant_ratings UNION ALL menu_ratings) WHERE rater_user_id=? AND created_at >= now-7d AND stars IS NOT NULL`
- 반환: `{ avgStars, count }` 또는 null

### 2.9 `listPopularThisWeek()`

- 이번 주(최근 7일) 식당 평가 기준 `avgStars` TOP, `count >= 2` 필터 (1건짜리 우대 방지)
- `RecommendationItem[]` 형태로 반환 (reason='high_rated')
- 사용처: T1 §3.2.D 만족도 TOP 리스트 / S6 만족도 리스트

---

## 3. UI 컴포넌트

| 컴포넌트 | 경로 | 역할 |
|---|---|---|
| `RatingStars` | `features/rating/components/RatingStars.tsx` | 1~5 별점 입력(인터랙티브) + 표시(읽기 전용) — `value`, `onChange?`, `size?`, `readOnly` |
| `RatingForm` | `features/rating/components/RatingForm.tsx` | 별점 + 태그 입력 + (메뉴면 comment) — onSubmit 콜백으로 부모에 위임 |
| `RatingItem` | `features/rating/components/RatingItem.tsx` | 단일 평가 카드 표시 (별점·태그·코멘트·작성일) |
| `RatingList` | `features/rating/components/RatingList.tsx` | RatingItem 리스트 + 빈 상태 |
| `DashboardWidget` | `features/recommendation/components/DashboardWidget.tsx` | T1 홈 상단 위젯 — Server Component, `recommendForUser` + `getDailySatisfaction` 직접 호출. 추천 3개 + 만족도 게이지 |
| `SatisfactionGauge` | `features/recommendation/components/SatisfactionGauge.tsx` | 만족도 게이지 — `value` (0~5) + `count` prop. count=0이면 "아직 평가 없음" |

**중요**: `DashboardWidget`는 Server Component. HTTP fetch 하지 말고 서버 함수 직접 import 호출. `app/(main)/page.tsx`(T-C 소유)는 parent가 머지 시 직접 import 추가.

---

## 4. API 엔드포인트

| 메서드 | 경로 | 함수 | 권한 |
|---|---|---|---|
| GET | `/api/restaurants/[id]/ratings` | `getRestaurantRatingStats` | requireUser |
| POST | `/api/restaurants/[id]/ratings` | `rateRestaurant` (body: `{partyId, stars?, comment?, tagLabels?}`) | requireUser |
| GET | `/api/menus/[id]/ratings` | `getMenuRatingStats` | requireUser |
| POST | `/api/menus/[id]/ratings` | `rateMenu` (body: `{partyId, stars, comment?}`) | requireUser |
| GET | `/api/recommendations` | `{ items: recommendForUser(userId, limit), satisfaction: getDailySatisfaction(userId) }` | requireUser |

응답: `{ data }` 또는 `{ error: { code, message } }` (lib/http.ts `ok`/`err`).

---

## 5. 외부 의존 (Public API만)

| 호출 | 사용 함수 | 처리 |
|---|---|---|
| M1 auth | 모든 Route Handler 진입 | `requireUser` (이미 구현) |
| M2 party | `canRateRestaurant`, `canRateMenu`, `recommendForUser` | `getUserVisitHistory` (이미 구현) |
| M3 restaurant | `canRateMenu` (메뉴→식당 매핑), `recommendForUser` (식당 카탈로그) | T-B stub. **graceful 처리**: try/catch + fallback (메뉴 평가는 menus 테이블 직접 SELECT, 추천은 restaurants 직접 SELECT) |

**graceful fallback 전략**: M3 미구현 단계에서도 T-D 단독 테스트·빌드·기동 가능하도록, M5 `recommendForUser`는 restaurants 테이블 비어 있으면 `[]` 반환. canRateMenu는 menus 테이블 비어 있으면 `false` 반환.

---

## 6. 에러 코드 표 (M4 정의)

| Code | HTTP | 의미 |
|---|---|---|
| `VALIDATION_ERROR` | 400 | 별점·태그·코멘트 형식 |
| `NOT_ELIGIBLE` | 403 | 다녀온 적 없는 식당/메뉴 평가 시도 |
| `RESTAURANT_NOT_FOUND` | 404 | 식당 없음 |
| `MENU_NOT_FOUND` | 404 | 메뉴 없음 |
| `UNAUTHORIZED` | 401 | 미인증 (M1) |

---

## 7. NFR (inline 요약)

### 7.1 성능
- 통계 함수는 인덱스 hit 필수: `restaurant_ratings(restaurant_id)`, `menu_ratings(menu_id)` 이미 존재.
- 추천 함수는 식당 수 100개 이하 가정 — 메모리 정렬 가능. 향후 식당 수 늘면 SQL 가중 랜덤으로 마이그레이션.
- `getRestaurantRatingStats` 태그 빈도 집계는 application-layer JSON 파싱 — 식당당 평가 수 100건 이하 가정.

### 7.2 동시성
- upsert는 `db.transaction()` 안에서 SELECT → UPDATE/INSERT. 단일 row 단위 트랜잭션이라 race window 짧음. SQLite WAL + BEGIN IMMEDIATE면 충분 (M2 joinParty 동일 패턴).

### 7.3 보안
- Route Handler는 `requireUser` 후 `userId`를 인자로 전달 (클라이언트가 body로 임의 userId 전송 차단).
- `canRate*` 검증 server function 진입부에 항상 수행.
- Drizzle 파라미터 바인딩만 사용 (SQL 인젝션 없음).

### 7.4 인프라
- 신규 인프라 없음. SQLite 단일 파일 + 기존 Drizzle 인스턴스.

---

## 8. 테스트 인벤토리

### Unit
- `RatingForm` 별점 범위 입력 → 1~5만 허용 (UI 검증)
- `rateRestaurant` 입력 검증 (stars 0, 6, 비정수 → VALIDATION_ERROR)
- `rateMenu` comment 길이 초과 → VALIDATION_ERROR
- 통계 빈 데이터 → `{ avgStars: 0, count: 0, tagFrequency: [] }`

### Integration (`tests/integration/rating.test.ts`)
- rate + upsert: 같은 (user, restaurant) 두 번 호출 → 1행 유지 + stars 갱신
- canRateRestaurant: 미참여 식당 → false / 참여한 closed 파티의 식당 → true
- canRateRestaurant: NOT_ELIGIBLE 케이스에서 rateRestaurant 호출 시 에러
- stats: 별점 3건 + 태그 5개 → avgStars / tagFrequency 정확성
- listMyRatings: 식당 2건 + 메뉴 1건 → 두 리스트로 분리

### Integration (`tests/integration/recommendation.test.ts`)
- recent_avoid 필터: 최근 7일 내 다녀온 식당이 후보에서 제외됨
- 빈 식당: restaurants 비어 있으면 `recommendForUser` → `[]`
- high_rated 우선 + unvisited fallback
- getDailySatisfaction: 7일 내 평가 3건 → avgStars 평균 / count=3
- getDailySatisfaction: 평가 0건 → null
- listPopularThisWeek: count>=2 식당만 노출

### 도구
- `tests/_helpers/factories.ts` 기존 makeUser/inMinutes 사용
- `tests/_helpers/rating-factories.ts` (신규): `makeRestaurant`, `makeMenu`, `makeRatedParty(owner, member, restaurantId, daysAgo)`

---

## 9. UI 화면 ↔ 함수 매핑

| 화면 | 사용 함수 |
|---|---|
| T1 §3.2.C 오늘의 추천 카드 (3개) | `recommendForUser(userId, 3)` (DashboardWidget) |
| T1 §3.2.D 만족도 TOP 리스트 | `listPopularThisWeek` |
| 만족도 게이지 (T1 상단) | `getDailySatisfaction` |
| M1 식당 평가 모달 | `rateRestaurant` + `getRestaurantRatingStats` |
| M2 메뉴 평가 모달 | `rateMenu` + `getMenuRatingStats` |
| S1 식당 상세 평가 요약 | `getRestaurantRatingStats` |
| S6 만족도 리스트 | `listPopularThisWeek` (limit 늘림) |
| 마이페이지 내 평가 | `listMyRatings` |

---

## 10. Out of Scope

- 가중치 추천 (§3.4.2 만족도 가중치) — 후속
- 날씨/계절 추천 (§3.4.3) — 후속
- 메뉴 단위 추천 (메뉴 단위 가중) — MVP는 식당 단위
- 다시 뽑기(M11) — 본 트랙은 stateless `recommendForUser` 제공만. UI 호출은 T-C 영역 (또는 후속)
- 평가 태그 자체 관리 (자동완성·인기 태그) — `tags`/`restaurant_tags` 테이블은 M3(T-B) 영역. 본 트랙은 `restaurant_ratings.tags_json`에만 저장
