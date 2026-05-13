# Unit of Work Plan (jummechu)

> Stage: **INCEPTION → Units Generation Part 1 (Planning)**
> 작성: 2026-05-13
> 입력 소스: `requirements/lunch.md`, `requirements/UI.md`, `requirements/design.md`, `requirements/tech-review.md`

## Decomposition Context

- **Deployment**: 단일 Next.js 앱 → 배포 단위 1개 (모놀리스)
- **Terminology**: 본 plan에서 "Unit of Work" = "**Module**" (서비스 분리 X, 코드 폴더·기능 경계로 분할)
- **Greenfield**: 새로 생성하는 코드. 코드 조직 전략을 plan 안에 명시 필요
- **Team**: 사내 도구, 작은 규모 가정 (1~소수 명)

## Default Proposal (논의 출발점)

> design.md §7 후보 + Application Design에서 도출. 사용자 [Answer]로 확정·조정.

| # | Module | 범위 (요구사항 ID) | UI 표면 | DB 테이블 (소유) |
|---|---|---|---|---|
| M1 | **auth** | §0 인증 (회원가입·로그인·세션·로그아웃·PW 변경) | F1, T3 일부 | `users` |
| M2 | **party** | §2 파티 CRUD, 선착순 합류, B3 공지, §3.1 재파티 | T1 파티 리스트, F2 생성, S2 상세, S3/S4 히스토리 | `parties`, `party_members` |
| M3 | **restaurant** | §3.2 식당 정보, §3.3 메뉴, §3.5 해시태그(태깅·검색) | S1 식당 상세, S8 검색, M7 입력기, T2 지도 마커 | `restaurants`, `menus`, `tags`, `restaurant_tags` |
| M4 | **rating** | §1.3 식당·메뉴 평가 (별점+태그, 다녀온 파티 참여자만) | M1, M2, S1 평가 영역 | `restaurant_ratings`, `menu_ratings` |
| M5 | **recommendation** | §1.1/§1.4 대시보드 추천 (최근성+랜덤), §1.2 만족도 TOP | T1 상단 3.2.C/3.2.D, M11 다시 뽑기 | (read-only — 다른 모듈 데이터 집계) |
| M6 | **map** | §4.1 네이버 지도 + 길찾기 딥링크 | T2 지도 탭, S1 길찾기 버튼 | (read-only — `restaurants` 좌표 사용) |
| M7 | **notification** | §B4 출발 임박 알림 (인앱 배너 우선) | N1 배너 | (없음 — 클라이언트 타이머 + 서버 broadcast 검토) |

**기각된 분할안 후보** (Step 7 분석용):
- M3을 [restaurant_core] + [tag] 두 모듈로 더 쪼개기 → 태그가 식당 단위 메타라 분리 시 의존 과다
- M2와 M5를 합치기 → 추천 로직이 파티와 평가·식당 모듈 모두에 의존하므로 별도 모듈이 깔끔
- M7을 M2에 흡수 → 알림은 파티 외 다른 트리거(예: §5.x 후속)에 재사용 가능하므로 분리

## Mandatory Artifacts Checklist (Part 2에서 생성)

- [x] `aidlc-docs/inception/application-design/unit-of-work.md` — 모듈 정의·책임·코드 조직 (Greenfield)
- [x] `aidlc-docs/inception/application-design/unit-of-work-dependency.md` — 의존성 매트릭스
- [x] `aidlc-docs/inception/application-design/unit-of-work-story-map.md` — MVP IN 요구사항·화면을 모듈로 매핑
- [x] 모듈 경계·의존성 검증 (DAG 사이클 없음 확인, M3↔M4 잠재 사이클은 M3→M4 일방향으로 해소)
- [x] 모든 MVP IN 요구사항이 모듈에 할당됨을 확인 (story-map.md 누락 검증 섹션)

---

## Planning Questions

> 사용자가 [Answer]: 옆에 A/B/C/D 또는 자유 텍스트로 답변. 본 plan은 채팅 `AskUserQuestion`과 병행 사용 — 채팅 답변을 받으면 AI가 [Answer]에 옮겨 적음.

### Q1. 모듈 분할 — 7개 default를 그대로 갈까요?

위 Default Proposal의 M1~M7 7개 모듈을 그대로 가는지, 합치거나 더 쪼개는지.

A) 그대로 7개 (M1 auth / M2 party / M3 restaurant / M4 rating / M5 recommendation / M6 map / M7 notification)
B) M5 recommendation을 M2 party에 흡수 (6개) — 추천 = 파티 생성 보조 기능으로 보기
C) M7 notification을 M2 party에 흡수 (6개) — 알림 = 파티 출발의 사이드 이펙트
D) M5, M7 모두 흡수 (5개) — 가장 단순
E) Other

[Answer]: A — 그대로 7개 유지 (각 모듈별 설명 확인 후 사용자 명시 선택)

### Q2. 코드 조직 — Next.js 안에서 모듈을 어떻게 표현?

Greenfield 코드 조직 전략. design.md §1 라우트 맵·§5 컴포넌트 구조 기반.

