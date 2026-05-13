# Unit of Work Definition (jummechu)

> 작성: 2026-05-13
> 입력 plan: `aidlc-docs/inception/plans/unit-of-work-plan.md`
> 입력 design: `requirements/design.md`
> 배포 단위: 단일 Next.js 앱 — 본 문서의 "Unit of Work"는 **Module**과 동의어 (코드 폴더·기능 경계로 분할, 서비스 분리 X)

## Module Catalog

### M1. auth

**책임**
- 회원가입 (이름·이메일·패스워드 3필드, 도메인 화이트리스트 없음, 이메일 인증 없음, 가입 즉시 진입)
- 로그인 / 로그아웃 / 세션 관리 (NextAuth Credentials + JWT, 세션 항상 유지 = 30일 슬라이딩 갱신)
- 패스워드 변경 (T3 프로필)
- 모든 보호된 라우트의 인증 게이트 (`middleware.ts` 통해)

**소유 테이블**: `users`

**Public API (`features/auth/index.ts`) 시그니처 초안**
```ts
// Server
export function getCurrentUser(): Promise<User | null>
export function requireUser(): Promise<User>        // 미인증 시 throw → 401
export async function signupUser(input: SignupInput): Promise<User>
export async function changePassword(userId: number, oldPw: string, newPw: string): Promise<void>

// Types
export type User = { id: number; email: string; name: string; team: string | null; createdAt: number }
export type SignupInput = { name: string; email: string; password: string }
```

**UI 표면 (UI.md)**: F1 로그인·회원가입 / T3 프로필 일부(이메일·패스워드 변경·로그아웃)

**외부 의존**: 없음 (기반 모듈)

---

### M2. party

**책임**
- 파티 CRUD (생성·조회·수정·취소)
- 선착순 합류 / 본인 탈퇴 (트랜잭션 동시성 처리)
- 파티장 한 줄 공지(B3), 파티장 권한 검사
- 파티 목록 (오늘의 파티 + 필터·정렬), 히스토리(S3/S4)
- 재파티 생성(§3.1) — 히스토리에서 동일 조건으로 prefill
- 정원 미달 시 그대로 진행 (자동 무산 없음)

**소유 테이블**: `parties`, `party_members`

**Public API (`features/party/index.ts`) 시그니처 초안**
```ts
export async function createParty(ownerId: number, input: CreatePartyInput): Promise<Party>
export async function getParty(id: number): Promise<PartyDetail | null>
export async function listOpenParties(filter: PartyFilter): Promise<PartyCard[]>
export async function joinParty(partyId: number, userId: number): Promise<void>  // 정원 검사 트랜잭션
export async function leaveParty(partyId: number, userId: number): Promise<void>
export async function setNotice(partyId: number, ownerId: number, text: string): Promise<void>
export async function listMyHistory(userId: number): Promise<HistoryItem[]>
export async function getPartyForReclone(id: number): Promise<CreatePartyInput>

export type Party = { id: number; ... }
export type PartyDetail = Party & { members: User[]; notice: string | null; restaurant: RestaurantSummary | null }
export type PartyCard = { id: number; name: string; departAt: number; capacity: number; currentCount: number; ... }
```

**UI 표면**: T1 파티 리스트 / F2 파티 생성 / S2 파티 상세 / S3·S4 히스토리 / M9 합류 확인

**외부 의존**:
- M1 `getCurrentUser` / `requireUser` (모든 API 호출)
- M3 `getRestaurantSummary(id)` — 파티 상세에 식당 정보 임베드

---

### M3. restaurant

**책임**
- 식당 등록·조회·정보 갱신 (이름·주소·카테고리·대기도·예약필수·좌표)
- 식당 상세 추천 메뉴 (메뉴명·가격) — `menus` 테이블 관리
- 해시태그 (태그 풀 관리, 식당에 태깅, 자동완성, 인기 태그)
- 해시태그 검색 (S8, M7 입력기)
- 식당의 좌표·메타 데이터를 다른 모듈에 read-only 제공

**소유 테이블**: `restaurants`, `menus`, `tags`, `restaurant_tags`

