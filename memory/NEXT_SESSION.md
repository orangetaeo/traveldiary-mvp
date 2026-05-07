# TravelDiary 다음 세션 가이드

> **마지막 업데이트**: 2026-05-07
> **세션 상태**: 6개 도시 Place DB 4,324곳 완성

---

## ✅ 최근 세션 완료 사항

### 4개 도시 시드 파이프라인 확장 (2026-05-07)

- **Google Places API 파이프라인**: 호치민(836), 하노이(565), 나트랑(606), 달랏(486) — 총 2,493곳 수집·정제
- **프로덕션 DB 적재**: 기존 PQC(756)+DAD(1,075) 포함 **6개 도시 총 4,324곳** upsert 완료
- **파이프라인 config 확장**: 21개 zone 추가 (hcm 6, han 5, nha 5, dl 5)
- **ZONE_LABEL 매핑**: place.repository.ts + 06-export-discover.ts에 한글 zone 라벨 33개
- **ID prefix 매핑**: hcm/han/nha/dl prefix (05-phase-b-refine.ts)
- **시드 인덱스**: lib/seed/places/index.ts 6개 도시 통합
- **photo_reference 정리**: CI secret scan false positive 해결
- **프로덕션 검증**: 6개 도시 discover 페이지 전체 정상 확인
- **PR**: #254

### DB Place → UI 연결 (2026-05-07)

- **Prisma 마이그레이션**: `add-place-model` → Place 테이블 프로덕션 DB 생성
- **시드 적용**: 푸꾸옥 752곳 + 다낭 1,075곳 = 1,827곳 프로덕션 DB 적재
- **시드 버그 수정**: `prisma/seed.ts`에 Prisma 7 PrismaPg 드라이버 어댑터 누락 수정
- **DB 연결**: `place.repository.ts`에 `getDiscoverPlaces()` 추가 — DB Place → DiscoverPlace 변환
- **discover 페이지 + itinerary 페이지**: DB 우선 조회 → 시드 fallback
- **ItineraryView**: 시드 직접 import 제거 → suggestions props 수신
- **데이터 정합성**: 다낭 시드에 푸꾸옥 장소 오분류 1건 제거 (Pepper Farm)
- **데모 trip ID 별칭**: `demo-phu-quoc` → `demo-trip-phu-quoc` 등 6개 도시 대응
- **Railway 배포**: 공개 DB URL (`switchback.proxy.rlwy.net`) 사용 로컬 마이그레이션/시드 패턴 확립
- **PR**: #231 (DB 연결), #233 (오분류 제거), #238 (별칭 지원)

### 하네스 시스템 v2 (도서관 형태) 구축

```
.claude/
├── INDEX.md              # 마스터 목차 (62권)
├── CATALOG.md            # 키워드 인덱스 + 상세 카탈로그
├── HARNESS.md            # 5단계 작업 프로세스 매뉴얼
├── agents/               # 19개 도메인 에이전트
│   ├── T1~T11 (기존)
│   └── T12~T19 (신규)
└── skills/               # 19개 도메인 스킬
    ├── S-01~S-06 (기존)
    └── S-07~S-19 (신규)

memory/
├── MEMORY.md             # 핵심 규칙 (5가지 절대 규칙)
└── NEXT_SESSION.md       # 이 파일
```

### 새로 추가된 에이전트 (T12~T19)

| # | 에이전트 | 역할 |
|---|---------|------|
| T12 | QA Lead | 도메인 QA·환각 검출 |
| T13 | Code Reviewer | 다중 코드 리뷰 |
| T14 | DB Architect | Prisma·DAG 영속화 |
| T15 | DevOps Engineer | Railway 배포 |
| T16 | Security Engineer | OWASP·인증·프라이버시 |
| T17 | UX/UI Designer | 디자인 시스템·LEVEL |
| T18 | Self-Evolution Coach | 회고·자가 진화 |
| T19 | Harness Librarian | 도서관 사서·검색 |

### 새로 추가된 스킬 (S-07~S-19)

