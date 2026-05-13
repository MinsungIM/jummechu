# 점심 메뉴 추천 시스템 - Application Design

> 작성: 2026-05-13
> 상태: 첫 cut — 섹션별 redirect 환영
> 연계: `./lunch.md` 요구사항 / `./UI.md` 화면 / `./tech-review.md` 기술 선정
> 스택: Next.js (App Router) + Route Handlers + NextAuth(Credentials) + Drizzle + better-sqlite3 + SQLite

> **이 문서의 범위**: 백엔드·DB·인증·라우팅 구현 구조. UI 화면 묘사는 `./UI.md`가 단일 출처. design.md는 "어떤 라우트가 어떤 화면을 렌더링하는지" 매핑 한 줄 + 백엔드 디테일.

---

## 1. Next.js 라우트 맵

> App Router 기준. UI.md의 T(탭)/F(플로우)/S(스택) 화면을 라우트에 매핑.

```
app/
├── (auth)/                          # 인증 그룹 레이아웃 (탭바 없음)
│   ├── login/page.tsx               # F1 로그인
│   └── signup/page.tsx              # F1 회원가입 (별도 라우트로 분리)
│
├── (main)/                          # 메인 그룹 레이아웃 (플로팅 탭바 §UI 1.2.1)
│   ├── page.tsx                     # T1 파티 리스트 탭 (대시보드 통합)
│   ├── map/page.tsx                 # T2 지도 탭
│   ├── settings/page.tsx            # T3 설정 탭
│   │
│   ├── parties/
│   │   ├── new/page.tsx             # F2 파티 생성 플로우 (단일 폼)
│   │   └── [partyId]/page.tsx       # S2 파티 상세
│   │
│   ├── restaurants/
│   │   ├── [restaurantId]/page.tsx  # S1 식당 상세
│   │   └── search/page.tsx          # S8 해시태그 검색 결과
│   │
│   └── history/
│       ├── page.tsx                 # S3 히스토리 목록
│       └── [partyId]/page.tsx       # S4 히스토리 상세 (재파티 진입점)
│
├── api/                             # Route Handlers (§2)
└── layout.tsx                       # 루트 레이아웃 (SessionProvider 등)
```

**MVP OUT 라우트** (참고용 — 만들지 않음): `S5 내 뱃지` / `S6 만족도 리스트 단독 페이지` / `S7 즐겨찾기 목록` / `F3 혼밥 매칭`. 모두 후속 에디션에서 추가.

**라우트 그룹 분리 이유**:
- `(auth)` — 미인증 진입점. 로그인된 상태에서 접근하면 `/`로 리다이렉트
- `(main)` — 인증 필수. NextAuth 미들웨어가 게이트. 플로팅 탭바 §UI 1.2.1 공통 레이아웃

---

## 2. API 표면 (Route Handlers)

> 전체 `app/api/*/route.ts`. 모든 엔드포인트는 인증 미들웨어 통과 후 호출 (단, `/api/auth/*` 제외).

| Method | Path | 용도 | UI 연결 |
|---|---|---|---|
| POST | `/api/auth/[...nextauth]` | NextAuth 자동 핸들러 (로그인·로그아웃·세션 조회) | F1 / T3 로그아웃 |
| POST | `/api/auth/signup` | 회원가입 (이름·이메일·패스워드) | F1 회원가입 |
| GET | `/api/parties` | 오늘의 파티 리스트 (정렬·태그 필터 쿼리) | T1 카드 리스트 |
| POST | `/api/parties` | 파티 생성 | F2 |
| GET | `/api/parties/:id` | 파티 상세 | S2 |
| PATCH | `/api/parties/:id` | 파티 수정 (파티장만) | S2 kebab |
| DELETE | `/api/parties/:id` | 파티 취소 (파티장만) | S2 kebab |
| POST | `/api/parties/:id/members` | 선착순 합류 | S2 합류 버튼 (M9) |
| DELETE | `/api/parties/:id/members/me` | 본인 탈퇴 | S2 |
| PUT | `/api/parties/:id/notice` | 한 줄 공지(B3) | S2 공지 작성 |
| GET | `/api/recommendations` | 오늘의 추천 메뉴 (최근성+랜덤 §1.4) | T1 3.2.C |
| GET | `/api/restaurants` | 식당 목록 (지도용·검색용) | T2 / S8 |
| GET | `/api/restaurants/:id` | 식당 상세 | S1 |
| POST | `/api/restaurants/:id/tags` | 식당 해시태그 추가 (M7) | S1 |
| GET | `/api/restaurants/:id/menus` | 추천 메뉴 리스트 | S1 |
| POST | `/api/restaurants/:id/menus` | 메뉴 추가 (M3) | S1 |
| POST | `/api/restaurants/:id/ratings` | 식당 평가(별점+태그 §1.4) — 다녀온 참여자만 | M1 |
| POST | `/api/menus/:id/ratings` | 메뉴 평가 — 다녀온 참여자만 | M2 |
| GET | `/api/tags` | 태그 자동완성·인기 태그 | M7 |
| GET | `/api/history/me` | 내 히스토리 (종료 파티) | S3 |

