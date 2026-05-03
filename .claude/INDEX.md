# 📚 TravelDiary 하네스 도서관 — 마스터 목차

> **이 파일은 도서관의 "책 목차"입니다.**
> 전체를 읽지 마세요. 작업에 필요한 페이지만 펼쳐서 보세요.
>
> 이 파일을 먼저 보고 → [CATALOG.md](CATALOG.md)에서 상세 카탈로그 확인 → 필요한 책(에이전트/스킬 .md 파일)만 열기.

---

## 🗺️ 도서관 사용법 (3단계)

```
1단계: INDEX.md (이 파일) — 어떤 분류에 어떤 자료가 있는지 한눈에
        ↓
2단계: CATALOG.md — 자료의 키워드·요약·연관 자료 정밀 검색
        ↓
3단계: 개별 .md (에이전트/스킬) — 디테일 학습 후 작업 실행
```

### 검색 패턴

| 사용자 요청 유형 | 검색 키워드로 찾을 것 |
|----------------|---------------------|
| "일정 만들어줘" | M1 + dag + scheduling → T1, T2, T3, T4 |
| "여행 중 변경" | M3 + replan → T2, T5 |
| "메뉴 번역" | M4 + ocr → T6 |
| "기술 결정" | CTO + ADR → R1 + cto-review-gate |
| "테스트" | QA + test → T12 + test-strategy |
| "API 만들기" | API + audit → T10 + R4 + audit-log |
| "배포" | Railway + DevOps → T15 + railway-deploy |
| "보안" | security → T16 + api-security |

---

## 📖 1부. 운영 매뉴얼 (반드시 먼저 읽기)

| # | 파일 | 핵심 |
|---|------|------|
| OP-1 | [HARNESS.md](HARNESS.md) | **하네스 운영 방식** — 작업 들어왔을 때 어떻게 도서관 검색 → 팀 소집 → 병렬 실행 |
| OP-2 | [CATALOG.md](CATALOG.md) | 전체 자료 카탈로그 (책 정보 + 키워드 + 연관) |
| OP-3 | `../memory/MEMORY.md` | 핵심 규칙·금지 사항 |

---

## 👥 2부. 도메인 에이전트 (T1~T19) — 이 프로젝트 전용

> **"누가" 작업하는가**. 각 에이전트는 자신의 책임 범위 안에서 동작.
> 작업 시 필요한 에이전트만 골라 **병렬로 소집**.

### 🟢 핵심 도메인 (M1~M4 매직 모먼트 담당)

| # | 에이전트 | 책 | 한줄 | M |
|---|---------|----|------|---|
| T1 | Trip Architect | [agents/trip-planner.md](agents/trip-planner.md) | 여행 전체 설계 | M1, M2 |
| T2 | Itinerary Graph Engineer | [agents/itinerary-architect.md](agents/itinerary-architect.md) | DAG 일정 그래프 | M3 |
| T3 | Evidence Collector | [agents/evidence-collector.md](agents/evidence-collector.md) | 추천 근거 수집 | M1 |
| T4 | Validation Engineer | [agents/validation-engineer.md](agents/validation-engineer.md) | 5단계 검증 | M1 |
| T5 | Live Replan Engine | [agents/live-replan-engine.md](agents/live-replan-engine.md) | 실시간 재계획 | M3 |
| T6 | Translation Specialist | [agents/translation-specialist.md](agents/translation-specialist.md) | 카메라 번역 | M4 |
| T7 | Mode Transition Manager | [agents/mode-transition-manager.md](agents/mode-transition-manager.md) | D-Day 모드 전환 | M2 |

### 🟡 사업·제품 도메인

