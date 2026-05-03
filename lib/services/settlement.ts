/**
 * Settlement (E1 v1 + v2) — 사이클 E1 / II.
 *
 * 정산 흐름 계산. splitWith[0]을 결제자(payer)로 약속하는 컨벤션.
 *
 * v1 (사이클 E1, ADR-039): splitWith: string[]
 *  - splitWith[0] = 결제자
 *  - splitWith[1..] = 함께 부담한 사람들 (결제자 자기 몫 포함)
 *  - 분담 = amountKrw / splitWith.length (모두 1/N)
 *
 * v2 (사이클 II, ADR-039 갱신): splitWith: WeightedMember[] 도 허용
 *  - { name, weight? } — weight 미명시 시 1
 *  - 첫 element = 결제자 (컨벤션 유지)
 *  - 분담 = amountKrw × member.weight / sum(weights)
 *  - schema 변경 0 — 동일 Json? 컬럼에서 형식 분기
 *
 * v3 미니 (사이클 UU, ADR-042): settledAt NOT NULL인 entry는 흐름 계산에서 제외.
 *  - splitEntryCount / totalSplitKrw / transfers / netByMember 모두 미정산 entry만 반영
 *  - settledEntryCount / settledTotalKrw 별도 노출 (정산 완료된 건 표시용)
 *
 * 순수 함수 (server-only X) — 클라이언트/서버 모두 사용 가능.
 */

import type { CostEntry } from "@/lib/types";

export interface WeightedMember {
  name: string;
  /** 가중치 — 미명시 시 1 (어른=2, 아동=1 등) */
  weight?: number;
}

/** 정규화된 멤버 — 내부 계산용 */
interface NormalizedMember {
  name: string;
  weight: number;
}

export interface SettlementTransfer {
  from: string;
  to: string;
  amountKrw: number;
}

export interface SettlementResult {
  netByMember: Array<{ name: string; netKrw: number }>;
  transfers: SettlementTransfer[];
  totalSplitKrw: number;
  splitEntryCount: number;
  /** 가중치를 명시적으로 사용한 entry 개수 */
  weightedEntryCount: number;
  /**
   * 사이클 UU (ADR-042) — 정산 완료된 entry 수 (흐름 계산에서 제외됨).
   */
  settledEntryCount: number;
  /** 사이클 UU — 정산 완료된 split entry 합계 (KRW). */
  settledTotalKrw: number;
}

const EMPTY_RESULT: SettlementResult = {
  netByMember: [],
  transfers: [],
  totalSplitKrw: 0,
  splitEntryCount: 0,
  weightedEntryCount: 0,
  settledEntryCount: 0,
  settledTotalKrw: 0,
};

/**
 * splitWith를 NormalizedMember[]로 정규화.
 *  - string[] → weight=1 모두
 *  - WeightedMember[] → weight 미명시 시 1
 *  - 잘못된 형식(weight ≤ 0, name 빈 값) 제거
 */
export function normalizeSplitWith(
  raw: unknown,
): { members: NormalizedMember[]; isWeighted: boolean } {
  if (!Array.isArray(raw)) return { members: [], isWeighted: false };

  let isWeighted = false;
  const members: NormalizedMember[] = [];
  for (const entry of raw) {
    if (typeof entry === "string") {
      const name = entry.trim();
      if (name.length > 0) members.push({ name, weight: 1 });
    } else if (entry && typeof entry === "object" && "name" in entry) {
      const name = String((entry as { name: unknown }).name).trim();
      if (name.length === 0) continue;
      const weightRaw = (entry as { weight?: unknown }).weight;
      const weight = typeof weightRaw === "number" && weightRaw > 0 ? weightRaw : 1;
      if (weightRaw !== undefined && weight !== 1) isWeighted = true;
      members.push({ name, weight });
    }
  }
  return { members, isWeighted };
}

