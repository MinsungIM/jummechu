# AI-DLC State Tracking

## Project Information
- **Project Name**: jummechu (점메추 — 점심 메뉴 추천)
- **Project Type**: Greenfield
- **Start Date**: 2026-05-13
- **Current Stage**: INCEPTION → Units Generation 진입 직전
- **Workspace Pattern**: 기존 `requirements/` 브레인스토밍 문서 패턴 유지 + `aidlc-docs/`에 트래킹 파일만 추가 (하이브리드)

## Workspace State
- **Existing Code**: No (greenfield)
- **Reverse Engineering Needed**: No
- **Workspace Root**: `/home/ims/source/github/jummechu`

## Code Location Rules
- **Application Code**: 워크스페이스 루트 (Next.js 구조, 추후 추가)
- **Brainstorming/Requirements**: `requirements/` 디렉토리 (lunch.md, UI.md, tech-review.md, design.md, constraints.md)
- **Design References**: `requirements/ref/` (ref1.png, design.md - Framer 가이드)
- **Pencil Design Files**: `mock_uiux/` (jummechu.pen)
- **AI-DLC Tracking**: `aidlc-docs/` (state + audit only)

## Extension Configuration
| Extension | Enabled | Decided At |
|---|---|---|
| security-baseline | Not Configured | (인증 결정 시 묵시적으로 OWASP 가이드 참조 — 정식 opt-in 절차 미실행) |
| testing | Not Configured | (Units Generation에서 결정 예정) |

> **Note**: Extension opt-in 정식 절차는 미실행. Units Generation 진입 전에 정리 권장.

## Stage Progress

### 🔵 INCEPTION PHASE
- [x] **Workspace Detection** — 2026-05-13. Greenfield 확정. 기존 `requirements/` 브레인스토밍 문서 존재
- [-] **Reverse Engineering** — SKIPPED (Greenfield)
- [x] **Requirements Analysis** — 산출물: `requirements/lunch.md`, `requirements/UI.md`, `requirements/tech-review.md`. Standard depth. 인증·기술 스택·MVP 범위·평가·추천 등 핵심 결정 모두 정리됨
- [-] **User Stories** — SKIPPED (사용자 명시 선택, Application Design 직진)
- [x] **Workflow Planning** — 비공식 (Q&A 대화를 통한 점진적 결정). 정식 산출물 없음. MVP 범위(§E2), 단위 분할 후보(design.md §7)로 대체
- [x] **Application Design** — 산출물: `requirements/design.md` (라우트/API/DB 스키마/인증/컴포넌트). 사전 결정 3종: NextAuth(Credentials) / Route Handlers / Drizzle
- [x] **Units Generation** — Part 1 Plan + Part 2 산출물 3종 생성 완료. **묵시적 승인** (사용자 "코드 기본 틀 만들어" 명령으로 진행 의사 확인)
  - Plan: `aidlc-docs/inception/plans/unit-of-work-plan.md` (5 결정 확정)
  - 산출물: `aidlc-docs/inception/application-design/unit-of-work.md`, `unit-of-work-dependency.md`, `unit-of-work-story-map.md`
  - 7 모듈 (M1 auth / M2 party / M3 restaurant / M4 rating / M5 recommendation / M6 map / M7 notification)
  - 4 트랙 병렬 (T-A/T-B/T-C/T-D)
  - DAG 검증 완료 (사이클 없음)

