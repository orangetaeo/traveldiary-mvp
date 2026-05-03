# TravelDiary - AI 여행 동반자

> **프로젝트**: 자유여행자를 위한 AI 여행 동반자
> **버전**: 0.1.0 (MVP)
> **기술 스택**: Next.js 14, React 18, Tailwind CSS, TypeScript 5, Prisma 7, PostgreSQL 16
> **하네스 시스템**: 도서관 형태 (62권의 책)

---

## 🚦 절대 원칙 (5가지) — 반드시 준수

| # | 원칙 | 위반 시 |
|---|------|--------|
| 1 | **회의 없이 코드 작성 금지** — Triage→회의→구현→검증→보고 5단계 | 즉시 중단 |
| 2 | **CTO 사인오프 없이 기술 결정 금지** — 의존성·스택·아키텍처 변경 시 | 코드 리뷰 반려 |
| 3 | **다중 검증 통과 없이 완료 선언 금지** — ① 자체 ② 코드 리뷰 ③ QA ④ CTO 4단계 | 검증 처음부터 |
| 4 | **감사 로그 없이 변경 API 금지** — POST/PUT/PATCH/DELETE 동시 구현 | 코드 리뷰 반려 |
| 5 | **회고 없이 세션 종료 금지** — T18 Self-Evolution Coach가 학습 메모 저장 | 사이클 미종료 |

---

## 📚 하네스 도서관 (작업 시작 전 필독)

> 모든 사용자 요청은 도서관 검색으로 시작.

### 진입점

```
1. 사용자 요청
   ↓
2. .claude/INDEX.md 펼치기 (마스터 목차)
   ↓
3. .claude/CATALOG.md 정밀 검색
   ↓
4. 필요한 책(에이전트/스킬 .md)만 펼치기
   ↓
5. 회의 멤버 병렬 소집 → STEP 2~5 진행
```

### 마스터 파일

| 파일 | 용도 |
|------|------|
| [.claude/INDEX.md](.claude/INDEX.md) | 도서관 마스터 목차 (62권) |
| [.claude/CATALOG.md](.claude/CATALOG.md) | 키워드 인덱스 + 상세 카탈로그 |
| [.claude/HARNESS.md](.claude/HARNESS.md) | 운영 매뉴얼 (5단계 작업 프로세스) |
| [memory/MEMORY.md](memory/MEMORY.md) | 핵심 규칙 + 갱신 이력 |

---

## 🎯 우리가 만드는 것

**자유여행자를 위한 AI 여행 동반자.**
일정을 짜고, 살아 움직이게 하고, 함께 만들어 가는 한 개의 앱.

### 핵심 차별화 4축

1. **추천 근거 패널** — AI가 왜 이걸 골랐는지 출처와 함께 보여줌. (M1)
2. **환각 차단 검증 레이어** — Google Places + OTA로 5단계 사실 확인.
3. **한국인 특화** — 한국어 후기 인덱싱, 알레르기·식이 필터, 카카오톡 협업.
4. **여행 중에 살아있음** — D-Day 자동 모드 전환, Live Replan, 카메라 번역. (M2~M4)

### Magic Moments (v2 — 2026-04-29 사이클 6 갱신, 8개)

| # | 모먼트 | 화면 | 담당 에이전트 | 핵심 스킬 | 상태 |
|---|--------|------|--------------|----------|------|
| M1 | 추천 근거 패널 | 일정 상세 | T1, T3, T4 | S-02, S-03, S-05 | ✅ 사이클 1 |
| M2 | D-Day 모드 전환 | 여행 중 홈 | T7, T17 | S-04 | ✅ 사이클 3 (데모) |
| M3 | Live Replan | 재계획 모달 | T2, T5 | S-01, S-06 | ✅ 사이클 2 (시뮬) |
| M4 | 카메라 번역 | 번역 화면 | T6 | S-07, S-08 | ✅ 사이클 4 (정적) |
| **M5** | **응급/실용/도시 컨텍스트** | **/travel 푸터 + /city** | **T8, T16** | **S-20 (신규)** | ⏳ 사이클 8 |
| **M6** | **D-Day 체크리스트 + 비용 관리** | **/checklist /cost** | **T8, T17** | **S-21 (신규)** | ⏳ 사이클 9 |
| **M7** | **공유 링크 + 동기화 키 협업** | **/share** | **T9, T16** | **S-22 (신규)** | ⏳ 사이클 11 |
| **M8** | **OTA 가격 비교 (수익 모델)** | **일정 상세 인라인** | **T9, T10** | **S-23 (신규)** | ⏳ 사이클 12 |

