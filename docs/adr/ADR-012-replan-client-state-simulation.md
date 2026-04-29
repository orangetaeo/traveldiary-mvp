---
id: ADR-012
title: 사이클 2 Live Replan — 클라이언트 상태 시뮬레이션 (mutation/DB 미도입)
status: Accepted
date: 2026-04-29
decider: R1 CTO
proposer: T19 Harness Librarian (사이클 2 STEP 2 회의 종합)
---

# ADR-012: 사이클 2 Live Replan — 클라이언트 상태 시뮬레이션

## 컨텍스트

사이클 1(ADR-009)은 데모 모드(DATABASE_URL 미설정 시 `lib/seed/*` 직접 import)로 종료됨. 사이클 2 M3 Live Replan은 자연스럽게 mutation을 떠올리게 한다. 그러나:

- mutation Server Action을 도입하려면 Prisma 7 driver adapter + `prisma.config.ts` 추가 필요(ADR-011 후속).
- adapter 도입은 `@prisma/adapter-pg`·`pg` 신규 의존성 2개를 강제 — ADR-010(의존성 0 추가) 정신 위배.
- DB가 실제로 필요해지는 시점은 사이클 5 Railway PostgreSQL 인스턴스 도입.

따라서 사이클 2와 사이클 5 사이의 **결합도가 자연스럽게 일치한다**.

## 결정

1. **사이클 2 Live Replan은 클라이언트 상태(useState/useReducer)로만 시뮬레이션**한다.
2. `lib/replan.ts`의 DAG 영향 범위·3옵션 생성 알고리즘은 **순수 함수**로 작성 — 서버·클라이언트 양쪽에서 호출 가능. 사이클 5에서 Server Action으로 wrap만 하면 된다.
3. UI는 "Live Replan 시뮬레이션" 진입 버튼 + 바텀 시트 모달 + 3옵션 카드 + ImpactDisplay 컴포넌트.
4. 실 mutation·writeAuditLog 실호출·prisma.config.ts·driver adapter는 **사이클 5에서 ADR-013으로 일괄 도입**.
5. 사이클 2의 검증 시나리오는 푸꾸옥 시드 일정의 트리거 케이스 1건(예: Day 3 사오비치 90분 지연) 기반.

## 대안

### A — 사이클 2에 mutation+adapter+DB 모두 도입 (비채택)
- 장점: 사이클 5에서 Replan 재구현 불필요.
- 단점: 의존성 2개 추가 + adapter ADR + DB connection 관리 + 마이그레이션 절차 — 사이클 1 회고에서 "한 사이클에 너무 많이 담기 금지" 학습 위반.

### B — Server Action 도입하되 메모리 store에 저장 (비채택)
- 단점: 메모리 store의 동시성·재시작 문제 + 사이클 5에서 어차피 swap 필요. 정직성 떨어짐.

### C — 사이클 2를 건너뛰고 사이클 3으로 (비채택)
- 단점: 사용자 결정상 사이클 2가 M3. M3는 "이거 진짜 살아있네" 매직 모먼트 — 시연 가능 시점을 늦추면 안 됨.

## 영향

### 긍정
- 사이클 2도 신규 의존성 0개 유지.
- `lib/replan.ts`가 순수 함수라 단위 테스트 용이.
- 사이클 5에서 Server Action·writeAuditLog·DB persist를 함께 도입하여 한 번에 정합 검증.

### 부정
- "AI는 결정하지 않는다 — 사용자가 결정한다" 원칙은 시연 가능하지만, 결정 결과가 새로고침 시 사라짐(클라이언트 상태). 사용자 멘탈 모델 보호용으로 모달 헤더에 "데모 시뮬레이션" 라벨 명시.
- 사이클 5 Replan persist 도입 시 클라이언트→서버 전환 비용 1회 발생.

## 후속

- ADR-013 (사이클 5): Prisma 7 driver adapter (`@prisma/adapter-pg` + `pg`) + `prisma.config.ts` + 첫 mutation Server Action + writeAuditLog 실호출 + Railway PostgreSQL.

## 사인오프

- R1 CTO ✅ · T2 Itinerary Graph Engineer ✅ · T5 Live Replan Engine ✅ · T14 DB Architect ✅ (사이클 5에서 처리 동의)
