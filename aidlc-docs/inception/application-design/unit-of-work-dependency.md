# Unit of Work Dependency Matrix (jummechu)

> 작성: 2026-05-13
> 출처: `unit-of-work.md` Public API 시그니처
> 목적: 4 트랙 병렬 작업 시 인터페이스 합의의 단일 출처. 사이클 검증 + 트랙 의존도 시각화.

## Module Dependency Matrix

> **읽는 법**: 행(M_x)이 열(M_y)을 사용함. 즉 *행이 열에 의존*.
> 셀 값:
> - `—` 의존 없음
> - `T` 타입만 import (런타임 의존 없음, mock 가능)
> - `F` 함수 호출 (런타임 의존, mock 필요)
> - `M` middleware/cross-cutting (인증 게이트)

| 사용↓ \ 제공→ | M1 auth | M2 party | M3 restaurant | M4 rating | M5 recommendation | M6 map | M7 notification |
|---|---|---|---|---|---|---|---|
| **M1 auth** | — | — | — | — | — | — | — |
| **M2 party** | F+M | — | F+T | — | — | — | — |
| **M3 restaurant** | F+M | — | — | T (역방향 결합 회피) | — | — | — |
| **M4 rating** | F+M | F+T | F+T | — | — | — | — |
| **M5 recommendation** | F+M | F+T | F+T | F+T | — | — | — |
| **M6 map** | — | — | F+T | — | — | — | — |
| **M7 notification** | F+M | F+T | — | — | — | — | — |

**M1 auth는 어디에도 의존하지 않음** → 기반 모듈, 가장 먼저 안정화.

## 의존 관계 그래프 (ASCII)

```
                      ┌────────────┐
                      │ M1 auth    │  (기반, 의존 없음)
                      └─────┬──────┘
                            │ F+M (requireUser, getCurrentUser)
       ┌────────────────────┼────────────────────┐
       │                    │                    │
       ▼                    ▼                    ▼
┌────────────┐     ┌────────────────┐     ┌──────────────┐
│ M3         │     │ M2 party       │     │ M7 notif.    │
│ restaurant │     │                │     │              │
└─────┬──────┘     └──┬─────┬───────┘     └──────┬───────┘
      │ F+T          │     │ F+T               (← F+T from M2)
      │              │ F+T │                      │
      │              │     │                      │
      │              ▼     ▼                      │
      │       ┌────────────────┐                  │
      │  ┌───▶│ M4 rating      │                  │
      │  │    └────────┬───────┘                  │
      │  │             │ F+T                      │
      │  │             │                          │
      │  │             ▼                          │
      │  │    ┌────────────────────┐              │
      │  └────┤ M5 recommendation  │◀─────────────┘
      └──────▶└────────────────────┘  (M2,M3,M4 → M5)

         ┌────────────┐
         │ M6 map     │ ── F+T ──▶ M3 restaurant
         └────────────┘
```

## 의존 사이클 검사

- M3 ↔ M4 잠재 사이클: M3가 `getAvgRating(restaurantId)`를 식당 상세 표시용으로 필요로 했으나, **방향성 결정으로 회피**:
  - M4가 *제공자* (집계 함수 export)
  - M3는 본인 데이터만 책임
  - 식당 상세 페이지에서 M3·M4를 호출자(`app/(main)/restaurants/[id]/page.tsx`)가 각각 호출해 데이터 합성
  - → `M3 → M4` 일방향, 사이클 없음
- **그 외 사이클 없음**. DAG 성립.

## Public API 시그니처 — 4 트랙 첫날 합의용 (단일 출처)

> 본 섹션은 `features/*/index.ts` stub 작성의 단일 출처.
> D+0 PR 머지 시 본 시그니처 그대로 type-only export. 구현은 후속 트랙 PR.

### M1 auth (`features/auth/index.ts`)
```ts
import type { ... } from './types'

export async function getCurrentUser(): Promise<User | null>
export async function requireUser(): Promise<User>                                  // throws if unauth
export async function signupUser(input: SignupInput): Promise<User>
export async function changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void>

export type User = { id: number; email: string; name: string; team: string | null; createdAt: number }
export type SignupInput = { name: string; email: string; password: string }
```

