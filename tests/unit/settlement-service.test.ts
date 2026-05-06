/**
 * lib/services/settlement.ts 순수 함수 단위 테스트.
 *
 * 대상:
 *  - normalizeSplitWith: raw → NormalizedMember[]
 *  - computeSettlement: CostEntry[] → SettlementResult
 *  - parseSplitToken: 입력 토큰 → string | WeightedMember | null
 */

import { describe, it, expect } from "vitest";
import {
  normalizeSplitWith,
  computeSettlement,
  parseSplitToken,
} from "@/lib/services/settlement";
import type { CostEntry } from "@/lib/types";

/** 간이 CostEntry 생성 */
function costEntry(
  overrides: Partial<CostEntry> & { amountKrw: number },
): CostEntry {
  return {
    id: `ce-${Math.random().toString(36).slice(2, 6)}`,
    tripId: "trip-1",
    date: "2026-06-01",
    label: "테스트 지출",
    amountKrw: overrides.amountKrw,
    status: "estimated",
    createdAt: "2026-06-01T00:00:00Z",
    updatedAt: "2026-06-01T00:00:00Z",
    ...overrides,
  };
}

/* ════════════════════════════════════════════
 * normalizeSplitWith
 * ════════════════════════════════════════════ */

describe("normalizeSplitWith", () => {
  it("string[] → 각 weight=1", () => {
    const { members, isWeighted } = normalizeSplitWith(["철수", "영희"]);
    expect(members).toHaveLength(2);
    expect(members[0]).toEqual({ name: "철수", weight: 1 });
    expect(members[1]).toEqual({ name: "영희", weight: 1 });
    expect(isWeighted).toBe(false);
  });

  it("WeightedMember[] — 가중치 있으면 isWeighted=true", () => {
    const { members, isWeighted } = normalizeSplitWith([
      { name: "철수", weight: 2 },
      { name: "영희", weight: 1 },
    ]);
    expect(members).toHaveLength(2);
    expect(members[0]).toEqual({ name: "철수", weight: 2 });
    expect(isWeighted).toBe(true);
  });

  it("weight 미명시 → 1 (isWeighted=false)", () => {
    const { members, isWeighted } = normalizeSplitWith([
      { name: "철수" },
      { name: "영희" },
    ]);
    expect(members[0].weight).toBe(1);
    expect(members[1].weight).toBe(1);
    expect(isWeighted).toBe(false);
  });

  it("weight ≤ 0 → 1로 보정", () => {
    const { members } = normalizeSplitWith([
      { name: "철수", weight: -1 },
      { name: "영희", weight: 0 },
    ]);
    expect(members[0].weight).toBe(1);
    expect(members[1].weight).toBe(1);
  });

  it("빈 이름 → 제거", () => {
    const { members } = normalizeSplitWith(["철수", "", "  ", "영희"]);
    expect(members).toHaveLength(2);
    expect(members.map((m) => m.name)).toEqual(["철수", "영희"]);
  });

  it("빈 name 객체 → 제거", () => {
    const { members } = normalizeSplitWith([
      { name: "" },
      { name: "철수" },
    ]);
    expect(members).toHaveLength(1);
  });

  it("이름 트림", () => {
    const { members } = normalizeSplitWith(["  철수  ", { name: "  영희  " }]);
    expect(members[0].name).toBe("철수");
    expect(members[1].name).toBe("영희");
  });

  it("non-array → 빈 결과", () => {
    expect(normalizeSplitWith(null).members).toEqual([]);
    expect(normalizeSplitWith(undefined).members).toEqual([]);
    expect(normalizeSplitWith("hello").members).toEqual([]);
    expect(normalizeSplitWith(42).members).toEqual([]);
  });

  it("빈 배열 → 빈 결과", () => {
    expect(normalizeSplitWith([]).members).toEqual([]);
  });

  it("혼합 배열 (string + WeightedMember)", () => {
    const { members } = normalizeSplitWith([
      "철수",
      { name: "영희", weight: 2 },
    ]);
    expect(members).toHaveLength(2);
    expect(members[0]).toEqual({ name: "철수", weight: 1 });
    expect(members[1]).toEqual({ name: "영희", weight: 2 });
  });
});

