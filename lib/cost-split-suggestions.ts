/**
 * Cost Split Suggestions — 사이클 A5 (디자인 갭 자율 발견 #3).
 *
 * 기존 CostEntry.splitWith 데이터에서 빈도 기반 동행자 후보 추출 +
 * "전체 1/N 균등 분담" 자동 생성. schema 변경 0 — splitWith Json 컬럼만 활용.
 *
 * 답습:
 *  - lib/services/settlement.ts normalizeSplitWith — Json 형식 v1/v2 해석
 *  - feedback_local_const_to_shared_lib_extraction — 신규 lib + 첫 사용처 동시 swap
 *
 * 순수 함수 — server/client 모두 사용 가능.
 */

import { normalizeSplitWith } from "@/lib/services/settlement";
import type { CostEntry } from "@/lib/types";

export interface MemberFrequency {
  name: string;
  /** 등장한 entry 개수 (settledAt 무관, splitWith 멤버로 등장한 entry 모수) */
  count: number;
}

/**
 * 기존 entries의 splitWith 멤버 빈도 카운트 → 빈도수 내림차순 정렬.
 *  - 이름 trim 후 비교
 *  - 빈 이름은 제외
 *  - settledAt 무관 (정산 완료된 entry도 동행자 후보)
 */
export function extractCommonMembers(entries: CostEntry[]): MemberFrequency[] {
  const counter = new Map<string, number>();
  for (const entry of entries) {
    const { members } = normalizeSplitWith(entry.splitWith);
    const seenInEntry = new Set<string>();
    for (const m of members) {
      if (seenInEntry.has(m.name)) continue;
      seenInEntry.add(m.name);
      counter.set(m.name, (counter.get(m.name) ?? 0) + 1);
    }
  }
  return Array.from(counter.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name, "ko-KR");
    });
}

/**
 * 결제자 + 함께 부담 멤버 → splitWith 배열 생성 (1/N 균등 분담, weight 미사용).
 *  - payer 빈 문자열 → null 반환 (사용자가 결제자를 채워야 분담 가능)
 *  - others에서 payer와 동일 이름은 제외 (중복 방지)
 *  - splitWith[0] = payer 컨벤션 (ADR-039)
 */
export function buildEqualSplit(
  payer: string,
  others: string[],
): string[] | null {
  const payerName = payer.trim();
  if (payerName.length === 0) return null;
  const seen = new Set<string>([payerName]);
  const cleaned: string[] = [];
  for (const name of others) {
    const trimmed = name.trim();
    if (trimmed.length === 0) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    cleaned.push(trimmed);
  }
  if (cleaned.length === 0) return null;
  return [payerName, ...cleaned];
}
