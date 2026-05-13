# M7 notification — Functional Design

> Stage: CONSTRUCTION → T-A Per-Unit Loop → Functional Design
> 작성: 2026-05-13
> 입력: `requirements/lunch.md §B3·§B4`, `requirements/UI.md §2.5 N1~N6 / §3.6 / §3.4 알림 토글`, `requirements/design.md` (해당 도메인 한정), Agent 호출 spec (8 함수 + `notifications` 테이블)
> 비고: D+0 `unit-of-work-dependency.md` M7 시그니처(`getUpcomingDeparturesForUser` 1개) **대체**. 매트릭스상 M7은 호출자 없음 → breaking change 영향 없음. NFR Requirements + NFR Design + Infrastructure Design은 본 문서 §5 inline (advisor 결정 패턴 — T-C와 동일).

---

## 1. 도메인 모델

```
Notification
  ├─ identity:  id (auto)
  ├─ owner:     userId  → users.id        (수신자, FK)
  ├─ ref:       partyId → parties.id      (nullable, onDelete: 'set null')
  ├─ kind:      'depart_soon' | 'notice' | 'cancelled' | 'system'
  ├─ payload:   title (필수) / body (선택) / url (선택, 클릭 시 deeplink)
  ├─ state:     isRead (boolean)
  └─ createdAt
```

### 1.1 핵심 불변식 (Invariants)

| # | Invariant |
|---|---|
| I-1 | `partyId IS NULL` 허용 (kind='system'). 그 외 kind는 partyId 권장 (강제 X — soft) |
| I-2 | `kind='depart_soon'` 은 (userId, partyId) 쌍당 최대 1행 — idempotency (cron 재실행 안전) |
| I-3 | `markRead`/`markAllRead` 는 **본인 알림만** 변경 (WHERE user_id=?) |
| I-4 | 파티 삭제 시 알림은 보존하되 `party_id` SET NULL (onDelete='set null') — 사용자 받은 알림 이력은 사라지지 않음 |
| I-5 | unread COUNT 및 list 쿼리는 `(user_id, is_read, created_at DESC)` 복합 인덱스 hit |

---

## 2. State Machine

```
                  insert
   notify*() ─────────────▶ ┌─────────┐
                            │ unread  │
                            └────┬────┘
                                 │ markRead / markAllRead
                                 ▼
                            ┌────────┐
                            │  read  │
                            └────────┘
                                (final — MVP에서 unread 복귀 없음)
```

`depart_soon` 의 경우 같은 (user, party)에 두 번째 insert 시도는 `I-2` invariant로 **silent no-op** (UNIQUE 충돌 → 무시). cron 또는 lazy fan-out 안전.

---

## 3. Public API 함수별 명세

> 시그니처는 Agent 호출 spec 그대로. 본 섹션은 동작·에러·권한·트랜잭션 경계.

### 3.1 `listMyUnread(userId)`
- **동작**: `SELECT * FROM notifications WHERE user_id=? AND is_read=0 ORDER BY created_at DESC` (LIMIT 50)
- **인덱스**: `(user_id, is_read, created_at)`
- **반환**: `Notification[]`

### 3.2 `listMy(userId, limit=30)`
- **동작**: read+unread 통합 — `WHERE user_id=? ORDER BY created_at DESC LIMIT ?`
- **반환**: `Notification[]`

### 3.3 `markAllRead(userId)`
- **권한 (I-3)**: 본인 알림만. UPDATE WHERE user_id=? AND is_read=0
- **트랜잭션**: 단일 UPDATE (transaction 불필요)
- **반환**: void

### 3.4 `markRead(userId, notificationId)`
- **권한 (I-3) — 핵심 보안**: `UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?`. `WHERE id=?` 단독 사용 **금지** (advisor 가이드).
- **동작**: 해당 행이 본인 소유가 아니면 영향 받는 행 0개. 에러 throw 안 함 (idempotent). 호출자는 affected==0 로 silent fail 처리.
- **반환**: void

