# M3 restaurant + M6 map — Functional Design (T-B 트랙)

> Stage: CONSTRUCTION → T-B Per-Unit Loop → Functional Design
> 작성: 2026-05-13
> 입력: `requirements/lunch.md §3.1/3.2/3.3/3.5/4.1`, `requirements/UI.md` T2/S1/S8/M3/M7, `aidlc-docs/inception/application-design/unit-of-work-dependency.md` M3·M6 시그니처
> 비고: M2 party 패턴(`functional-design.md`)을 따라 NFR Requirements / NFR Design / Infrastructure Design은 본 문서 §5에 inline. 변경 없음 영역은 SKIP.

---

## 0. 시그니처 단일 출처 (충돌 해소)

작업 지시 prompt 와 `unit-of-work-dependency.md` 가 일부 시그니처에서 충돌함. **`unit-of-work-dependency.md` 의 M3·M6 시그니처를 정본**으로 채택 (변경 거버넌스 §변경 — 4 트랙 합의 필요). 이미 M2 party 의 `getParty.ts` 가 그 형태에 의존.

- `Restaurant` / `RestaurantSummary{id,name,category1,lat,lng}` / `Menu` / `Tag` / `RestaurantMapMarker` — dep doc 그대로.
- 함수 11개 — dep doc 그대로 export.
- task prompt 의 추가 함수 (`listRestaurants(filter)`, `createRestaurant`, `getRestaurantDetail` 등) 는 **호출자 없음** → 본 단계에서는 export 하지 않음. 추후 4 트랙 합의 후 dep doc 개정 시 도입.
- M6 의 `reverseGeocode` / `getStaticMapUrl` / `geocode` 도 동일 — 현재 호출자 없으므로 미구현.
- `buildNaverDirectionsUrl` (dep doc 정본) 은 구현 — S1 식당 상세 "길찾기" 버튼 (UI.md §3.5) 의 외부 딥링크 생성.

---

## 1. 도메인 모델

```
Restaurant
  ├─ identity: id (auto)
  ├─ what:     name, address(nullable)
  ├─ category: category1 ∈ {kor,chn,jpn,wes} | null
  │            category2 (자유 텍스트 — 김치찌개/파스타 등)
  ├─ ops:      waitLevel ∈ {light,medium,heavy} | null
  │            reservationRequired (boolean)
  ├─ geo:      naverPlaceId(nullable), lat/lng(nullable)
  └─ createdAt

Menu (m:1 → Restaurant)
  ├─ id, restaurantId, name, price(nullable), createdAt
  └─ ON DELETE CASCADE

Tag (자유 라벨 풀)
  ├─ id, label (UNIQUE, 정규화 후 저장), usageCount
  └─ usageCount = COUNT(restaurant_tags WHERE tag_id=self.id)  -- invariant

RestaurantTag (m:n)
  ├─ (restaurantId, tagId) PK
  ├─ taggedBy → users.id (nullable)
  └─ createdAt
```

### 1.1 핵심 불변식

| # | Invariant |
|---|---|
| I-1 | `restaurants.name` 비어있지 않음 (trim 후 길이 ≥ 1) |
| I-2 | `tags.label` 정규화된 라벨만 저장 (lower + 공백 정리 + ≤50자), UNIQUE |
| I-3 | `(restaurant_id, tag_id)` UNIQUE — 같은 식당에 같은 태그 중복 X |
| I-4 | `tags.usage_count = COUNT(restaurant_tags WHERE tag_id=self.id)` (tagRestaurant/untag 후 재계산) |
| I-5 | `menus.restaurant_id` 는 존재하는 식당 (FK + ON DELETE CASCADE) |

---

## 2. 태그 정규화 규칙 (단일 출처)

`features/restaurant/server/_lib/normalizeTag.ts`:

```ts
export function normalizeTagLabel(raw: string): string {
  // 1) trim
  // 2) 선행 # 제거 (#가성비 → 가성비)
  // 3) 내부 공백 1개로 정리 (\s+ → ' ')
  // 4) lowercase
  // 5) 길이 ≤ 50자
  // 빈 문자열이면 throw ValidationError('tag', '비어있음')
}
```

**적용 지점**: `tagRestaurant`, `suggestTags`, `searchRestaurantsByTag` 입력 boundary. 한국어 lowercase 는 영문 알파벳만 영향 → 한글 태그는 trim/공백만 영향. 같은 정규화 결과끼리는 `tags.label` UNIQUE 로 자동 통합.

---

## 3. State Machine

식당 / 메뉴 / 태그 모두 **상태 머신 없음** — 등록·태깅·삭제(미정)만 존재.

- 식당 삭제: MVP OUT. 메뉴 삭제: MVP OUT. 태그 삭제: MVP OUT. (lunch.md §3.6 미정 영역).
- 향후 추가될 가능성 있음 → server 함수 시그니처에 status 컬럼 추가하면 됨.