/* ════════════════════════════════════════════
 * computeSettlement
 * ════════════════════════════════════════════ */

describe("computeSettlement", () => {
  it("빈 entries → EMPTY_RESULT", () => {
    const result = computeSettlement([]);
    expect(result.splitEntryCount).toBe(0);
    expect(result.totalSplitKrw).toBe(0);
    expect(result.transfers).toEqual([]);
    expect(result.netByMember).toEqual([]);
  });

  it("splitWith 없는 entries → 정산 대상 없음", () => {
    const entries = [costEntry({ amountKrw: 10000 })];
    const result = computeSettlement(entries);
    expect(result.splitEntryCount).toBe(0);
  });

  it("splitWith 1명 → 정산 대상 없음 (2명 이상만)", () => {
    const entries = [costEntry({ amountKrw: 10000, splitWith: ["철수"] })];
    const result = computeSettlement(entries);
    expect(result.splitEntryCount).toBe(0);
  });

  it("2명 균등 분할 (10000원)", () => {
    const entries = [
      costEntry({ amountKrw: 10000, splitWith: ["철수", "영희"] }),
    ];
    const result = computeSettlement(entries);
    expect(result.splitEntryCount).toBe(1);
    expect(result.totalSplitKrw).toBe(10000);
    // 철수 결제 → 영희가 5000원 보내야 함
    expect(result.transfers).toHaveLength(1);
    expect(result.transfers[0].from).toBe("영희");
    expect(result.transfers[0].to).toBe("철수");
    expect(result.transfers[0].amountKrw).toBe(5000);
  });

  it("3명 균등 분할 (30000원)", () => {
    const entries = [
      costEntry({
        amountKrw: 30000,
        splitWith: ["철수", "영희", "민수"],
      }),
    ];
    const result = computeSettlement(entries);
    expect(result.splitEntryCount).toBe(1);
    expect(result.totalSplitKrw).toBe(30000);
    // 철수 결제, 각 10000원 분담
    // 철수 net: +30000 - 10000 = +20000
    // 영희 net: -10000, 민수 net: -10000
    expect(result.transfers).toHaveLength(2);
    const toChulsu = result.transfers.filter((t) => t.to === "철수");
    expect(toChulsu).toHaveLength(2);
    expect(toChulsu.reduce((sum, t) => sum + t.amountKrw, 0)).toBe(20000);
  });

  it("가중치 분할 (어른 2 : 아동 1)", () => {
    const entries = [
      costEntry({
        amountKrw: 30000,
        splitWith: [
          { name: "철수", weight: 2 },
          { name: "아이", weight: 1 },
        ],
      }),
    ];
    const result = computeSettlement(entries);
    expect(result.weightedEntryCount).toBe(1);
    // 총 가중치 3: 철수 20000, 아이 10000
    // 철수 결제 30000 - 자기 몫 20000 = net +10000
    // 아이 net -10000
    expect(result.transfers).toHaveLength(1);
    expect(result.transfers[0]).toEqual({
      from: "아이",
      to: "철수",
      amountKrw: 10000,
    });
  });

  it("복수 entry — 교차 결제 상쇄", () => {
    const entries = [
      costEntry({
        amountKrw: 20000,
        splitWith: ["철수", "영희"],
      }),
      costEntry({
        amountKrw: 20000,
        splitWith: ["영희", "철수"],
      }),
    ];
    const result = computeSettlement(entries);
    expect(result.splitEntryCount).toBe(2);
    expect(result.totalSplitKrw).toBe(40000);
    // 철수: +20000 - 10000 - 10000 = 0
    // 영희: -10000 + 20000 - 10000 = 0
    expect(result.transfers).toHaveLength(0);
  });

  it("settledAt 있는 entry → 흐름 계산 제외", () => {
    const entries = [
      costEntry({
        amountKrw: 10000,
        splitWith: ["철수", "영희"],
        settledAt: "2026-06-02T00:00:00Z",
      }),
    ];
    const result = computeSettlement(entries);
    expect(result.splitEntryCount).toBe(0);
    expect(result.settledEntryCount).toBe(1);
    expect(result.settledTotalKrw).toBe(10000);
    expect(result.transfers).toHaveLength(0);
  });

  it("settled + unsettled 혼합", () => {
    const entries = [
      costEntry({
        amountKrw: 10000,
        splitWith: ["철수", "영희"],
        settledAt: "2026-06-02T00:00:00Z",
      }),
      costEntry({
        amountKrw: 20000,
        splitWith: ["철수", "영희"],
      }),
    ];
    const result = computeSettlement(entries);
    expect(result.splitEntryCount).toBe(1);
    expect(result.settledEntryCount).toBe(1);
    expect(result.settledTotalKrw).toBe(10000);
    expect(result.totalSplitKrw).toBe(20000);
    expect(result.transfers).toHaveLength(1);
    expect(result.transfers[0].amountKrw).toBe(10000);
  });

  it("netByMember 내림차순 (creditor → debtor)", () => {
    const entries = [
      costEntry({
        amountKrw: 30000,
        splitWith: ["철수", "영희", "민수"],
      }),
    ];
    const result = computeSettlement(entries);
    expect(result.netByMember.length).toBe(3);
    // 내림차순 정렬
    for (let i = 1; i < result.netByMember.length; i++) {
      expect(result.netByMember[i - 1].netKrw).toBeGreaterThanOrEqual(
        result.netByMember[i].netKrw,
      );
    }
  });

  it("모두 정산 완료 → 빈 transfers + settledEntryCount", () => {
    const entries = [
      costEntry({
        amountKrw: 10000,
        splitWith: ["철수", "영희"],
        settledAt: "2026-06-02T00:00:00Z",
      }),
      costEntry({
        amountKrw: 20000,
        splitWith: ["민수", "철수"],
        settledAt: "2026-06-02T00:00:00Z",
      }),
    ];
    const result = computeSettlement(entries);
    expect(result.splitEntryCount).toBe(0);
    expect(result.settledEntryCount).toBe(2);
    expect(result.settledTotalKrw).toBe(30000);
    expect(result.transfers).toHaveLength(0);
  });
});