| # | 에이전트 | 책 | 한줄 |
|---|---------|----|------|
| T8 | Product Planner | [agents/product-planner.md](agents/product-planner.md) | 제품 로드맵·시나리오 |
| T9 | Business Developer | [agents/business-developer.md](agents/business-developer.md) | 수익·파트너십·투자 |
| T10 | API Specialist | [agents/api-specialist.md](agents/api-specialist.md) | API·외부 연동 |
| T11 | Marketing Specialist | [agents/marketing-specialist.md](agents/marketing-specialist.md) | 브랜드·성장 |

### 🔵 인프라·품질 도메인 (신규 — 다중 검증/자가 진화)

| # | 에이전트 | 책 | 한줄 |
|---|---------|----|------|
| T12 | QA Lead | [agents/qa-lead.md](agents/qa-lead.md) | 도메인 QA·테스트 시나리오·환각 검출 |
| T13 | Code Reviewer | [agents/code-reviewer.md](agents/code-reviewer.md) | 다중 리뷰·리팩터링 제안 |
| T14 | DB Architect | [agents/db-architect.md](agents/db-architect.md) | Prisma 스키마·DAG 영속화·마이그레이션 |
| T15 | DevOps Engineer | [agents/devops-engineer.md](agents/devops-engineer.md) | Railway·환경변수·CI/CD |
| T16 | Security Engineer | [agents/security-engineer.md](agents/security-engineer.md) | API 키·OAuth·위치 데이터·OWASP |
| T17 | UX/UI Designer | [agents/ux-designer.md](agents/ux-designer.md) | 디자인 토큰·화면 LEVEL·A11y |
| T18 | Self-Evolution Coach | [agents/self-evolution-coach.md](agents/self-evolution-coach.md) | 회고·학습 메모 저장·다음 사이클 개선 |
| T19 | Harness Librarian | [agents/harness-librarian.md](agents/harness-librarian.md) | 도서관 사서·검색 코디네이터·팀 소집 |

---

## 🛠️ 3부. 도메인 스킬 (S-01 ~ S-19) — 에이전트가 참조하는 "방법론"

> **"어떻게" 일하는가**. 에이전트는 책임을 지고, 스킬은 구체적 절차를 담당.

### 🟢 매직 모먼트 핵심 스킬

| ID | 스킬 | 책 | 사용 에이전트 |
|----|------|----|--------------|
| S-01 | DAG Scheduling | [skills/dag-scheduling.md](skills/dag-scheduling.md) | T2, T5 |
| S-02 | Evidence Gathering | [skills/evidence-gathering.md](skills/evidence-gathering.md) | T3 |
| S-03 | Place Verification | [skills/place-verification.md](skills/place-verification.md) | T4 |
| S-04 | Mode Transition | [skills/mode-transition.md](skills/mode-transition.md) | T7 |
| S-05 | Korean Review Analysis | [skills/korean-review-analysis.md](skills/korean-review-analysis.md) | T3 |
| S-06 | Live Replan Options | [skills/live-replan-options.md](skills/live-replan-options.md) | T5 |

### 🟡 도메인 확장 스킬 (신규)

| ID | 스킬 | 책 | 사용 에이전트 |
|----|------|----|--------------|
| S-07 | OCR Translation | [skills/ocr-translation.md](skills/ocr-translation.md) | T6 |
| S-08 | Allergen Filter | [skills/allergen-filter.md](skills/allergen-filter.md) | T6, T1 |
| S-09 | Prisma Schema Design | [skills/prisma-schema-design.md](skills/prisma-schema-design.md) | T14 |
| S-10 | Railway Deploy Pattern | [skills/railway-deploy-pattern.md](skills/railway-deploy-pattern.md) | T15 |
| S-11 | API Security | [skills/api-security.md](skills/api-security.md) | T16, T10 |
| S-12 | UX Design System | [skills/ux-design-system.md](skills/ux-design-system.md) | T17, R10 |

### 🔵 운영·품질 스킬 (절대 규칙)