### 3.5 `notifyDepartSoon(partyId)` — cron/lazy fan-out
- **호출 시점**: 출발 5~10분 전 트리거 (MVP: lazy — 다른 페이지 진입 시 호출 또는 cron). 본 구현은 함수 자체만 제공, 트리거 hook은 OOS.
- **동작**:
  1. SELECT party + members (party_members 조인)
  2. 멤버별로 idempotent INSERT (I-2): `INSERT INTO notifications ... WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE user_id=? AND party_id=? AND kind='depart_soon')`
  3. title: `"5분 후 출발: {partyName}"` body: `"{place ?? restaurantName}"`
  4. url: `/parties/{partyId}`
- **idempotency (I-2 — advisor 가이드)**: 같은 (user, party, kind='depart_soon') 조합은 1 row 보장. 두 번째 호출은 0건 insert
- **반환**: void

### 3.6 `notifyNotice(partyId, text)`
- **호출 시점**: T-C `setNotice` 후속에서 hook (본 트랙 OOS). 본 트랙은 함수만 제공.
- **동작**: 현재 멤버 전원에 INSERT (idempotent **하지 않음** — 공지 변경마다 새 알림)
- **kind**: `'notice'`, title: `"새 공지: {partyName}"`, body: `text` (앞 100자), url: `/parties/{partyId}`

### 3.7 `notifyCancelled(partyId)`
- **호출 시점**: T-C `cancelParty` 후속에서 hook (본 트랙 OOS).
- **동작**: 현재 멤버 전원에 INSERT
- **kind**: `'cancelled'`, title: `"파티 취소됨: {partyName}"`, body: null, url: `/history` (취소된 파티 상세는 사라지므로 히스토리로)

### 3.8 (시스템 알림 — 인터널)
- `kind='system'` 은 admin 메시지·온보딩 등 — Public API 없음. DB 레벨에서만.

---

## 4. 인증·권한·시간

- **시간 소스**: 서버 `Date.now()`만 사용
- **권한 검사**:
  - `listMyUnread` / `listMy` / `markAllRead` / `markRead` — `requireUser`(M1) 후 `userId === currentUser.id` 검사 (Route Handler 레벨)
  - `notifyDepartSoon` / `notifyNotice` / `notifyCancelled` — 서버 내부 호출 전용 (Route Handler 미노출). E2E 테스트에서 직접 호출.
- **I-3 보안 invariant**: `markRead` SQL은 반드시 `WHERE id=? AND user_id=?`. 통합 테스트로 검증.

---

## 5. NFR (inline)

### 5.1 Idempotency — `notifyDepartSoon`

- **위험**: cron이 매 분 실행되거나 lazy fan-out이 페이지 진입마다 호출되면 같은 알림 N배 중복
- **해결**: `WHERE NOT EXISTS` subquery 또는 `INSERT ... ON CONFLICT DO NOTHING` (SQLite UNIQUE)
- **선택**: drizzle on conflict 가독성 위해 `INSERT ... ON CONFLICT(user_id, party_id) WHERE kind='depart_soon' DO NOTHING` 보다는 (이건 partial unique index가 별도 필요해 복잡), **명시적 SELECT 후 INSERT 방식 + (user_id, party_id, kind) 조합 사전 체크**로 단순화. transaction 안에서 처리해 race-free.
- **테스트 (필수)**: 같은 partyId로 `notifyDepartSoon` 2회 호출 → 멤버 수만큼만 insert (N rows, not 2N)

### 5.2 markRead 보안 — I-3 검증

- **위험**: API에서 다른 사용자의 notificationId를 marking
- **해결**: SQL WHERE 절에 user_id 묶음 + 통합 테스트 명시
- **테스트**: 다른 user의 알림 id로 markRead 호출 → 해당 알림 is_read 그대로 (false)

### 5.3 인덱스

- `notifications_user_unread_created_idx` on `(user_id, is_read, created_at DESC)` — `listMyUnread` + 배지 COUNT 모두 hit