| ID | 스킬 |
|----|------|
| S-07 | OCR Translation |
| S-08 | Allergen Filter (한국인 특화) |
| S-09 | Prisma Schema Design |
| S-10 | Railway Deploy Pattern |
| S-11 | API Security |
| S-12 | UX Design System |
| **S-13** | **Audit Log Pattern** ⭐ 절대 규칙 |
| S-14 | Test Strategy |
| S-15 | Code Review Checklist |
| S-16 | Self-Evolution Loop |
| S-17 | Parallel Team Orchestration |
| **S-18** | **CTO Review Gate** ⭐ 절대 규칙 |
| S-19 | Librarian Search |

---

## 🚦 다음 세션에서 반드시 준수 — 5가지 절대 규칙

```
1. 하네스 5단계 작업 프로세스 (회의 없이 코드 금지)
2. CTO 사인오프 (기술 결정 시)
3. 다중 검증 4단계 (한 번에 OK 금지)
4. 감사 로그 (변경 API 동시 구현)
5. T18 회고 (세션 종료 전)
```

**자세한 절차**: [memory/MEMORY.md](MEMORY.md)

---

## 📌 다음 세션 우선순위

### 우선순위 1: 사용자 흐름 갭 마무리 (6/8 완료)

```
남은 갭:
- 사이클 6: G1+G2 4-OAuth 게이트 batch
- 사이클 8: G3 로그아웃/계정 삭제
```

### 우선순위 2: Place 데이터 활용 (시드 완료)

```
1. ✅ 베트남 6개 도시 시드 완료 (4,324곳) — PR #254
2. Place → ItineraryItem 연결 (일정 추가 시 DB 장소 정보 활용)
3. 장소 검색 API (키워드/카테고리/지역 필터)
4. Naver 블로그 증거 수집 (NAVER_CLIENT_ID/SECRET 설정 후 03단계)
```

### 우선순위 3: Place 데이터 품질

```
1. 시드 파이프라인 zone 분류 정확도 개선
2. 도시 간 오분류 자동 탐지 스크립트
3. photo_reference → 실제 이미지 URL 변환
```

### 참고: Railway 로컬 마이그레이션/시드 패턴

```bash
# 공개 DB URL로 마이그레이션 (internal URL은 로컬에서 접근 불가)
DATABASE_URL="postgresql://postgres:***@switchback.proxy.rlwy.net:53253/railway" npx prisma migrate dev --name <name>

# 시드 실행
DATABASE_URL="..." npx tsx prisma/seed.ts
```

---

## 🎯 작업 시작 시 첫 응답 패턴 (HARNESS §8)

새 작업이 들어오면 다음 형식으로 답하기:

```
1. (사용자 요청 1줄 재정의)
2. 도서관 검색 결과:
   - 회의 멤버: [...]
   - 참고 스킬: [...]
   - 매직 모먼트 매핑: M?
   - CTO 게이트 필요? (Yes/No)
3. STEP 1 Triage 시작.
   [TodoWrite 호출 → 5단계 등록]
```

---

## 🔗 빠른 링크

| 파일 | 용도 |
|------|------|
| [CLAUDE.md](../CLAUDE.md) | 프로젝트 메인 |
| [memory/MEMORY.md](MEMORY.md) | 핵심 규칙 |
| [.claude/INDEX.md](../.claude/INDEX.md) | 도서관 목차 |
| [.claude/CATALOG.md](../.claude/CATALOG.md) | 상세 카탈로그 |
| [.claude/HARNESS.md](../.claude/HARNESS.md) | 운영 매뉴얼 |
| [docs/01-vision.md](../docs/01-vision.md) | 프로젝트 비전 |
| [docs/04-data-model.md](../docs/04-data-model.md) | DAG 데이터 모델 |

---

## 🚀 시작 방법

```bash
cd c:\Projects\traveldiary-mvp

# 의존성 설치 (이미 완료)
npm install

# 개발 서버
npm run dev
```

---

## 📝 다음 세션 시작 체크리스트

```
□ memory/MEMORY.md 5가지 절대 규칙 확인
□ .claude/INDEX.md 마스터 목차 펼치기
□ 사용자 요청 도착 → T19 Harness Librarian 호출
□ Triage 보고서 작성 (회의 멤버 + 참고 스킬)
□ STEP 2 회의 진입 (병렬 호출)
```
