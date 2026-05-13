# M2 party — Functional Design

> Stage: CONSTRUCTION → T-C Per-Unit Loop → Functional Design
> 작성: 2026-05-13
> 입력: `requirements/lunch.md §2`, `requirements/UI.md` T1/F2/S2/S3/S4/M9, `requirements/design.md` §1·§2·§3, `aidlc-docs/inception/application-design/unit-of-work-dependency.md` M2 시그니처
> 비고: NFR Requirements 별도 stage 대신 본 문서 §5에 inline. NFR Design + Infrastructure Design은 변경 없음으로 SKIP (advisor 결정)

---

## 1. 도메인 모델

```
Party
  ├─ identity:  id (auto)
  ├─ owner:     ownerId → users.id
  ├─ name:      "마라탕 모임"
  ├─ what:      restaurantId(nullable) | restaurantNameFreetext
  ├─ when:      departAt (출발 시각) / joinUntil (참여 마감)
  ├─ where:     place (한 줄 자유 텍스트)
  ├─ how:       capacity, priceBand, rules, isSilent, extraSchedule
  ├─ status:    open | closed | cancelled
  ├─ notice:    한 줄 공지 (§B3)
  └─ createdAt

PartyMember (m:n)
  ├─ (partyId, userId) PK
  └─ joinedAt          (선착순 정렬 기준)
```

### 1.1 핵심 불변식 (Invariants)

| # | Invariant |
|---|---|
| I-1 | 같은 user는 같은 party에 최대 1회만 멤버 (UNIQUE PK) |
| I-2 | `COUNT(party_members WHERE party_id=p) ≤ parties.capacity` (항상 성립) |
| I-3 | `parties.capacity ≥ 2` |
| I-4 | `parties.departAt ≥ parties.joinUntil` (마감이 출발보다 늦을 수 없음) |
| I-5 | 합류 가능 조건: `status='open' AND joinUntil > now() AND 현재 멤버 수 < capacity` |
| I-6 | 파티장은 항상 본인이 만든 파티의 멤버 (생성 시 자동 INSERT into party_members) |

---

## 2. State Machine

```
              create
   ─────────────────────▶ ┌──────┐
                          │ open │
                          └──┬─┬─┘
                             │ │
       owner: cancelParty()  │ │  depart_at 도달
                             │ │  (lazy: 조회/합류 시 검사)
                             ▼ ▼
                    ┌──────────┐  ┌────────┐
                    │cancelled │  │ closed │
                    └──────────┘  └────────┘
                       (final)      (final)
```

**전이 규칙**
- `open → cancelled`: 파티장만, 그리고 `status='open'`일 때만. 사유 저장 안 함 (MVP).
- `open → closed`: 자동. 별도 cron 없음 — 다음번 `getParty`/`listOpenParties`에서 `departAt <= now()` 발견 시 갱신 (lazy transition). 이미 `closed`된 파티는 합류·수정 차단.
- `cancelled`/`closed`에서의 전이: 없음 (final). 재생성은 새 Party 인스턴스 (§3.1 재파티).

**참고**: cron 없이 lazy transition 채택 — SQLite 단일 파일 + 단일 인스턴스 단순화. 트래픽이 작아 N+1 갱신 비용 무시 가능.

---

## 3. Public API 함수별 명세

> 시그니처는 `unit-of-work-dependency.md` M2 섹션 그대로. 본 섹션은 동작·에러·권한·트랜잭션 경계.

### 3.1 `createParty(ownerId, input)`
- **권한**: 인증된 user (M1 `requireUser`)
- **검증**:
  - `name` 1~100자
  - `capacity ≥ 2 ∧ capacity ≤ 50` (상한은 가벼움)
  - `joinUntil < departAt` (둘 다 미래 시각, `> now() + 60s`)
  - `restaurantId` 제공 시 M3 `getRestaurantSummary` 존재 검증 (없으면 `RESTAURANT_NOT_FOUND`)