### M2 party (`features/party/index.ts`)
```ts
export async function createParty(ownerId: number, input: CreatePartyInput): Promise<Party>
export async function getParty(id: number): Promise<PartyDetail | null>
export async function listOpenParties(filter: PartyFilter): Promise<PartyCard[]>
export async function joinParty(partyId: number, userId: number): Promise<void>
export async function leaveParty(partyId: number, userId: number): Promise<void>
export async function setNotice(partyId: number, ownerId: number, text: string): Promise<void>
export async function listMyHistory(userId: number): Promise<HistoryItem[]>
export async function listMyOpenParties(userId: number): Promise<PartyCard[]>           // ⬅ M7 사용
export async function getPartyForReclone(id: number): Promise<CreatePartyInput>
export async function getMembership(partyId: number, userId: number): Promise<Membership | null>  // ⬅ M4 권한 검사용
export async function getUserVisitHistory(userId: number, sinceTs: number): Promise<RestaurantVisit[]>  // ⬅ M5 추천용

export type CreatePartyInput = {
  name: string
  restaurantId: number | null
  restaurantNameFreetext?: string
  departAt: number
  joinUntil: number
  place: string | null
  priceBand: string | null
  capacity: number
  rules?: string
  isSilent?: boolean
  extraSchedule?: string
}
export type Party = { id: number; ownerId: number; status: 'open' | 'closed' | 'cancelled' } & CreatePartyInput & { createdAt: number }
export type PartyDetail = Party & { members: Array<{ id: number; name: string }>; notice: string | null; currentCount: number; restaurant: { id: number; name: string } | null }
export type PartyCard = Pick<Party, 'id' | 'name' | 'departAt' | 'capacity' | 'priceBand' | 'isSilent'> & { currentCount: number; restaurantName: string | null; tags: string[] }
export type PartyFilter = { tagIds?: number[]; sortBy?: 'depart' | 'remaining' | 'price' | 'category'; categoryIn?: string[] }
export type HistoryItem = Pick<Party, 'id' | 'name' | 'departAt' | 'restaurantId'> & { restaurantName: string | null; memberCount: number }
export type Membership = { partyId: number; userId: number; joinedAt: number }
export type RestaurantVisit = { restaurantId: number; lastVisitedAt: number; visitCount: number }
```

### M3 restaurant (`features/restaurant/index.ts`)
```ts
export async function getRestaurant(id: number): Promise<Restaurant | null>
export async function getRestaurantSummary(id: number): Promise<RestaurantSummary | null>     // ⬅ M2 사용
export async function listRestaurantsByTags(tagIds: number[]): Promise<Restaurant[]>
export async function searchRestaurantsByTag(label: string): Promise<Restaurant[]>
export async function addMenu(restaurantId: number, name: string, price: number | null): Promise<Menu>
export async function getMenu(menuId: number): Promise<Menu | null>                            // ⬅ M4 사용
export async function getMenusByRestaurant(restaurantId: number): Promise<Menu[]>
export async function suggestTags(prefix: string): Promise<Tag[]>
export async function tagRestaurant(restaurantId: number, label: string, byUserId: number): Promise<void>
export async function getPopularTags(limit: number): Promise<Tag[]>
export async function getAllRestaurantsForMap(): Promise<RestaurantMapMarker[]>                // ⬅ M6 사용

export type Restaurant = {
  id: number
  name: string
  address: string | null
  category1: 'kor' | 'chn' | 'jpn' | 'wes' | null
  category2: string | null
  waitLevel: 'light' | 'medium' | 'heavy' | null
  reservationRequired: boolean
  naverPlaceId: string | null
  lat: number | null
  lng: number | null
  tags: Tag[]
  createdAt: number
}
export type RestaurantSummary = Pick<Restaurant, 'id' | 'name' | 'category1' | 'lat' | 'lng'>
export type Menu = { id: number; restaurantId: number; name: string; price: number | null }
export type Tag = { id: number; label: string; usageCount: number }
export type RestaurantMapMarker = Pick<Restaurant, 'id' | 'name' | 'lat' | 'lng' | 'category1' | 'waitLevel' | 'reservationRequired'> & { avgRating: number | null }
```

### M4 rating (`features/rating/index.ts`)
```ts
export async function rateRestaurant(input: RestaurantRatingInput): Promise<void>
export async function rateMenu(input: MenuRatingInput): Promise<void>
export async function getAvgRating(restaurantId: number): Promise<number | null>               // ⬅ M3 (map marker), M5
export async function getMenuAvgRating(menuId: number): Promise<number | null>
export async function getRestaurantTagFrequency(restaurantId: number): Promise<TagFreq[]>
export async function getTopRatedRestaurants(limit: number, windowDays?: number): Promise<RestaurantRatingSummary[]>  // ⬅ M5
export async function canRate(userId: number, restaurantId: number): Promise<boolean>

export type RestaurantRatingInput = { restaurantId: number; partyId: number; raterId: number; stars?: number; tags?: string[] }
export type MenuRatingInput = { menuId: number; partyId: number; raterId: number; stars: number; comment?: string }
export type TagFreq = { label: string; count: number }
export type RestaurantRatingSummary = { restaurantId: number; restaurantName: string; avgStars: number; ratingCount: number }
```