**Public API (`features/restaurant/index.ts`) 시그니처 초안**
```ts
export async function getRestaurant(id: number): Promise<Restaurant | null>
export async function getRestaurantSummary(id: number): Promise<RestaurantSummary | null>
export async function listRestaurantsByTags(tagIds: number[]): Promise<Restaurant[]>
export async function searchRestaurantsByTag(label: string): Promise<Restaurant[]>
export async function addMenu(restaurantId: number, name: string, price: number): Promise<Menu>
export async function getMenusByRestaurant(restaurantId: number): Promise<Menu[]>
export async function suggestTags(prefix: string): Promise<Tag[]>
export async function tagRestaurant(restaurantId: number, label: string, byUserId: number): Promise<void>
export async function getPopularTags(limit: number): Promise<Tag[]>
export async function getAllRestaurantsForMap(): Promise<RestaurantMapMarker[]>

export type Restaurant = { id: number; name: string; address: string | null; category1: string | null; ... }
export type RestaurantSummary = Pick<Restaurant, 'id' | 'name' | 'category1' | 'lat' | 'lng'>
export type Menu = { id: number; restaurantId: number; name: string; price: number | null }
export type Tag = { id: number; label: string; usageCount: number }
export type RestaurantMapMarker = Pick<Restaurant, 'id' | 'name' | 'lat' | 'lng' | 'category1'> & { waitLevel: WaitLevel; avgRating: number | null }
```

**UI 표면**: S1 식당 상세 / S8 검색 결과 / M3 메뉴 추가 / M7 태그 입력기 / 부분적으로 T2 마커 데이터·F2 식당 선택

**외부 의존**:
- M1 `requireUser` (등록·태깅·메뉴 추가)
- M4 `getAvgRating(restaurantId)` — 식당 상세·지도 마커의 평균 별점 표시 (역방향 의존성 — 권장: M4가 데이터 제공, M3가 호출하는 형태로 통일)

---

### M4. rating

**책임**
- 식당 평가 (별점 + 태그형 — `restaurant_ratings`)
- 메뉴 평가 (별점 + 한 줄 코멘트 — `menu_ratings`)
- 권한 검사: **다녀온 파티 참여자만** (party.status='closed' AND party.restaurant_id 일치 AND 본인이 party_member)
- 평균 별점·태그 빈도 집계 (식당 상세·지도 마커·만족도 TOP 리스트에 공급)

**소유 테이블**: `restaurant_ratings`, `menu_ratings`

**Public API (`features/rating/index.ts`) 시그니처 초안**
```ts
export async function rateRestaurant(input: RestaurantRatingInput): Promise<void>
export async function rateMenu(input: MenuRatingInput): Promise<void>
export async function getAvgRating(restaurantId: number): Promise<number | null>
export async function getMenuAvgRating(menuId: number): Promise<number | null>
export async function getRestaurantTagFrequency(restaurantId: number): Promise<TagFreq[]>
export async function getTopRatedRestaurants(limit: number, windowDays?: number): Promise<RestaurantRatingSummary[]>
export async function canRate(userId: number, restaurantId: number): Promise<boolean>  // 권한 미리 보기

export type RestaurantRatingInput = { restaurantId: number; partyId: number; raterId: number; stars?: number; tags?: string[] }
export type MenuRatingInput = { menuId: number; partyId: number; raterId: number; stars: number; comment?: string }
export type TagFreq = { label: string; count: number }
```

**UI 표면**: S1의 평가 영역 / M1 식당 평가 모달 / M2 메뉴 평가 모달

**외부 의존**:
- M1 `requireUser`
- M2 `getMembership(partyId, userId)`, `getPartyForRating(partyId)` (권한 검사용)
- M3 `getRestaurant`, 메뉴 검증

---

### M5. recommendation

**책임**
- 대시보드 "오늘의 추천 메뉴" 카드 (최근성 + 랜덤 — 최근 N일 안 간 식당 우선, N=7 초안)
- 만족도 TOP 리스트 (이번 주 만족도 높은 식당)
- 다시 뽑기(M11) — 같은 정책으로 재추천 (쿨다운 정책은 별도)

**소유 테이블**: 없음 (read-only consumer)

**Public API (`features/recommendation/index.ts`) 시그니처 초안**
```ts
export async function getTodayRecommendations(userId: number, count: number): Promise<RecommendationCard[]>
export async function reshuffleRecommendations(userId: number, excludeIds: number[]): Promise<RecommendationCard[]>
export async function getSatisfactionTop(limit: number): Promise<RestaurantRatingSummary[]>

export type RecommendationCard = {
  restaurantId: number
  restaurantName: string
  primaryMenu?: { id: number; name: string; price: number | null }
  reason: 'recent_skip' | 'high_rating' | 'random'
  lastVisitedAt: number | null
}
```

**UI 표면**: T1 상단 3.2.C 오늘의 추천 카드, 3.2.D 만족도 TOP / S6 만족도 리스트 / M11 다시 뽑기

**외부 의존**:
- M1 `requireUser` — 개인화(최근 방문 이력)
- M2 `getUserVisitHistory(userId, sinceTs)` — 최근 다녀온 식당 ID 목록
- M3 `getAllRestaurants`, `getRestaurantSummary`
- M4 `getTopRatedRestaurants`, `getAvgRating`

---

### M6. map