export function computeSettlement(entries: CostEntry[]): SettlementResult {
  // 정규화 후 2명 이상인 entry만 정산 대상
  const allSplitEntries = entries
    .map((e) => ({
      entry: e,
      ...normalizeSplitWith(e.splitWith),
    }))
    .filter((s) => s.members.length >= 2);

  // 사이클 UU (ADR-042) — settledAt 있는 entry는 흐름 계산에서 제외
  const settledOnly = allSplitEntries.filter((s) => s.entry.settledAt);
  const splitEntries = allSplitEntries.filter((s) => !s.entry.settledAt);

  const settledEntryCount = settledOnly.length;
  const settledTotalKrw = settledOnly.reduce(
    (sum, s) => sum + s.entry.amountKrw,
    0,
  );

  if (splitEntries.length === 0) {
    return { ...EMPTY_RESULT, settledEntryCount, settledTotalKrw };
  }

  const memberSet = new Set<string>();
  for (const s of splitEntries) {
    for (const m of s.members) memberSet.add(m.name);
  }
  const members = Array.from(memberSet);
  const net = new Map<string, number>(members.map((m) => [m, 0]));
  let totalSplitKrw = 0;
  let weightedEntryCount = 0;

  for (const { entry, members: split, isWeighted } of splitEntries) {
    if (isWeighted) weightedEntryCount += 1;
    const payer = split[0].name;
    const totalWeight = split.reduce((sum, m) => sum + m.weight, 0);

    // 결제자 net = +amountKrw (지불) - 자기 share
    net.set(payer, (net.get(payer) ?? 0) + entry.amountKrw);
    // 모든 멤버는 weight 비율로 share 부담
    for (const m of split) {
      const share = Math.round((entry.amountKrw * m.weight) / totalWeight);
      net.set(m.name, (net.get(m.name) ?? 0) - share);
    }
    totalSplitKrw += entry.amountKrw;
  }

  // greedy 매칭 — 가장 빚진 사람 → 가장 많이 받을 사람
  const creditors = members
    .map((m) => ({ name: m, netKrw: net.get(m) ?? 0 }))
    .filter((m) => m.netKrw > 0)
    .sort((a, b) => b.netKrw - a.netKrw);
  const debtors = members
    .map((m) => ({ name: m, netKrw: net.get(m) ?? 0 }))
    .filter((m) => m.netKrw < 0)
    .sort((a, b) => a.netKrw - b.netKrw);

  const transfers: SettlementTransfer[] = [];
  let ci = 0;
  let di = 0;
  const cWork = creditors.map((c) => ({ ...c }));
  const dWork = debtors.map((d) => ({ ...d, netKrw: -d.netKrw }));

  while (ci < cWork.length && di < dWork.length) {
    const credit = cWork[ci];
    const debt = dWork[di];
    const amount = Math.min(credit.netKrw, debt.netKrw);
    if (amount > 0) {
      transfers.push({ from: debt.name, to: credit.name, amountKrw: amount });
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
    weightedEntryCount,
    settledEntryCount,
    settledTotalKrw,
  };
}

export function formatKrw(value: number): string {
  return `₩${Math.abs(value).toLocaleString("ko-KR")}`;
}

/**
 * UI 입력 토큰 파싱 — "이름" 또는 "이름:가중치" 형식.
 * 사이클 II — UI에서 "철수:2" 같은 입력을 WeightedMember로 변환.
 *  - 빈 입력 → null
 *  - weight 파싱 실패(0, 음수, NaN) → weight=1
 *  - weight=1이면 객체 대신 문자열 반환 (v1 호환 — 데이터 단순화)
 */
export function parseSplitToken(
  raw: string,
): string | { name: string; weight?: number } | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  const colonIdx = trimmed.lastIndexOf(":");
  if (colonIdx < 0) return trimmed;
  const name = trimmed.slice(0, colonIdx).trim();
  if (name.length === 0) return null;
  const weightRaw = parseFloat(trimmed.slice(colonIdx + 1).trim());
  if (!isFinite(weightRaw) || weightRaw <= 0 || weightRaw === 1) {
    return name;
  }
  return { name, weight: weightRaw };
}