### 5.4 트랜잭션 격리

- `notifyDepartSoon`/`notifyNotice`/`notifyCancelled` — 멤버 목록 조회 + bulk insert를 단일 `BEGIN IMMEDIATE` transaction. 멤버 fan-out 중 멤버 추가/탈퇴 race 회피.

### 5.5 폴링·실시간 정책 (out-of-scope)

- WebSocket·SSE 미사용 (MVP). 헤더 배지·알림 페이지는 **요청 시점 렌더링** + 사용자 액션 후 router.refresh()
- B4 출발 임박은 cron 또는 lazy fan-out. cron 구체 구현은 후속 (지금은 함수만)

---

## 6. 외부 의존 (Public API만 호출, ESLint 강제)

| 호출 | 사용 위치 | 사용 함수 |
|---|---|---|
| M1 auth | 모든 Route Handler 진입 | `requireUser`, `getCurrentUser` |
| M2 party | `notifyDepartSoon` 외 3개 fan-out 함수 | 멤버 조회는 자체 DB query (`party_members` 테이블 직접) — M2 의존 회피로 cycle 방지 |

**의존 회피 결정**: `notifyDepartSoon` 등이 M2 `getParty` 호출하면 M2 → M1, M7 → M2 → M1 으로 chain 깊어짐. 멤버 조회는 `partyMembers` 테이블 SELECT 가 단순하므로 **자체 query**. parties 테이블 SELECT도 fan-out 함수 안에서 직접. `unit-of-work-dependency.md` 매트릭스의 "M7 → M2 F+T" 는 본 디자인에서 **타입만 import (T)** 로 약화 — Notification 타입은 자체 정의, party 멤버는 schema 직접.

---

## 7. DB 스키마 (신규)

`drizzle/schema/notifications.ts`:

```ts
export const notifications = sqliteTable(
  'notifications',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull().references(() => users.id),
    partyId: integer('party_id').references(() => parties.id, { onDelete: 'set null' }),
    kind: text('kind', { enum: ['depart_soon', 'notice', 'cancelled', 'system'] }).notNull(),
    title: text('title').notNull(),
    body: text('body'),
    url: text('url'),
    isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at').notNull(),
  },
  (t) => ({
    userUnreadCreatedIdx: index('notifications_user_unread_created_idx').on(
      t.userId, t.isRead, t.createdAt
    ),
  })
)
```

`drizzle/schema/index.ts` 에 `export * from './notifications'` 추가. 마이그레이션 `0001_*.sql` 생성.

---

## 8. 에러 코드 표 (M7 정의)

| Code | HTTP | 의미 |
|---|---|---|
| `VALIDATION_ERROR` | 400 | 입력 형식·범위 (id 음수 등) |
| `UNAUTHORIZED` | 401 | 미인증 (M1) |
| `NOTIFICATION_NOT_FOUND` | 404 | 알림 없음 (markRead에서 사용 안 함 — silent) |

표준 응답: `{ error: { code, message } }`. 본 모듈은 도메인 에러가 적음 — 주로 인증·검증.

---

## 9. UI 매핑

| 화면 / 컴포넌트 | 사용 함수 | 위치 |
|---|---|---|
| `NotificationBadge` (헤더, server) | `listMyUnread(userId).length` | `app/(main)/layout.tsx` 상단에 sticky header 신설, 배지 우상단 |
| `/notifications` 페이지 | `listMy(userId, 30)` + `markAllRead` 버튼 | `app/(main)/notifications/page.tsx` |
| `NotificationList` | render `Notification[]` | server component |
| `NotificationItem` | 클릭 시 `markRead` API + 이동 | client (button) |
| `InAppBanner` (B4) | client-only, 최신 unread `depart_soon` 1개 표시 + dismiss | `app/(main)/layout.tsx`에 마운트 |

### 9.1 NotificationBadge 마운트 결정 (advisor 가이드)