---

## 4. Public API 함수별 명세

> 시그니처는 `unit-of-work-dependency.md` M3·M6 섹션 그대로. 본 섹션은 동작·에러·트랜잭션 경계.

### M3 restaurant

#### 4.1 `getRestaurant(id) → Restaurant | null`
- SELECT restaurants + LEFT JOIN restaurant_tags + tags
- 반환: `Restaurant` (tags 배열 포함)
- 없음 → null

#### 4.2 `getRestaurantSummary(id) → RestaurantSummary | null` (M2 사용)
- SELECT restaurants `(id, name, category1, lat, lng)` only
- M2 `createParty`/`getParty` 가 호출. dep doc 의 `Pick<…,'id'|'name'|'category1'|'lat'|'lng'>` 형 유지.

#### 4.3 `listRestaurantsByTags(tagIds) → Restaurant[]`
- 빈 배열 입력 → 모든 식당 반환 (안전 디폴트)
- INNER JOIN restaurant_tags ON tag_id IN (?...) + GROUP BY restaurant_id HAVING COUNT(DISTINCT tag_id) = ?  ← AND 시맨틱
- 각 식당의 tags 도 함께 반환 (위 4.1 동일 JOIN)

#### 4.4 `searchRestaurantsByTag(label) → Restaurant[]`
- `normalizeTagLabel(label)` 후 tags.label = ? 찾고, 해당 tag_id 로 `listRestaurantsByTags([id])` 위임
- 태그 미존재 → 빈 배열

#### 4.5 `addMenu(restaurantId, name, price) → Menu`
- 검증: `name` 1~100자 trim, `price` null 또는 0~1_000_000
- 식당 존재 검사 (없으면 `RESTAURANT_NOT_FOUND`)
- INSERT menus
- 반환: 생성된 Menu

#### 4.6 `getMenu(menuId) → Menu | null` (M4 사용)
- SELECT menus WHERE id=?

#### 4.7 `getMenusByRestaurant(restaurantId) → Menu[]`
- SELECT menus WHERE restaurant_id=? ORDER BY created_at DESC

#### 4.8 `suggestTags(prefix) → Tag[]` (M7 자동완성)
- `prefix` 정규화 후 `LIKE prefix%` 로 검색. usageCount DESC, limit 20.
- 빈 prefix → 인기 태그 (4.10 위임)

#### 4.9 `tagRestaurant(restaurantId, label, byUserId) → void`
- 검증: 식당 존재
- `normalizeTagLabel(label)` 적용
- 트랜잭션 (BEGIN IMMEDIATE):
  ```
  INSERT INTO tags (label, usage_count) VALUES (?, 0) ON CONFLICT(label) DO NOTHING
  SELECT id FROM tags WHERE label = ?
  INSERT INTO restaurant_tags (...) → UNIQUE 충돌 시 ALREADY_TAGGED 에러 (404 와 구분, 200 또는 409)
                                       MVP 정책: 조용히 무시 (멱등). 호출자 UX 측 결정.
  UPDATE tags SET usage_count = (SELECT COUNT(*) FROM restaurant_tags WHERE tag_id=?) WHERE id=?
  ```
- **결정**: 이미 태깅된 케이스는 throw 하지 않고 멱등 처리 (UI.md M7 자동완성·반복 클릭 시나리오 자연스러움)

#### 4.10 `getPopularTags(limit) → Tag[]`
- SELECT tags ORDER BY usage_count DESC, label ASC LIMIT ?

#### 4.11 `getAllRestaurantsForMap() → RestaurantMapMarker[]` (M6 사용)
- SELECT 식당 전체 + `(id,name,lat,lng,category1,waitLevel,reservationRequired)`
- `avgRating`: **항상 null 반환 (현 단계)**. M4 미완성 → 의존 회피. T-D 완성 시 LEFT JOIN으로 채워 넣음. dep doc M3↔M4 사이클 회피 결정에 맞게 호출자(`map/page.tsx`) 합성으로 옮기는 게 본래 방향이나, 본 함수 시그니처가 `avgRating` 포함이므로 일단 null 채워 호환 유지.

### M6 map

#### 4.12 `buildNaverDirectionsUrl(from, toLat, toLng, restaurantName) → string`
- 네이버 지도 외부 길찾기 딥링크 URL 생성.
- `from='current'` → 출발지 미지정 (네이버 측이 현재 위치 사용).
- `from = {lat,lng}` → start parameter 채움.
- 형식 (네이버 지도 표준 외부 링크):
  ```
  https://map.naver.com/v5/directions/-/{toLng},{toLat},{name},,PLACE_POI/-/transit?c=15.00,0,0,0,dh
  // current 위치는 brower geolocation 의존 → 단순 형태로 위경도+이름만 인코딩
  // 안전한 fallback: https://map.naver.com/p/search/{encodeURIComponent(name)}
  ```
