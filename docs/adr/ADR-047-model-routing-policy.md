---
id: ADR-047
title: 자율 모드 모델 라우팅 정책 (사이클 AAAA1)
status: Accepted (2026-05-04, cycle AAAA1)
date: 2026-05-04
decider: R1 CTO
proposer: R1 CTO + T18 Self-Evolution (5인 회의 결과 답습)
related: ADR-046 (24h 자율 안전 킬스위치), AUTONOMY.md §0.5.2
---

# ADR-047: 자율 모드 모델 라우팅 정책 (사이클 AAAA1)

## 컨텍스트

ZZZ 회의(R1 CTO P0-1)에서 식별: AUTONOMY.md/HARNESS.md 어디에도 Sonnet/Opus/Haiku 자동 선택 룰이 없다. 자율 모드에서 Opus 4.7로 STEP 1 Triage까지 처리 시 토큰 폭증 위험. 사이클 카운터(`lib/autonomy/cycle-counter.ts`) + 외부 API 일일 cap 도입과 함께 모델 라우팅을 박제할 시점.

**현 상태**:
- 메인 컨텍스트는 사용자가 시작한 모델(현재 Claude Opus 4.7 1M) 그대로 진행
- sub-agent는 호출 시 모델 명시 가능 (`Plan` agent는 별도 모델 사용 등)
- ZZZ 회의에서 5명 sub-agent 병렬 호출 시 모델 라우팅 의식 없이 진행됨 → 비용 추적 부재로 정확한 영향 불명

## 결정

**3-tier 모델 라우팅 매트릭스 박제. 자율 모드 한정 권장 — 깨어있는 시간(09:00~22:00) 사용자 명시 override 가능.**

### 결정 매트릭스

| 작업 영역 | 권장 모델 | 사유 |
|---|---|---|
| **STEP 1 Triage** (T19 Librarian, 도서관 검색, INDEX/CATALOG 라우팅) | **Haiku 4.5** | 단순 분류·검색·라우팅. 토큰 5~10배 저렴. Opus는 과잉 |
| **STEP 2 회의** (도메인 에이전트 병렬, 일반 회의) | **Sonnet 4.6** | 균형 — 코드/패턴 인식 충분, 비용 합리적. ZZZ 회의(5명)도 이 단계 권장 |
| **STEP 3 구현** (BE/FE/DB sub-agent, 일반 코드 작성/수정) | **Sonnet 4.6** | 답습 패턴 적용·테스트 작성·메모리 갱신은 Sonnet 충분 |
| **STEP 4 검증** (T13 Code Review, T12 QA) | **Sonnet 4.6** | 회귀 검사·환각 검출은 Sonnet 충분. 단 STEP 4 ④ R1 사인오프는 Opus |
| **STEP 5 회고** (T18 Self-Evolution, 메모리 정리) | **Haiku 4.5** | 단순 요약·메모리 작성. Sonnet도 OK |
| **R1 CTO 사인오프 게이트** | **Opus 4.7** | 거버넌스 결정·아키텍처·장기 영향 — 가장 깊은 추론 필요 |
| **M1 LLM 설계 (Phase 4)** | **Opus 4.7** | 일정 생성 핵심 가치. 회의 + 결정 모두 |
| **5+ 파일 멀티파일 리팩터** | **Opus 4.7** | 영향 범위 큼. Sonnet 2회 실패 후 Opus 승격 |
| **보안 회귀/SQL injection/XSS 검토** | **Opus 4.7** | 환각 저허용 영역 |
| **Sonnet 2회 연속 실패 작업** | **Opus 4.7** | 에스컬레이션 패턴 |

### Opus 호출 전 4-체크 (모두 Yes일 때만 Opus)
- [ ] 5개 이상 파일에 영향?
- [ ] 아키텍처 결정 또는 보안 이슈?
- [ ] Sonnet으로 2회 이상 실패?
- [ ] 또는 release 전 최종 QA?

체크 미달 시 Sonnet 우선 시도 → 실패 시 Opus 승격.

### 분포 목표 (사이클당)
- **Haiku**: 5~10% (Triage + 회고 + 단순 분류)
- **Sonnet**: 70~75% (회의 + 구현 + 검증 본체)
- **Opus**: 15~25% (R1 게이트 + M1 + 멀티파일 + 최종 QA)

### 분포 측정 (사이클 AAAA5b 도입)

`lib/autonomy/distribution.ts` — `recordSpend.byModel` 누적치를 read-only로 집계 (pickModel은 부수효과 없음 유지, R1+T13 결정).

| 함수 | 반환 |
|------|------|
| `classifyModel(name)` | `"haiku"` / `"sonnet"` / `"opus"` / `null` (정규식 매칭) |
| `getDailyModelDistribution(now?, dir?)` | `{ haiku, sonnet, opus, unclassified, total }` — 각 tier별 count/costUsd/pct (비용 가중) |
| `isWithinTargetDistribution(dist)` | `{ ok, alerts: string[] }` — Haiku <5%, Sonnet <70%, Opus >25%, unclassified 검출 시 alert |