A) **Feature folders** — `features/{auth,party,restaurant,...}/` 아래에 컴포넌트·서버 함수·스키마 묶음. `app/` 라우트는 얇은 page.tsx만 두고 features를 import. **DDD-light + Next.js 친화.**
B) **Layered** — `components/`, `lib/db/`, `lib/api/` 식으로 종류별. 모듈 경계 약함. 빠른 시작 가능.
C) **Hybrid** — 도메인 모델·서비스 함수는 features별, UI 컴포넌트만 종류별 (`components/ui/`)
D) Other

[Answer]: A — Feature folders

### Q3. 모듈 간 의존성 — 직접 import 허용 vs 인터페이스 계층?

같은 Next.js 앱 안이라 직접 import는 어차피 가능. 단위 경계를 얼마나 강제할지.

A) **자유 import** — `features/party/...` 가 `features/restaurant/...` 함수를 바로 호출. 경계는 *convention*만.
B) **public API 컨벤션** — 각 features 폴더에 `index.ts`만 외부 노출. 내부 헬퍼는 import 금지 (ESLint `no-restricted-imports` 권장).
C) **이벤트 버스/큐로 분리** — 모듈 간 직접 호출 금지. 과한 분리, MVP에 비추천.
D) Other

[Answer]: B — Public API 컨벤션. features/*/index.ts만 외부 공개, 내부 import 금지 (ESLint 강제)

### Q4. 구현 순서 — 어느 모듈부터?

MVP 빌드 순서. 의존성 기반으로 합리적 default 제안.

A) **default 순서**: M1 auth → M3 restaurant(스키마·태그) → M2 party(CRUD·합류) → M4 rating → M6 map → M5 recommendation → M7 notification. *데이터 모델 아래에서 위로*
B) **빠른 데모 우선**: M2 party(임시 인증 우회) → M1 auth → M3 → M4 → M5/M6/M7. 시연 가능한 화면 빨리.
C) **수평 슬라이스**: 한 화면씩 (F1 로그인 → T1 파티 리스트 → F2 파티 생성 → ...) — 모듈 횡단으로 화면 단위 진행.
D) Other

[Answer]: D (Other) → **4명 병렬 분할**. 4 트랙 구성:
- **T-A**: M1 auth + M7 notification
- **T-B**: M3 restaurant + M6 map
- **T-C**: M2 party
- **T-D**: M4 rating + M5 recommendation

**병렬화 전제**:
1. 작업 시작 전 각 모듈 `features/*/index.ts` public API 시그니처 합의 (stub만)
2. design.md §3 9 테이블 Drizzle 마이그레이션 첫날 일괄 머지 — 각 트랙은 자기 테이블만 책임
3. T-D는 T-B/T-C의 in-memory mock으로 의존 해소 가능

### Q5. 테스트·문서 수준 — 모듈마다 어디까지?

CLAUDE.md `extensions/testing` 영향 받는 질문. MVP·사내 도구 톤 감안.

A) **가벼움** — 도메인 함수(`features/*/server/`)에 단위 테스트만. UI·E2E 없음.
B) **표준** — 단위 + 핵심 API Route Handler 통합 테스트 (Vitest + Drizzle in-memory). UI E2E는 인증/파티 합류 같은 critical path 1~2개만 Playwright.
C) **무거움** — 모든 모듈에 단위+통합+E2E. 사내 도구엔 과함.
D) Other

[Answer]: C — 무거움 (모든 모듈에 unit+통합+E2E). 4명 병렬 작업에서 모듈 간 계약을 테스트로 고정하기 위함

---

## Step 7 Analysis (2026-05-13)

**모호한 응답**: 없음.
**모순**: 없음. Q5 "무거움" 선택은 의외이나 Q4의 "4명 병렬"이라는 맥락에서 *모듈 간 계약을 테스트로 고정*하려는 의도와 일관됨.
**미정의 용어**: 없음. 모든 선택지가 명시 옵션 또는 명확한 자유 텍스트.
**Combined options**: 없음.

**의도 해석 (소프트 클러스터링)**:
- 사용자 선택의 일관된 메시지: **"각 모듈을 명확한 경계로 분리하고, 4명이 독립 진행할 수 있도록 인터페이스·테스트로 계약 고정"**
- Q2 Feature folders + Q3 Public API + Q4 4 트랙 + Q5 무거운 테스트 = 모두 *경계 강화·계약 고정* 패턴
- 인증 단계에서 보였던 "간단하게" 톤과는 다르지만, 협업·확장 관점에서는 합리적 전환

**리스크 메모 (구현 단계에서 다룸, 본 plan에 차단 요인 아님)**:
- "무거움" 테스트가 4명 병렬의 속도를 잡아먹을 수 있음 → 트랙 시작 시 각 모듈 *contract test* 우선 작성, E2E는 critical path부터 점진 확장 권장
- E2E 시나리오 정의는 Code Generation 단계에서 구체화

**Follow-up 필요 여부**: 없음. Step 9 승인 요청으로 진행.

---

## Step 9 Approval Prompt

> 모든 답변 수령 + 모호성 해소 후, AI가 다음 문구로 승인 요청:
>
> *"Unit of work plan complete. Review the plan in `aidlc-docs/inception/plans/unit-of-work-plan.md`. Ready to proceed to generation?"*
