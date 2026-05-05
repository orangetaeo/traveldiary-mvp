# 13. MVP 시나리오 B — PRD (Single Source of Truth)

> **결정**: 2026-05-03 사용자 (bizcomhome@gmail.com)
> **시나리오**: B — 진짜 사용자가 자기 여행을 만들 수 있는 상태까지 만든 뒤 출시
> **상태**: ✅ Code-Complete (2026-05-04) — BLOCKER 7 사업 액션만 잔여
> **추정 사이클**: 17~28 → **실제 소요 ~20 사이클** (PR #22~#50)
> **연관**: `memory/project_mvp_scenario_b_decision_2026_05_03.md`, `memory/project_audit_2026_05_03_blockers.md`, `.claude/AUTONOMY.md`

---

## 0. 이 문서의 목적

이 PRD는 **다음 사이클 무엇을 할지를 사용자에게 묻지 않고도** Claude Code가 따라갈 수 있는 단일 진실 문서입니다. 자율 모드(`.claude/AUTONOMY.md`)와 짝을 이루어 사용자 의사결정 대기를 최소화합니다.

**원칙**: 사용자에게 묻기 전에 이 문서를 먼저 본다. 이 문서가 답하지 못하는 질문만 사용자에게 묻는다.

---

## 1. 출시 정의 (DoD — Definition of Done)

다음 7가지가 전부 충족되어야 "시나리오 B 출시 가능":

1. ✅ 신규 사용자가 자기 여행을 직접 입력해서 AI 일정을 생성할 수 있음 (BLOCKER 1) — **PR #42 (2026-05-04)**
2. ✅ 사용자가 자기 정체성/마이페이지를 가짐 (BLOCKER 2) — **PR #34 (2026-05-04)**
3. ✅ 관리자 페이지가 인증으로 보호됨 (BLOCKER 3) — **PR #33 (2026-05-04)**
4. ✅ 모바일에서 일정 순서를 자연스럽게 바꿀 수 있음 (BLOCKER 4) — **PR #35 (2026-05-04)**
5. ✅ 핵심 9개 페이지에서 BottomNav로 길을 잃지 않음 (BLOCKER 5) — **PR #33 (2026-05-04)**
6. ✅ 같은 기기 사용자 A·B가 자기 여행으로 분리됨 (BLOCKER 6) — **PR #41 (2026-05-04)**
7. ⏳ OTA 어필리에이트가 dummy URL 아닌 실 계약 링크로 동작 (BLOCKER 7 — **사업 액션 대기**)

**검증 방법**: Playwright E2E 시나리오 — `e2e/scenario-b-golden-path.spec.ts` **(PR #50, 2026-05-04 작성 완료)**

---

## 2. BLOCKER 상세 (우선순위 순)

### Phase 1 — 빠른 손질 (3~5 사이클) ✅ 완료

#### BLOCKER 5: BottomNav 9 페이지 확장 — ✅ PR #33

#### BLOCKER 3: Admin 페이지 인증 가드 — ✅ PR #33

- `ADMIN_SECRET_KEY` 환경변수 기반 timing-safe 가드. 비인증 시 404.

#### BLOCKER 2: Profile/마이페이지 skeleton — ✅ PR #34

- `/profile` 라우트 신설 + BottomNav href 변경.

---

### Phase 2 — 모바일 핵심 (2~3 사이클) ✅ 완료

#### BLOCKER 4: 모바일 드래그앤드랍 어포던스 — ✅ PR #35

- 옵션 A 채택 (의존성 0): 위/아래 화살표 패턴을 일정에 적용.

---

### Phase 3 — 다중 사용자 격리 (3~5 사이클) ✅ 완료

#### BLOCKER 6: 모든 모델 actorId 격리 — ✅ PR #41

- TT 사이클(ChecklistItem) + PR #41(CostEntry + ItineraryItem + Vote). 마이그 0013 + 0014.

#### Phase 3.5 — 카카오 OAuth 활성 (사용자 액션) ⏳

- **사용자 액션 1건**: 카카오 개발자 콘솔에서 KAKAO_CLIENT_ID/SECRET 발급 + Railway env 등록
- 상세 가이드: `docs/12-user-actions.md §B` + `docs/16-kakao-oauth-quickstart.md`

---

### Phase 4 — 핵심 가치 (5~10 사이클) ✅ 완료

#### BLOCKER 1: M1 AI 일정 생성 실 구현 — ✅ PR #42

- Claude Haiku 통합 + 시드 폴백 + 베트남 6 도시 입력 검증.
- `lib/services/itinerary-generator.ts` + `actions/trip.ts` createTripFromOnboarding 연동.

---

### Phase 5 — 사업 (코드 외부)

#### BLOCKER 7: OTA 어필리에이트 실 계약

- **현상**: stub URL `https://api.klook.com/v1/affiliate/search`. 어필리에이트 미체결.
- **DoD**: 최소 1개 OTA(Klook 우선) 어필리에이트 계약 + 실 endpoint 갱신 + 사용자 클릭 시 어필리에이트 매개변수 전달.
- **추정**: 코드 1~2 사이클 (계약 후) + **사업 액션 별도**
- **자율/게이트**: 🔴 사업 결정 — 사용자만 가능. Claude는 코드 측 준비만.
- **의존성**: 사업 액션 외부

---

### Phase 6 — 사용자 여정 + 출시 준비 (3~5 사이클) ✅ 완료

| ID | 항목 | PR | 상태 |
|----|------|----|------|
| C1 | 온보딩-시드 분리 | #44 | ✅ |
| C2 | 빈 상태 가이드 | #45 | ✅ |
| C3 | /share/[key] 보기 전용 | #46 | ✅ |
| C4 | Day 동기화 | #43 | ✅ |
| C5 | 응급 페이지 진입 | #47 | ✅ |
| L1 | Lighthouse | #49 | ✅ |
| A11 | 키보드 네비 | #48 | ✅ |
| E2E | 골든 패스 | #50 | ✅ |

---

## 3. 사이클 시퀀스 (권장)

```
[Phase 1: 손질]     ✅ PR #33, #34
[Phase 2: 모바일]   ✅ PR #35
[Phase 3: 격리]     ✅ PR #41 + TT 사이클
[Phase 4: M1]       ✅ PR #42
[Phase 5: 사업]     ⏳ BLOCKER 7 사업 액션 대기
[Phase 6: 출시 준비] ✅ PR #43~#50
[Phase 7: 디자인]   🔄 Stitch 시안 적용 (3 세션 병렬)
```

**결과**: 코드 가능 항목 전부 완료. BLOCKER 7 + 카카오 OAuth 활성(사용자 액션) 잔여.

---

### Phase 7 — 디자인 적용 (3 세션 병렬)

> **목적**: Stitch 시안을 실제 코드에 적용하여 출시 수준 UI/UX 달성.
> **방식**: 3 세션 동시 작업 (충돌 방지 매트릭스 아래).
> **시작**: 2026-05-05

#### 세션 분할 매트릭스

| 세션 | Branch | 담당 영역 | 작업 내용 |
|------|--------|----------|----------|
| **A** | `auto/session-a-pages-restyle` | 기존 10 페이지 리스타일링 | onboarding, profile, trips, shared, checklist, cost, vote, city, guide, itinerary/creating |
| **B** | `auto/session-b-components` | 공유 UI 컴포넌트 | Toast, EmptyState, ErrorState, EvidencePanel, Allergen, Impact |
| **C** | `auto/session-c-new-pages` | 신규 페이지 + Admin 디자인 + 공유 파일 | admin/*, wrap-up, permission, settings, booking |

#### 공유 파일 단일 라이터 (세션 C 전담)

- `prisma/schema.prisma` + `prisma/migrations/`
- `tailwind.config.ts`, `app/globals.css`, `lib/design-tokens.ts`
- `docs/13-mvp-scenario-b-prd.md`, `docs/10-stitch-mapping.md`
- `package.json` (의존성 추가 — R1 CTO 게이트 후)

#### 충돌 방지 규칙

1. 매 사이클 시작 시 `git fetch origin && git pull origin main --rebase`
2. 세션 B 컴포넌트가 머지되기 전: import를 stub으로 두고 페이지 구조만 진행
3. 마이그레이션 번호: git fetch 후 다음 번호 확인
4. 새 npm 의존성: R1 CTO 게이트 + 사용자 결정

#### Phase 7 작업 목록

| # | 작업 | 세션 | Stitch 시안 | 상태 |
|---|------|------|------------|------|
| 7-1 | PRD §3 + stitch-mapping 갱신 | C | — | ✅ |
| 7-2 | /admin 메인 디자인 | C | Admin Main | ✅ |
| 7-3 | /admin/funnel 디자인 | C | Admin Funnel | ✅ |
| 7-4 | /admin/affiliate 디자인 | C | Admin Affiliate | ✅ |
| 7-5 | /admin/m2-skip-reasons 디자인 | C | Admin M2 Skip Reasons | ✅ |
| 7-6 | /admin/invite 디자인 | C | Admin Invite | ✅ |
| 7-7 | /admin/ab 디자인 | C | Admin A/B Test | ✅ |
| 7-8 | /wrap-up/[tripId] 신규 | C | Trip Wrap-up | ✅ |
| 7-9 | /permission/location 신규 | C | Permission Location | ✅ |
| 7-10 | /permission/notification 신규 | C | Permission Notification | ✅ |
| 7-11 | /settings 신규 | C | Settings | ✅ |
| 7-12 | /booking/[bookingId] 신규 | C | Booking Confirmation | ✅ |
| 7-13 | Camera 알레르기 매칭 강조 | C | Camera 알레르기 변형 | ✅ |
| 7-14 | OTA Affiliate Interstitial 모달 | C | OTA Affiliate Interstitial | ✅ |
| 7-15 | Live Replan Conflict 모달 | C | Live Replan Conflict | ✅ |
| 7-A1~A10 | 기존 10 페이지 리스타일링 | A | (각 페이지 시안) | ⬜ |
| 7-B1~B6 | 공유 UI 컴포넌트 | B | (각 컴포넌트 시안) | ⬜ |

---

## 4. 자율 / 게이트 매트릭스 (요약)

| 영역 | 자율 OK | 사용자 게이트 |
|------|---------|--------------|
| 코드 작성 / 리팩터 / 테스트 | ✅ | |
| 기존 패턴 답습 (mutation 표준, audit log, schema validation, 화살표 정렬) | ✅ | |
| 작은 의존성 0 UX 개선 | ✅ | |
| BLOCKER 우선순위 (이 PRD대로) | ✅ | |
| BottomNav 페이지 추가 / 라우팅 정리 | ✅ | |
| Admin 인증 가드 추가 | ✅ | |
| 새 npm 의존성 추가 | | 🔴 R1 CTO |
| 새 Prisma 마이그레이션 | | 🔴 R1 CTO + 사용자 (`migrate deploy`) |
| Claude/외부 API 모델 선택, 비용 가드 정책 | | 🔴 R1 CTO |
| 베트남 정책 위반 (다른 나라 도시 추가) | | 🔴 사용자 |
| 새 외부 키 요구 (사업 액션) | | 🔴 사용자 |
| UX 큰 결정 (모바일 드래그 옵션 A vs B) | | 🟡 옵션 A는 자율, B는 R1 + 사용자 |
| ADR 작성 | ✅ Claude가 초안 | 🟡 사용자 승인 |
| 사이클 종료 후 다음 사이클 시작 | ✅ (자율 모드) | |

자세한 정책: `.claude/AUTONOMY.md`

---

## 5. 베트남 단일 국가 정책 (재확인)

이 PRD의 모든 사이클은 **베트남 6 도시 한정**으로 작동해야 합니다 (`memory/feedback_vietnam_only_focus.md`):
- 푸꾸옥 / 다낭 / 호치민 / 하노이 / 나트랑 / 달랏
- 다른 나라 시드(태국 치앙마이/방콕, 일본 도쿄)는 dormant 유지
- M1 AI 일정 생성도 베트남 도시 한정 입력 검증

---

## 6. 위험 등록부

| # | 위험 | 영향 | 완화책 |
|---|------|------|--------|
| R1 | M1 LLM 환각 | 사용자가 잘못된 장소 안내 받음 | 검증 5단계 + 환각 검출 회귀 + 사용자 신고 경로 |
| R2 | M1 비용 폭증 | Anthropic 청구액 폭증 | rate limit + token limit + EvidenceCache 7일 TTL |
| R3 | M1 응답 시간 | 사용자 이탈 | streaming + 단계별 진행 표시 |
| R4 | BLOCKER 6 마이그 충돌 | 라이브 데이터 손상 | NULLABLE 기본 + 데모 trip DEMO 가드 + 롤백 마이그 동시 작성 |
| R5 | 모바일 드래그 사용자 불만 | UX 호불호 | 옵션 A 출시 후 피드백 수집, 필요시 옵션 B 전환 |
| R6 | OTA 계약 지연 | 수익 모델 미가동 | dummy URL이라도 클릭 추적은 유지 → 계약 후 즉시 전환 |
| R7 | Claude Code 자율 모드 표류 | 사용자 의도 이탈 | 게이트 매트릭스 엄격 준수 + 매 N 사이클 사용자 체크포인트 |

---

## 7. 출시 후 (시나리오 C)

이 PRD는 시나리오 B 한정. 시나리오 C(수익 검증 출시)로의 이행은 별도 PRD 작성 필요:
- 실 사용자 베타 100명
- 월매출 100만원 검증
- ASO/SEO 최적화
- 신규 도시 확장 (베트남 외 — 사용자 정책 변경 후)

---

## 8. 변경 이력

| 일자 | 사이클 | 변경 |
|------|-------|------|
| 2026-05-03 | (신규) | 초기 작성. 시나리오 B 결정 + 7 BLOCKER + 자율-게이트 매트릭스. |
| 2026-05-04 | PR #33~#50 | Phase 1~4, 6 전부 완료. BLOCKER 1~6 + CRITICAL C1~C5 + L1 + A11 + E2E. Code-Complete 선언. |
| 2026-05-05 | Phase 7 | 디자인 적용 Phase 추가. 3 세션 병렬 분할 (A 리스타일 / B 컴포넌트 / C 신규 페이지+Admin). |

> 다음 단계: 시나리오 C PRD (`docs/15-mvp-scenario-c-prd.md`) 참조.
