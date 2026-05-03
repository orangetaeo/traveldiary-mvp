---
id: ADR-043
title: 베트남 6 도시 boundary 활성화 — M2 자동 모드 전환 (사이클 WW)
status: Accepted
date: 2026-05-03
decider: R1 CTO
proposer: T7 Mode Transition + T19 Librarian + T16 Security + R5 FE
related: ADR-014 (M2 데모 토글), ADR-017 (Geolocation + AutoModeDetector), ADR-032 (Country 정규화)
---

# ADR-043: 베트남 6 도시 boundary 활성화 (M2 실 가동)

## 컨텍스트

**현 상태 (사이클 VV 직후)**:
- ADR-014 — M2 D-Day 모드 전환 데모 토글 (사이클 3)
- ADR-017 — Geolocation + AutoModeDetector + setTripMode mutation (5b-4). 클라 좌표 → mode만 서버 전송
- `lib/mode-transition.ts:DESTINATION_BOUNDARIES` — **PQC(푸꾸옥)만 등록**

**문제**: 베트남 trip 시드 6개(PQC/SGN/HAN/DAD/NHA/DLI) 중 푸꾸옥 외 5개에서 AutoModeDetector "📍 내 위치로 자동 전환" 클릭 시 `isWithinBoundary` 항상 false → 자동 전환 동작 불가. M2 실 가동이 단일 도시에 머물러 있음.

**메모 정책 (2026-05-03 사용자 명시)**: 베트남 단일 국가 집중. 다른 나라 확장은 보류 (`feedback_vietnam_only_focus`). 비-베트남 도시(BKK/CNX/TYO) boundary 추가는 본 사이클 범위 외.

## 결정

**`DESTINATION_BOUNDARIES`에 베트남 trip 시드 보유 5 도시 추가 (PQC 포함 총 6개).**

| code | 도시 | 중심 좌표 | 반경 | 비고 |
|---|---|---|---|---|
| PQC | 푸꾸옥 | 10.225, 103.96 | 30km | 섬 — 사이클 0 답습 |
| SGN | 호치민 | 10.7769, 106.7009 | 25km | 대도시 |
| HAN | 하노이 | 21.0285, 105.8542 | 25km | 대도시 |
| DAD | 다낭 | 16.0544, 108.2022 | 25km | 대도시 |
| NHA | 나트랑 | 12.2388, 109.1967 | 20km | 중소도시 |
| DLI | 달랏 | 11.9404, 108.4583 | 20km | 산악 중소도시 |

**호이안(HOI)** — city only, trip 시드 없음 → boundary 미추가 (dead 회피).
**비-베트남(BKK/CNX/TYO)** — 베트남 단일 국가 정책에 따라 미추가.

### 부수 정리 (사이클 WW)

- `lib/mode-transition.ts` 헤더 주석 — "사이클 3 데모 토글로만 시연" → 5b-4 ADR-017 + WW 반영
- `lib/replan.ts` 헤더 주석 — "mutation·DB 미도입" stale → 5b-2 commitReplan 반영
- `tests/unit/mode-transition-vietnam.test.ts` 신규 — 6 도시 + 비-베트남 3 도시 회귀

## 대안

| 대안 | 채택 안 한 이유 |
|---|---|
| `City.center` 필드 추가 후 시드들에 좌표 채움 (정규화) | 단계적 정규화 패턴 답습 — 트리거 = "Phase 2 동남아 확장 시". 현재는 도시 6개 직접 등록이 충분 (`feedback_phased_normalization`) |
| 호이안 boundary도 함께 추가 | trip 시드 없어 detectMode 호출 경로 없음 → dead. trip 시드 추가 시 동시 도입 |
| 비-베트남 3 도시(BKK/CNX/TYO) boundary 일괄 등록 | 베트남 단일 국가 정책에 위배 (`feedback_vietnam_only_focus`). 사업 확장 사이클에서 별도 ADR |

## 시드 승격 트리거 (City.center 정규화)

다음 중 **2개 이상** 충족 시 ADR로 승격:
1. boundary 등록 도시 ≥ 10개 (현재 6, 4 더 추가 시)
2. 도시별 다중 polygon 필요 (현재는 원형 1개로 충분)
3. 비-베트남 도시 trip 시드 활성화 (Phase 2)

## 데이터 안전성

- 좌표 서버 미전송 정책 ADR-017 그대로. boundary 데이터는 **클라이언트 번들에 정적**으로 노출되지만, 6 도시 중심 좌표는 위키피디아 공개 정보 — 보안 이슈 없음.
- `audit log metadata.trigger="geolocation"`만 기록, 좌표 X (ADR-017 §C 답습).

## 회귀 단언 (T12)

`tests/unit/mode-transition-vietnam.test.ts` (신규):
1. 6 도시 모두 `isWithinBoundary(중심좌표, code) === true`
2. 6 도시 모두 1000km 외곽 좌표 → `false`
3. 비-베트남 3 도시(BKK/CNX/TYO) → 항상 `false` (boundary 미등록 회귀)
4. `detectMode(trip, today, 중심좌표) === "in-travel"` (D-Day 0)
5. `detectMode(trip, today, 외곽좌표) === "pre-travel"` (보수)
6. `detectMode(trip, today, undefined) === "pre-travel"` (위치 미제공 보수)

## 영향

- **신규 의존성 0**
- **schema 변경 0**
- **신규 컴포넌트 0**
- **vitest +18 (6 도시 × 3 + 비-베트남 3 × 1 + detectMode 6 × 3 = 보수)**
- **사용자 액션 0** (코드만)