**MVP OUT 엔드포인트** (만들지 않음): `/api/badges`, `/api/solo`, `/api/favorites`, `/api/diet`, 비밀번호 재설정.

**모든 응답 표준 형식**: `{ data: T } | { error: { code, message } }`. 표준 에러 코드는 §6 미정.

---

## 3. DB 스키마 (Drizzle)

> SQLite 단일 파일. 모든 테이블 `id INTEGER PRIMARY KEY AUTOINCREMENT`, `created_at INTEGER` (unix ms).

### 3.1 관계도 (ASCII)

```
users ──┬──< parties (owner)
        ├──< party_members (user) >── parties
        ├──< restaurant_ratings (rater) >── restaurants
        └──< menu_ratings (rater) >── menus >── restaurants
                                                    │
                                       restaurant_tags >── tags
                                                    │
                              party.restaurant_id ─→ restaurants
```

### 3.2 테이블 정의

**users**
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | INTEGER PK | |
| email | TEXT UNIQUE NOT NULL | 식별자 |
| name | TEXT NOT NULL | 표시명 |
| password_hash | TEXT NOT NULL | bcrypt |
| team | TEXT | 선택 입력, §D1 통계용 |
| created_at | INTEGER | |

**parties** (인스턴스성, 1회 모임)
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | INTEGER PK | |
| owner_id | INTEGER FK→users | 파티장 |
| name | TEXT NOT NULL | 파티명 |
| restaurant_id | INTEGER FK→restaurants | nullable (직접 입력 case) |
| restaurant_name_freetext | TEXT | restaurant_id가 NULL일 때만 |
| depart_at | INTEGER NOT NULL | 출발 시각 (unix ms) |
| join_until | INTEGER NOT NULL | 참여 제한 시각 |
| place | TEXT | 모이는 장소 |
| price_band | TEXT | 가격대 (slider 값 직렬화) |
| capacity | INTEGER NOT NULL | 정원 (2 이상) |
| rules | TEXT | 자유 규칙 (사일런트 런치 프리셋은 별도 boolean) |
| is_silent | INTEGER (0/1) | 사일런트 런치 토글 |
| extra_schedule | TEXT | 커피숍/산책 자유 텍스트 |
| status | TEXT | `open` / `closed` / `cancelled` |
| created_at | INTEGER | |

**party_members** (선착순 합류)
| 컬럼 | 타입 | 비고 |
|---|---|---|
| party_id | INTEGER FK→parties | PK 일부 |
| user_id | INTEGER FK→users | PK 일부 |
| joined_at | INTEGER | 선착순 정렬 키 |

UNIQUE(party_id, user_id). 정원 초과 합류는 트랜잭션에서 `COUNT(*) < capacity` 검사 후 INSERT.

**restaurants**
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | INTEGER PK | |
| name | TEXT NOT NULL | |
| address | TEXT | |
| category1 | TEXT | 한/중/일/양 |
| category2 | TEXT | 세부 (김치찌개·파스타…) |
| wait_level | TEXT | `light`/`medium`/`heavy` |
| reservation_required | INTEGER (0/1) | |
| naver_place_id | TEXT | 네이버 지도 연동용 |
| lat | REAL | |
| lng | REAL | |
| created_at | INTEGER | |

