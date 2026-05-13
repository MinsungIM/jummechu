# Unit of Work — Story Map (jummechu)

> 작성: 2026-05-13
> 입력: `requirements/lunch.md §E2 MVP 범위`, `requirements/UI.md` (T/F/S/M 화면), `requirements/design.md §2` (API), `unit-of-work.md` (모듈 정의)
> 목적: MVP IN 모든 요구사항·UI 화면·API가 7 모듈 중 정확히 하나에 (또는 명시적으로 여러 모듈에 분산) 할당됨을 검증

> **Note**: 본 프로젝트에서 정식 User Stories 단계는 사용자 선택으로 SKIP. 본 문서는 *요구사항·화면·API → 모듈* 매핑으로 동등한 역할 수행.

## MVP IN 요구사항 → 모듈 매핑

### §0 인증
| 요구사항 | 모듈 | 비고 |
|---|---|---|
| 회원가입 (이름·이메일·패스워드 3필드) | M1 auth | |
| 로그인 / 로그아웃 / 세션 유지 | M1 auth | 세션 항상 유지 (30일 슬라이딩) |
| 패스워드 변경 | M1 auth | T3 프로필 |
| 도메인 화이트리스트 X / 이메일 인증 X / 가입 즉시 진입 | M1 auth | 기본 동작 |

### §2 파티
| 요구사항 | 모듈 | 비고 |
|---|---|---|
| 파티 생성 (이름·출발시각·제한시각·장소·식당·가격대·정원·규칙·추가스케줄) | M2 party | F2 폼 |
| 파티 목록 (당일 모집 중) | M2 party | T1 카드 |
| 파티 상세·합류·탈퇴 | M2 party | S2 + M9 합류 확인 |
| 선착순 합류 (트랜잭션 정원 검사) | M2 party | 동시성 처리 |
| 파티장 공지 (B3) | M2 party | S2 공지 영역 |
| 파티 수정·취소 (파티장만) | M2 party | 권한 검사 |
| 정원 미달 시 그대로 진행 | M2 party | 자동 무산 X (§C2 OUT) |
| 사일런트 런치 프리셋 토글 (§5.1 MVP OUT)이지만 폼 필드는 존재? | (MVP OUT) | 화면에서 토글은 노출하지 않음 (UI.md F2-7) |

### §3.1 재파티 생성
| 요구사항 | 모듈 |
|---|---|
| 히스토리에서 동일 조건 재생성 | M2 party (`getPartyForReclone` + `createParty`) |

### §3.2 식당 정보 스키마
| 요구사항 | 모듈 |
|---|---|
| 식당 등록 (이름·주소·카테고리1·카테고리2·대기도·예약필수) | M3 restaurant |
| 식당 좌표 (네이버 place_id 연동) | M3 restaurant |

### §3.3 추천 메뉴 (식당별)
| 요구사항 | 모듈 |
|---|---|
| 메뉴 추가 (메뉴명·가격) | M3 restaurant |
| 식당별 메뉴 리스트 | M3 restaurant |

### §3.5 해시태그 (태깅·검색)
| 요구사항 | 모듈 |
|---|---|
| 식당에 해시태그 부여 | M3 restaurant |
| 해시태그 자동완성 입력기 (M7) | M3 restaurant |
| 인기 태그 칩 노출 | M3 restaurant |
| 해시태그 검색 결과 (S8) | M3 restaurant |
| 칩 필터 (T1 sticky 필터 바) | M3 restaurant (데이터) + M2 party (적용 — `listOpenParties` filter) |

### §3.4.1 메뉴 평가 분리 + §1.3 식당·메뉴 평가
| 요구사항 | 모듈 |
|---|---|
| 식당 평가 (별점+태그, 다녀온 참여자만) | M4 rating |
| 메뉴 평가 (별점+한줄, 다녀온 참여자만) | M4 rating |
| 평가 권한 검사 | M4 rating (`canRate`) |
| 평균 별점 집계 (S1 식당 상세) | M4 rating (`getAvgRating`) |
| 식당 태그 빈도 집계 (M1 모달의 자주 쓰인 태그 노출) | M4 rating (`getRestaurantTagFrequency`) |

### §1.1/§1.4 대시보드 추천
| 요구사항 | 모듈 |
|---|---|
| 오늘의 추천 카드 (T1 3.2.C) | M5 recommendation |
| 최근성+랜덤 정렬 (최근 N일 안 간 식당 우선) | M5 recommendation |
| 카드 탭 → 파티 생성으로 직진 (메뉴·식당 프리필) | M5 recommendation (데이터) + M2 party (생성 호출) |
| 다시 뽑기 (M11) | M5 recommendation (`reshuffleRecommendations`) |

