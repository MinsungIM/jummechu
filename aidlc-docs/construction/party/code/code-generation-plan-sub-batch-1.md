# M2 party — Code Generation Plan (Sub-batch 1: Read path)

> Stage: CONSTRUCTION → T-C → Code Generation Part 1 (Planning)
> 작성: 2026-05-13
> 입력: `aidlc-docs/construction/party/functional-design/functional-design.md`
> 출처: advisor 가이드 — 3 sub-batch 분할 (Read / Write / History)
> 본 plan은 **sub-batch 1 (Read path)** 만 다룸. Write·History는 별도 plan.

## Scope (Read path)

**구현할 함수 3개**
- `createParty(ownerId, input)` — 트랜잭션으로 INSERT party + INSERT party_members(owner). Functional Design §3.1
- `getParty(id)` — SELECT + lazy transition (departAt 지나면 closed로 갱신) + JOIN members + restaurant. §3.2
- `listOpenParties(filter)` — 오늘의 파티 + 필터·정렬 + 배치 lazy transition. §3.3

**API 3개 (501 → 실제 구현)**
- `POST /api/parties`
- `GET /api/parties`
- `GET /api/parties/:id`

**UI 화면 3개**
- T1 파티 리스트 (`app/(main)/page.tsx`) — listOpenParties 데이터, PartyCard 리스트
- F2 파티 생성 (`app/(main)/parties/new/page.tsx`) — PartyCreateForm
- S2 파티 상세 (`app/(main)/parties/[partyId]/page.tsx`) — getParty + PartyDetailView (read-only)

**OUT of sub-batch 1** (sub-batch 2/3에서)
- joinParty / leaveParty / members API / M9 합류 모달
- setNotice / cancelParty / 파티 수정
- listMyHistory / S3·S4 히스토리 / getPartyForReclone
- listMyOpenParties / getMembership / getUserVisitHistory

---

## File List (체크박스)

### A. lib/db.ts 리팩터 (advisor 지적 #1 — 테스트 주입점)
- [ ] `lib/db.ts` — `createDb(url)` factory + `setDbForTesting(db|null)` 추가. `getDb()` 캐싱 + test override 로직

### B. Drizzle 마이그레이션
- [ ] `pnpm db:generate` 실행 → `drizzle/migrations/0000_*.sql` 생성. SQL 파일은 커밋 포함.
- [ ] `pnpm db:migrate` 실행 (개발 검증용, lock 파일은 커밋 포함)

### C. M2 server 함수 3개 (실제 구현)
- [ ] `features/party/server/createParty.ts` — Zod 입력 검증, BEGIN IMMEDIATE 트랜잭션 (INSERT party + INSERT party_members owner), 에러 클래스
- [ ] `features/party/server/getParty.ts` — SELECT + lazy transition (status='open' AND departAt <= now → UPDATE closed) + JOIN members + restaurant
- [ ] `features/party/server/listOpenParties.ts` — 오늘 범위 + 정렬·필터 + 배치 lazy transition
- [ ] `features/party/server/_lib/dateRange.ts` — startOfTodayKST / endOfTodayKST 헬퍼 (UTC unix ms로 변환)
- [ ] `features/party/server/_lib/errors.ts` — PartyNotFoundError / RestaurantNotFoundError / ValidationError 정의

### D. M2 Public API 교체 (stub throw → 실제 export)
- [ ] `features/party/index.ts` 갱신 — server 함수 3개를 stub 대신 실제 구현 re-export. 나머지 함수는 stub 유지 (sub-batch 2/3에서 교체)

### E. UI 컴포넌트 (mock_uiux/jummechu.pen `comp_PartyCard` ytr0D 그대로 변환)
- [ ] `features/party/components/PartyCard.tsx` — Server Component. PartyCard prop → JSX. .pen 구조 (top: 🤫 + title + yellow time_chip / meta: category chip + menu + price / foot: 인원 + dark "합류" pill)
- [ ] `features/party/components/CategoryChip.tsx` — 카테고리 한·중·일·양 색상 매핑 (`text-category-han` 등)
- [ ] `features/party/components/TimeChip.tsx` — yellow pill 시간 표시 (formatTimeKST)
- [ ] `features/party/components/PartyCreateForm.tsx` — Client Component. Zod 입력 (capacity, departAt, joinUntil, name, place, priceBand, capacity, rules, isSilent). 단일 폼 + 접이식 섹션. 제출 시 fetch POST /api/parties
- [ ] `features/party/components/PartyDetailView.tsx` — Server Component (read-only 표시. 합류·공지·취소는 sub-batch 2/3)
- [ ] `features/party/components/EmptyState.tsx` — N6 빈 상태 카드

