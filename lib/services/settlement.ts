/**
 * Settlement (E1 v1) — 사이클 E1.
 *
 * 정산 흐름 계산. splitWith[0]을 결제자(payer)로 약속하는 컨벤션.
 *  - splitWith[0] = 결제자
 *  - splitWith[1..] = 함께 부담한 사람들 (결제자 포함 아님)
 *  - 분담 = amountKrw / splitWith.length (결제자도 자기 몫 부담)
 *
 * v2 트리거(ADR-039): payer 별도 컬럼이 필요한 시점 — 사용자 100+ 도달 시 schema 갱신.
 *
 * 순수 함수 (server-only X) — 클라이언트/서버 모두 사용 가능.
 */

import type { CostEntry } from "@/lib/types";

export interface SettlementTransfer {
  /** 빚진 사람 → 결제자에게 줘야 함 */
  from: string;
  to: string;
  amountKrw: number;
}

export interface SettlementResult {
  /** 멤버별 net (양수=받을 돈, 음수=내야 할 돈) */
  netByMember: Array<{ name: string; netKrw: number }>;
  /** 최종 송금 흐름 (greedy 매칭) */
  transfers: SettlementTransfer[];
  /** splitWith 가진 entry들의 총합 */
  totalSplitKrw: number;
  /** 정산 대상 entry 개수 */
  splitEntryCount: number;
}

const EMPTY_RESULT: SettlementResult = {
  netByMember: [],
  transfers: [],
  totalSplitKrw: 0,
  splitEntryCount: 0,
};

export function computeSettlement(entries: CostEntry[]): SettlementResult {
  // 정산 대상: splitWith가 2명 이상인 entry
  const splitEntries = entries.filter(
    (e) => e.splitWith && e.splitWith.length >= 2,
  );
  if (splitEntries.length === 0) return EMPTY_RESULT;

  const memberSet = new Set<string>();
  for (const e of splitEntries) {
    for (const m of e.splitWith ?? []) memberSet.add(m);
  }
  const members = Array.from(memberSet);

  // net 계산: payer는 amountKrw 받음(+), 모든 splitWith 멤버는 share 부담(-)
  const net = new Map<string, number>(members.map((m) => [m, 0]));
  let totalSplitKrw = 0;

  for (const e of splitEntries) {
    const split = e.splitWith ?? [];
    const payer = split[0];
    const n = split.length;
    const share = Math.round(e.amountKrw / n);

    // 결제자가 amountKrw 지불 → 받을 돈 +amountKrw
    net.set(payer, (net.get(payer) ?? 0) + e.amountKrw);
    // 모든 멤버는 share만큼 부담 (자기 몫)
    for (const m of split) {
      net.set(m, (net.get(m) ?? 0) - share);
    }
    totalSplitKrw += e.amountKrw;
  }

  // greedy 매칭 — 가장 빚진 사람 → 가장 많이 받을 사람
  const creditors = members
    .map((m) => ({ name: m, netKrw: net.get(m) ?? 0 }))
    .filter((m) => m.netKrw > 0)
    .sort((a, b) => b.netKrw - a.netKrw);
  const debtors = members
    .map((m) => ({ name: m, netKrw: net.get(m) ?? 0 }))
    .filter((m) => m.netKrw < 0)
    .sort((a, b) => a.netKrw - b.netKrw); // 가장 음수(가장 많이 빚진)부터

  const transfers: SettlementTransfer[] = [];
  let ci = 0;
  let di = 0;
  // 작업 사본
  const cWork = creditors.map((c) => ({ ...c }));
  const dWork = debtors.map((d) => ({ ...d, netKrw: -d.netKrw }));

  while (ci < cWork.length && di < dWork.length) {
    const credit = cWork[ci];
    const debt = dWork[di];
    const amount = Math.min(credit.netKrw, debt.netKrw);
    if (amount > 0) {
      transfers.push({
        from: debt.name,
        to: credit.name,
        amountKrw: amount,
      });
    }
    credit.netKrw -= amount;
    debt.netKrw -= amount;
    if (credit.netKrw === 0) ci++;
    if (debt.netKrw === 0) di++;
  }

  return {
    netByMember: members
      .map((m) => ({ name: m, netKrw: net.get(m) ?? 0 }))
      .sort((a, b) => b.netKrw - a.netKrw),
    transfers,
    totalSplitKrw,
    splitEntryCount: splitEntries.length,
  };
}

export function formatKrw(value: number): string {
  return `₩${Math.abs(value).toLocaleString("ko-KR")}`;
}