### §1.2 음식점 만족도 리스트
| 요구사항 | 모듈 |
|---|---|
| 만족도 TOP 리스트 (T1 3.2.D + S6) | M5 recommendation (`getSatisfactionTop` — M4 데이터 집계) |

### §4.1 지도
| 요구사항 | 모듈 |
|---|---|
| 지도 탭 (T2) | M6 map |
| 식당 마커 (카테고리 색·대기도 테두리·만족도 뱃지·예약필수 🔒) | M6 map (시각화) + M3 (데이터) + M4 (평균 별점) |
| 길찾기 외부 딥링크 | M6 map (`buildNaverDirectionsUrl`) |

### §B3 멤버 공지
| 요구사항 | 모듈 |
|---|---|
| 파티장 한 줄 공지 작성·노출 | M2 party (`setNotice` + `PartyDetail.notice`) |

### §B4 출발 임박 알림
| 요구사항 | 모듈 |
|---|---|
| 출발 N분 전 알림 (인앱 배너 N1) | M7 notification |
| 사용자 토글 (T3 알림 ON/OFF) | M7 notification (UI) + M1 (선호 저장 — 향후) |

---

## UI 화면 → 모듈 매핑 (UI.md 기준)

| UI ID | 화면명 | 1차 책임 모듈 | 보조 모듈 (read) |
|---|---|---|---|
| **F1** | 로그인 / 회원가입 | M1 auth | — |
| **F2** | 파티 생성 플로우 | M2 party | M3 restaurant (식당 선택), M5 recommendation (프리필) |
| **F3** | 혼밥 매칭 (MVP OUT) | — | — |
| **T1** | 파티 리스트 탭 (대시보드 통합) | M2 party (카드 리스트) | M5 recommendation (상단 카드+만족도), M3 restaurant (해시태그 칩) |
| **T2** | 지도 탭 | M6 map | M3 restaurant (마커 데이터), M4 rating (만족도 뱃지) |
| **T3** | 설정 탭 | M1 auth (이메일·PW·로그아웃) | M7 notification (알림 토글), 기타 미정 |
| **S1** | 식당 상세 | M3 restaurant (식당·메뉴·태그) | M4 rating (평균·태그 빈도), M6 map (미니뷰·길찾기), M2 party (여기서 파티 만들기) |
| **S2** | 파티 상세 | M2 party (정보·멤버·공지·합류) | M3 restaurant (식당 정보 카드) |
| **S3** | 히스토리 목록 | M2 party (`listMyHistory`) | M3 restaurant (해시태그 칩 필터) |
| **S4** | 히스토리 상세 (재파티) | M2 party (`getPartyForReclone`) | — |
| **S5** | 내 뱃지 (MVP OUT) | — | — |
| **S6** | 만족도 리스트 | M5 recommendation (`getSatisfactionTop`) | M4 rating (집계), M3 restaurant (이름) |
| **S7** | 즐겨찾기 식당 (MVP OUT) | — | — |
| **S8** | 해시태그 검색 결과 | M3 restaurant (`searchRestaurantsByTag`) | — |
| **M1** | 식당 평가 모달 | M4 rating | M3 restaurant (자주 쓰인 태그 자동완성) |
| **M2** | 메뉴 평가 모달 | M4 rating | M3 restaurant (메뉴 정보) |
| **M3** | 메뉴 추가 모달 | M3 restaurant | — |
| **M4** | 메뉴판 뷰어/업로더 (MVP 보류 — 이미지 업로드 인프라 미정) | (보류) | — |
| **M5** | 한줄 후기 (§B5 MVP OUT) | — | — |
| **M6** | 영수증 메모 (§D3 MVP OUT) | — | — |
| **M7** | 해시태그 입력기 | M3 restaurant (`suggestTags`, `tagRestaurant`) | — |
| **M8** | 정렬/필터 시트 | M2 party (적용) | M3 restaurant (태그 풀) |
| **M9** | 파티 합류 확인 | M2 party (`joinParty`) | — |
| **M10** | 파티장 위임 (§C4 MVP OUT) | — | — |
| **M11** | 다시 뽑기 | M5 recommendation (`reshuffleRecommendations`) | — |
| **M12** | 동명이인 보조 (제거됨) | — | — |
| **M13** | 사일런트 런치 토글 (§5.1 MVP OUT) | — | — |
| **N1** | 출발 임박 배너 | M7 notification | M2 party (`listMyOpenParties`) |
| **N2** | 모집 마감/정원 충족 | M2 party (상태 변경 + 배너) | — |
| **N3** | 정원 미달 자동 무산 (§C2 MVP OUT) | — | — |
| **N4** | 랜덤 선정 결과 (인원 모델 MVP OUT) | — | — |
| **N5** | 다른 혼밥러 알림 (§5.2 MVP OUT) | — | — |
| **N6** | 빈 상태 메시지 | 각 모듈 UI 컴포넌트 (공통 패턴) | — |