/* ════════════════════════════════════════════
 * parseSplitToken
 * ════════════════════════════════════════════ */

describe("parseSplitToken", () => {
  it("단순 이름 → string 반환", () => {
    expect(parseSplitToken("철수")).toBe("철수");
  });

  it("이름:가중치 → { name, weight }", () => {
    const result = parseSplitToken("철수:2");
    expect(result).toEqual({ name: "철수", weight: 2 });
  });

  it("가중치 소수 → 정상 파싱", () => {
    const result = parseSplitToken("영희:1.5");
    expect(result).toEqual({ name: "영희", weight: 1.5 });
  });

  it("가중치 1 → string 반환 (v1 호환)", () => {
    expect(parseSplitToken("철수:1")).toBe("철수");
  });

  it("가중치 0 → string 반환 (무효)", () => {
    expect(parseSplitToken("철수:0")).toBe("철수");
  });

  it("가중치 음수 → string 반환 (무효)", () => {
    expect(parseSplitToken("철수:-2")).toBe("철수");
  });

  it("가중치 NaN → string 반환", () => {
    expect(parseSplitToken("철수:abc")).toBe("철수");
  });

  it("빈 문자열 → null", () => {
    expect(parseSplitToken("")).toBeNull();
  });

  it("공백만 → null", () => {
    expect(parseSplitToken("   ")).toBeNull();
  });

  it("콜론만 → null (이름 빈)", () => {
    expect(parseSplitToken(":2")).toBeNull();
  });

  it("공백 트림", () => {
    expect(parseSplitToken("  철수  ")).toBe("철수");
  });

  it("공백 포함 이름:가중치 트림", () => {
    const result = parseSplitToken("  영희 : 3 ");
    expect(result).toEqual({ name: "영희", weight: 3 });
  });

  it("이름에 콜론 포함 — lastIndexOf 사용", () => {
    // "김:철수:2" → lastIndexOf → name="김:철수", weight=2
    const result = parseSplitToken("김:철수:2");
    expect(result).toEqual({ name: "김:철수", weight: 2 });
  });
});