**menus** (식당별 추천 메뉴)
| 컬럼 | 타입 |
|---|---|
| id | INTEGER PK |
| restaurant_id | INTEGER FK→restaurants |
| name | TEXT NOT NULL |
| price | INTEGER | KRW |
| created_at | INTEGER |

**tags** (해시태그 풀)
| 컬럼 | 타입 |
|---|---|
| id | INTEGER PK |
| label | TEXT UNIQUE NOT NULL | (정규화: lowercase, 공백 제거) |
| usage_count | INTEGER | 인기 태그 정렬용 |

**restaurant_tags** (다대다)
| 컬럼 |
|---|
| restaurant_id FK |
| tag_id FK |
| tagged_by FK→users |
| created_at |

PK(restaurant_id, tag_id).

**restaurant_ratings** — 식당 평가 (태그 중심 §1.4)
| 컬럼 | 비고 |
|---|---|
| id PK | |
| restaurant_id FK | |
| rater_user_id FK→users | |
| party_id FK→parties | 다녀온 파티 식별 (권한 검사용) |
| stars | INTEGER 1~5 (선택) |
| tags_json | TEXT — JSON 배열 (`#대기길다` `#가성비` 등) |
| created_at | |

UNIQUE(restaurant_id, rater_user_id, party_id). 동일 파티 내 1회만.

**menu_ratings** — 메뉴 평가 (별점 중심 §1.4)
| 컬럼 |
|---|
| id PK |
| menu_id FK |
| rater_user_id FK |
| party_id FK |
| stars INTEGER 1~5 NOT NULL |
| comment TEXT (한 줄) |
| created_at |

UNIQUE(menu_id, rater_user_id, party_id).

### 3.3 권한 규칙 (애플리케이션 레벨)

- 식당/메뉴 평가: `EXISTS (SELECT 1 FROM party_members pm JOIN parties p ON pm.party_id=p.id WHERE pm.user_id=:me AND p.restaurant_id=:rid AND p.status='closed')` 통과 시에만 INSERT 허용
- 파티 수정·취소·공지: `parties.owner_id = :me` 검사
- 합류: 트랜잭션에서 `(SELECT COUNT(*) FROM party_members WHERE party_id=:pid) < parties.capacity AND parties.join_until > now AND parties.status='open'`

### 3.4 인덱스

- `parties(depart_at, status)` — T1 오늘 파티 조회
- `restaurant_tags(tag_id)` — 태그 검색
- `restaurant_ratings(restaurant_id)` / `menu_ratings(menu_id)` — 집계
- `party_members(user_id)` — 내 히스토리

---

## 4. 인증·세션 구현 (NextAuth + Credentials)

### 4.1 구성

- `app/api/auth/[...nextauth]/route.ts` — NextAuth 핸들러
- Provider: `Credentials` (email/password)
- 세션 전략: **JWT** (DB 세션 테이블 없이, SQLite 부담 줄임)
- JWT 만료: **30일 + 슬라이딩 갱신** — 사용자 결정 "항상 로그인 유지"를 만료-없는 무한이 아닌 *충분히 긴 + 활동 시 갱신*으로 구현 (httpOnly 쿠키)
- 비밀번호 검증: `bcrypt.compare` (`password_hash`)

### 4.2 회원가입 흐름

`POST /api/auth/signup` — 별도 Route Handler (NextAuth 표준 외)
1. 입력 검증 (이메일 형식, 패스워드 8자+영숫자)
2. `users.email` UNIQUE 충돌 시 409
3. `bcrypt.hash(password, 10)` → `users` INSERT
4. 가입 즉시 NextAuth 세션 발급 (302 → `/`)

### 4.3 미들웨어 (`middleware.ts`)

- `(main)` 그룹: 세션 없으면 `/login`으로 리다이렉트
- `(auth)` 그룹: 세션 있으면 `/`로 리다이렉트
- `/api/*`: `getServerSession`으로 검증, 미인증 시 401 (단 `/api/auth/*`, `/api/auth/signup` 예외)