| ID | 스킬 | 책 | 핵심 |
|----|------|----|------|
| S-13 | Audit Log Pattern | [skills/audit-log-pattern.md](skills/audit-log-pattern.md) | **모든 변경 API 필수** |
| S-14 | Test Strategy | [skills/test-strategy.md](skills/test-strategy.md) | 단위·통합·E2E 우선순위 |
| S-15 | Code Review Checklist | [skills/code-review-checklist.md](skills/code-review-checklist.md) | 다중 리뷰 강제 |
| S-16 | Self-Evolution Loop | [skills/self-evolution-loop.md](skills/self-evolution-loop.md) | 회고→학습→진화 |
| S-17 | Parallel Team Orchestration | [skills/parallel-team-orchestration.md](skills/parallel-team-orchestration.md) | 에이전트 병렬 소집 |
| S-18 | CTO Review Gate | [skills/cto-review-gate.md](skills/cto-review-gate.md) | **기술 결정 시 필수** |
| S-19 | Librarian Search | [skills/librarian-search.md](skills/librarian-search.md) | 도서관 검색 패턴 |

---

## 🤝 4부. 공유 라이브러리 (`C:\Projects\_shared\agents\`)

> 모든 프로젝트 공통. 자세한 목차는 `_shared/agents/INDEX.md`.

### 역할 에이전트 (R1~R10) — 부서별 회의 참가자

| # | Role | 한줄 | 이 프로젝트에서 |
|---|------|------|---------------|
| R1 | CTO | 기술 전략, ADR | **모든 기술 결정 게이트** |
| R2 | PM | 우선순위, 스프린트 | 회의 진행 |
| R3 | TDA | 시스템 설계, ERD | T14와 협업 |
| R4 | BE | API, DB, 비즈니스 로직 | T10과 짝 |
| R5 | FE | 컴포넌트, 상태, API 연동 | T17과 짝 |
| R6 | QA | 테스트, 버그 진단 | T12와 짝 |
| R7 | SA | 배포, 환경, 보안 | T15·T16과 짝 |
| R8 | DA | KPI, 데이터 분석 | T11과 협업 |
| R9 | UX/UI | UX 흐름, 디자인 시스템 | T17 |
| R10 | PUB | HTML, CSS, 반응형 | T17과 짝 |

### 패턴 스킬 (P1~P9)

| # | Skill | 한줄 |
|---|-------|------|
| P1 | tech-decision (CTO) | ADR 작성, 기술 부채 |
| P2 | test-pattern (QA) | vitest 구조, 우선순위 |
| P3 | bug-checklist (QA) | 5대 버그 카테고리 |
| P4 | api-pattern (BE) | RESTful, Zod, 에러 처리 |
| P5 | component-pattern (FE) | shadcn/ui, 훅 |
| P6 | api-integration (FE) | React Query, 캐시 |
| P7 | ux-principles (UX) | 토큰, A11y |
| P8 | env-management (SA) | .env, 보안 |
| P9 | architecture-design (TDA) | 서비스 레이어, ERD |

### 프로세스

- `_shared/agents/process/work-process.md` — Triage → 회의 → 구현 → 검증 → 보고
- `_shared/agents/process/meeting-template.md` — 부서별 회의록 표준

---

## 🚦 5부. 절대 규칙 (3가지)

| # | 규칙 | 위치 |
|---|------|------|
| 1 | **회의 없이 코드 작성 금지** — Triage→회의→구현→검증→보고 | [HARNESS.md](HARNESS.md) §3 |
| 2 | **CTO 사인오프 없이 기술 결정 금지** — 의존성/스택/패턴 변경 시 | [skills/cto-review-gate.md](skills/cto-review-gate.md) |
| 3 | **감사 로그 없이 변경 API 배포 금지** — POST/PUT/PATCH/DELETE 모두 | [skills/audit-log-pattern.md](skills/audit-log-pattern.md) |

---

## 🔄 6부. 자가 진화 루프