### F. Pages 갱신 (placeholder → 실제 데이터 연결)
- [ ] `app/(main)/page.tsx` — T1 listOpenParties 호출, PartyCard 리스트 + EmptyState
- [ ] `app/(main)/parties/new/page.tsx` — F2 PartyCreateForm 사용
- [ ] `app/(main)/parties/[partyId]/page.tsx` — S2 getParty + PartyDetailView (notFound 처리)

### G. API Route Handlers (3개 — 501 → 실제)
- [ ] `app/api/parties/route.ts` — GET listOpenParties (query parsing: sortBy, tagIds, categoryIn) + POST createParty
- [ ] `app/api/parties/[id]/route.ts` — GET getParty (404 처리). PATCH/DELETE는 sub-batch 2/3

### H. 테스트 (Functional Design §8 sub-batch 1 항목)
- [ ] `tests/unit/party-validation.test.ts` — createParty 입력 검증 (capacity ≥ 2, joinUntil < departAt, name 1~100자)
- [ ] `tests/integration/party-read-path.test.ts` — in-memory SQLite + setDbForTesting:
  - createParty → owner 자동 멤버 검증
  - getParty 라운드트립
  - getParty lazy transition (departAt 지난 open → closed)
  - listOpenParties 정렬 (depart asc / remaining desc)
  - listOpenParties 빈 결과
- [ ] `tests/_helpers/db.ts` — 통합 테스트 헬퍼 (in-memory DB 생성 + 마이그레이션 + setDbForTesting + 정리)
- [ ] `tests/_helpers/factories.ts` — User·Party 테스트 fixture 팩토리

### I. 검증 + 커밋·푸시
- [ ] `pnpm build` 통과
- [ ] `pnpm test` 통과 (smoke + party-validation + party-read-path)
- [ ] `pnpm dev`로 골든 패스 손으로 확인: 회원가입 → 로그인 → 파티 생성 → 리스트에 나타남 → 상세 진입
- [ ] git add + commit "T-C sub-batch 1 (Read path) — createParty/getParty/listOpenParties + T1/F2/S2"
- [ ] git push

---

## M3 미완성 대응 (advisor 가이드 §6)

- `createParty`에서 `restaurantId` 입력 시 M3 `getRestaurantSummary` 호출 → `not implemented` throw catch → 임시로 검증 skip (warn log) + 진행. T-B 완성 후 catch 제거.
- `getParty` / `listOpenParties`에서 restaurant 정보 임베드 — M3 throw catch → restaurant 필드 null로 fallback.
- 통합 테스트는 `vi.mock('@/features/restaurant', ...)`로 `getRestaurantSummary` 모킹.

## NextAuth 세션 user.id 캐스팅

- Route Handler에서 `requireUser()` 호출 후 `user.id` 사용. M1 `getCurrentUser`가 이미 `User { id: number }` 반환하므로 직접 사용.

---

## 변경 영향 vs 기존 D+0 파일

| 파일 | 상태 |
|---|---|
| `lib/db.ts` | **변경** (factory + test injection) |
| `features/party/index.ts` | **변경** (3 함수 실제 구현 export, 나머지 stub 유지) |
| `app/(main)/page.tsx` | **교체** (placeholder → 실제) |
| `app/(main)/parties/new/page.tsx` | **교체** |
| `app/(main)/parties/[partyId]/page.tsx` | **교체** |
| `app/api/parties/route.ts` | **교체** (501 → 실제) |
| `app/api/parties/[id]/route.ts` | **교체** (501 → 실제) |
| 기타 (앞서 만든 M1 / D+0 stub) | 영향 없음 |

---

## 예상 산출 파일 수 (이 sub-batch)

- 새로 생성: server 5 (createParty, getParty, listOpenParties, dateRange, errors) + components 6 (Card, CategoryChip, TimeChip, CreateForm, DetailView, EmptyState) + tests 3 + helpers 2 + migrations 1 = **17**
- 수정: lib/db / features/party/index / 3 pages / 2 api routes = **7**
- 총 **24 파일**

---

## Step 9 Approval Prompt

> *"Code Generation sub-batch 1 plan complete. Review at `aidlc-docs/construction/party/code/code-generation-plan-sub-batch-1.md`. Ready to generate?"*