### M5 recommendation (`features/recommendation/index.ts`)
```ts
export async function getTodayRecommendations(userId: number, count: number): Promise<RecommendationCard[]>
export async function reshuffleRecommendations(userId: number, excludeIds: number[]): Promise<RecommendationCard[]>
export async function getSatisfactionTop(limit: number): Promise<RestaurantRatingSummary[]>

export type RecommendationCard = {
  restaurantId: number
  restaurantName: string
  primaryMenu: { id: number; name: string; price: number | null } | null
  reason: 'recent_skip' | 'high_rating' | 'random'
  lastVisitedAt: number | null
}
```

### M6 map (`features/map/index.ts`)
```ts
// Server (small)
export function buildNaverDirectionsUrl(from: LatLng | 'current', toLat: number, toLng: number, restaurantName: string): string

// Client components / hooks
export { default as NaverMap } from './components/NaverMap'                                    // 'use client' + dynamic import
export { default as RestaurantMarker } from './components/RestaurantMarker'

export type LatLng = { lat: number; lng: number }
```

### M7 notification (`features/notification/index.ts`)
```ts
// Server
export async function getUpcomingDeparturesForUser(userId: number, withinMinutes: number): Promise<UpcomingDeparture[]>

// Client
export { default as InAppNotificationBanner } from './components/InAppNotificationBanner'
export { useDepartureReminders } from './hooks/useDepartureReminders'

export type UpcomingDeparture = {
  partyId: number
  partyName: string
  departAt: number
  minutesUntil: number
}
```

---

## 트랙 의존성 그래프

```
                 D+0 공통 PR (4명 함께)
                 ─ 골격 + 9 테이블 + index.ts stub
                 ─ middleware.ts + ui 프리미티브
                          │
        ┌─────────┬───────┴────────┬──────────┐
        │         │                │          │
        ▼         ▼                ▼          ▼
       T-A       T-B              T-C        T-D
   (auth+notif) (rest+map)       (party)   (rating+rec)
        │         │                │          │
        │         │ ◀─────T-C uses M3.getRestaurantSummary─┐
        │         │                │                       │
        │ ◀──T-C uses M1.requireUser──┘                    │
        │                          │                       │
        │ ◀──T-D uses M1.requireUser──────────────────────┘
        │         │                │                       │
        │         │ ◀──T-D uses M3.* (restaurants/menus)──┤
        │         │                │                       │
        │         │ ◀──T-B(map) uses M3.getAllRestaurantsForMap────  (T-B 내부 의존)
        │         │                │                       │
        │         │                │ ◀── T-D uses M2.getMembership/getUserVisitHistory
        │         │                │                       │
        │ ◀──T-A(notif) uses M2.listMyOpenParties──────────┤
        │                                                  │
```

### 트랙 간 블로킹 요약

| 트랙 | 블로킹 받음 | 블로킹 줌 |
|---|---|---|
| T-A | 없음 | M2(M1 인증), M4(M1 인증), M5(M1 인증) |
| T-B | 없음 | M2(M3.getRestaurantSummary), M4(M3.getMenu), M5(M3.*) |
| T-C | M3 타입 합의 (D+0 PR로 해소) | M4(M2.getMembership), M5(M2.getUserVisitHistory), M7(M2.listMyOpenParties) |
| T-D | M2/M3/M4 타입 합의 (D+0 PR로 해소) | 없음 (최상위) |

**핵심**: D+0 공통 PR로 *모든 인터페이스 stub*을 머지하면 4 트랙 모두 즉시 병렬 진행 가능. 실제 함수 구현이 끝나기 전엔 호출 쪽이 in-memory mock으로 진행.

---

## 외부 의존 (3rd-party·infra)

| 의존 | 사용 모듈 | 비고 |
|---|---|---|
| NextAuth (Auth.js) | M1 | Credentials Provider, JWT |
| Drizzle ORM + better-sqlite3 | M1·M2·M3·M4 (소유 테이블 가진 모듈) | 단일 SQLite 파일 |
| 네이버 지도 JS SDK | M6 | `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` 환경 변수, 도메인 제한 필수 |
| bcrypt | M1 | 패스워드 해싱 |
| Vitest | 전 모듈 | 단위·통합 테스트 |
| Playwright | E2E | 전 모듈에 critical path 커버 |

---

## 변경 거버넌스

- 본 매트릭스·시그니처 변경 시 4 트랙 합의 필요
- 시그니처 변경 PR은 `features/*/index.ts` 변경만 별도 PR로 분리 → 4명 리뷰 후 머지
- Breaking change는 minor version bump 이슈 라벨로 트래킹
