# 13. MVP 시나리오 B — PRD (Single Source of Truth)

> **결정**: 2026-05-03 사용자 (bizcomhome@gmail.com)
> **시나리오**: B — 진짜 사용자가 자기 여행을 만들 수 있는 상태까지 만든 뒤 출시
> **상태**: Active
> **추정 사이클**: 17~28 (자율 모드 + 하루 10시간 작업 시 약 2~4주)
> **연관**: `memory/project_mvp_scenario_b_decision_2026_05_03.md`, `memory/project_audit_2026_05_03_blockers.md`, `.claude/AUTONOMY.md`

---

## 0. 이 문서의 목적

이 PRD는 **다음 사이클 무엇을 할지를 사용자에게 묻지 않고도** Claude Code가 따라갈 수 있는 단일 진실 문서입니다. 자율 모드(`.claude/AUTONOMY.md`)와 짝을 이루어 사용자 의사결정 대기를 최소화합니다.

**원칙**: 사용자에게 묻기 전에 이 문서를 먼저 본다. 이 문서가 답하지 못하는 질문만 사용자에게 묻는다.

---

## 1. 출시 정의 (DoD — Definition of Done)

다음 7가지가 전부 충족되어야 "시나리오 B 출시 가능":

1. ✅ 신규 사용자가 자기 여행을 직접 입력해서 AI 일정을 생성할 수 있음 (BLOCKER 1)
2. ✅ 사용자가 자기 정체성/마이페이지를 가짐 (BLOCKER 2)
3. ✅ 관리자 페이지가 인증으로 보호됨 (BLOCKER 3)
4. ✅ 모바일에서 일정 순서를 자연스럽게 바꿀 수 있음 (BLOCKER 4)
5. ✅ 핵심 9개 페이지에서 BottomNav로 길을 잃지 않음 (BLOCKER 5)
6. ✅ 같은 기기 사용자 A·B가 자기 여행으로 분리됨 (BLOCKER 6)
7. ✅ OTA 어필리에이트가 dummy URL 아닌 실 계약 링크로 동작 (BLOCKER 7 — 사업 액션)

**검증 방법**: Playwright E2E 시나리오 — 신규 사용자가 온보딩 → AI 일정 생성 → 체크리스트 작성 → 비용 입력 → 공유 → 받은 사람 확인까지 한 번에 끝까지 통과.

---

## 2. BLOCKER 상세 (우선순위 순)

### Phase 1 — 빠른 손질 (3~5 사이클)

#### BLOCKER 5: BottomNav 9 페이지 확장

- **현상**: BottomNav가 `/`, `/trips` 두 페이지에만 노출. 9개 핵심 페이지에서 사라짐.
- **DoD**: 핵심 페이지 모두 BottomNav 노출. active slot 정확.
  - 노출 대상: `/itinerary/[id]`, `/cost/[tripId]`, `/checklist/[tripId]`, `/city/[slug]`, `/city/[slug]/emergency`, `/translate`, `/share/[key]`, `/vote/[tripId]`, `/shared`
  - 모달/풀스크린 페이지는 예외 (judgment call 필요)
- **추정**: 1~2 사이클
- **자율/게이트**: 🟢 자율 OK (UI 패턴 답습)
- **의존성**: 없음
- **위험**: 낮음 — 사이클 O에서 컴포넌트 추출 완료 상태

#### BLOCKER 3: Admin 페이지 인증 가드

- **현상**: `/admin/affiliate`, `/admin/m2-skip-reasons`가 URL 직접 입력으로 누구나 접근.
- **DoD**: SYSTEM_OWNER_ID 또는 OWNER_KEY 환경변수 기반 가드. 비인증 시 404.
- **추정**: 1 사이클
- **자율/게이트**: 🟢 자율 OK (보안 게이트는 표준 패턴)
- **의존성**: 없음
- **위험**: 낮음

#### BLOCKER 2: Profile/마이페이지 skeleton

- **현상**: BottomNav Profile → /onboarding. 프로필 라우트 자체 부재.
- **DoD (Phase 1 한정)**: `/profile` 라우트 신설 + 기본 정보 노출(닉네임, clientUuid, 받은 공유 수, 내 여행 수). 카카오 OAuth 연동 자리만 마련(BLOCKER 6과 연계).
- **추정**: 1~2 사이클
- **자율/게이트**: 🟢 자율 OK
- **의존성**: BLOCKER 5 완료 후 (BottomNav Profile 라우팅 변경 동시 처리)
- **위험**: 낮음

