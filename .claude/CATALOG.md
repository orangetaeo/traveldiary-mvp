# 📑 TravelDiary 도서관 — 상세 카탈로그

> 각 책(에이전트/스킬)의 **키워드·요약·연관 자료**를 모은 카탈로그.
> [INDEX.md](INDEX.md)에서 목차를 보고, 이 파일에서 정밀 검색.

---

## 🔎 키워드 인덱스

| 키워드 | 관련 책 |
|--------|---------|
| `M1`, `근거`, `evidence`, `추천 근거` | T3, T4, S-02, S-05 |
| `M2`, `D-Day`, `모드`, `mode` | T7, S-04 |
| `M3`, `replan`, `재계획`, `live` | T2, T5, S-01, S-06 |
| `M4`, `번역`, `OCR`, `메뉴` | T6, S-07, S-08 |
| `DAG`, `그래프`, `의존성` | T2, S-01 |
| `검증`, `validation`, `5단계`, `환각` | T4, T12, S-03 |
| `네이버`, `한국어`, `후기` | T3, S-05 |
| `알레르기`, `식이`, `필터` | T6, S-08 |
| `API`, `서버 액션`, `RESTful` | T10, R4, P4 |
| `DB`, `Prisma`, `스키마`, `마이그레이션` | T14, S-09, P9 |
| `보안`, `OAuth`, `API 키`, `OWASP` | T16, S-11 |
| `배포`, `Railway`, `환경변수` | T15, S-10, P8 |
| `테스트`, `QA`, `시나리오` | T12, S-14, P2, P3 |
| `리뷰`, `리팩터` | T13, S-15 |
| `감사 로그`, `audit` | S-13 (모든 변경 API) |
| `CTO`, `ADR`, `결정`, `게이트` | R1, S-18, P1 |
| `회고`, `학습`, `진화`, `evolution` | T18, S-16 |
| `병렬`, `팀`, `소집`, `parallel` | T19, S-17 |
| `검색`, `사서`, `librarian` | T19, S-19 |
| `UX`, `토큰`, `디자인`, `A11y` | T17, R9, R10, S-12, P7 |
| `사업`, `수익`, `Affiliate`, `투자` | T8, T9 |
| `마케팅`, `브랜드`, `성장` | T11, R8 |
| `로드맵`, `시나리오`, `우선순위` | T8, R2 |

---

## 👥 에이전트 카탈로그 (T1~T19)

### T1: Trip Architect
- **파일**: [agents/trip-planner.md](agents/trip-planner.md)
- **키워드**: 여행 비전, 도시 선택, 일정 전략, 마일스톤
- **참조 스킬**: S-01, S-04, S-05
- **연관 에이전트**: T3, T4, T7, T8
- **언제 호출**: 새 여행 생성·전체 일정 설계·도시 확장 결정

### T2: Itinerary Graph Engineer
- **파일**: [agents/itinerary-architect.md](agents/itinerary-architect.md)
- **키워드**: DAG, 의존성, topological sort, flexibility, 시간 충돌
- **참조 스킬**: S-01, S-06
- **연관 에이전트**: T5
- **언제 호출**: 일정 그래프 구축·재배치 가능성 계산

### T3: Evidence Collector
- **파일**: [agents/evidence-collector.md](agents/evidence-collector.md)
- **키워드**: 근거, 네이버 후기, 긍정율, 출처 검증
- **참조 스킬**: S-02, S-05
- **연관 에이전트**: T1, T4
- **언제 호출**: M1 근거 패널 데이터 생성·후기 분석

### T4: Validation Engineer
- **파일**: [agents/validation-engineer.md](agents/validation-engineer.md)
- **키워드**: 5단계 검증, Google Places, 환각 차단, 운영 상태
- **참조 스킬**: S-03
- **연관 에이전트**: T3, T10, T12
- **언제 호출**: 장소 진위 확인·실시간 상태 점검