### 🟢 CONSTRUCTION PHASE
- [x] **D+0 Common Scaffolding** (per-unit loop 이전 단계 — unit-spanning 공통 골격) — 80 파일 한 배치 작성
  - **A 인프라**: package.json (Next.js 15 / React 19 / NextAuth / Drizzle / Vitest / Playwright), tsconfig, next.config, tailwind.config (mock_uiux/jummechu.pen 토큰 반영), postcss, eslint (Public API 강제), .gitignore, .env.example, drizzle.config
  - **B DB**: 9 테이블 Drizzle 스키마 (users, parties, party_members, restaurants, menus, tags, restaurant_tags, restaurant_ratings, menu_ratings)
  - **C lib**: db.ts, auth.ts (NextAuth Credentials + JWT 30일 슬라이딩), time.ts (KST 헬퍼), http.ts
  - **D middleware**: NextAuth withAuth 게이트
  - **E M1 auth 실제 구현**: getCurrentUser/requireUser/signupUser/changePassword + LoginForm/SignupForm/ChangePasswordForm/LogoutButton + 회원가입·패스워드 변경 API
  - **F UI 프리미티브** (mock 디자인 반영): Button, Input, Card, Modal, FloatingTabBar(yellow pill active + 분리형 FAB)
  - **G M2~M7 stub**: features/{party,restaurant,rating,recommendation,map,notification}/index.ts — Public API 시그니처 exhaustive, throw not implemented
  - **H app routes**: root layout + providers + (auth) login/signup + (main) layout/탭/도메인 페이지 placeholder
  - **I API stubs**: 13개 Route Handler 501 응답 + 인증 2개 실제 구현
  - **J 테스트 하네스**: vitest.config + playwright.config + smoke 3종 (unit/integration/e2e)
  - **K**: README setup 가이드
- [~] **Per-Unit Loop — T-C party 진행 중**
  - Functional Design 작성 (advisor 가이드 압축: 도메인 모델 + state machine + joinParty invariant + getDb 테스트 주입 + NFR inline)
  - NFR Requirements 별도 stage 대신 Functional Design에 inline (advisor 결정)
  - NFR Design + Infrastructure Design: **SKIP** (변경 없음)
  - Code Generation: 3 sub-batch로 분할 (1 Read path / 2 Write path / 3 History+extras) — 각 sub-batch 별 build·test·commit·push
- [ ] Per-Unit Loop — T-A notification / T-B restaurant+map / T-D rating+rec
- [ ] Build and Test (모든 트랙 완료 후)

### 🟢 CONSTRUCTION PHASE
- [ ] Per-Unit Loop (각 단위별 Functional Design / NFR / Code Generation)
- [ ] Build and Test

### 🟡 OPERATIONS PHASE
- [ ] Operations (placeholder)

## Key Decisions Snapshot

| 영역 | 결정 |
|---|---|
| 인증 | 이메일·패스워드 자체 회원가입, 도메인 화이트리스트 X, 이메일 인증 X, PW 재설정 MVP 제외, 세션 항상 유지 |
| PW 정책 | 최소 8자 + 영문·숫자 조합 |
| 스택 | Next.js 풀스택 + Route Handlers + NextAuth(Credentials) + Drizzle + better-sqlite3 + SQLite 단일 파일 |
| 지도 | 네이버 지도 |
| 인원 모델 | MVP: 선착순만. 정원 미달 그대로 진행 (자동 무산 X) |
| 추천 정렬 | 최근성 + 랜덤 (최근 N일 안 간 곳 우선) |
| 평가 형식 | 별점 + 태그 (메뉴=별점, 식당=태그 중심) |
| 평가 주체 | 다녀온 파티 참여자만 |
| MVP 범위 | §E2 — 인증 + 파티 CRUD + 지도 + 식당/메뉴 평가 + 추천 대시보드 + 해시태그 검색 + 출발 알림(인앱) + B3 공지 + §3.1 재파티 |

## Process Compliance Notes

- **2026-05-13 (Backfill)**: 초기 진행 시 `aidlc-docs/` 트래킹 파일을 만들지 않고 advisor 조언("formal 구조 신설하지 마라")을 따라 `requirements/` 패턴만 사용함. 사용자 지적 후 backfill 진행. 이후로는 CLAUDE.md 명시 지침대로 매 상호작용 로깅.
- **Question 파일 패턴**: `common/question-format-guide.md`의 "[Answer]: 태그 기반 질문 파일" 대신 채팅 내 `AskUserQuestion` 도구 사용. 사용자의 짧은 답변 톤에 맞춤. 모든 Q&A는 `audit.md`에 기록.
- **Welcome message**: 첫 응답에서 표시하지 않음 (기존 진행 중 프로젝트로 판단).