**책임**
- 네이버 지도 통합 (지도 JS SDK 래퍼, 마커 렌더링)
- 식당 좌표 마커 + 시각화 (카테고리 색·대기도 테두리·만족도 뱃지·예약필수 🔒)
- 길찾기 외부 딥링크 생성 (네이버 지도 앱)
- 마커 클러스터링 (임계치는 구현 시 결정, design.md §6 미정)

**소유 테이블**: 없음 (read-only consumer)

**Public API (`features/map/index.ts`) 시그니처 초안**
```ts
// Server (small)
export function buildNaverDirectionsUrl(from: LatLng | 'current', toLat: number, toLng: number, restaurantName: string): string

// Client components (export type)
export { default as NaverMap } from './components/NaverMap'           // dynamic import 권장
export { default as RestaurantMarker } from './components/RestaurantMarker'

export type LatLng = { lat: number; lng: number }
```

**UI 표면**: T2 지도 탭 / S1 식당 상세의 길찾기 버튼·미니 지도

**외부 의존**:
- M3 `getAllRestaurantsForMap` (좌표 + 카테고리 + 평균 만족도 + 대기도 포함된 marker 데이터)

**환경 변수**: `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` (도메인 제한 필수)

---

### M7. notification

**책임**
- 출발 임박 알림 (§B4) — MVP는 **인앱 배너만**
- 파티 출발 시각 N분 전 트리거 (N=5 초안)
- 사용자가 토글 가능 (T3 알림 ON/OFF)
- 구현 방식: 클라이언트 타이머 + (선택) 서버 SSE/polling — 구체화는 구현 단계

**소유 테이블**: 없음 (선택적으로 `notifications` 테이블 신설 가능 — 구현 시 결정)

**Public API (`features/notification/index.ts`) 시그니처 초안**
```ts
// Server
export async function getUpcomingDeparturesForUser(userId: number, withinMinutes: number): Promise<UpcomingDeparture[]>

// Client
export { default as InAppNotificationBanner } from './components/InAppNotificationBanner'
export { useDepartureReminders } from './hooks/useDepartureReminders'   // 클라이언트 폴링 훅

export type UpcomingDeparture = {
  partyId: number
  partyName: string
  departAt: number
  minutesUntil: number
}
```

**UI 표면**: N1 출발 임박 배너 / T3 알림 토글

**외부 의존**:
- M1 `getCurrentUser`
- M2 `listMyOpenParties(userId)` — 사용자가 가입한 미래 파티 목록

---

## Code Organization Strategy (Greenfield)

### 디렉토리 구조

```
jummechu/
├── app/                              # Next.js App Router (얇은 page.tsx만)
│   ├── (auth)/
│   │   ├── login/page.tsx           # features/auth/components/LoginForm
│   │   └── signup/page.tsx
│   ├── (main)/
│   │   ├── page.tsx                  # features/party + features/recommendation
│   │   ├── map/page.tsx             # features/map
│   │   ├── settings/page.tsx        # features/auth + features/notification + ...
│   │   ├── parties/
│   │   │   ├── new/page.tsx         # features/party/components/PartyCreateForm
│   │   │   └── [partyId]/page.tsx
│   │   ├── restaurants/
│   │   │   ├── [restaurantId]/page.tsx
│   │   │   └── search/page.tsx
│   │   └── history/
│   │       ├── page.tsx
│   │       └── [partyId]/page.tsx
│   ├── api/                          # Route Handlers (features에서 함수 import)
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── auth/signup/route.ts
│   │   ├── parties/...
│   │   ├── parties/[id]/members/route.ts
│   │   └── ...
│   └── layout.tsx
│
├── features/                         # 모듈별 도메인 코드 (Public API: index.ts만 외부 공개)
│   ├── auth/
│   │   ├── index.ts                  # ⬅ 외부에 노출하는 함수·타입만
│   │   ├── server/                   # 서버 전용 (DB 호출, NextAuth 설정)
│   │   ├── components/               # LoginForm, SignupForm, ChangePasswordForm
│   │   ├── schema.ts                 # Drizzle table 정의 (users)
│   │   └── lib/                      # 내부 헬퍼 (외부 import 금지)
│   ├── party/
│   │   ├── index.ts
│   │   ├── server/
│   │   ├── components/
│   │   ├── schema.ts                 # parties, party_members
│   │   └── lib/
│   ├── restaurant/                   # 동일 구조 (restaurants, menus, tags, restaurant_tags)
│   ├── rating/                       # restaurant_ratings, menu_ratings
│   ├── recommendation/               # 테이블 없음
│   ├── map/                          # NaverMap 컴포넌트·딥링크 헬퍼
│   └── notification/                 # InAppBanner·polling hook
│
├── components/ui/                    # 공통 UI 프리미티브 (Button, Modal, Input, Card)
├── lib/
│   ├── db.ts                         # Drizzle 인스턴스
│   └── auth.ts                       # NextAuth 옵션 (features/auth/server 의 export 재노출)
├── drizzle/                          # 마이그레이션 SQL
├── tests/
│   ├── unit/                         # 모듈별 단위 테스트
│   ├── integration/                  # API Route Handler 통합 테스트 (Vitest + in-memory SQLite)
│   └── e2e/                          # Playwright E2E
├── middleware.ts                     # 인증 미들웨어
├── drizzle.config.ts
├── next.config.js
├── package.json
└── eslint.config.js                  # no-restricted-imports 규칙
```

