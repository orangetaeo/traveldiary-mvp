# Skill S-16: Self-Evolution Loop (자가 진화 루프)

> **스킬 유형**: 운영·품질
> **핵심**: KPT 회고 → 학습 추출 → 도서관/메모리 갱신 → 다음 사이클 적용
> **사용 에이전트**: T18 Self-Evolution Coach

## 진화의 5단계

```
1. 회고 (Retrospective, KPT)
        ↓
2. 학습 추출 (Insight Extraction)
        ↓
3. 분류 (Categorization)
        ↓
4. 저장 (Persistence — 메모리 + 도서관)
        ↓
5. 적용 (Application — 다음 사이클)
```

## STEP 1. KPT 회고

```markdown
## 회고 — [작업명]
**날짜**: YYYY-MM-DD
**참여 에이전트**: [...]
**작업 시간**: [hh:mm]

### Keep — 잘된 것
- 무엇이 효과적이었나?
- 어떤 패턴이 처음에 작동했나?

### Problem — 어려웠던 것
- 무엇이 막혔나?
- 어떤 가정이 틀렸나?
- 사용자가 어디서 답답해했나?

### Try — 다음에 시도
- 어떻게 다르게 할까?
- 어떤 새 패턴을 시도할까?
- 어떤 자료를 도서관에 추가할까?
```

## STEP 2. 학습 추출

각 KPT 항목에서 **재사용 가능한 학습**을 추출:

| 항목 | 일회성 | 학습 |
|------|--------|------|
| "T3가 후기 0건 처리 누락" | ❌ 일회성 | ✅ S-02에 분기 추가 (재사용 가능) |
| "오타 수정" | ✅ 일회성 | ❌ 학습 아님 |
| "사용자가 회의 강조" | ❌ 일회성 | ✅ feedback 메모리 (재사용 가능) |

> 일회성 이벤트는 회고에만 기록, 학습으로 승격하지 않음.

## STEP 3. 분류 (5가지 종류)

| 종류 | 저장 위치 | 예시 |
|------|----------|------|
| **신규 도메인 패턴** | `.claude/skills/` 새 파일 | "후기 0건 처리" |
| **기존 패턴 보강** | 기존 스킬 파일 갱신 | S-02에 분기 추가 |
| **사용자 선호** | auto-memory `feedback_*.md` | "다중 검증 강제" |
| **사용자 정보** | auto-memory `user_*.md` | 역할/스택 |
| **프로젝트 상태** | auto-memory `project_*.md` | 마일스톤·기간 |
| **안티 패턴** | auto-memory `feedback_anti.md` | "회의 없이 코드 작성 금지" |

## STEP 4. 저장 절차

### 4-1. auto-memory 저장

경로: `C:\Users\heros\.claude\projects\c--Projects-traveldiary-mvp\memory\`

각 파일 형식:

```markdown
---
name: memory_name
description: 1-line description
type: user | feedback | project | reference
---

(content)

(feedback/project 타입은 추가로:)
**Why:** 이유
**How to apply:** 적용 시점
```

저장 후 `MEMORY.md` 인덱스에 1줄 추가:

```markdown
- [Title](file.md) — one-line hook
```

### 4-2. 도서관 갱신

```
신규 스킬 파일 추가:
1. .claude/skills/<id>-<name>.md 작성
2. INDEX.md "🛠️ 3부 스킬" 표에 행 추가
3. CATALOG.md 키워드 인덱스 + 스킬 카탈로그에 추가
4. 통계 업데이트 (총 책 수)
5. CATALOG.md 변경 이력에 1줄 추가

기존 스킬 갱신:
1. 해당 .md 파일 수정
2. CATALOG.md 변경 이력에 1줄 추가
```

### 4-3. MEMORY.md 갱신

핵심 규칙 변동 시:
1. `memory/MEMORY.md`의 "🔄 업데이트 기록" 섹션에 1줄 추가
2. 필요 시 "🔑 핵심 규칙" 또는 "⚠️ 주의사항" 갱신

### 4-4. NEXT_SESSION.md 갱신

다음 세션 시작 시 알아야 할 사항을 1단락으로 갱신.

## STEP 5. 적용

다음 사이클 시작 시:

```
STEP 1 Triage 단계에서:
  ↓
