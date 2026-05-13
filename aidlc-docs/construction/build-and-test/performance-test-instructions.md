# Performance Test Instructions — jummechu

## Purpose

MVP 사내 도구 (~50명 동시 사용 가정)이므로 성능 테스트는 **최소 수준**만 검증.
주요 관심사:
- 핫 API (`GET /api/parties`, `GET /api/recommendations`) 단일 SQLite 접근 지연
- `joinParty` 동시성 (이미 unit-level invariant로 보장됨)
- 페이지 SSR 응답 시간 (T1, S2)

## Performance Requirements

| 항목 | 목표 |
|---|---|
| `GET /api/parties` (오늘 50개 파티 가정) | p95 < 100ms |
| `GET /api/parties/[id]` (멤버 ≤ 20명) | p95 < 80ms |
| `POST /api/parties/[id]/members` (합류) | p95 < 150ms (트랜잭션 포함) |
| `GET /` T1 홈 (SSR) | p95 < 300ms (DB 2회 + 추천 계산) |
| 동시 합류 (capacity=10, 20명) | 정확히 10 성공 + 10 실패. 응답 시간 < 1s |

## Setup Performance Test Environment

### 1. Prepare Test Environment

```bash
# 별도 DB 파일로 격리
DATABASE_URL=./data/perf.db pnpm db:migrate

# 시드 데이터 주입 (50 식당 + 30 파티 + 200 유저)
DATABASE_URL=./data/perf.db pnpm tsx scripts/seed-restaurants.ts
# 추가 시드는 필요 시 scripts/seed-perf.ts (향후 추가)

# 프로덕션 빌드 후 실행
pnpm build
DATABASE_URL=./data/perf.db pnpm start
```

### 2. Configure Test Parameters

도구: `autocannon` (또는 `k6`). MVP는 autocannon으로 충분.

```bash
# autocannon 1회 설치 (devDependency 등록 권장)
pnpm add -D autocannon

# 50 connection, 10초간
pnpm exec autocannon -c 50 -d 10 http://localhost:3000/api/parties
```

## Run Performance Tests

### 1. 핫 API 부하

```bash
pnpm exec autocannon -c 50 -d 10 -H "Cookie: next-auth.session-token=<token>" \
  http://localhost:3000/api/parties

pnpm exec autocannon -c 50 -d 10 -H "Cookie: next-auth.session-token=<token>" \
  http://localhost:3000/api/recommendations
```

### 2. 합류 동시성 부하

Unit-level invariant 테스트(`tests/integration/party-write-path.test.ts > joinParty ⭐ 동시성`)가 이미 capacity=3, 10명 동시 → 정확히 2 성공 검증 완료. 실 운영 부하는 별도 스크립트 작성 시:

```bash
# 예시 (구현 시)
pnpm tsx scripts/perf-join-party.ts --partyId=1 --concurrent=30
```

### 3. 결과 해석

| 지표 | 합격 기준 |
|---|---|
| 2xx rate | ≥ 99% (합류 동시성 외) |
| Latency p95 | 위 §Performance Requirements 표 |
| Errors | 0 (5xx 발생 시 실패) |

## Notes

- SQLite는 단일 writer. 동시 write가 폭증하면 BEGIN IMMEDIATE 대기로 인해 합류 API p99가 길어질 수 있음. MVP 50명 동시는 안전 범위.
- 운영 확장 시 옵션: WAL 모드 보장(이미 적용), 또는 PostgreSQL 마이그레이션.
- 본 단계는 **placeholder** — MVP 출시 후 실제 측정값으로 보완.
