# 사이클 2 회고 (T18) — KPT

**날짜**: 2026-04-29
**범위**: 사이클 2 — M3 Live Replan (DAG 영향 범위 + 3옵션 + 바텀 시트)

---

## Keep

1. **순수 함수 우선 설계** — `lib/replan.ts`가 React 컴포넌트와 분리. 사이클 5 Server Action wrap이 자연스러움.
2. **시뮬레이션 한계 명시** — 모달 헤더 "데모 시뮬레이션" 라벨로 사용자 멘탈 모델 보호. 사용자 신뢰 깨지 않음.
3. **사이클 분할 결정 (ADR-012)** — mutation·DB를 사이클 5로 묶음으로써 사이클 2가 작고 검증 가능한 단위로 유지됨. 의존성 0개.
4. **시드 데이터 트리거 시나리오 정의** — 합의문 A4에 Day 3 사오비치 90분 지연을 명시. QA 골든패스가 한 번에 작성됨.

## Problem

1. **flexMinutes 정책의 불완전성** — 추천 옵션에서 `min(trigger, max(flexMinutes, 30))` 식이 자체 직관적이지만, "딱 30분 이상은 무조건 30분 보장"이라는 마법수가 ADR 없이 코드에 박혔음.
2. **클라이언트 상태가 라우팅 사이에 휘발** — `/itinerary/[id]/item/[itemId]` 상세로 들어갔다 돌아오면 시뮬 적용 결과가 사라짐. 데모로는 OK지만 사이클 5에서 제대로 다뤄야.
3. **시각적 비교 (변경 전 vs 변경 후)** 미구현 — 사용자에게 "Day 3 일정이 어떻게 바뀌나" 카드 단위 비교가 없음. 카드 내부 시간만 변경됨. 사이클 5에 ImpactPreview를 추가할지 검토.

## Try

1. **단위 테스트 가능 시점에 `lib/replan.ts` 테스트 추가** (vitest 도입은 사이클 5 전후로 ADR).
2. **Replan 적용 결과를 라우터 state 또는 URL로 보존** — Next.js의 `useSearchParams` + `?replan=recommend` 패턴 검토.
3. **flexMinutes 마법수 30 → 데이터 모델로 이전** (e.g. ItineraryItem.minShiftMinutes) — 사이클 3·5 사이에 결정.

## 새 패턴

### "Server→Client 데이터 패스 + 클라이언트 시뮬" (메모리화 후보)
사이클 1엔 페이지가 Server. 사이클 2엔 동일 페이지가 Server에서 데이터 조회 후 Client wrapper에 전달, Client가 상태·인터랙션 보유. 사이클 5에서 mutation 도입 시 wrapper의 setState를 Server Action 호출로 swap만 하면 됨. **신규 메모리에 저장**.

## 사이클 메트릭

| 지표 | 값 |
|------|----|
| 5단계 프로세스 | ✅ 5/5 |
| ADR | 1 (ADR-012) |
| 신규 의존성 | 0 |
| 산출 파일 | 5 (replan.ts + 3 컴포넌트 + 페이지 갱신) + 3 ADR/회의록 |
| 빌드 | 6 routes, /itinerary/[id] 4.59kB |
| tsc 에러 | 0 |