T19 Harness Librarian이 도서관 검색
  ↓
지난 회고의 "Try" 항목 자동 적용
  ↓
auto-memory의 user/feedback 자동 로드
  ↓
같은 실수 반복 방지
```

## 진화 측정 지표

| 지표 | 목표 |
|------|------|
| 같은 종류 실수 반복률 | < 10% |
| 회고당 학습 추출 수 | ≥ 3건 |
| 도서관 갱신 빈도 | 사이클당 1~2건 |
| 사용자 피드백 반영 시간 | 즉시 (해당 사이클 내) |
| 도서관 검색 누락률 | < 5% |

## 트리거 패턴

진화가 **반드시** 발동되는 5가지 신호:

| 트리거 | 신호 |
|--------|------|
| 1. 같은 버그 2회 발생 | 회귀 테스트 + 스킬 보강 |
| 2. 사용자 명시적 피드백 | "이렇게 해", "그건 하지 마" |
| 3. T12 QA에서 환각 검출 | T4 검증 강화 |
| 4. T13 코드 리뷰 반려 3회+ | 체크리스트 또는 패턴 추가 |
| 5. 외부 변화 | API 변경, 의존성 업데이트 → CTO 게이트 → 패턴 갱신 |

## 사이클 종료 체크리스트

```
□ KPT 회고 작성됨
□ 학습 분류 완료 (각 항목별)
□ 신규 메모리 파일 저장됨
□ MEMORY.md 인덱스 업데이트
□ 도서관 갱신 (신규 스킬 또는 기존 갱신)
□ INDEX.md 통계 업데이트
□ CATALOG.md 변경 이력 1줄
□ 다음 사이클 액션 아이템 명시
□ NEXT_SESSION.md 갱신 (필요 시)
```

## 안티 패턴 (T18이 잡아야 할 것)

| 안티 패턴 | 대응 |
|----------|------|
| 회고 없이 사이클 종료 | T18 호출 강제 |
| 학습을 너무 많이 저장 | 일회성과 재사용 가능 구분 |
| 메모리만 갱신, 도서관 갱신 누락 | 4단계 모두 점검 |
| Try 항목이 모호 ("더 잘하자") | 구체적 액션으로 변환 강제 |

## 예시 회고

```markdown
## 회고 — M1 추천 근거 패널 구현

**날짜**: 2026-04-29
**참여 에이전트**: T1, T3, T4, T17, T12, T13
**작업 시간**: 3:20

### Keep
- 도서관 검색 → 팀 소집 흐름이 자연스러웠다
- T13이 보안 취약점 사전 발견 (IP 평문 로깅)

### Problem
- T3가 후기 0건 케이스 처리 누락 → T12가 발견
- 외부 API 모킹 부재 → 단위 테스트 작성 불가

### Try
1. S-02 evidence-gathering.md에 "근거 부족 시 처리" 분기 명시
2. `__tests__/test-utils/mocks.ts` 작성 (외부 API 모킹 헬퍼)
3. T12 체크리스트에 "후기 0건 시 패널 숨김" 추가

### 학습 분류
1. (Try 1) → 기존 스킬 보강 (S-02 갱신)
2. (Try 2) → 신규 도메인 패턴 (S-XX 신설)
3. (Try 3) → T12 에이전트 갱신
4. (Keep 2) → user/feedback 메모리: "T13 사전 보안 점검이 효과적"

### 도서관 갱신
- S-02 갱신 (분기 추가)
- INDEX.md 통계 unchanged
- CATALOG.md 변경 이력 1줄 추가

### 메모리 갱신
- feedback_security_pre_review.md 신규
- MEMORY.md 인덱스 1줄 추가
```

## 파일 위치

`c:\Projects\traveldiary-mvp\.claude\skills\self-evolution-loop.md`
