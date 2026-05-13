# Integration Test Instructions — jummechu

> 모듈 간 상호작용·E2E 시나리오 실행 가이드.

## Purpose

단위 테스트가 보장하지 못하는 **모듈 경계 + 사용자 흐름**을 검증:
- M2 party ↔ M3 restaurant ↔ M4 rating 데이터 흐름
- M2 cancelParty / setNotice → M7 notification fan-out hook
- M7 NotificationBadge → 헤더 마운트 → 알림 페이지
- F1 회원가입 → F2 파티 생성 → 합류 → S2 상세 표시 (Critical Path)

## Test Scenarios

### Scenario 1: M2 party → M3 restaurant 임베드
- 파티 생성 시 `restaurantId` 지정 → `getParty`/`listOpenParties`에서 restaurant 이름 표시.
- `tests/integration/party-read-path.test.ts` + `tests/integration/restaurant-read.test.ts` 양쪽 커버.

### Scenario 2: M2 cancelParty → M7 notifyCancelled
- owner가 파티 취소 → 멤버 전원에게 `kind='cancelled'` 알림 INSERT.
- 현재 구현: `features/party/server/cancelParty.ts`가 `notifyCancelled(partyId)` 호출.
- 검증: M7 `tests/integration/notification.test.ts` + 수동 E2E.

### Scenario 3: M2 setNotice → M7 notifyNotice
- 동일 방식. 비어있는 공지 텍스트는 fan-out 스킵 (구현 §setNotice.ts).

### Scenario 4: M5 recommendation ← M2 visit history + M4 rating
- 추천 알고리즘 입력: `getUserVisitHistory(M2)` + 식당 별점 (M4).
- 미방문 + 별점 4+ → 가중 랜덤.
- 검증: `tests/integration/recommendation.test.ts`.

### Scenario 5: E2E Critical Path (수동)
1. `/signup` 회원가입 (`name`, `email`, `password 8+`)
2. 자동 로그인 → `/` T1 홈
3. `+ 새 파티 만들기` → F2 폼 → 제출 → S2 상세
4. 다른 유저 회원가입 → S2에서 `합류하기`
5. 방장 유저로 돌아와 `파티 취소` → 다른 유저의 `/notifications`에 `cancelled` 알림 표시

## Setup Integration Test Environment

### 1. Start Required Services
- **외부 서비스 없음** (SQLite 단일 파일 + Next.js dev 서버만)
- 통합 테스트는 in-memory SQLite로 격리되어 외부 의존 0

### 2. Configure Service Endpoints
- 통합 테스트(vitest): 별도 설정 없음 (`tests/_helpers/db.ts` 자동 처리)
- E2E (playwright): `playwright.config.ts`에 `baseURL=http://localhost:3000` 설정 (또는 3001 확인 후 조정)

## Run Integration Tests

### 1. Execute Integration Test Suite

```bash
# Vitest 통합 테스트
pnpm test -- tests/integration

# E2E (Playwright)
pnpm test:e2e               # headless
pnpm test:e2e -- --ui       # UI 모드
```

Vitest 통합: **80 tests passed** (party 26 + restaurant 24 + rating 14 + recommendation 8 + notification 13 + map·smoke 5 등).

### 2. Verify Service Interactions

수동 검증 체크리스트 (dev 서버):

```bash
# 사전: 서버 가동
pnpm dev

# 자동 검증 (선택)
curl -s http://localhost:3000/api/parties | jq
curl -s -X POST http://localhost:3000/api/parties/1/members \
  -H 'Cookie: <session>' -H 'Content-Type: application/json'
```

| 화면 | 기대 동작 |
|---|---|
| `/` T1 | DashboardWidget(추천 + 만족도) + 모집 중 파티 카드 + `+ 새 파티 만들기` |
| `/parties/new` F2 | name/restaurant/depart/joinUntil/capacity 입력 → POST /api/parties → 상세 페이지 이동 |
| `/parties/[id]` S2 | 파티 정보 + 멤버 + 합류/탈퇴 버튼 (방장은 취소 버튼) |
| `/notifications` | 본인 알림 목록 + `모두 읽음` 버튼 |
| `/restaurants/search` | 해시태그 입력 → 매칭 식당 |
| `/restaurants/[id]` S1 | 식당 상세 + 메뉴 + 평가 + 지도 |
| `/map` T2 | 네이버 지도 + 식당 마커 (Client ID + 도메인 등록 시) |
| `/history` S3 | 내가 참여한 closed/cancelled 파티 |
| `/history/[id]` S4 | 히스토리 상세 + 🔁 재파티 |

### 3. Cleanup

- in-memory DB: 테스트 종료 시 자동 정리 (`tests/_helpers/db.ts` afterEach)
- Playwright E2E: `playwright-report/` 생성 (gitignored)
- 로컬 dev DB (`./data/jummechu.db`): 필요 시 수동 삭제 후 `pnpm db:migrate` 재실행
