# Unit Test Instructions — jummechu

> Vitest + in-memory SQLite + drizzle 마이그레이션 자동 적용.

## Test 위치

- `tests/unit/**/*.test.ts` — DB 없이 검증 로직(Zod·정규화·헬퍼)
- `tests/integration/**/*.test.ts` — in-memory SQLite로 실제 SQL/트랜잭션 검증

`vitest.config.ts`는 양쪽 다 include. 본 문서는 unit + integration 통합으로 다룸.

## Run Unit Tests

### 1. Execute All Unit Tests

```bash
pnpm test                    # 전체 1회 실행 (CI/검증)
pnpm test -- tests/unit      # unit만
pnpm test:watch              # watch 모드 (개발)
```

기대: **109 tests / 15 files / passed**.

### 2. Review Test Results

콘솔 출력 형식:

```
✓ tests/unit/party-validation.test.ts (7 tests)
✓ tests/unit/normalize-tag.test.ts (8 tests)
...
Test Files  15 passed (15)
     Tests  109 passed (109)
```

특정 테스트만:

```bash
pnpm test -- tests/integration/party-write-path
pnpm test -- -t "동시성"   # description 매칭
```

### 3. Fix Failing Tests

| 실패 유형 | 원인·대응 |
|---|---|
| `Cannot open database` | `tests/_helpers/db.ts`가 `:memory:` SQLite로 자동 생성. `setDbForTesting`이 `lib/db.ts` 캐싱과 충돌하면 `afterEach`에서 cleanup 확인. |
| 시간 의존 실패 | `vi.setSystemTime(fixedNow)` + `vi.useRealTimers()` afterEach 패턴 준수. |
| `joinUntil < departAt` validation | createParty 입력에서 시간 순서 보장. 일반적 fixture 실수. |
| 동시성 테스트 flaky | better-sqlite3 + BEGIN IMMEDIATE write lock 보장. flaky 시 `db.transaction` 콜백 안에서 select+insert 순서 점검. |

## 모듈별 테스트 인벤토리

| 모듈 | 파일 | 케이스 수 |
|---|---|---|
| smoke | `tests/{unit,integration}/smoke.test.ts` | 3 |
| M1 auth | (M1은 기존 D+0에서 별도 unit 없음 — E2E 회원가입·로그인으로 검증) | 0 (단위) |
| M2 party — validation | `tests/unit/party-validation.test.ts` | 7 |
| M2 party — read | `tests/integration/party-read-path.test.ts` | 5 |
| M2 party — write | `tests/integration/party-write-path.test.ts` | 8 (동시성 invariant 포함) |
| M2 party — history | `tests/integration/party-history-path.test.ts` | 13 |
| M3 restaurant — normalize | `tests/unit/normalize-tag.test.ts` | 8 |
| M3 restaurant — read | `tests/integration/restaurant-read.test.ts` | 13 |
| M3 restaurant — write | `tests/integration/restaurant-write.test.ts` | 9 |
| M3 restaurant — tag concurrency | `tests/integration/restaurant-tag-concurrency.test.ts` | 2 |
| M4 rating | `tests/integration/rating.test.ts` | 14 |
| M5 recommendation | `tests/integration/recommendation.test.ts` | 8 |
| M6 map — URL builder | `tests/unit/build-naver-directions-url.test.ts` | 5 |
| M6 map | `tests/integration/map.test.ts` | 1 |
| M7 notification | `tests/integration/notification.test.ts` | 13 |

**합계 109 / 15 파일** (smoke 3 포함).

## ⭐ 핵심 invariant 테스트 (절대 실패 금지)

| 테스트 | invariant |
|---|---|
| `party-write-path > joinParty ⭐ 동시성` | capacity=3 owner 1, 10명 동시 합류 → 정확히 2 성공 + 8 CapacityFullError. SQLite write lock 보장. |
| `restaurant-tag-concurrency` | 동일 tag 동시 추가 → 멱등 (중복 INSERT 없음, usage_count 정확). |
| `recommendation > recent_avoid` | 최근 7일 방문한 식당은 추천 후보에서 제외. |
| `notification > markRead` | `WHERE id=? AND user_id=?` — 타인 알림 read 불가. |