`app/(main)/layout.tsx` 는 현재 헤더 없음 (FloatingTabBar만 있음). spec 요구사항은 "헤더에 unread 개수 표시" — 두 가지 선택:

- **(A) 최소 sticky header 추가** to `app/(main)/layout.tsx`: 로고/제목 + 우측 알림 종 아이콘 + 배지
- **(B) fixed floating bell**: 우상단 fixed, 탭바와 별개

**선택: (A) sticky header** — design.md의 토큰(yellow accent, ground bg)에 맞춰 자연스럽고, 페이지별 헤더는 각 페이지가 page-level 헤더로 처리하므로 layout-level은 작게. `app/(main)/layout.tsx`는 T-A 스코프 외 금지 목록에 없음. spec이 "헤더 표시"를 요구하므로 layout 수정은 합당.

### 9.2 InAppBanner 동작 (B4)

- Client component
- mount 시 `/api/notifications?unread=1&kind=depart_soon` fetch → 최신 1개 표시
- dismiss 버튼 → markRead 호출 후 hide. localStorage 별도 dismiss 캐시 불필요 (read 상태 자체가 충분).
- 폴링: 60초마다 refetch (MVP 단순 정책). SSE/WebSocket OOS.

---

## 10. 테스트 케이스 인벤토리

### Unit
- `validateKind` (enum 4종 + invalid) — kind 검증 헬퍼 (있다면)
- `formatNotificationTitle` (있다면) — 순수 함수

### Integration (`tests/integration/notification.test.ts`)
- ⭐ **markRead authorization (I-3)**: user A가 user B의 알림 id로 markRead → B의 알림 is_read=0 그대로
- ⭐ **notifyDepartSoon idempotency (I-2)**: 같은 partyId로 2회 호출 → 멤버 수 N rows (not 2N)
- `listMyUnread` 정렬 + is_read=0 필터
- `listMy` LIMIT 적용 + read/unread 모두 포함
- `markAllRead` — A의 호출이 B의 알림에 영향 없음
- `notifyNotice` fan-out — 현재 멤버 전원 insert
- `notifyCancelled` fan-out — 현재 멤버 전원 insert
- `partyId SET NULL on cascade` — 파티 삭제 시 notifications.party_id NULL 보존

### E2E (smoke 단계, 본 트랙 미포함 — Build and Test stage)
- 로그인 → /notifications 페이지 진입 → 빈 상태

---

## 11. Out of Scope (다른 트랙 또는 후속)

- T-C가 `setNotice` / `cancelParty` 에서 `notifyNotice` / `notifyCancelled` 호출하는 hook 연결 — **T-A는 함수만 제공**
- 출발 5분 전 cron 트리거 — 함수만 제공, cron job/스케줄러 OOS
- Web Push (브라우저 푸시 알림) — `tech-review.md T4` 후속
- WebSocket/SSE 실시간 — MVP OOS
- 사용자 알림 토글 (T3 설정 화면의 N1 ON/OFF) — UI는 T-D 또는 후속
- N4 랜덤 선정 / N5 다른 혼밥러 — kind 확장 후속

---

## 12. 기존 stub과의 차이 (decision record)

| 항목 | D+0 stub | T-A 본 디자인 |
|---|---|---|
| Public API | `getUpcomingDeparturesForUser` 1 함수 + 2 컴포넌트/훅 | 8 함수 + 4 컴포넌트 |
| 알림 영속성 | 메모리·도출 (party 테이블 query) | DB 테이블 `notifications` 신규 |
| kind | 사실상 depart_soon만 | 4종 enum |
| markRead | 없음 | I-3 권한 검증 포함 |
| 매트릭스 영향 | M7은 호출자 0개 | breaking change 없음 |

기존 stub 파일은 **재작성** (덮어쓰기): `features/notification/index.ts`, `components/InAppNotificationBanner.tsx`, `hooks/useDepartureReminders.ts`. `unit-of-work-dependency.md` M7 섹션은 본 트랙 마무리 후 갱신 권장 (별도 commit 또는 후속).
