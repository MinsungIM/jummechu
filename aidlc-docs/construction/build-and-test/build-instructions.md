# Build Instructions — jummechu

> Per CLAUDE.md AIDLC Build and Test stage. 모든 트랙(T-A/T-B/T-C/T-D) 머지 후 통합 빌드.

## Prerequisites

| 항목 | 버전·조건 |
|---|---|
| Node.js | 18.18+ (Next.js 16 요구) |
| pnpm | 9.0+ (`packageManager` 필드 고정) |
| SQLite | better-sqlite3 (네이티브 빌드) — Python 3 + 빌드 도구 필요 |
| 환경변수 | `.env` (아래 §2 참조) |

## Build Steps

### 1. Install Dependencies

```bash
pnpm install
```

- `pnpm-lock.yaml` 사용. `--frozen-lockfile`은 CI에서 사용.
- better-sqlite3 빌드 실패 시: `pnpm rebuild better-sqlite3`.

### 2. Configure Environment

`.env` 파일 작성:

```bash
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=./data/jummechu.db
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=<NCP Maps JS SDK Client ID>
# NAVER_SECRET=<server-only key, NCP REST API 구독 시>  ← NEXT_PUBLIC_ prefix 금지
```

`.env`는 gitignored. 운영 배포 시 시크릿 매니저(또는 .env.production) 사용.

### 3. Build All Units

```bash
# DB 마이그레이션 적용 (최초 1회 + 스키마 변경 시)
pnpm db:migrate

# Next.js 프로덕션 빌드
pnpm build
```

빌드 대상은 단일 Next.js 앱(모놀리스). 7 모듈은 `features/{module}/` 디렉토리로 분리되어 있지만 빌드는 한 번에 처리.

### 4. Verify Build Success

```bash
pnpm build 2>&1 | tail -30
```

기대 출력:
- `✓ Compiled successfully`
- `✓ Generating static pages`
- 28개 routes 표시 (Static 6 + Dynamic 22, middleware proxy 포함)
- 마지막 에러 없음

추가 검증:

```bash
pnpm lint    # ESLint flat config + Public API 컨벤션
pnpm test    # Vitest unit + integration (109 tests)
```

## Troubleshooting

### Build Fails with Dependency Errors

- `Cannot find module 'better-sqlite3'`: `pnpm rebuild better-sqlite3`
- `next-auth` peer 충돌: `pnpm install` 재실행
- ESLint `Cannot find module '@typescript-eslint/parser'`: 의존성 누락 → `pnpm install`

### Build Fails with Compilation Errors

- TypeScript strict mode. `pnpm exec tsc --noEmit`로 별도 검증 가능.
- `Cannot open database`: `data/` 디렉토리 생성 후 `pnpm db:migrate`.
- `useSearchParams() should be wrapped in a suspense boundary`: 클라이언트 컴포넌트에서 `<Suspense>` 누락. 기존에 `app/(auth)/login/page.tsx`에 적용 완료.

### Naver Maps Open API 401 (브라우저 콘솔)

- "네이버 지도 Open API 인증이 실패했습니다"
- NCP 콘솔에서 **Web Service URL**에 운영·로컬 도메인 등록 필요.
- 미설정 시 placeholder UI로 graceful degradation (`features/map/components/NaverMap.tsx`).

### Middleware deprecated 경고

- Next 16: `middleware.ts` → `proxy.ts`로 이름 변경 예정. 현재는 동작은 정상, 경고만 표시. 후속 작업.
