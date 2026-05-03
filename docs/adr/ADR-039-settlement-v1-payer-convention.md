---
id: ADR-039
title: E1 정산 분담 v1 — splitWith[0] = 결제자 컨벤션 (schema 변경 없이 데모 가능)
status: Accepted
date: 2026-05-03
decider: R1 CTO
proposer: T8 PM + T17 UX + T13 CR + T14 DB
related: ADR-022 (M6 Cost), ADR-026 (OAuth — v2 트리거), 마이그 0002
---

# ADR-039: E1 정산 v1 — payer 컨벤션 + 1/N (사이클 E1)

## 컨텍스트

CLAUDE.md M9 후보 = 정산 분담. CostEntry에 `splitWith Json?` 컬럼은 사이클 9 (ADR-022)부터 존재했으나 **결제자 명시 부재** + UI 부재로 정산 흐름 계산 불가. 사용자가 "누가 누구에게 얼마를 줘야 하는지" 알 수 없는 상태.

**제약**:
- OAuth 미활성 → User FK 사용 불가
- 사용자 액션 누적 5건(0007~0010 + 잠재 0011) → 추가 마이그 부담 ↑
- M9 풀 모델(payer 별도 컬럼 + 가중치 + 통화 변환)은 큰 사이클

## 결정

**v1 — schema 변경 없이 데이터 컨벤션으로 정산 흐름 활성화.**

### 컨벤션

```
splitWith[0] = 결제자
splitWith[1..] = 함께 부담한 사람들 (결제자 자기 몫 포함)
```

### 정산 계산 (`lib/services/settlement.ts`)

```
각 entry: amountKrw / splitWith.length = 1인당 share
결제자 net = +amountKrw - share  (받을 돈)
다른 멤버 net = -share  (낼 돈)

여러 entry 합산 후 net으로 greedy 매칭:
  가장 빚진 사람 → 가장 많이 받을 사람 송금 흐름 생성
```

### UI (`components/cost/SettlementCard.tsx`)

- /cost 페이지에 "일행 정산 (E1)" 카드 추가
- splitWith 가진 entry 1건 이상일 때만 노출
- 송금 흐름 ("A → B: ₩30,000") + 멤버별 net (양수/음수) details
- 추가 폼에 "결제자" + "함께 부담" 분리 입력 (선택)

## v1 한계 (의도적)

- ❌ 가중치 분담 (어른/아동, 5:5 vs 4:6) — 모두 1/N 균등
- ❌ 통화 변환 — KRW 기준만 (`amountKrw` 필드)
- ❌ 결제자 별도 컬럼 — splitWith[0] 컨벤션
- ❌ User FK — 닉네임 string array
- ❌ 정산 완료 표시 — read-only 흐름만

## v2 트리거 → schema 갱신

**모두 충족 시 v2 마이그 작성**:
1. 라이브 사용자 100+ 도달
2. 정산 데이터 누적 (`SELECT COUNT(*) FROM "CostEntry" WHERE "splitWith" IS NOT NULL ≥ 50`)
3. 사용자 피드백: 가중치 또는 결제자 명시 별도 컬럼 요청

**v2 schema 변경 후보**:
```prisma
model CostEntry {
  // ...
  payerName String?  // 결제자 명시
  splitShares Json?  // 가중치 분담 [{name: "나", weight: 2}, ...]
  settlementCompletedAt DateTime?  // 정산 완료 마킹
}
```

v1 → v2 마이그 시 데이터 변환:
- splitWith[0] → payerName, splitWith[1..] → splitShares (모두 weight=1)

## 결과

- schema 변경 0 / 마이그 0 / 사용자 액션 0
- 신규 컴포넌트: `SettlementCard.tsx`
- 신규 서비스: `lib/services/settlement.ts` (순수 함수)
- 신규 테스트: 9건 (`tests/unit/settlement.test.ts`)
- vitest 392 → 401 (+9)

## 회귀 방어

- `computeSettlement` 순수 함수 — 단위 테스트로 회귀 강제
- splitWith 없는 entry는 정산 미포함 (기존 동작 보존)
- `SettlementCard`는 splitEntryCount=0일 때 null 반환 (UI 노이즈 X)

## v2까지 답습 메모

- 사용자 입력: payer는 선택. 빈 입력 시 정산 미생성
- 데이터 컨벤션 깨지면 (splitWith[0] != 결제자) 정산 흐름 부정확 — UI에서 명시적 분리 입력 강제
- v2 마이그 시 데이터 변환 자동 (payerName=splitWith[0]) — 백워드 호환
