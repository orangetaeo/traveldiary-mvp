---
id: ADR-042
title: 정산 완료 마커 — CostEntry.settledAt 컬럼 (E1 v3 미니, 사이클 UU)
status: Accepted
date: 2026-05-03
decider: R1 CTO
proposer: T8 PM + T17 UX + T13 CR + T14 DB + R4 BE
related: ADR-022 (M6 Cost), ADR-039 (E1 v1+v2 — v3 트리거 명시), ADR-031 (마이그 0007 NULLABLE 답습)
---

# ADR-042: 정산 완료 마커 (E1 v3 미니)

## 컨텍스트

ADR-039 v3 트리거 3건 중 **사용자 피드백: 정산 완료 상태 마킹 요청** 항목만 도달. payerName/splitShares는 트리거 미충족(라이브 사용자 100+ + 데이터 50+ 미달).

**현 상태 (사이클 TT 직후)**:
- splitWith[0]=결제자 컨벤션 (v1) + 가중치 (v2) 정착
- SettlementCard 정산 흐름 + 통화 병기 (RR)
- ❌ 정산이 끝났는지 표시 불가 — 같은 entry가 영구히 흐름 계산에 포함

**문제**: 사용자가 "철수→영희 ₩5,000 송금" 후에도 SettlementCard에 동일 흐름 영구 노출. "이미 보냈는지" 마킹할 곳 없음.

## 결정

**`settledAt DateTime?` 컬럼 1개 추가** — NULL=미정산, NOT NULL=완료 시점.

ADR-039 v3 후보 schema 중 `settlementCompletedAt`만 도입 (이름은 `settledAt`로 단축). payerName/splitShares는 트리거 미충족 → 후속 ADR.

### 컬럼 디자인

```prisma
model CostEntry {
  // 기존 ...
  settledAt DateTime?

  @@index([tripId, settledAt])  // 미정산 필터링용
}
```

**NULLABLE 선택 근거** (마이그 0007 답습):
- 기존 row 모두 NULL → 미정산으로 호환
- data loss 0
- boolean+timestamp 중복 회피 (단일 source of truth)

### computeSettlement 영향

```ts
// settlement.ts — 정규화 후 settledAt 있는 entry 제외
const splitEntries = entries
  .map((e) => ({ entry: e, ...normalizeSplitWith(e.splitWith) }))
  .filter((s) => s.members.length >= 2 && !s.entry.settledAt);
```

정산 완료된 entry는 transfers/netByMember에서 모두 제외 → SettlementCard에서 자동 흐름 갱신.

### Server Action

```ts
// actions/cost.ts
async function settleCost({
  id, tripId, settled,
}: { id: string; tripId: string; settled: boolean }):
  Promise<CostActionResult<CostEntry>>
```

- `canWriteTrip` 권한 게이트 (기존 답습)
- audit log: `cost.settle` (settled=true) / `cost.unsettle` (settled=false) — before/after settledAt 기록
- demo trip → 클라이언트 시뮬

### UI

SettlementCard 안에 splitWith 가진 미정산/정산완료 entry 분리 섹션:
- 미정산: 흐름 + 멤버별 잔액 (기존)
- 정산완료: 작은 details에 "정산 완료된 X건" 라벨 + 토글로 되돌리기 가능

CostView 측에서 `handleSettle(entry, settled)` 추가 → server action 호출 + 옵티미스틱 업데이트.

## v3 풀 스케일 트리거 (현재 미충족 — 후속 ADR)

**모두 충족 시 후속 ADR**:
1. 라이브 사용자 100+ 도달 (현재 미달)
2. 정산 데이터 누적 (`COUNT(*) WHERE splitWith IS NOT NULL ≥ 50`) (현재 시드만)
3. 사용자 피드백: payer 별도 컬럼 또는 가중치 분리 컬럼 요청

**후속 schema 후보**:
```prisma
payerName    String?  // splitWith[0] 컨벤션 → 별도 컬럼
splitShares  Json?    // 가중치 분담 (v2 형식 명시화)
// settledAt 은 본 ADR-042에서 이미 추가됨
```

## 회귀 방어

| 항목 | 게이트 |
|------|--------|
| settledAt 있는 entry → transfers 제외 | settlement.test.ts 신규 |
| settledAt 있는 entry → netByMember 제외 | settlement.test.ts 신규 |
| 토글 양방향 (settle/unsettle) | settlement-card.test.tsx 신규 |
| audit log 누락 | feedback_audit_log 표준 답습 |
| demo trip 시뮬 | CostView handleAdd 답습 |

## 사용자 영향

- ✅ 정산 완료 표시로 SettlementCard 신선도 ↑
- 🟡 사용자 액션 +1 — `prisma migrate deploy` 0011 (총 5건 누적)

## 측정 (사이클 UU 시점)

- schema: +1 컬럼 + 1 인덱스
- 마이그: 0011 (NULLABLE — data loss 0)
- 신규 의존성: 0
- 신규 컴포넌트: 0 (SettlementCard 갱신)
- 신규 server action: 1 (settleCost)
- vitest: +N (settlement.test.ts 보강 + settlement-card.test.tsx 보강)

## 답습 메모

- v3 미니 패턴 — ADR-039 v3 후보 중 트리거 충족 항목만 분리 도입 가능 (payerName/splitShares는 보류)
- NULL=미정산 컨벤션은 boolean+timestamp 조합보다 깔끔 (마이그 0007 답습)
- computeSettlement에 entry 필터 1줄 추가로 모든 흐름 자동 반영 (순수 함수 확장성)