### T5: Live Replan Engine
- **파일**: [agents/live-replan-engine.md](agents/live-replan-engine.md)
- **키워드**: 실시간 재계획, 추천/안전/강행, 트리거 감지
- **참조 스킬**: S-01, S-06
- **연관 에이전트**: T2
- **언제 호출**: M3 일정 변경·지연·악천후·웨이팅

### T6: Translation Specialist
- **파일**: [agents/translation-specialist.md](agents/translation-specialist.md)
- **키워드**: OCR, 메뉴 번역, 한국어 특화, 알레르기
- **참조 스킬**: S-07, S-08
- **연관 에이전트**: T1, T16
- **언제 호출**: M4 카메라 번역·문화적 맥락 번역

### T7: Mode Transition Manager
- **파일**: [agents/mode-transition-manager.md](agents/mode-transition-manager.md)
- **키워드**: D-Day, 자동 전환, 위치 기반, UI 변경
- **참조 스킬**: S-04
- **연관 에이전트**: T17 (UI), T16 (위치 프라이버시)
- **언제 호출**: M2 여행 전→중→후 모드 전환

### T8: Product Planner
- **파일**: [agents/product-planner.md](agents/product-planner.md)
- **키워드**: 로드맵, Tier, 시나리오, 경쟁 분석
- **참조 스킬**: P2, P7
- **연관 에이전트**: R2, T9, T11
- **언제 호출**: 기능 우선순위·MVP 범위·시나리오 설계

### T9: Business Developer
- **파일**: [agents/business-developer.md](agents/business-developer.md)
- **키워드**: Affiliate, 파트너십, Series A, LTV/CAC
- **참조 스킬**: P1, R8
- **연관 에이전트**: T8, T11
- **언제 호출**: 수익 모델 결정·투자 자료·파트너십

### T10: API Specialist
- **파일**: [agents/api-specialist.md](agents/api-specialist.md)
- **키워드**: REST, Server Action, Google/Naver/OTA, 캐시
- **참조 스킬**: P4, P6, S-11, S-13
- **연관 에이전트**: R4, T14, T16
- **언제 호출**: API 설계·외부 연동·데이터 파이프라인

### T11: Marketing Specialist
- **파일**: [agents/marketing-specialist.md](agents/marketing-specialist.md)
- **키워드**: 브랜드, ASO, 인플루언서, NPS, ROAS
- **참조 스킬**: P7, P8 (DA)
- **연관 에이전트**: T8, T9
- **언제 호출**: 마케팅 캠페인·콘텐츠·KPI

### T12: QA Lead 🆕
- **파일**: [agents/qa-lead.md](agents/qa-lead.md)
- **키워드**: 도메인 QA, 환각 검출, 시나리오, 회귀
- **참조 스킬**: S-14, S-15, P2, P3
- **연관 에이전트**: R6, T13, T4
- **언제 호출**: STEP 4 QA 단계·테스트 시나리오 작성

### T13: Code Reviewer 🆕
- **파일**: [agents/code-reviewer.md](agents/code-reviewer.md)
- **키워드**: 다중 리뷰, 리팩터, SRP, 가독성
- **참조 스킬**: S-15, P3
- **연관 에이전트**: T12, R1
- **언제 호출**: STEP 4 코드 리뷰·리팩터링 제안

### T14: DB Architect 🆕
- **파일**: [agents/db-architect.md](agents/db-architect.md)
- **키워드**: Prisma, 스키마, 마이그레이션, 인덱스, DAG 영속화
- **참조 스킬**: S-09, S-13, P9
- **연관 에이전트**: R3, T10
- **언제 호출**: 새 모델 추가·마이그레이션·쿼리 최적화

### T15: DevOps Engineer 🆕
- **파일**: [agents/devops-engineer.md](agents/devops-engineer.md)
- **키워드**: Railway, 환경변수, CI/CD, 모니터링
- **참조 스킬**: S-10, P8
- **연관 에이전트**: R7, T16
- **언제 호출**: 배포·환경 설정·인프라 변경

