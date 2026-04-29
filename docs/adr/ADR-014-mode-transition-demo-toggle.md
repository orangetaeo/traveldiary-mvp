---
id: ADR-014
title: 사이클 3 모드 전환 — 데모 토글 UI (실 자동 전환은 사이클 5)
status: Accepted
date: 2026-04-29
decider: R1 CTO
proposer: T7 Mode Transition Manager + T17
---

# ADR-014: 사이클 3 모드 전환 — 데모 토글 UI

## 컨텍스트

S-04 mode-transition은 "D-Day=0 + 위치 ∈ 목적지 경계" 두 조건이 동시에 충족될 때 **자동** 전환을 명시한다. 그러나:

- 시드 `phuQuocTrip.startDate = 2026-05-14`, 오늘 2026-04-29 → D-Day 15. 자동 전환 트리거 미충족.
- 실제 위치 권한 요청은 외부 API(Geolocation) + Privacy 정책 — T16 Security 사인오프 + 사용자 명시 동의 필요. 사이클 5 항목.
- 사이클 3에서 시연 가능한 매직 모먼트 M2를 만들려면 **명시적 데모 토글**이 필요.

## 결정

1. **사이클 3은 데모 토글로만 시연** — `/itinerary/[id]`에 "여행 중 모드로 전환 (데모)" 버튼. 클릭 시 `/travel/[id]`로 navigation.
2. **`lib/mode-transition.ts`는 순수 함수로 작성** — `calculateDDay`, `isWithinBoundary`, `detectMode`. 사이클 5에서 자동 트리거가 그대로 호출.
3. **푸꾸옥 경계**: 중심 `(10.225, 103.96)` (즈엉동), 반경 30km. (데이터: `lib/mode-transition.ts` 내부 상수)
4. **모드별 색상은 CSS variable**: `globals.css`에 `--color-mode-primary` 정의, `data-travel-mode` 속성에 따라 보라/코랄/그린 자동 전환.
5. **Audit log 실호출은 미도입** — 사이클 5 ADR-013과 함께. 모드 전환 시 클라이언트 콘솔 로그만 (`console.info`).

## 대안

### A — Mock 위치 + Mock 시계 토글 (비채택)
- 장점: 자동 전환 로직을 그대로 시연.
- 단점: UI 복잡도 ↑, 시드 일정의 시간 인식이 두 시계 사이에서 혼란.

### B — 사이클 3 자체를 사이클 5와 묶음 (비채택)
- 단점: M2가 시연 가능 시점에서 빠짐. 매직 모먼트 4개 모두 묶이는 위험.

## 영향

### 긍정
- M2 시연 가능 (보라→코랄 색 전환, FAB 등장).
- `lib/mode-transition.ts`는 사이클 5에서 그대로 호출.
- Privacy 위반 없음 (실 위치 미요청).

### 부정
- 사용자 인터뷰 시 "버튼을 눌러야 전환되네"가 매직 모먼트 정신과 다름 — 데모 라벨 명시로 보완.

## 관련

- 영향 스킬: S-04 mode-transition (사이클 5에서 자동 트리거 ADR로 격상)
- 후속: ADR-013(사이클 5) — Geolocation·DB·Server Action·writeAuditLog 묶음.

## 사인오프

R1 ✅ · T7 ✅ · T17 ✅ · T16 ✅ (사이클 5에서 위치 권한 ADR 별도)