- 본 함수는 server 함수가 아닌 **순수 함수** (Node + Browser 양쪽). `lib/` 가 아닌 `features/map/server/` 가 어색 → `features/map/lib/buildNaverDirectionsUrl.ts` 로 배치하고 index.ts 에서 re-export.

#### 4.13 컴포넌트 `<NaverMap>`, `<RestaurantMarker>`

- **`NaverMap`** (`features/map/components/NaverMap.tsx`, `'use client'`):
  - props: `{ markers: RestaurantMapMarker[]; center?: LatLng; zoom?: number; height?: number; onMarkerClick?(id) }`
  - `useEffect`: SDK script 싱글톤 로딩 (`window.naver` 체크 → 없으면 `<script>` 삽입)
  - `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` 미설정 시 placeholder UI (베이지 박스 + "지도 키가 설정되지 않았습니다") + `console.warn` 1회.
  - SDK 로드 실패 시 placeholder fallback (error boundary 대신 try/catch + state)
  - 마커 클릭 → `onMarkerClick(id)` (기본: `/restaurants/{id}` 이동)
- **`RestaurantMarker`**: 카테고리별 색상 PIN을 만드는 helper. 직접 DOM 마커가 아니라, `NaverMap` 안에서 `new naver.maps.Marker(...)` 호출 시 사용할 icon HTML을 만드는 **순수 함수형 컴포넌트** 대신 helper 로 단순화. (UI.md §3.3 — 카테고리 색·대기도 테두리·예약필수 🔒.)
  - 본 단계는 **단일 PIN + onClick** 으로 시작. 색상/뱃지 디테일은 T-D 합류 후. 디자인 자체는 mock 변환이라 큰 결정 없음.
  - 외부 export 의 props 안정성을 위해 `RestaurantMarker` 는 자식 컴포넌트로 두되 본문은 helper-driven (jsx 없음). `NaverMap` 내부에서만 사용.

---

## 5. NFR (inline)

### 5.1 동시성 — 태그 usage_count 일관성 (I-4)

- `tagRestaurant` 가 동시 호출되면 INSERT 와 UPDATE 가 인터리브될 수 있음. better-sqlite3 는 sync 라 단일 프로세스 안에선 직렬화되지만, 트랜잭션 안에 SELECT COUNT → UPDATE 를 묶어 안전화.
- 패턴은 M2 `joinParty` 와 동일 (BEGIN IMMEDIATE).
- 테스트: 같은 식당에 같은 태그를 `Promise.all` 10회 → restaurant_tags row 1개 + tags.usage_count = 1.

### 5.2 N+1 회피

- `getRestaurant` 의 tags JOIN, `listRestaurantsByTags` 의 GROUP BY HAVING 패턴 — 모두 단일 쿼리.
- `getAllRestaurantsForMap` 도 단일 SELECT.

### 5.3 인덱스

- D+0 스키마에 `restaurant_tags(tag_id)` 인덱스 + `menus(restaurant_id)` 인덱스 + `tags.label` UNIQUE 모두 존재.
- 추가 인덱스 불필요.

### 5.4 네이버 지도 — 외부 의존 격리

- SDK 로딩은 client-only (`'use client'` + useEffect).
- 환경 변수 누락 시 graceful degradation (placeholder).
- SDK 로딩 실패 시 throw 안 함, placeholder.
- E2E 환경(playwright)에서는 SDK 실제 로딩 시도 → ID 없으면 placeholder. 정상.

### 5.5 테스트 주입점

- `getDb()` 패턴 그대로 사용 (M2 가 도입). 추가 작업 없음.

---

## 6. 외부 의존 (Public API만 호출, ESLint 강제)

| 호출 대상 | 사용 위치 | 비고 |
|---|---|---|
| M1 auth | `tagRestaurant`, `addMenu`, 모든 write API route | `requireUser` |
| (없음) | M3 자기 자신 | 자체 DB만 사용 |
| (없음) | M6 자기 자신 | 순수 URL 빌더 + client 컴포넌트만 |

M3 는 dep doc 매트릭스대로 M1 외 의존 없음. M6 는 M3 의 `getAllRestaurantsForMap` 만 호출 (페이지 레벨에서).

---

## 7. 에러 코드 표 (M3·M6 정의)

| Code | HTTP | 의미 |
|---|---|---|
| `VALIDATION_ERROR` | 400 | 입력 형식 (메뉴명 길이, price 범위, 태그 정규화 실패) |
| `RESTAURANT_NOT_FOUND` | 404 | 식당 id 미존재 |
| `MENU_NOT_FOUND` | 404 | 메뉴 id 미존재 |
| `UNAUTHORIZED` | 401 | 미인증 (M1) |

