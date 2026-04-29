# 사이클 1 회고 (T18 Self-Evolution Coach) — KPT

**날짜**: 2026-04-29
**범위**: 사이클 1 (기반 + M1 — 푸꾸옥 시드, Trip·ItineraryItem 모델, 일정 생성/전체/상세 화면, 추천 근거 패널)
**참여**: T18 단독 정리 + 모든 에이전트 산출물 통합

---

## Keep (계속)

1. **5단계 프로세스를 그대로 밟았다** — Triage → 회의 합의문/ADR → 구현 → 4단계 검증 → 회고. 사용자가 "전체 구현"을 요청했지만 사이클 분할로 다중 검증 원칙을 지킬 수 있었다.
2. **CTO 게이트가 실효성 있었다** — `tsx`·`framer-motion`·`zod` 추가 욕구를 ADR-010으로 즉시 차단. 결과적으로 의존성 0개 추가로 사이클 종료.
3. **데모 모드 폴백 전략(ADR-009)** — DB 미연결 상태에서도 화면이 동작 → 사용자에게 즉시 시연 가능.
4. **도서관 검색 → 책 펼치기** 순서가 작동했다. INDEX → CATALOG → 개별 .md 3단계로 핵심 파일만 펼쳐 STEP 2 회의 자료 확보.

## Problem (어려웠던 것)

1. **Prisma 7 schema 변경 미반영** — 도서관의 S-09(prisma-schema-design.md)는 Prisma 6 패턴으로 작성되어 있어 STEP 4 검증 단계에서 generate 실패. ADR-011로 수습했지만 사전 발견 못 함.
2. **lint 룰의 ARIA 속성 expression 검증** — `aria-expanded={open}`이 boolean인데 lint 플러그인이 string 리터럴을 요구. 미리 알았으면 한 번에 작성 가능했음.
3. **inline style 1건 잔존** — 동적 width(progress bar)를 Tailwind JIT가 처리 못함. CSS variable로 옮기지 않은 채 warning 통과.
4. **CLAUDE.md의 audit-log 절대 규칙을 mutation 0건 사이클에 어떻게 해석할지** — 변경 API가 없어서 writeAuditLog 호출처가 없는데 "절대 규칙 위반" 오해 소지. ADR-009에서 명문화로 해결했지만 사이클 2부터 진짜 시험대.

## Try (다음 사이클에 시도)

1. **사이클 시작 시 도서관 패턴 자동 검증** — Prisma 7 같은 메이저 변경이 도서관에 반영됐는지 STEP 1 Triage에서 한 번 grep 또는 빠른 generate. 이번엔 STEP 4에서 발견.
2. **lint warning을 "사이클 정리 큐"로 정식 트래킹** — 매 사이클 종료 시 누적 warning이 n개를 넘기면 정리 사이클을 끼워 넣는다.
3. **사이클 2엔 첫 mutation Server Action을 만들면서 adapter ADR-012 + writeAuditLog 실호출 패턴**을 함께 도입.
4. **CSS variable 패턴 도입** — `style={{ "--progress": ... }}` + Tailwind arbitrary value. 동적 스타일을 토큰화해서 inline style warning 박멸.

## 새로 발견된 패턴 (도서관 갱신 후보)

### 1. "사이클 1엔 mutation 0건이라 audit-log는 정의만" 패턴
- 영향 스킬: S-13 audit-log-pattern
- 갱신 내용: "변경 API가 0건인 사이클에서는 유틸·모델 정의로 충족. 절대 규칙은 'mutation이 추가될 때 동시에'를 의미하며 'mutation 없는 사이클에 강제 호출'을 요구하지 않음."

### 2. "데모 모드 폴백" 패턴 (신규 후보)
- 외부 API/DB가 없어도 화면이 동작하도록 시드 데이터를 직접 import.
- 후속 사이클에서 일반화되면 신규 스킬 후보.

### 3. "Prisma 7 datasource는 클라이언트 생성자/adapter로" 패턴
- S-09 즉시 갱신 대상 (이 회고에서 처리).

## 학습 메모리에 저장할 항목

- 사이클 1 = 푸꾸옥 시드 + M1 근거 패널 시연 가능 상태로 종료 (2026-04-29).
- ADR-009/010/011 통과. 의존성 추가 0개.
- 다음 사이클 = M3 Live Replan + adapter ADR-012.

## 사이클 메트릭

| 지표 | 값 |
|------|----|
| 5단계 프로세스 준수 | ✅ 5/5 |
| CTO 게이트 1차 승인률 | 3/3 ADR (100%) |
| 다중 검증 4단계 통과 | ✅ |
| 신규 의존성 추가 | 0 |
| 도서관 갱신 항목 | 1건 (S-09 Prisma 7) |
| 산출 파일 | 13 (스키마·시드·라이브러리·페이지·컴포넌트) + 4 ADR/회의록 |
| 빌드 결과 | 6 routes, First Load JS 87~95kB |