> v2 비전 — [docs/09-vision-v2.md](docs/09-vision-v2.md) (Accepted 2026-04-29)

---

## 👥 에이전트 팀 (19명) — 도서관에서 검색

| # | 에이전트 | 책 | 한줄 |
|---|---------|----|------|
| T1 | Trip Architect | [.claude/agents/trip-planner.md](.claude/agents/trip-planner.md) | 여행 전체 설계 |
| T2 | Itinerary Graph Engineer | [.claude/agents/itinerary-architect.md](.claude/agents/itinerary-architect.md) | DAG 일정 그래프 |
| T3 | Evidence Collector | [.claude/agents/evidence-collector.md](.claude/agents/evidence-collector.md) | 추천 근거 수집 |
| T4 | Validation Engineer | [.claude/agents/validation-engineer.md](.claude/agents/validation-engineer.md) | 5단계 검증 |
| T5 | Live Replan Engine | [.claude/agents/live-replan-engine.md](.claude/agents/live-replan-engine.md) | 실시간 재계획 |
| T6 | Translation Specialist | [.claude/agents/translation-specialist.md](.claude/agents/translation-specialist.md) | 카메라 번역 |
| T7 | Mode Transition Manager | [.claude/agents/mode-transition-manager.md](.claude/agents/mode-transition-manager.md) | D-Day 모드 전환 |
| T8 | Product Planner | [.claude/agents/product-planner.md](.claude/agents/product-planner.md) | 제품 로드맵 |
| T9 | Business Developer | [.claude/agents/business-developer.md](.claude/agents/business-developer.md) | 사업화 |
| T10 | API Specialist | [.claude/agents/api-specialist.md](.claude/agents/api-specialist.md) | API·연동 |
| T11 | Marketing Specialist | [.claude/agents/marketing-specialist.md](.claude/agents/marketing-specialist.md) | 마케팅 |
| T12 | QA Lead | [.claude/agents/qa-lead.md](.claude/agents/qa-lead.md) | 도메인 QA·환각 검출 |
| T13 | Code Reviewer | [.claude/agents/code-reviewer.md](.claude/agents/code-reviewer.md) | 다중 코드 리뷰 |
| T14 | DB Architect | [.claude/agents/db-architect.md](.claude/agents/db-architect.md) | Prisma·DAG 영속화 |
| T15 | DevOps Engineer | [.claude/agents/devops-engineer.md](.claude/agents/devops-engineer.md) | Railway 배포 |
| T16 | Security Engineer | [.claude/agents/security-engineer.md](.claude/agents/security-engineer.md) | 보안·OWASP |
| T17 | UX/UI Designer | [.claude/agents/ux-designer.md](.claude/agents/ux-designer.md) | 디자인 시스템 |
| T18 | Self-Evolution Coach | [.claude/agents/self-evolution-coach.md](.claude/agents/self-evolution-coach.md) | 회고·자가 진화 |
| T19 | Harness Librarian | [.claude/agents/harness-librarian.md](.claude/agents/harness-librarian.md) | 도서관 사서·검색 |

> 자세한 매핑: [.claude/CATALOG.md](.claude/CATALOG.md)

---

## 🛠️ 스킬 라이브러리 (19권) — 에이전트가 참조

| ID | 스킬 | 사용 |
|----|------|------|
| S-01 | DAG Scheduling | T2, T5 |
| S-02 | Evidence Gathering | T3 |
| S-03 | Place Verification | T4 |
| S-04 | Mode Transition | T7 |
| S-05 | Korean Review Analysis | T3 |
| S-06 | Live Replan Options | T5 |
| S-07 | OCR Translation | T6 |
| S-08 | Allergen Filter | T6, T1 |
| S-09 | Prisma Schema Design | T14 |
| S-10 | Railway Deploy Pattern | T15 |
| S-11 | API Security | T16, T10 |
| S-12 | UX Design System | T17 |
| **S-13** | **Audit Log Pattern** ⭐ | 모든 변경 API |
| S-14 | Test Strategy | T12 |
| S-15 | Code Review Checklist | T13 |
| S-16 | Self-Evolution Loop | T18 |
| S-17 | Parallel Team Orchestration | T19 |
| **S-18** | **CTO Review Gate** ⭐ | R1, T19 |
| S-19 | Librarian Search | T19 |