### T16: Security Engineer 🆕
- **파일**: [agents/security-engineer.md](agents/security-engineer.md)
- **키워드**: API 키, OAuth, 위치 데이터, OWASP, Rate Limiting
- **참조 스킬**: S-11, P8
- **연관 에이전트**: T10, T15, T7 (위치)
- **언제 호출**: 보안 검토·인증·민감 데이터 처리

### T17: UX/UI Designer 🆕
- **파일**: [agents/ux-designer.md](agents/ux-designer.md)
- **키워드**: 디자인 토큰, 화면 LEVEL, A11y, 인터랙션
- **참조 스킬**: S-12, P5, P7
- **연관 에이전트**: R9, R10, T7
- **언제 호출**: 화면 설계·컴포넌트·인터랙션·접근성

### T18: Self-Evolution Coach 🆕
- **파일**: [agents/self-evolution-coach.md](agents/self-evolution-coach.md)
- **키워드**: 회고, 학습, 메모리, KPT, 진화
- **참조 스킬**: S-16
- **연관 에이전트**: 전체 (사이클 종료 시)
- **언제 호출**: STEP 5 회고·새 패턴 발견·학습 저장

### T19: Harness Librarian 🆕
- **파일**: [agents/harness-librarian.md](agents/harness-librarian.md)
- **키워드**: 사서, 검색, 코디네이터, 팀 소집
- **참조 스킬**: S-17, S-19
- **연관 에이전트**: 전체
- **언제 호출**: STEP 1 Triage·도서관 검색·팀 소집

---

## 🛠️ 스킬 카탈로그 (S-01~S-19)

### S-01: DAG Scheduling
- **파일**: [skills/dag-scheduling.md](skills/dag-scheduling.md)
- **키워드**: topological sort, cycle detection, 시간 충돌
- **사용 에이전트**: T2, T5

### S-02: Evidence Gathering
- **파일**: [skills/evidence-gathering.md](skills/evidence-gathering.md)
- **키워드**: 후기 수집, 긍정율, 출처 검증
- **사용 에이전트**: T3

### S-03: Place Verification
- **파일**: [skills/place-verification.md](skills/place-verification.md)
- **키워드**: 5단계 검증, Google Places, 운영 상태
- **사용 에이전트**: T4

### S-04: Mode Transition
- **파일**: [skills/mode-transition.md](skills/mode-transition.md)
- **키워드**: D-Day 계산, 위치 경계, UI 전환
- **사용 에이전트**: T7

### S-05: Korean Review Analysis
- **파일**: [skills/korean-review-analysis.md](skills/korean-review-analysis.md)
- **키워드**: LLM 요약, 감정 분류, 인덱싱
- **사용 에이전트**: T3

### S-06: Live Replan Options
- **파일**: [skills/live-replan-options.md](skills/live-replan-options.md)
- **키워드**: 추천/안전/강행, 영향 시각화
- **사용 에이전트**: T5

### S-07: OCR Translation 🆕
- **파일**: [skills/ocr-translation.md](skills/ocr-translation.md)
- **키워드**: 이미지→텍스트, LLM 번역, 문화 맥락
- **사용 에이전트**: T6

### S-08: Allergen Filter 🆕
- **파일**: [skills/allergen-filter.md](skills/allergen-filter.md)
- **키워드**: 알레르기, 식이 제한, 한국인 특화
- **사용 에이전트**: T6, T1

### S-09: Prisma Schema Design 🆕
- **파일**: [skills/prisma-schema-design.md](skills/prisma-schema-design.md)
- **키워드**: 모델, 관계, 인덱스, DAG 영속화
- **사용 에이전트**: T14