### Public API 컨벤션 강제 (ESLint)

```js
// eslint.config.js 발췌
{
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['@/features/*/!(index)', '@/features/*/!(index)/**'],
          message: 'features/{module}/index.ts 만 import 허용. 내부 경로 직접 import 금지.'
        }
      ]
    }]
  }
}
```

### 횡단 관심사(Cross-cutting)

- **DB**: `lib/db.ts`에서 Drizzle 인스턴스 단일 생성. 각 모듈의 `server/`가 import.
- **인증**: `middleware.ts`가 모든 `/api/*` + `(main)` 라우트 보호. 각 모듈의 server 함수는 `auth.requireUser()`만 호출.
- **에러**: 모든 API 응답 `{ data } | { error: { code, message } }` 표준 (design.md §6 미정 항목 후속).
- **시간**: unix ms로 저장, KST 표시는 UI 컴포넌트에서 변환 (공통 헬퍼 `lib/time.ts`).

---

## 4 트랙 병렬 개발 구성

| Track | 담당 모듈 | 1차 산출물 (D+1) | 2차 산출물 (D+3) | 3차 산출물 (D+5) |
|---|---|---|---|---|
| **T-A** | M1 auth, M7 notification | features/auth/index.ts 인터페이스 + users 스키마 | NextAuth 설정 + 회원가입 API + 로그인 폼 | 출발 임박 폴링 훅 + 인앱 배너 + T3 토글 |
| **T-B** | M3 restaurant, M6 map | features/restaurant/index.ts 인터페이스 + restaurants/menus/tags/restaurant_tags 스키마 + features/map/index.ts | 식당 CRUD + 태그 자동완성 + S1 상세 페이지 | 네이버 지도 통합 + T2 마커·클러스터 + 길찾기 딥링크 |
| **T-C** | M2 party | features/party/index.ts 인터페이스 + parties/party_members 스키마 | 파티 CRUD + 선착순 합류 트랜잭션 + F2 생성 폼 | T1 파티 리스트 + S2 상세 + 히스토리 + 재파티 생성 |
| **T-D** | M4 rating, M5 recommendation | features/rating/index.ts + features/recommendation/index.ts 인터페이스 + restaurant_ratings/menu_ratings 스키마 | 평가 권한 검사 + 별점·태그 집계 + M1/M2 모달 | 추천 정렬 로직 + 다시 뽑기 + 만족도 TOP 리스트 |

### 첫날(D+0) 공통 작업

- 4명이 함께 머지하는 단일 PR로 처리:
  1. Next.js 프로젝트 초기화 + ESLint + 디렉토리 골격
  2. Drizzle 마이그레이션 — `design.md §3` 9 테이블 한 번에
  3. 각 모듈 `features/*/index.ts` 시그니처 stub (실제 구현 throw)
  4. `middleware.ts` 인증 게이트 stub
  5. 공통 ui 프리미티브 (Button, Modal, Input, Card)
  6. 테스트 환경 (Vitest + Playwright + in-memory SQLite 헬퍼)
- 이후로 각 트랙은 자기 모듈만 PR. 다른 트랙 함수는 stub을 import.

### 트랙 간 통신 패턴

- **타입·인터페이스**: `features/{m}/index.ts`의 export type만 사용. 변경은 모든 트랙 합의.
- **함수 호출**: 비동기 함수만. 트랜잭션 경계는 호출하는 모듈이 결정.
- **공유 트랜잭션**: 같은 Drizzle 인스턴스이므로 가능. M2 `joinParty`에서 M3 검증·M4 권한 미리 보기까지 한 트랜잭션으로 묶을 수 있음.
- **mocking**: T-D가 T-B/T-C 완성 전 진행 시, 자체 `__mocks__/`에 in-memory mock 인터페이스 제공. 통합 테스트는 실제 모듈로 교체.

---

## 검증 — MVP IN 요구사항 누락 없음

`lunch.md §E2 MVP IN` 모든 항목이 위 7 모듈에 매핑됨. 자세한 매핑은 `unit-of-work-story-map.md` 참조.