**측정 단위**: 비용($) 기준 비율. 호출 횟수 기준은 단가 차이(Haiku $1 vs Opus $15)로 왜곡되므로 비용 가중.

**일탈 시그널**:
- Haiku <5% → Triage가 상위 모델로 처리됨 (Librarian이 Sonnet/Opus 사용)
- Sonnet <70% → 회의·구현이 Opus 사용 의심
- Opus >25% → Opus 호출 전 4-체크 미준수 의심
- unclassified 검출 → 모델 name 패턴 검토 필요 (가격표 갱신 또는 정규식 보강)

## 트리거 (사이클 처리 상태)

| 트리거 | 후속 | 상태 |
|---|---|---|
| sub-agent 호출 시 모델 자동 선택 헬퍼 (`pickModel(stage, criteria)`) | AAAA2 | ✅ AAAA2 — `lib/autonomy/pick-model.ts` (권장 반환, throw 없음) |
| 비용 트래킹 통합 (호출당 input_tokens/output_tokens 누적) | AAAA2 | ✅ AAAA2 — `lib/autonomy/budget.ts` `recordSpend()` + anthropic-claude.ts 통합 |
| 일일 비용 임계치 (시간당 $3/$6, 일일 $30/$50/$200) | AAAA2 | ✅ AAAA2 — `assertBudget()` 사전 게이트 + 3단계(warn/throw/emergency) |
| auto-degrade (Opus→Sonnet→Haiku) | AAAA3 | ⏳ AAAA2 미룸 (분포 데이터 1주일 누적 후 실측 기반) |
| `pickModel` 강제 throw | AAAA3 | ⏳ AAAA2 미룸 (현재는 권장 + console.warn) |
| `lib/usage-quota.ts` 영속화 (in-memory STATE → DB) | AAAA3 | ⏳ AAAA2는 메모리 파일 JSON(R1 (b) 결정), DB 승격은 다중 컨테이너 전환 시 |
| 모델별 토큰 단가 갱신 (Anthropic 가격 변경 시) | 별도 PR | 📌 `lib/autonomy/model-pricing.ts` 단가표 분리 |
| **OTA `provider="ota"` 통합 cap 분리** | BBBB 또는 라이브 활성 시 | 🔒 라이브 활성 전 보류 |
| `lib/autonomy/cycle-counter.ts` 영속 (메모리 파일 → DB) | 필요 시 | 🔒 보류 (현재 단일 세션 충분) |

## 영향

### Positive
- 자율 모드 비용 예측 가능 (전부 Opus 가정 → 평균 70% Sonnet 가정)
- ZZZ 회의(5 sub-agent 병렬)가 Sonnet 권장으로 향후 비용 절감
- 명문화 → T19 Librarian 사이클 시작 시 모델 결정 자동화 가능 (AAAA2)

### Negative
- 권장만 박제, 강제 메커니즘은 AAAA2까지 부재 → Claude가 "잊으면" Opus 그대로
- Haiku→Sonnet→Opus 승격 결정이 자동화되지 않아 사용자 명시 override가 1차 트리거
- 본 문서 갱신은 Anthropic 모델 가격/성능 변경 시 stale 위험

### Neutral
- 메인 컨텍스트 모델은 사용자가 결정 (`/fast`로 Opus 4.6 toggle 등)
- sub-agent 호출 시 model 명시는 호출처 책임

## 참조
- AUTONOMY.md §0.5.2 (사이클 카운터 + 모델 라우팅), §0.5.4 (사이클 AAAA2 비용 트래킹)
- ADR-046 (24h 자율 안전 킬스위치 — 비용 거버넌스의 짝)
- `lib/autonomy/cycle-counter.ts` (사이클 수 트래킹)
- `lib/autonomy/budget.ts` (사이클 AAAA2 비용 트래킹 + 임계치 + emergency-stop)
- `lib/autonomy/pick-model.ts` (사이클 AAAA2 모델 라우팅 헬퍼)
- `lib/autonomy/model-pricing.ts` (사이클 AAAA2 모델 단가표)

## 변경 이력

| 일자 | 사이클 | 변경 |
|------|-------|------|
| 2026-05-04 | AAAA1 | 초기 작성 — 3-tier 매트릭스 + Opus 4-체크 + 분포 목표 |
| 2026-05-04 | AAAA2 | 트리거 4건 처리 (pickModel + 비용 트래킹 + 임계치 + 영속 카운터(파일)). auto-degrade + pickModel 강제 throw + DB 승격은 AAAA3로 박제 |
| 2026-05-04 | AAAA5b | 분포 측정 wiring — `lib/autonomy/distribution.ts` 신규 (classifyModel + getDailyModelDistribution + isWithinTargetDistribution). recordSpend.byModel 재활용 read-only reporter (R1+T13 옵션 C, pickModel 부수효과 거부). 비용 가중 측정. |