**MVP OUT 화면 (참고)**: F3, S5, S7, M4, M5, M6, M10, M12, M13, N3, N4, N5. 후속 에디션에서 모듈에 추가.

---

## API 엔드포인트 → 모듈 매핑 (design.md §2 기준)

| Method | Path | 모듈 |
|---|---|---|
| POST | `/api/auth/[...nextauth]` | M1 |
| POST | `/api/auth/signup` | M1 |
| GET | `/api/parties` | M2 |
| POST | `/api/parties` | M2 |
| GET | `/api/parties/:id` | M2 |
| PATCH | `/api/parties/:id` | M2 |
| DELETE | `/api/parties/:id` | M2 |
| POST | `/api/parties/:id/members` | M2 |
| DELETE | `/api/parties/:id/members/me` | M2 |
| PUT | `/api/parties/:id/notice` | M2 |
| GET | `/api/recommendations` | M5 |
| GET | `/api/restaurants` | M3 |
| GET | `/api/restaurants/:id` | M3 |
| POST | `/api/restaurants/:id/tags` | M3 |
| GET | `/api/restaurants/:id/menus` | M3 |
| POST | `/api/restaurants/:id/menus` | M3 |
| POST | `/api/restaurants/:id/ratings` | M4 |
| POST | `/api/menus/:id/ratings` | M4 |
| GET | `/api/tags` | M3 |
| GET | `/api/history/me` | M2 |

**MVP OUT API**: 비밀번호 재설정 / 즐겨찾기 / 뱃지 / 혼밥 / 식이 제한 — 만들지 않음.

---

## DB 테이블 → 모듈 소유

| 테이블 | 소유 모듈 | 다른 모듈에서 read |
|---|---|---|
| `users` | M1 | M2 (멤버 표시), M4 (rater 표시), M5 (개인화) |
| `parties` | M2 | M4 (권한 검사), M5 (히스토리 집계), M7 (출발 임박 조회) |
| `party_members` | M2 | M4 (권한 검사), M5 (방문 이력) |
| `restaurants` | M3 | M2 (파티 식당 정보), M4 (평가 대상), M5 (추천), M6 (지도 마커) |
| `menus` | M3 | M4 (메뉴 평가) |
| `tags` | M3 | M2 (필터링) |
| `restaurant_tags` | M3 | M2 (필터링) |
| `restaurant_ratings` | M4 | M3 (식당 상세 평균), M5 (만족도 TOP) |
| `menu_ratings` | M4 | — |

**원칙**: 다른 모듈은 자기 소유가 아닌 테이블에 **직접 쿼리하지 않음**. 항상 소유 모듈의 public API를 통과.

---

## 누락 검증

✅ `lunch.md §E2 MVP IN` 모든 항목이 7 모듈에 매핑됨 (위 매핑 표 참조)
✅ `UI.md` MVP IN 화면 모두 모듈 할당됨 (MVP OUT은 명시 제외)
✅ `design.md §2` 20개 엔드포인트 모두 모듈 할당됨
✅ 9개 DB 테이블 소유 모듈 명확 (테이블 소유권 단일)

⚠️ **미해소 항목** (구현 단계에서 처리, 본 단계 블로킹 아님):
- N1 배너의 정확한 발송 트리거 (클라이언트 폴링 주기 / 서버 SSE) — `design.md §6` 미정과 동일
- N2 모집 마감/정원 충족 알림의 표시 위치 — 화면 매핑 추가 검토 필요 (UI.md에 별도 표면 없음 — 인앱 토스트로 처리?)
- M11 다시 뽑기 쿨다운/횟수 정책 — UI.md §6 미정 그대로

이 3건은 모듈 경계와 무관, Construction의 Code Generation Part 1 Planning에서 다룸.
