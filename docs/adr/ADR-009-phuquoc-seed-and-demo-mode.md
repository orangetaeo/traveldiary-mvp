---
id: ADR-009
title: 푸꾸옥(PQC) 시드 데이터 + Phase 0 데모 모드
status: Accepted
date: 2026-04-29
decider: R1 CTO
proposer: T19 Harness Librarian (사이클 1 회의 종합)
---

# ADR-009: 푸꾸옥(PQC) 시드 데이터 + Phase 0 데모 모드

## 컨텍스트

- 사이클 1에서 "기반 + M1 추천 근거 패널"을 시연 가능한 수준까지 구현해야 함.
- 사용자 결정: 시드 도시는 **푸꾸옥(베트남, 코드 `PQC`)**, 기획 문서(`docs/`)도 푸꾸옥으로 전면 교체.
- 기존 ADR-007/008은 "환각 차단 + 한국어 후기 인덱싱"이지만, 사이클 1에서는 외부 API(Google/Naver) 키 없이도 동작하는 **정적 시드 + 데모 모드**가 필요.
- ADR-004(Prisma 7 + PostgreSQL)는 유지하되, 사이클 1은 DB 미연결 상태에서도 화면이 동작해야 함.

## 결정

1. **시드 도시 = 푸꾸옥**, `destinationCode = "PQC"`.
2. **시드 사양**: 카테고리별 24곳 (food 8 / spot 8 / shopping 4 / rest 4). 각 곳마다 `Evidence` 정적으로 작성 (네이버 후기 수·긍정율·출처 URL은 큐레이션된 합리적 수치).
3. **시연 일정 = 3박 4일 푸꾸옥 샘플**:
   - Day 1 (도착): 즈엉동 야시장 디너 → 사오비치 야경 산책
   - Day 2 (액티비티): 빈원더스 → 빈펄 사파리 → 더 캐비 디너
   - Day 3 (자연): 사오비치 → 케이블카(혼톰) → 선월드 → 호국사
   - Day 4 (출발): 즈엉동 거리 → 공항
4. **데모 모드 (Phase 0)**: `DATABASE_URL`이 비어 있으면 시드 데이터를 메모리에서 직접 import해 화면을 렌더한다. `prisma migrate dev` 실행 후엔 DB 모드로 전환 (Phase 1).
5. **변경 API는 사이클 2에서**: 사이클 1은 읽기 전용 시연이므로 mutation Server Action은 미구현. `lib/audit-log.ts` 유틸과 `AuditLog` 모델만 정의해 둔다 (절대 규칙 위반 아님 — POST/PUT/PATCH/DELETE가 없으므로).

## 대안

### 대안 A — 도쿄 시드 유지 (비채택)
- 장점: 기존 docs와 일관성.
- 단점: 사용자 명시 요구(푸꾸옥) 위배.

### 대안 B — 도쿄 + 푸꾸옥 둘 다 시드 (비채택)
- 장점: 다도시 지원 사전 검증.
- 단점: 사이클 1 범위 폭증, MVP 다중 검증 부실 위험.

### 대안 C — 사이클 1에 외부 API(Google/Naver) 실제 호출 (비채택)
- 단점: API 키 미수령 상태(`.env.example` 빈 칸). CTO 게이트 새 결정 필요. 비용 증가. 사이클 4(M4)에서 함께 도입이 합리적.

## 영향

### 긍정적
- 외부 키 없이도 즉시 시연 가능.
- M1 근거 패널의 시각·인터랙션을 환각 위험 없이 검증 가능.
- 푸꾸옥은 "Phase 2 동남아 진출"의 첫 도시 — 로드맵 선행 효과.

### 부정적
- Evidence가 정적이므로 사용자에게 명시적으로 "데모 데이터"임을 표시할 필요는 없음 (시드는 실제 후기 수치를 모방).
- DB 미연결 상태에서 화면이 동작하므로, 사이클 2 mutation 구현 시 데이터 흐름 일관성 점검 필요.

### 트레이드오프
- "정적 데이터를 어디까지 진짜처럼 만들까" — 검증 가능한 출처 URL을 동반시켜 출처 클릭 시 외부 사이트로 이동하게 한다 (실 운영 시점에 진짜 후기 인덱스로 교체).

## 관련

- 영향받는 스킬: S-02 evidence-gathering, S-09 prisma-schema-design, S-13 audit-log-pattern
- 영향받는 에이전트: T1 Trip Architect, T3 Evidence Collector, T14 DB Architect, T17 UX Designer
- 후속: 사이클 2에서 Live Replan 구현 시 시드 일정의 DAG 의존성을 사용. 사이클 4에서 외부 API 도입.

## 사인오프

- R1 CTO ✅ (사이클 1 범위 한정, 사용자 결정 반영)
- R3 TDA ✅ (데모 모드 폴백 패턴 OK)
- T8 Product Planner ✅ (3박 4일 푸꾸옥 시연으로 매직 모먼트 M1 충분)