---

### Phase 2 — 모바일 핵심 (2~3 사이클)

#### BLOCKER 4: 모바일 드래그앤드랍 어포던스

- **현상**: HTML5 native drag만 사용. iOS Safari 미지원. 어포던스 0(드래그 핸들 없음, 가이드 없음).
- **DoD**: 모바일에서 일정 순서 변경 가능한 UX.
  - 옵션 A (의존성 0 추천): 사이클 BBB의 위/아래 화살표 패턴을 일정에도 적용 (`moveItem` mutation, `swapWithinDay` 헬퍼)
  - 옵션 B (의존성 추가): `@dnd-kit/core` 도입 (touch sensor 지원)
  - **자율 결정 영역**: 옵션 A 우선. 옵션 B는 R1 CTO 게이트.
- **추정**: 2~3 사이클
- **자율/게이트**: 🟡 옵션 A는 자율, 옵션 B 도입은 R1 CTO 게이트
- **의존성**: 없음
- **위험**: 중간 — UX 결정이라 사용자 호불호 영역

---

### Phase 3 — 다중 사용자 격리 (3~5 사이클, 일부 진행 중)

#### BLOCKER 6: 모든 모델 actorId 격리

- **현상**: `SYSTEM_OWNER_ID`로 모든 trip 단일 귀속. 같은 기기 사용자 구분 0.
- **진행 중**: TT 사이클(2026-05-03)이 `ChecklistItem.actorId` NULLABLE + 마이그 0013 + `lib/auth/actor-resolution` 시작.
- **DoD**: Trip / ItineraryItem / ChecklistItem / CostEntry / Vote / ShareComment 전부 actorId 컬럼 + clientUuid 매칭 격리. 데모 trip은 명시적 DEMO 가드(누구나 보기 OK).
- **추정**: 추가 3~5 사이클 (TT 진행분 포함)
- **자율/게이트**: 🟡 격리 패턴 답습은 자율, 마이그레이션은 R1 CTO 게이트 (사이클당 1 마이그)
- **의존성**: 없음 (OAuth 활성과 독립적으로 진행 가능)
- **위험**: 중간 — 데이터 모델 변경. 기존 데모 시드와 호환성 유지 필요

#### Phase 3.5 — 카카오 OAuth 활성 (사용자 액션)

- **사용자 액션 1건**: 카카오 개발자 콘솔에서 KAKAO_CLIENT_ID/SECRET 발급 + Railway env 등록 (`docs/12-user-actions.md` 참조)
- **코드 변경**: 0 (이미 11b에서 통합 완료)
- **자율 영역 아님**: 사용자만 가능

---

### Phase 4 — 핵심 가치 (5~10 사이클)

#### BLOCKER 1: M1 AI 일정 생성 실 구현 ⭐

- **현상**: `app/itinerary/creating/page.tsx`는 스피너 + 타이밍 시뮬만. LLM 호출 함수 0.
- **DoD**:
  1. 사용자가 도시 + 일자 + 취향 입력 → Claude API로 일정 생성 → DB 영속화 → `/itinerary/[id]` 표시
  2. 생성된 각 ItineraryItem에 evidence 필드(검증 5단계 — Google Places + Naver) 자동 채움
  3. 데모 모드 fallback (ANTHROPIC_API_KEY 없으면 베트남 시드 trip로 fallback)
  4. 사용자 입력 검증 (베트남 도시 한정 정책)
- **추정**: 5~10 사이클 (가장 큰 BLOCKER)
- **자율/게이트**:
  - 🟡 LLM 프롬프트 설계 — 자율 1차 시도 + 사용자 호출 (UX 결정)
  - 🔴 R1 CTO 게이트: Claude API 모델 선택, 비용 가드, 응답 스키마 ADR
  - 🟢 자율 OK: 검증 5단계 통합(이미 사이클 5b-3/5b-6에서 구축), DB 영속화 패턴 답습