- **트랜잭션**: `BEGIN IMMEDIATE; INSERT parties; INSERT party_members(owner); COMMIT;` — 파티장은 자동 멤버 (I-6)
- **반환**: `Party`
- **에러 코드**: `VALIDATION_ERROR`, `RESTAURANT_NOT_FOUND`

### 3.2 `getParty(id)`
- **권한**: 인증된 user
- **동작**:
  - SELECT party + JOIN members + restaurant summary
  - `departAt <= now() AND status='open'`이면 트랜잭션 안에서 `UPDATE status='closed'` (lazy transition)
- **반환**: `PartyDetail | null` (없으면 null)

### 3.3 `listOpenParties(filter)`
- **권한**: 인증된 user
- **동작**:
  - 오늘의 파티만 (`departAt BETWEEN startOfToday AND endOfToday`)
  - `status='open'` 우선, `status='closed'` 후순위 (또는 별도 표시)
  - lazy transition: 결과 set 안에 `departAt <= now() AND status='open'`인 행은 closed로 갱신 (배치 UPDATE)
  - 필터: tagIds(M3 join), sortBy(`depart`(asc) | `remaining`(`capacity-currentCount` desc) | `price` | `category`)
- **인덱스**: `parties(depart_at, status)` (D+0 스키마에 추가됨)
- **반환**: `PartyCard[]`

### 3.4 `joinParty(partyId, userId)` ⭐ 핵심 동시성
- **권한**: 인증된 user
- **불변식**: I-1·I-2·I-5 (위)
- **트랜잭션** (`BEGIN IMMEDIATE` — better-sqlite3 동기 호출 하나로 묶음):
  ```
  BEGIN IMMEDIATE
    SELECT status, capacity, join_until,
           (SELECT COUNT(*) FROM party_members WHERE party_id=?) AS cur
    FROM parties WHERE id=?
    ─ check: status='open' AND join_until > now() AND cur < capacity
    INSERT INTO party_members (party_id, user_id, joined_at) VALUES (?, ?, ?)
  COMMIT
  ```
- **에러 코드**:
  - `PARTY_NOT_FOUND` (없음)
  - `PARTY_CLOSED` (status != 'open')
  - `JOIN_EXPIRED` (join_until <= now)
  - `PARTY_FULL` (현재 >= capacity)
  - `ALREADY_JOINED` (UNIQUE violation → 잡아서 매핑)
- **권한 검사 / 트랜잭션 모두 server 함수 안에서**. Route Handler는 단순 invoke.

### 3.5 `leaveParty(partyId, userId)`
- **권한**: 본인만 (자기 멤버십만 삭제)
- **제약**: 파티장은 leave 불가 (`OWNER_CANNOT_LEAVE`). 파티장 위임(C4)은 MVP OUT — 파티장이 빠지려면 cancelParty.
- **상태**: closed 파티에서도 leave 가능 (기록 정리)

### 3.6 `setNotice(partyId, ownerId, text)`
- **권한**: 파티장만 (`OWNER_ONLY`)
- **검증**: `text` 0~200자 (빈 문자열은 공지 제거)
- **상태**: open/closed 모두 가능 (closed에서도 후 회고 메모 가능)

### 3.7 `listMyHistory(userId)`
- **반환**: `status IN ('closed','cancelled') AND user 가 멤버` 인 파티 리스트. `departAt DESC`.

### 3.8 `listMyOpenParties(userId)` (M7 사용)
- **반환**: `status='open' AND join_until > now() AND user 가 멤버` 인 파티 리스트. `departAt ASC`.

### 3.9 `getPartyForReclone(id)`
- **반환**: `CreatePartyInput` 형태 — 같은 식당/메뉴/가격대/규칙 등 복사, 시간은 null (호출자가 설정)

### 3.10 `getMembership(partyId, userId)` (M4 권한 검사 사용)
- **반환**: `Membership | null`