이 도서관은 **고정된 책장**이 아닙니다. 매 작업 후 **T18 Self-Evolution Coach**가 회고를 수행하고:
- 새로 발견된 패턴 → 신규 스킬 파일로 추가
- 잘못된 가정 → 기존 스킬 업데이트
- 사용자 피드백 → memory/MEMORY.md 반영

> 자세한 절차: [skills/self-evolution-loop.md](skills/self-evolution-loop.md)

---

## 📊 라이브러리 통계 (2026-04-29 기준)

```
도메인 에이전트  :  19권 (T1~T19)
도메인 스킬      :  19권 (S-01~S-19)
공유 역할        :  10권 (R1~R10)
공유 패턴        :   9권 (P1~P9)
공유 프로세스    :   2권
운영 매뉴얼      :   3권 (INDEX/CATALOG/HARNESS)
─────────────────────────
총               :  62권
```

## 📌 사이클 진행 상황

| 사이클 | 상태 | 산출물 |
|--------|------|--------|
| 1 — 기반 + M1 (푸꾸옥) | ✅ 2026-04-29 완료 | DB·시드·일정 화면·근거 패널·ADR 009/010/011 |
| 2 — M3 Live Replan | ✅ 2026-04-29 완료 | replan 엔진·바텀 시트·ImpactDisplay·ADR-012 |
| 3 — M2 D-Day 모드 전환 | ✅ 2026-04-29 완료 | /travel/[id]·CSS 변수·ADR-014 |
| 4 — M4 카메라 번역 | ✅ 2026-04-29 완료 | /translate·정적 메뉴 시드·다국어 알레르기·ADR-015 |
| 5a — Railway 외부 노출 (데모) | ✅ 2026-04-29 완료 | https://traveldiary-mvp-production.up.railway.app · ADR-016 |
| **6 — 견적 기획 v2** | ✅ 2026-04-29 완료 | docs/09-vision-v2.md Accepted · M5~M8 추가 · 7개 결정 |
| 5b-1 — Prisma adapter + DB + 첫 mutation | ✅ 2026-04-30 완료 | ADR-013 · createTripFromOnboarding |
| 5b 옵션 C — Stitch 디자인 매핑 | ✅ 2026-04-30 완료 | 11개 한국어 화면 코드 매핑 |
| 5b-2 — commitReplan + setTripMode + 낙관적 동시성 | ✅ 2026-04-30 완료 | discriminated union return · expectedTripUpdatedAt |
| 5b-3 — Google Places + EvidenceCache | ✅ 2026-04-30 완료 | ADR-018 · 검증 1~2단계 · server-only · 캐시 우선 |
| 5b-4 — Geolocation + M2 자동 + Privacy | ✅ 2026-04-30 완료 | ADR-017 · 좌표 서버 미전송 · 명시적 사용자 트리거 |
| 5b-5 — Vision OCR + Claude API (M4 실 동작) | ✅ 2026-04-30 완료 | ADR-019 · 사용자 액션 2건 (옵션) · Naver는 5b-6 |
| 5b-6 — Naver Local + Blog (한국어 후기) | ✅ 2026-04-30 완료 | ADR-020 · 사용자 액션 1건 (옵션) · UI 통합 5b-6.5+ |
| 7 — ItineraryItem.photos + Maps/Uber/Grab deeplink | ✅ 2026-04-30 완료 | ADR-023 · 마이그레이션 0003 |
| 7.5 — Google Maps Embed 인라인 지도 (A1) | ✅ 2026-04-30 완료 | ADR-028 · NEXT_PUBLIC_* 키 + referrer 보안 |
| 8 — M5 City 데이터 모델 + 푸꾸옥 | ✅ 2026-04-30 완료 | Stitch #19/#20 매핑 · 시드만 · 다낭은 8.5+ |
| 8.5 — 다낭 시드 + visa/utilities/weather (Prisma City는 보류) | ✅ 2026-04-30 완료 | 베트남 2도시 |
| 9 — M6 체크리스트 + 비용 관리 | ✅ 2026-04-30 완료 | ADR-022 · 마이그레이션 0002 · 이중통화 |
| 10 — UX 보강 (A2 드래그 + A5 자유 추가) | ✅ 2026-04-30 완료 | HTML5 native drag · 의존성 0 · A4 검색은 11+ |
| 11a — M7 ShareLink (OAuth 없이) | ✅ 2026-04-30 완료 | ADR-024 · 마이그레이션 0004 · 시드니 패턴 |
| 11b — 카카오 OAuth + actorId 본격 | ✅ 2026-04-30 완료 | ADR-026 · jose 의존성 1개 · 14 mutation actorId 도입 |
| 12a — M8 OTA 가격 비교 시드 + 어필리에이트 패턴 | ✅ 2026-04-30 완료 | ADR-025 · Klook/KKday/Agoda |
| 12b — 실 OTA API 인프라 + aggregator | ✅ 2026-04-30 완료 | ADR-027 · 시드 fallback · 어필리에이트 계약 후 활성 |
| 후속 일괄 (5b-6.5 / 5b-5.5 / 7.5+ / 11c / 12c) | ✅ 2026-04-30 완료 | Naver UI 통합 · Translate Live · Maps directions+Geo · 카카오 email + ShareLink edit · /admin/affiliate |
| v2 출시 준비 (A~K 11 작업) | ✅ 2026-04-30 완료 | 권한 검증 · 보안 헤더 · migration 0005~0006 · 방콕/도쿄 · Vote · OG · 카카오맵 · 정산 · README · 체크리스트 · Playwright |
| **L+N — 5단계 검증 3·5단계 (booking + price)** | ✅ 2026-05-02 완료 | ADR-029 · vitest 도입(38건 PASS) · ValidationResult 첫 영속화 · Google Places types · OTA aggregator 가격 비교(±20%) · matchTag·통화환산 fix · 사용자 액션 0 |
| **B+D — 시드 보정 + ValidationBadges UI** | ✅ 2026-05-02 완료 | 야시장 550k VND·사오비치 950k VND·사파리 OTA 3건 추가 · 도달률 17→42% · ValidationBadges 컴포넌트 7 status × 디자인 토큰 · vitest 40건 · booking 키워드 보강(사파리·사오비치·데이투어) |
| **M — 5단계 검증 4단계 distanceVerified** | ✅ 2026-05-02 완료 | ADR-030 · Google Directions + Haversine fallback · DistanceBadge 6 status · 차별화 축 2 인프라 65→85% · vitest +23건 (총 63) · 마이그레이션 0 · 사용자 액션 1건 (선택) |
| **C — 다낭/방콕/도쿄 OTA 인프라 시드** | ✅ 2026-05-02 완료 | OTA Offer 18건 (도시당 6) · matchTag 도시 prefix 표준(pq/dn/bk/ty) · findOffersByKeyword 다국가 한·영 분기 · vitest +24건 (총 87) · itinerary 시드는 별도 사이클로 분리 |
| **D — 다낭 itinerary 시드 + 도달률 50%** | ✅ 2026-05-02 완료 | 다낭 12 일정 (3박 4일) · OTA 매칭 6건 verified 보장 · OTA 풀 다낭 6→15건 · listDemoTrips() 두 trip 노출 · 홈에 "다른 도시" 카드 · vitest +21건 (총 108) · 도달률 50%/100% |
| **E — 인프라 부채 해소 (마이그 0007 + 통합 + StatusBadge)** | ✅ 2026-05-02 완료 | ADR-031 · ValidationResult priceStatus/distanceStatus 컬럼 (캐시 hit 정확화) · validateItemAction이 googleResult 노출 (외부 API 호출 50% ↓) · StatusBadge 공통 컴포넌트 + mismatch ring-2 강화 · vitest +7건 (총 115) · 사용자 액션 1건 (`prisma migrate deploy` 선택) |
| **F+G+H — 베트남 6도시 + Country 정규화** | ✅ 2026-05-02 완료 | V3 베트남 우선 + V1 호치민/하노이/호이안/나트랑 + ADR-032 Country 모델 (옵션 C 하이브리드, ~370행 절감) · vitest 115→239 (+124, 6사이클) |
| **I — /trips 라우트 + Bottom Nav 4슬롯** | ✅ 2026-05-02 완료 | ADR-033 · `app/trips/page.tsx` SSR + `lib/services/trips-listing.ts` 분리 · 카드 3종(trip/city-only/coming-soon) + sticky 칩 필터 · 홈 "전체 보기" 링크 + trip→city 단방향 칩 · vitest +10 (총 249) · STEP 3 복귀 0회 · 의존성 0 / 마이그 0 |
| **J — ResolvedTrip 뷰 객체 + city→trip 역방향 CTA** | ✅ 2026-05-02 완료 | ADR-034 · `lib/services/resolved-trip.ts` 신규 + `trips-listing` 리팩터(TripCardData를 ResolvedTrip 기반) · `/city/[slug]` Hero 아래 큰 CTA(trip 있음) / amber "준비 중" 안내(HOI) · trip↔city 양방향 완성 · vitest +11 (총 260) · STEP 3 복귀 0회 |
| **K — 베트남 추가 도시 (껀터·달랏)** | ✅ 2026-05-02 완료 | 옵션 C — 달랏 α (city + trip 8 일정 / 2박 3일) + 껀터 β (city only) · 사이클 I·J 자산 자동 활용 · 도달률 5/8 → 6/10 (60%) · vitest +26 (총 286) · ADR 불필요 (답습) · STEP 3 복귀 0회 |
| **L — 사용자 직접 액션 가이드** | ✅ 2026-05-02 완료 | `docs/12-user-actions.md` 신규 (~155행) — 카카오 OAuth 7단계 + `prisma migrate deploy` 가이드 + 외부 키 6종 표 + 시크릿 회전 정책 · 코드 변경 0 / vitest 변동 0 · ADR 불필요 (문서만) |
| **N — 달랏 OTA aggregator 시드** | ✅ 2026-05-02 완료 | daLatOtaOffers 10건 (시그니처 랑비앙·다탄라 3 + 보조 야시장·케이블카 2) + isDaLatCtx 게이트(푸꾸옥/나트랑 충돌 회피) + 랑비앙·다탄라 고유 키워드 직접 매칭 · M8 도달 7→8 도시 · vitest +17 (총 303) · ADR 불필요 (사이클 C 답습) · STEP 3 복귀 0회 |
| **O — BottomNav 컴포넌트 추출** | ✅ 2026-05-02 완료 | `components/ui/BottomNav.tsx` 신규 (~75행) · 홈+/trips 인라인 60행 중복 → `<BottomNav active="..." />` 1행씩 · `BottomNavSlot` union으로 새 슬롯 추가 명시화 · vitest +9 (총 312) · ADR 불필요 (사이클 I 답습 추출) · 트리거 미충족 선제 리팩터 (회의 정당화) · STEP 3 복귀 0회 |
| **P — M5 응급/실용/도시 컨텍스트 강화** | ✅ 2026-05-02 완료 | ADR-035 · `/city/[slug]/emergency` 서브 라우트 (~250행) + `koreanLossContacts.ts` 4 카테고리 분실 가이드 + EmergencyHeaderButton (TravelHome·city·itinerary 헤더) + CityContextStrip 분기 제거(currentMode 무관 노출) · T16 환각 차단(개별 카드사·통신사 번호 미시드, 통합 번호만) · vitest +14 (총 326) · STEP 3 복귀 0회 |
| **Q — 사이클 P 백로그 정리** | ✅ 2026-05-02 완료 | 번호 표기 하이픈 통일(외교부 0404.go.kr 공식) + `EmergencyContact.url` 옵션 필드 + 8 도시 영사관 mofa.go.kr URL 매핑 + LossGuideCard 시맨틱(`<span>` → `<div>+<a>` 형제) · vitest +12 (총 338) · ADR 불필요 (백로그 정리) · STEP 3 복귀 0회 |
| **R — M7 협업 강화 (익명 댓글 + 카카오 공유)** | ✅ 2026-05-02 완료 | ADR-036 · ShareComment 모델 + 마이그 0008 + clientUuid + nickname 익명 협업 + Web Share API + 카카오 URL scheme 폴백(의존성 0) + ShareLink 만료/revoke 차단 + escapeHtml + Rate Limit 분당 5건 + 데모 LocalStorage fallback · vitest +12 (총 350) · 사용자 액션 +1 (migrate deploy 0008) · STEP 3 복귀 0회 |
| **S — Build Hotfix + CI Gate** | ✅ 2026-05-03 완료 | 35eb085 tsconfig exclude vitest.config.ts/tests/** (Railway 17h 정체 해소) · 067fe61 `.github/workflows/ci.yml` (push:main + PR:main, Node 20, 첫 실행 success) · feedback_tsconfig_build_isolation 정착 · vitest 350 변동 X · STEP 3 복귀 0회 |
| **T — health endpoint cycle 동적화** | ✅ 2026-05-03 완료 | RAILWAY_GIT_COMMIT_SHA → commit 7자 + commitFull + deploymentId + branch · 하드코딩 "v2-launch-ready" 제거 · vitest +4 (총 354) · ADR 불필요 |
| **U — 백로그 정리 미니 (VarChar 정합성)** | ✅ 2026-05-03 완료 | ShareComment.nickname VarChar(50) + body VarChar(1000) — validateNickname(10) / validateBody(200)의 5x escape 마진과 정합 · 마이그 0009 · vitest +5 (총 359) · 사용자 액션 +1 (migrate deploy 0009) |
| **V — E2E nightly 워크플로우** | ✅ 2026-05-03 완료 | ADR-037 · `.github/workflows/e2e-nightly.yml` (cron 0 18 UTC = KST 03:00 + workflow_dispatch + health probe 선행) · ADR-029 빌드 회귀 ↔ ADR-037 라이브 회귀 계층 분리 · 의존성 0 / 마이그 0 |
| **W — /shared 받은 trip 목록 (M7 미니)** | ✅ 2026-05-03 완료 | LocalStorage td_received_share_keys (LRU 50, 1년) · ReceivedKeyTracker 'use client' (/share/[key]에서 자동 추가) · /api/share/lookup POST (분당 30회 IP rate limit) · /shared 페이지 + /trips에 "받은 여행" 링크 · BottomNav 변경 X (사이클 I/O 답습) · vitest +14 (총 373) |
| **X — M3 Live Replan 동적 trigger** | ✅ 2026-05-03 완료 | ItineraryView에 activeTrigger state + 카드 dropdown(Day별 일정 선택) + 30/60/90분 버튼 · effectiveTrigger를 ReplanModal/commitReplan 전달 · 기존 hardcoded `pq-item-6` → fallback으로만 사용 · mutation 자체는 무변경 (답습) |
| **Y — M4 카메라 번역 진단 도구** | ✅ 2026-05-03 완료 | `/api/diag/translate` GET (vision/claude available + keyMask 마지막 4자만) · docs/12-user-actions.md §C 신규 (Vision/Claude 활성 검증 + 비용 가드) · vitest +5 · ADR 불필요 |

---

## 🔗 빠른 링크

- 운영 매뉴얼: [HARNESS.md](HARNESS.md)
- 상세 카탈로그: [CATALOG.md](CATALOG.md)
- 핵심 규칙: `../memory/MEMORY.md`
- 프로젝트 비전: `../docs/01-vision.md`
- 데이터 모델: `../docs/04-data-model.md`
- 공유 라이브러리: `C:\Projects\_shared\agents\INDEX.md`