표준 응답: `{ error: { code, message } }`. (lib/http.ts 헬퍼.)

---

## 8. UI 화면 ↔ 함수 매핑

| 화면 | 사용 함수 |
|---|---|
| **T2 지도 탭** (UI.md §3.3) | `getAllRestaurantsForMap` → `<NaverMap markers>` |
| **S1 식당 상세** (UI.md §3.5) | `getRestaurant`, `getMenusByRestaurant`, `tagRestaurant`(M7 입력기), `buildNaverDirectionsUrl` |
| **S8 해시태그 검색** (UI.md §3.10) | `searchRestaurantsByTag` (URL query `?tag=가성비`) |
| **M3 메뉴 추가 모달** (UI.md §3.12) | `addMenu` |
| **M7 해시태그 입력기** (UI.md §3.12) | `suggestTags` (prefix), `getPopularTags` (빈 prefix), `tagRestaurant` |

M2 의 F2 파티 생성 폼은 `getRestaurantSummary` 를 통해 식당명 표시. 현 단계에서는 ID 입력 또는 freetext 만 지원하므로 ID 가 들어오면 호출, 없으면 freetext 사용 (이미 M2 패턴 반영).

---

## 9. 테스트 케이스 인벤토리

### 9.1 unit
- `normalizeTagLabel`: trim / 선행 # 제거 / 내부 공백 정리 / lower / 50자 cap / 빈 입력 에러
- `buildNaverDirectionsUrl`: 한글 식당명 URL 인코딩 / `current` 분기

### 9.2 integration — restaurant
- `addMenu` → `getMenusByRestaurant` 라운드트립
- `addMenu` price null 허용 / 음수 거부
- `addMenu` 식당 없음 → `RESTAURANT_NOT_FOUND`
- `tagRestaurant` 신규 태그 → tags.usage_count = 1, restaurant_tags 1 row
- `tagRestaurant` 같은 라벨 다른 표기 (`#가성비`, `가성비 `) → 동일 tag_id 재사용
- `tagRestaurant` 동시 10회 Promise.all → row 1, usage_count = 1 (멱등성 + I-4)
- `searchRestaurantsByTag` 정규화 후 검색
- `listRestaurantsByTags([a,b])` AND 시맨틱 (식당이 a,b 모두 가질 때만 hit)
- `getRestaurantSummary` shape (id/name/category1/lat/lng) 확인 (M2 호환)
- `getAllRestaurantsForMap` avgRating null 채움
- `suggestTags` prefix LIKE + usageCount DESC 정렬
- `getPopularTags` 정렬

### 9.3 integration — map
- `buildNaverDirectionsUrl` 출력 URL format 검증 (네이버 도메인, encodeURIComponent 적용)

### 9.4 e2e (smoke 보강)
- T2 지도 페이지: NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 미설정 → placeholder 렌더링 확인
- S8 해시태그 검색 페이지: `?tag=가성비` 진입 → 검색 결과 또는 빈 상태 UI

---

## 10. Sub-batch 분할 (Code Gen)

advisor 권고 따라 3 sub-batch 가능하나, 규모가 M2 보다 작아 **단일 batch** 로 진행. 단 빌드 검증을 단계별로:

1. `_lib`(normalizeTag) + server 함수 + types + Public API index.ts → `pnpm test` (unit) 통과
2. API Route Handler 5개 교체 → `pnpm test` (integration) 통과
3. UI 컴포넌트 + S1·S8·T2 페이지 + NaverMap → `pnpm build` 통과
4. seed 스크립트 (선택) → `pnpm lint` 통과

전체 한 커밋으로 마무리.

---

## 11. Out of Scope (다른 트랙 또는 후속)

- **식당 등록 UI/API** — task prompt 의 `createRestaurant` / `RegisterRestaurantForm` 은 dep doc 시그니처에 없음. 본 단계는 seed 스크립트(`scripts/seed-restaurants.ts`)로 dev 편의 데이터 주입.
- **메뉴/식당 평가 표시** — T-D rating 영역. S1 에서 자리만 잡고 placeholder.
- **마커 클러스터링** — UI.md 검토 사항. MVP OUT.
- **마커 카테고리 색·대기도 테두리·예약 🔒** — Phase 2. 현 단계는 기본 PIN.
- **현재 위치 / 회사 위치 토글** — UI.md §3.3 검토 사항. Phase 2.
- **`reverseGeocode`/`getStaticMapUrl`/`geocode`** — 호출자 없음, dep doc 외. 미구현.
- **메뉴/식당 삭제** — lunch.md §3.6 미정.
- **즐겨찾기 식당 (B1)** — 별도 트랙.