### 3.11 `getUserVisitHistory(userId, sinceTs)` (M5 추천 사용)
- **반환**: `RestaurantVisit[]` — closed 파티에서 user 가 멤버인 식당별 마지막 방문일 + 횟수. `sinceTs` 이후만.

---

## 4. 권한·시간·취소 규칙 (advisor 가이드 inline)

- **시간 소스**: **서버 `Date.now()`만 사용**. 클라이언트가 보내는 `departAt`/`joinUntil`은 입력값이지 비교 기준 아님. `now()` 비교는 server 함수 안에서.
- **취소 규칙**: `cancelParty(partyId, userId)` — 파티장만, `status='open'`일 때만. closed 파티는 취소 불가.
- **권한 검사 위치**: 항상 `features/party/server/*.ts`의 server 함수 진입부. Route Handler는 단순 invoke (`requireUser` + body parse 후 server 함수 호출).

---

## 5. NFR (inline)

### 5.1 동시성 (선착순 합류) — 핵심

- **invariant I-2**: 항상 `현재 멤버 수 ≤ capacity`
- **better-sqlite3 특성**: 동기 API, Node 이벤트 루프 1 tick = 한 트랜잭션 commit. 실제 병렬 쓰기 불가 (file lock으로 직렬화)
- **위험 지점**: SELECT COUNT → INSERT 사이에 다른 트랜잭션이 끼는 케이스. **회피**: `BEGIN IMMEDIATE` + 동일 트랜잭션 내 SELECT COUNT + INSERT를 single sync block으로
- **테스트 (필수, integration)**: `capacity=3` 파티에 `joinParty` 10개 `Promise.all` → 정확히 3 성공 + 7개 `PARTY_FULL`. 테스트 통과해야 코드 정상.

### 5.2 시간 정렬 / 인덱스

- `parties(depart_at, status)` 인덱스 — D+0 스키마에 추가됨. `listOpenParties` 쿼리 인덱스 hit 보장.

### 5.3 트랜잭션 격리

- WAL 모드 + `BEGIN IMMEDIATE` — write lock 즉시 획득. 다른 write 대기. 일관성 보장.

### 5.4 테스트 주입점 — `getDb()` 리팩터 (advisor 지적 #1)

- **현재 문제**: `getDb()`가 module-singleton, 환경변수 한 번 읽고 캐시 → 통합 테스트에서 in-memory SQLite 주입 불가
- **변경 (Code Gen sub-batch 1에서 함께)**:
  ```ts
  // lib/db.ts
  export function createDb(url: string): BetterSQLite3Database<typeof schema> { ... }

  let _testDb: BetterSQLite3Database<typeof schema> | null = null
  export function setDbForTesting(db: BetterSQLite3Database<typeof schema> | null) {
    _testDb = db
  }

  let _db: BetterSQLite3Database<typeof schema> | null = null
  export function getDb() {
    if (_testDb) return _testDb
    if (_db) return _db
    const url = process.env.DATABASE_URL ?? './data/jummechu.db'
    // ... dir 생성, pragma 설정
    _db = createDb(url)
    return _db
  }
  ```
- **테스트에서**:
  ```ts
  beforeEach(() => {
    const db = createDb(':memory:')
    runMigrations(db)
    setDbForTesting(db)
  })
  afterEach(() => setDbForTesting(null))
  ```
