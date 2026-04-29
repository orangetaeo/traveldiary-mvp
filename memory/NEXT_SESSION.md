# TravelDiary 다음 세션 가이드

> **마지막 업데이트**: 2026-04-29
> **세션 상태**: 하네스 시스템 v2 (도서관 형태) 구축 완료

---

## ✅ 이번 세션 완료 사항

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

### 우선순위 1: DB 셋업 (T14 + R1 + R3)

```
1. Prisma 스키마 작성 (S-09 참조)
   - Trip, ItineraryItem, ItineraryDependency
   - Evidence (JSON), ValidationResult
   - User, TripMember
   - AuditLog ⭐ (S-13 절대 규칙)
   - EvidenceCache
2. PostgreSQL 마이그레이션 (Railway 또는 로컬)
3. Repository 레이어 (lib/repositories/)
```

### 우선순위 2: 핵심 API (T10 + R4 + T16 + T13)

```
1. Trip API — 생성, 조회, 수정 (감사 로그 동시)
2. Itinerary API — DAG 생성·재계획
3. Place API — 검색·검증 (T4)·근거 (T3)
모든 API에 입력 검증 + Rate Limit + 권한 체크
```

### 우선순위 3: M1 추천 근거 패널 (T1 + T3 + T4 + T17)

```
1. 일정 상세 화면 (LEVEL 1)
2. EvidencePanel 컴포넌트 (S-12)
3. 근거 부족 시 패널 숨김 로직
```

### 우선순위 4: M2 D-Day 모드 전환 (T7 + T17)

```
1. TravelModeContext (lib/types.ts)
2. detectModeTransition 로직 (S-04)
3. UI 색상 전환 (디자인 토큰)
4. 위치 권한 거부 시 fallback (T16)
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