- **의존성**: BLOCKER 6 일부(actorId 인프라) 권장. 단, 현재 SYSTEM_OWNER_ID로 진행 후 BLOCKER 6와 합치는 것도 옵션.
- **위험**: 높음
  - LLM 환각 → 5단계 검증으로 차단되지만 시드 부족한 베트남 도시는 검증 통과율↓
  - 비용 가드 실패 시 청구액 폭증
  - 응답 시간 (10~30초) — 사용자 경험 영향
- **제안 사이클 분할**:
  1. Claude API 통합 + 단일 도시(푸꾸옥) 단순 일정 생성 (스키마 ADR)
  2. 검증 5단계 통합 + DB 영속화
  3. 입력 폼 UX (취향/예산/식이/알레르기)
  4. 베트남 6 도시 확장
  5. 데모 모드 fallback + 비용 가드 (rate limit + token limit)
  6. 골든 패스 E2E + 환각 검출 회귀

---

### Phase 5 — 사업 (코드 외부)

#### BLOCKER 7: OTA 어필리에이트 실 계약

- **현상**: stub URL `https://api.klook.com/v1/affiliate/search`. 어필리에이트 미체결.
- **DoD**: 최소 1개 OTA(Klook 우선) 어필리에이트 계약 + 실 endpoint 갱신 + 사용자 클릭 시 어필리에이트 매개변수 전달.
- **추정**: 코드 1~2 사이클 (계약 후) + **사업 액션 별도**
- **자율/게이트**: 🔴 사업 결정 — 사용자만 가능. Claude는 코드 측 준비만.
- **의존성**: 사업 액션 외부

---

### Phase 6 — 사용자 여정 + 출시 준비 (3~5 사이클)

CRITICAL 5건 + 골든 패스 E2E + 성능/접근성:

| ID | 항목 | DoD |
|----|------|-----|
| C1 | 온보딩-시드 분리 | hardcoded `startDate` 제거 + 데모 trip "체험" 라벨 명시 |
| C2 | 빈 상태 가이드 | /cost, /checklist 빈 상태에서 "첫 항목 추가" 명시 CTA |
| C3 | /share/[key] 보기 전용 표시 | 수정 시도 전 시각 차단 (회색 배지 + disabled) |
| C4 | Day 동기화 | Itinerary↔Cost↔Checklist day 파라미터 전달 |
| C5 | 응급 페이지 진입 | 도시 페이지 본문에 응급 카드 명시 노출 |
| L1 | Lighthouse | 모바일 LCP < 2.5s, CLS < 0.1, A11y > 90 |
| A11 | 키보드 네비 | 핵심 인터랙션 모두 Tab + Enter 가능 |
| E2E | 골든 패스 | Playwright `e2e/scenario-b-golden-path.spec.ts` 통과 |

- **추정**: 3~5 사이클
- **자율/게이트**: 🟢 자율 OK (이미 정착된 패턴)

---

## 3. 사이클 시퀀스 (권장)

```
[Phase 1: 손질 3~5]
  → BLOCKER 5 (BottomNav 확장) — 1~2 사이클
  → BLOCKER 3 (Admin 가드) — 1 사이클
  → BLOCKER 2 (/profile skeleton) — 1~2 사이클
[Phase 2: 모바일 2~3]
  → BLOCKER 4 (드래그 → 화살표) — 2~3 사이클
[Phase 3: 격리 3~5, TT 진행 중]
  → BLOCKER 6 (Trip + ItineraryItem + CostEntry + Vote + ShareComment actorId) — 3~5 사이클
  → 사용자 액션: 카카오 OAuth 활성 (계속 자율 진행 가능)
[Phase 4: M1 5~10]  ⭐ 핵심
  → BLOCKER 1 분할 6 사이클 (위 §2 BLOCKER 1 분할 참조)
[Phase 5: 사업 외부]
  → BLOCKER 7 (사용자 사업 액션 후 코드 1~2)
[Phase 6: 출시 준비 3~5]
  → CRITICAL C1~C5 + Lighthouse + E2E 골든 패스
```

**총**: 17~28 사이클. Phase 1·2·3은 병렬 진행 가능.

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

> 이후 변경은 사이클 종료 시 T18 회고에서 PRD 갱신 여부 판단.