### S-10: Railway Deploy Pattern 🆕
- **파일**: [skills/railway-deploy-pattern.md](skills/railway-deploy-pattern.md)
- **키워드**: Railway 설정, 환경변수, 마이그레이션
- **사용 에이전트**: T15

### S-11: API Security 🆕
- **파일**: [skills/api-security.md](skills/api-security.md)
- **키워드**: API 키 관리, Rate Limit, OAuth, OWASP
- **사용 에이전트**: T16, T10

### S-12: UX Design System 🆕
- **파일**: [skills/ux-design-system.md](skills/ux-design-system.md)
- **키워드**: 디자인 토큰, 화면 LEVEL, A11y
- **사용 에이전트**: T17, R9, R10

### S-13: Audit Log Pattern ⭐ 절대 규칙
- **파일**: [skills/audit-log-pattern.md](skills/audit-log-pattern.md)
- **키워드**: writeAuditLog, 변경 추적, 감사
- **사용 에이전트**: 모든 데이터 변경 API 작성자

### S-14: Test Strategy 🆕
- **파일**: [skills/test-strategy.md](skills/test-strategy.md)
- **키워드**: 단위·통합·E2E, 우선순위, 골든 패스
- **사용 에이전트**: T12, R6

### S-15: Code Review Checklist 🆕
- **파일**: [skills/code-review-checklist.md](skills/code-review-checklist.md)
- **키워드**: 다중 리뷰, SRP, 보안, 가독성
- **사용 에이전트**: T13

### S-16: Self-Evolution Loop 🆕
- **파일**: [skills/self-evolution-loop.md](skills/self-evolution-loop.md)
- **키워드**: KPT, 회고, 학습 저장, 메모리
- **사용 에이전트**: T18

### S-17: Parallel Team Orchestration 🆕
- **파일**: [skills/parallel-team-orchestration.md](skills/parallel-team-orchestration.md)
- **키워드**: 병렬 호출, 의존성 분석, 팀 소집
- **사용 에이전트**: T19

### S-18: CTO Review Gate ⭐ 절대 규칙
- **파일**: [skills/cto-review-gate.md](skills/cto-review-gate.md)
- **키워드**: ADR, 기술 결정, 사인오프
- **사용 에이전트**: R1, T19

### S-19: Librarian Search 🆕
- **파일**: [skills/librarian-search.md](skills/librarian-search.md)
- **키워드**: 키워드 검색, 카탈로그, 팀 매핑
- **사용 에이전트**: T19

---

## 🔗 작업 유형별 책 묶음 (Quick Set)

### 새 매직 모먼트 화면 만들기
```
필독: HARNESS.md, T17, S-12
참조: M에 따라 T3/T4/T5/T6/T7
검증: T12, T13, S-14, S-15
```

### 새 API 추가
```
필독: T10, R4, P4
참조: T14 (DB), T16 (보안)
필수: S-13 (감사 로그), S-11 (API 보안)
검증: T12, T13
```

### DB 마이그레이션
```
필독: T14, S-09, P9
참조: R3 (TDA)
필수: S-18 (CTO 게이트), S-13
검증: T13, R1
```

### 배포
```
필독: T15, S-10, P8
참조: T16 (보안)
필수: S-18 (CTO 게이트)
검증: T12 (스모크 테스트)
```

### 회고
```
필독: T18, S-16
저장: memory/MEMORY.md, INDEX.md 통계 갱신
```

---

## 📦 신규 추가 후 갱신 절차

새 에이전트/스킬을 추가하면:
1. 이 CATALOG.md에 항목 추가 (키워드·요약·연관)
2. INDEX.md 표에 행 추가
3. INDEX.md 통계 업데이트
4. 관련 키워드 인덱스 추가
5. 변경 이력 기록 (아래)

---

## 📝 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-04-29 | 초기 카탈로그 작성. 도메인 에이전트 19개(T1~T19), 도메인 스킬 19개(S-01~S-19) 등록 |
