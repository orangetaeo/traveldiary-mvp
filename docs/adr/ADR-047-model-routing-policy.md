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

## 트리거 (다음 사이클로 분리)

| 트리거 | 후속 |
|---|---|
| sub-agent 호출 시 모델 자동 선택 헬퍼 (`pickModel(stage, criteria)`) | AAAA2 또는 BBBB |
| 비용 트래킹 통합 (호출당 input_tokens/output_tokens 누적) | **AAAA2 최우선** (R1 사인오프) |
| 일일 비용 임계치 (시간당 $3/$6, 일일 $30/$50/$200) + 자동 강등 | AAAA2 |
| 모델별 토큰 단가 갱신 (Anthropic 가격 변경 시) | 별도 PR |
| **OTA `provider="ota"` 통합 cap 분리** — 어필리에이트 1개라도 라이브 키 활성 시 `ota.agoda` / `ota.kkday` / `ota.klook` 각자 wrap (현재 1000 통합 → 각 1000) | **AAAA2 또는 BBBB** (R1 사인오프 C2). 라이브 활성 전까지는 통합 cap 유지 |
| `lib/usage-quota.ts` 영속 카운터 (in-memory STATE → KV/DB) | AAAA2 (다중 세션·서버리스 재시작 대응) |
| `lib/autonomy/cycle-counter.ts` 영속 (메모리 파일 JSON → DB) | BBBB (필요 시) |

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
- AUTONOMY.md §0.5.2 (사이클 카운터 + 모델 라우팅)
- ADR-046 (24h 자율 안전 킬스위치 — 비용 거버넌스의 짝)
- `lib/autonomy/cycle-counter.ts` (사이클 수 트래킹)
