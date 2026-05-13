# M7 notification — Code Generation Plan

> Stage: CONSTRUCTION → T-A Per-Unit Loop → Code Generation Part 1 (Plan)
> 작성: 2026-05-13
> 입력: `aidlc-docs/construction/notification/functional-design/functional-design.md`
> 결정: 단일 batch (T-C와 달리 sub-batch 분할 불필요 — 함수 8개, 의존 단순)

---

## Scope (한 batch)

- DB 스키마 + 마이그레이션
- 8 server 함수 (Public API)
- 4 React 컴포넌트 + 1 page
- 3 API Route Handler
- layout 수정 (sticky header + InAppBanner mount)
- integration test 1 파일

---

## 파일 리스트 (체크박스)

### A. DB 스키마 + 마이그레이션
- [x] `drizzle/schema/notifications.ts` — 신규 테이블 + 인덱스
- [x] `drizzle/schema/index.ts` — `export * from './notifications'` 추가
- [x] `drizzle/migrations/0001_*.sql` — `pnpm db:generate` 산출물 (auto-generated SQL + meta 업데이트)

### B. 도메인 에러 + 타입
- [x] `features/notification/types.ts` — `NotificationKind`, `Notification` 타입
- [x] `features/notification/server/_lib/errors.ts` — 도메인 에러 (현재 1~2개만)

### C. Server 함수 (8개)
- [x] `features/notification/server/listMyUnread.ts`
- [x] `features/notification/server/listMy.ts`
- [x] `features/notification/server/markAllRead.ts`
- [x] `features/notification/server/markRead.ts` — ⭐ I-3 권한 검증
- [x] `features/notification/server/notifyDepartSoon.ts` — ⭐ I-2 idempotency
- [x] `features/notification/server/notifyNotice.ts`
- [x] `features/notification/server/notifyCancelled.ts`
- [x] `features/notification/server/_lib/fanOut.ts` (선택, 공통 fan-out 헬퍼)

### D. UI 컴포넌트 + 페이지
- [x] `features/notification/components/NotificationBadge.tsx` (Server, async)
- [x] `features/notification/components/NotificationList.tsx` (Server, accepts data prop or async)
- [x] `features/notification/components/NotificationItem.tsx` (Client — markRead click + nav)
- [x] `features/notification/components/InAppBanner.tsx` (Client — dismiss 가능 + 폴링)
- [x] `app/(main)/notifications/page.tsx` (Server page)

### E. API
- [x] `app/api/notifications/route.ts` — GET listMy / listMyUnread (?unread=1)
- [x] `app/api/notifications/read-all/route.ts` — POST markAllRead
- [x] `app/api/notifications/[id]/read/route.ts` — POST markRead

### F. Layout 수정
- [x] `app/(main)/layout.tsx` — sticky header 추가 (logo + bell with badge)
  - NotificationBadge async 컴포넌트는 layout에서 직접 호출 (Suspense 래핑)
  - InAppBanner client 컴포넌트 마운트

### G. Public API
- [x] `features/notification/index.ts` — 전체 재작성 (기존 stub 대체)

### H. 기존 stub 정리
- [x] `features/notification/components/InAppNotificationBanner.tsx` — DELETE (이름 변경: InAppBanner)
- [x] `features/notification/hooks/useDepartureReminders.ts` — DELETE (D 컴포넌트가 자체 fetch)

### I. 테스트
- [x] `tests/integration/notification.test.ts` — 8개 시나리오 (Functional Design §10)

---

## 외부 의존 정리

- M1 (`features/auth`): `requireUser`, `getCurrentUser` — Public API 호출
- 기존 lib 사용만: `lib/db.ts`, `lib/http.ts`, `lib/time.ts`
- M2 직접 import 없음 — `partyMembers`, `parties` 스키마는 `@/drizzle/schema`에서 직접 SELECT (Functional Design §6 의존 회피 결정)

---

## 빌드·테스트 절차

1. `pnpm install` (필요 시)
2. `drizzle/schema/notifications.ts` 작성 후 `pnpm db:generate` → 마이그레이션 sql 자동 생성
3. `pnpm db:migrate` (worktree DB 적용, 로컬 검증 용)
4. server 함수 + 컴포넌트 + API + 테스트 작성
5. `pnpm test` (unit + integration)
6. `pnpm lint`
7. `pnpm build`

---

## 커밋 메시지 초안 (한국어)

```
T-A notification 트랙 — M7 알림 도메인 구현

- notifications 테이블 신규 (4종 kind, 인덱스, FK SET NULL)
- 8 server 함수: list/markRead/markAllRead + 3종 fan-out (depart_soon idempotent)
- 4 UI 컴포넌트 (Badge / List / Item / InAppBanner) + /notifications 페이지
- 3 API Route Handler (GET, POST read-all, POST :id/read)
- (main) layout sticky header에 종 아이콘 + 배지 마운트
- 기존 stub 재작성 (D+0 시그니처 → 본 디자인으로 교체)
- integration test 8 시나리오 (markRead 권한, depart_soon idempotency 포함)
```