- 호출자 코드 (lib/auth.ts, features/auth/server/*) 변경 불필요 — `getDb()` 그대로

---

## 6. 외부 의존 (Public API만 호출, ESLint 강제)

| 호출 | 사용 위치 | 사용 함수 |
|---|---|---|
| M1 auth | 모든 server 함수 진입 | `requireUser` |
| M3 restaurant | `createParty`, `getParty`, `listOpenParties` | `getRestaurantSummary`, `getRestaurant`, restaurant 이름·태그 |

M3 의 일부 함수는 T-B 트랙이 아직 stub. **T-C 진행 중에는 mock으로 대체** — 통합 테스트는 `features/restaurant`의 server 함수를 vi.mock으로 모킹. 실제 T-B 완성 후 mock 제거.

---

## 7. 에러 코드 표 (M2 정의)

| Code | HTTP | 의미 |
|---|---|---|
| `VALIDATION_ERROR` | 400 | 입력 형식·범위 |
| `PARTY_NOT_FOUND` | 404 | 파티 없음 |
| `RESTAURANT_NOT_FOUND` | 400 | 입력된 restaurantId 없음 |
| `PARTY_CLOSED` | 409 | 합류·수정 시 closed |
| `JOIN_EXPIRED` | 409 | join_until 지남 |
| `PARTY_FULL` | 409 | 정원 초과 |
| `ALREADY_JOINED` | 409 | 이미 멤버 |
| `OWNER_ONLY` | 403 | 파티장 권한 필요 |
| `OWNER_CANNOT_LEAVE` | 409 | 파티장은 leave 불가 |
| `UNAUTHORIZED` | 401 | 미인증 (M1) |

표준 응답: `{ error: { code, message } }`.

---

## 8. 테스트 케이스 인벤토리 (Code Gen sub-batch 별로 작성)

### Sub-batch 1: Read path
- unit: `createParty` 입력 검증 (capacity≥2, joinUntil<departAt)
- unit: `getParty` lazy transition (departAt 지난 open → closed 자동 갱신)
- integration: `listOpenParties` 정렬·필터 (depart, remaining, tagIds)
- integration: createParty → getParty 라운드트립 (owner 자동 멤버)

### Sub-batch 2: Write path
- integration: ⭐ **`joinParty` capacity=3 + Promise.all 10 → 3 성공 / 7 PARTY_FULL** (advisor 명시)
- integration: `joinParty` JOIN_EXPIRED (join_until 지남)
- integration: `joinParty` PARTY_CLOSED
- integration: `joinParty` ALREADY_JOINED
- integration: `leaveParty` OWNER_CANNOT_LEAVE
- e2e: F1 회원가입 → F2 파티 생성 → 다른 사용자 합류 → S2 표시 (critical path)

### Sub-batch 3: History + extras
- unit: `setNotice` 권한·길이
- integration: `listMyHistory` 정렬·필터
- integration: `getPartyForReclone` prefill 정확성
- e2e: 히스토리 → 재파티 흐름

---

## 9. UI 화면 ↔ 함수 매핑

| 화면 | 사용 함수 |
|---|---|
| T1 파티 리스트 | `listOpenParties` |
| F2 파티 생성 | `createParty` (+ M3 식당 검색 mocking 가능) |
| S2 파티 상세 | `getParty`, `setNotice`, `leaveParty` |
| M9 합류 확인 모달 | `joinParty` |
| S3 히스토리 목록 | `listMyHistory` |
| S4 히스토리 상세 → F2 재파티 | `getPartyForReclone` |

PartyCard 컴포넌트는 `mock_uiux/jummechu.pen` `comp_PartyCard`(`ytr0D`) 그대로 React 변환 (advisor 가이드 #6) — 별도 디자인 작업 없음.

---

## 10. Out of Scope (다른 트랙 또는 후속)

- M3 식당 검색·태그 자동완성 (T-B) — F2에서는 일단 ID 입력 또는 단순 텍스트로 시작, T-B 완성 후 자동완성 연결
- M5 추천 카드 → F2 prefill (T-D 완성 후)
- M7 출발 임박 알림 (T-A)
- N3 정원 미달 자동 무산 — MVP OUT 결정 (§C2 OUT)
- M11 다시 뽑기 — T-D 영역
- M13 사일런트 런치 토글 — F2 단계에서 form field 노출. M2 영역에서는 그대로 저장만 (§5.1 토글 로직은 후속)
- 파티장 위임 (§C4) — MVP OUT
