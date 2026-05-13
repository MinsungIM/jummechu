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
- [ ] **Units Generation** — 다음 단계. MVP를 [인증][파티 CRUD][지도][식당·메뉴 평가][추천 대시보드][해시태그 검색] 6개 단위 후보로 쪼개기

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