---

## 🤝 공유 라이브러리 (R1~R10, P1~P9)

| 분류 | 위치 | 사용 |
|------|------|------|
| Role Agents | `C:\Projects\_shared\agents\roles\` | R1 CTO 등 부서별 |
| Pattern Skills | `C:\Projects\_shared\agents\patterns\` | P1~P9 범용 |
| Process | `C:\Projects\_shared\agents\process\` | work-process |

---

## 📊 데이터 모델 (DAG 기반 — `lib/types.ts`)

```typescript
interface ItineraryItem {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  
  // Live Replan 핵심
  flexibility: "fixed" | "flexible" | "booked";
  priority: 1 | 2 | 3 | 4 | 5;
  flexMinutes: number;
  
  // 그래프 구조
  dependencies: string[];
  
  // 콘텐츠
  name: string;
  category: "food" | "spot" | "shopping" | "rest";
  location: { lat: number; lng: number; address: string };
  
  // 우리 정체성
  evidence: Evidence;
}
```

자세히: [docs/04-data-model.md](docs/04-data-model.md), [.claude/skills/prisma-schema-design.md](.claude/skills/prisma-schema-design.md)

---

## 🔄 5단계 작업 프로세스 (HARNESS.md 발췌)

```
STEP 1. Triage (T19 Harness Librarian)
        ↓ 도서관 검색 → 회의 멤버 + 참고 자료 확정
STEP 2. 회의 (병렬 호출 — R1 CTO 게이트 포함)
        ↓ 합의된 설계 + ADR (필요 시)
STEP 3. 구현 (R4 BE + 도메인 에이전트, R5 FE + T17)
        ↓ 코드 + 감사 로그 + 테스트
STEP 4. 다중 검증 (4단계, 직렬)
        ① 자체 → ② T13 코드 리뷰 → ③ T12 QA → ④ R1 CTO 사인오프
        ↓ 어느 단계 실패 시 STEP 3 복귀
STEP 5. 보고 + 회고 (T18 자가 진화)
        ↓ 학습 메모리 저장 + 도서관 갱신
```

자세히: [.claude/HARNESS.md](.claude/HARNESS.md)

---

## 📋 핵심 참조

| 구분 | 파일 |
|------|------|
| 비전 | [docs/01-vision.md](docs/01-vision.md) |
| 매직 모먼트 | [docs/02-magic-moments.md](docs/02-magic-moments.md) |
| 스타일 시스템 | [docs/03-style-system.md](docs/03-style-system.md) |
| 데이터 모델 | [docs/04-data-model.md](docs/04-data-model.md) |
| 로드맵 | [docs/05-roadmap.md](docs/05-roadmap.md) |
| AI 협업 | [docs/06-ai-collaboration.md](docs/06-ai-collaboration.md) |
| 배포 | [docs/07-railway-deploy.md](docs/07-railway-deploy.md) |
| 핵심 규칙 | [memory/MEMORY.md](memory/MEMORY.md) |

---

## 🛡️ CI 게이트 (2026-05-03 도입)

`.github/workflows/ci.yml` — push to main + PR to main에서 `tsc --noEmit` + `test:unit` + `next build` 자동 검증.

> **CI는 "조기 경보"**, Railway deploy gate 아님. Railway는 GitHub push를 직접 구독하므로 CI 실패해도 배포 시도. PR 머지 차단(branch protection)으로만 강제 가능.

재발 방지 대상: 35eb085 같은 빌드 부채를 푸시 전(또는 PR에서) 차단.

---

## 🚀 작업 시작 시 체크리스트

```
□ memory/MEMORY.md 핵심 규칙 확인
□ .claude/INDEX.md 마스터 목차 확인
□ 사용자 요청 → T19 Librarian 검색
□ 5단계 프로세스 진행 (회의 없이 코드 금지)
□ 다중 검증 4단계 통과
□ T18 회고 후 메모리 저장
□ 도서관 갱신 (필요 시)
```

---

## 🔗 빠른 시작

```bash
cd c:\Projects\traveldiary-mvp
npm install
npm run dev
```

> 새 작업이 들어오면: **`.claude/HARNESS.md`** 펼치고 STEP 1부터.