### 4.4 로그아웃

T3 설정 탭의 명시적 진입점 → `signOut()` 호출 → 쿠키 삭제 → `/login`

---

## 5. 컴포넌트 계층 / 렌더링 전략

### 5.1 기본 전략

- **Server Components 기본** — 데이터 페치는 서버에서. 카드 리스트·식당 상세·히스토리 등 정적 표면 다수
- **Client Components**는 인터랙션 필수 표면만:
  - F1 로그인/회원가입 폼
  - F2 파티 생성 폼 (접이식·미리보기)
  - T1 해시태그 칩 필터 (선택 상태 관리)
  - T2 지도 탭 (네이버 JS SDK)
  - M7 해시태그 자동완성 입력기
  - 모든 모달/바텀시트 (Radix UI 또는 자체 구현)

### 5.2 디렉토리 구조 (`components/`)

```
components/
├── layout/
│   ├── FloatingTabBar.tsx          # §UI 1.2.1 (Client)
│   └── DetachedFab.tsx             # 분리형 FAB
├── party/
│   ├── PartyCard.tsx               # T1 카드 (Server)
│   ├── PartyListFilter.tsx         # 해시태그 칩 + 정렬 (Client)
│   └── PartyCreateForm.tsx         # F2 단일 폼 (Client)
├── restaurant/
│   ├── RestaurantDetail.tsx        # S1 (Server, 인터랙션은 child Client)
│   ├── TagChipList.tsx             # (Client)
│   └── MenuList.tsx                # (Server)
├── modal/
│   ├── RestaurantRatingModal.tsx   # M1 (Client)
│   ├── MenuRatingModal.tsx         # M2 (Client)
│   ├── MenuAddModal.tsx            # M3 (Client)
│   ├── JoinConfirmModal.tsx        # M9 (Client)
│   └── TagInputModal.tsx           # M7 (Client, 자동완성)
├── map/
│   └── NaverMap.tsx                # T2 (Client, dynamic import)
└── ui/
    └── ... (공통 버튼/입력/카드 프리미티브)
```

### 5.3 데이터 페치 패턴

- Server Components — `db.query.*` 직접 호출 (Drizzle), API Route 거치지 않음
- Client Components — `fetch('/api/...')` 또는 SWR (선택)
- Mutation — Client에서 `fetch(POST/PATCH/DELETE)` → Route Handler → revalidate (필요 시 `revalidatePath`)

---

## 6. 미정 / 검토 / 잔여

- **에러 코드 체계** — `{ error: { code: 'PARTY_FULL' | 'NOT_AUTHORIZED' | ... } }` 표준화
- **NextAuth JWT 시크릿 운영** — `.env`로 충분 / Vault 같은 비밀 관리 필요?
- **백업 전략** — SQLite 파일 정기 스냅샷 (cron) + Litestream 같은 스트림 백업 검토
- **마이그레이션 도구** — Drizzle Kit으로 충분. 운영 마이그레이션 실행 시점 정책 (배포 훅?)
- **시간대** — 모든 시각은 unix ms 저장, UI에서 KST 표시. SQLite 자체엔 TZ 없음
- **동시 합류 트랜잭션 격리** — better-sqlite3는 동기 API, BEGIN IMMEDIATE로 충분할 듯
- **Naver Map API 키 보호** — `NEXT_PUBLIC_*`로 노출되니 도메인 제한 필수
- **테스트 전략** — Drizzle은 in-memory SQLite로 통합 테스트 쉬움. 단위 테스트 vs 통합 테스트 비중
- **로깅·모니터링** — 사내 도구 수준에서 어디까지 필요한지 (Sentry / pino / 콘솔만)

---

## 7. 다음 단계

- 이 design.md에 대한 redirect/수정 받기
- 확정되면 **Units Generation** — MVP를 [인증][파티 CRUD][지도][식당·메뉴 평가][추천 대시보드][해시태그 검색] 6개 단위 정도로 쪼개 구현 순서 잡기
