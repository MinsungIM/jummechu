# 점메추 (jummechu)

사내 점심 메뉴 추천·파티 모집 시스템. Next.js 풀스택, SQLite 단일 파일, 4명 병렬 개발.

## 스택

- **Next.js 15** (App Router) + **React 19** + **TypeScript strict**
- **Tailwind CSS** (디자인 토큰은 `mock_uiux/jummechu.pen` 기반)
- **NextAuth (Auth.js)** + Credentials Provider + JWT 30일 슬라이딩
- **Drizzle ORM** + **better-sqlite3** + **SQLite** 단일 파일
- **Vitest** (unit / integration) + **Playwright** (E2E)
- 패키지 매니저: **pnpm**

## 디렉토리 구조

```
app/                    # Next.js App Router (얇은 page.tsx만)
  (auth)/               # 미인증 진입 (로그인·회원가입)
  (main)/               # 인증 보호 + 플로팅 탭바 레이아웃
  api/                  # Route Handlers (features의 public API 호출)
features/               # 모듈별 도메인 코드 — Public API는 index.ts만 외부 공개
  auth/         (M1)    # ✅ 실제 구현 — 회원가입·로그인·세션·PW 변경
  party/        (M2)    # stub — T-C 트랙
  restaurant/   (M3)    # stub — T-B 트랙
  rating/       (M4)    # stub — T-D 트랙
  recommendation/(M5)   # stub — T-D 트랙
  map/          (M6)    # stub — T-B 트랙
  notification/ (M7)    # stub — T-A 트랙
components/
  ui/                   # 공통 프리미티브 (Button, Input, Modal, Card)
  layout/               # FloatingTabBar (.pen comp_TabBar)
lib/                    # 횡단 (db / auth / time / http)
drizzle/schema/         # 9 테이블 Drizzle 스키마
tests/                  # unit / integration / e2e
```

## 시작하기

### 1. 의존성 설치
```bash
pnpm install
```

### 2. 환경 변수
```bash
cp .env.example .env.local
# NEXTAUTH_SECRET 채우기:
#   openssl rand -base64 32
# NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 발급 (T-B 트랙 단계에서 필요)
```

### 3. DB 마이그레이션 생성·실행
```bash
pnpm db:generate    # 스키마 변경 후 마이그레이션 SQL 생성
pnpm db:migrate     # SQLite 파일에 적용 (data/jummechu.db)
```

### 4. 개발 서버
```bash
pnpm dev
```

### 5. 테스트
```bash
pnpm test           # vitest (unit + integration)
pnpm test:e2e       # Playwright E2E
```

## 4 트랙 병렬 개발

`aidlc-docs/inception/application-design/unit-of-work.md` §4 트랙 병렬 개발 구성 참조.

| Track | 모듈 | 상태 |
|---|---|---|
| **T-A** | M1 auth + M7 notification | M1 실제 / M7 stub |
| **T-B** | M3 restaurant + M6 map | stub |
| **T-C** | M2 party | stub |
| **T-D** | M4 rating + M5 recommendation | stub |

각 트랙은 자기 모듈만 PR. 다른 트랙 함수는 `features/{module}/index.ts` stub을 import.
인터페이스 변경은 4명 합의 후 별도 PR.

## Public API 컨벤션 (강제)

`eslint.config.js`의 `no-restricted-imports` 규칙으로 강제됨:
- `features/{module}/index.ts`만 외부에서 import 가능
- `features/{module}/server/*`, `lib/*`, `components/*` 내부 경로 직접 import 금지

## 문서

- 요구사항: `requirements/lunch.md`, `requirements/UI.md`, `requirements/design.md`
- 기술 검토: `requirements/tech-review.md`
- 트래킹: `aidlc-docs/aidlc-state.md`, `aidlc-docs/audit.md`
- 단위 설계: `aidlc-docs/inception/application-design/`
- 디자인 mock: `mock_uiux/jummechu.pen` (pencil MCP로 열기)
