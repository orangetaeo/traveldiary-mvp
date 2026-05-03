/**
 * 사이클 E1 — Settlement (정산 흐름) 단위 테스트.
 *
 * splitWith[0] = 결제자 컨벤션 (ADR-039).
 */

import { describe, it, expect } from "vitest";
import {
  computeSettlement,
  formatKrw,
  normalizeSplitWith,
  parseSplitToken,
} from "@/lib/services/settlement";
import type { CostEntry } from "@/lib/types";

function makeEntry(
  id: string,
  amountKrw: number,
  splitWith?: CostEntry["splitWith"],
): CostEntry {
  return {
    id,
    tripId: "t1",
    date: "2026-05-10",
    label: id,
    amountKrw,
    status: "paid",
    splitWith,
    createdAt: "2026-05-10T00:00:00.000Z",
    updatedAt: "2026-05-10T00:00:00.000Z",
  };
}

describe("computeSettlement — 기본 시나리오", () => {
  it("splitWith 없는 entry만 → 빈 결과", () => {
    const result = computeSettlement([makeEntry("a", 30000)]);
    expect(result.transfers).toEqual([]);
    expect(result.netByMember).toEqual([]);
    expect(result.totalSplitKrw).toBe(0);
    expect(result.splitEntryCount).toBe(0);
  });

  it("splitWith.length < 2 → 정산 안 함", () => {
    const result = computeSettlement([
      makeEntry("a", 30000, ["나"]),
    ]);
    expect(result.splitEntryCount).toBe(0);
  });

  it("2명 1/N — 결제자 받을 돈 = 다른 사람 줄 돈", () => {
    // 나가 30000원 결제, 나 + 영희 1/N → 영희가 나에게 15000원
    const result = computeSettlement([
      makeEntry("a", 30000, ["나", "영희"]),
    ]);
    expect(result.splitEntryCount).toBe(1);
    expect(result.totalSplitKrw).toBe(30000);
    expect(result.transfers).toHaveLength(1);
    expect(result.transfers[0].from).toBe("영희");
    expect(result.transfers[0].to).toBe("나");
    expect(result.transfers[0].amountKrw).toBe(15000);
  });

  it("3명 1/N — 결제자 +2/3, 다른 둘 -1/3씩", () => {
    // 나가 30000원 결제, 3등분 → 영희, 철수가 각각 10000씩 나에게
    const result = computeSettlement([
      makeEntry("a", 30000, ["나", "영희", "철수"]),
    ]);
    expect(result.transfers).toHaveLength(2);
    const total = result.transfers.reduce((s, t) => s + t.amountKrw, 0);
    expect(total).toBe(20000); // 두 사람 × 10000
    // 둘 다 from!=나, to=나
    for (const t of result.transfers) {
      expect(t.to).toBe("나");
      expect(t.from).not.toBe("나");
    }
  });

  it("netByMember — 양수=받을 돈, 음수=내야 할 돈", () => {
    const result = computeSettlement([
      makeEntry("a", 30000, ["나", "영희", "철수"]),
    ]);
    const me = result.netByMember.find((m) => m.name === "나");
    const yh = result.netByMember.find((m) => m.name === "영희");
    expect(me?.netKrw).toBe(20000); // 30000 - 10000(자기 몫)
    expect(yh?.netKrw).toBe(-10000);
  });

  it("여러 entry — 결제자 다른 경우 net 합산", () => {
    // 1) 나가 20000 결제 (나/영희) → 나 +10000, 영희 -10000
    // 2) 영희가 30000 결제 (나/영희) → 영희 +15000, 나 -15000
    // net: 나 -5000, 영희 +5000 → 나 → 영희 5000
    const result = computeSettlement([
      makeEntry("a", 20000, ["나", "영희"]),
      makeEntry("b", 30000, ["영희", "나"]),
    ]);
    expect(result.transfers).toHaveLength(1);
    expect(result.transfers[0].from).toBe("나");
    expect(result.transfers[0].to).toBe("영희");
    expect(result.transfers[0].amountKrw).toBe(5000);
  });

  it("greedy 매칭 — 가장 빚진 사람 → 가장 받을 사람", () => {
    // 나가 90000 결제 4명 1/N → 나 +67500, 영희/철수/민수 -22500 각자
    const result = computeSettlement([
      makeEntry("a", 90000, ["나", "영희", "철수", "민수"]),
    ]);
    expect(result.transfers).toHaveLength(3);
    expect(result.transfers.every((t) => t.to === "나")).toBe(true);
    expect(
      result.transfers.reduce((s, t) => s + t.amountKrw, 0),
    ).toBe(67500);
  });

  it("totalSplitKrw — splitWith 가진 entry만 합산", () => {
    const result = computeSettlement([
      makeEntry("a", 30000, ["나", "영희"]),
      makeEntry("b", 20000), // splitWith 없음
      makeEntry("c", 10000, ["나"]), // <2명, 미포함
    ]);
    expect(result.totalSplitKrw).toBe(30000);
    expect(result.splitEntryCount).toBe(1);
  });
});

describe("formatKrw", () => {
  it("천 단위 콤마 + 절댓값", () => {
    expect(formatKrw(15000)).toBe("₩15,000");
    expect(formatKrw(-15000)).toBe("₩15,000"); // 음수도 절댓값 표시
    expect(formatKrw(0)).toBe("₩0");
  });
});

describe("사이클 II — normalizeSplitWith (v1/v2 호환)", () => {
  it("string[] (v1) → 모두 weight=1", () => {
    const { members, isWeighted } = normalizeSplitWith(["나", "영희"]);
    expect(members).toEqual([
      { name: "나", weight: 1 },
      { name: "영희", weight: 1 },
    ]);
    expect(isWeighted).toBe(false);
  });

  it("WeightedMember[] (v2) — weight=2 인식", () => {
    const { members, isWeighted } = normalizeSplitWith([
      { name: "나" },
      { name: "철수", weight: 2 },
    ]);
    expect(members).toEqual([
      { name: "나", weight: 1 },
      { name: "철수", weight: 2 },
    ]);
    expect(isWeighted).toBe(true);
  });

  it("v1+v2 mixed → 모두 정규화", () => {
    const { members } = normalizeSplitWith([
      "나",
      { name: "철수", weight: 2 },
    ]);
    expect(members).toEqual([
      { name: "나", weight: 1 },
      { name: "철수", weight: 2 },
    ]);
  });

  it("잘못된 weight (≤0, NaN) → 1로 폴백", () => {
    const { members } = normalizeSplitWith([
      { name: "a", weight: 0 },
      { name: "b", weight: -1 },
      { name: "c", weight: NaN },
    ]);
    expect(members.every((m) => m.weight === 1)).toBe(true);
  });

  it("name 빈 값 → drop", () => {
    const { members } = normalizeSplitWith([
      { name: "" },
      "  ",
      { name: "나" },
    ]);
    expect(members).toEqual([{ name: "나", weight: 1 }]);
  });

  it("배열 아닌 입력 → 빈 결과", () => {
    expect(normalizeSplitWith(null).members).toEqual([]);
    expect(normalizeSplitWith("not-array").members).toEqual([]);
  });
});

describe("사이클 II — computeSettlement v2 가중치", () => {
  it("어른 2명 + 아동 2명 (2:2:1:1) — 결제자 어른", () => {
    // 60000원 결제. 가중치 합 6 → 어른 20000씩, 아동 10000씩 부담.
    // 결제자(어른1) net = +60000 - 20000 = +40000
    // 어른2 net = -20000, 아동1 net = -10000, 아동2 net = -10000
    // greedy: 어른2 → 어른1 20000, 아동1 → 어른1 10000, 아동2 → 어른1 10000
    const result = computeSettlement([
      makeEntry("a", 60000, [
        { name: "어른1", weight: 2 },
        { name: "어른2", weight: 2 },
        { name: "아동1", weight: 1 },
        { name: "아동2", weight: 1 },
      ]),
    ]);
    expect(result.weightedEntryCount).toBe(1);
    expect(result.transfers).toHaveLength(3);
    // 모두 어른1로
    expect(result.transfers.every((t) => t.to === "어른1")).toBe(true);
    const total = result.transfers.reduce((s, t) => s + t.amountKrw, 0);
    expect(total).toBe(40000);

    const adult2 = result.transfers.find((t) => t.from === "어른2");
    const child1 = result.transfers.find((t) => t.from === "아동1");
    expect(adult2?.amountKrw).toBe(20000);
    expect(child1?.amountKrw).toBe(10000);
  });

  it("v1 string[] 입력은 모두 균등 (기존 동작 보존)", () => {
    const result = computeSettlement([
      makeEntry("a", 30000, ["나", "영희"]),
    ]);
    expect(result.weightedEntryCount).toBe(0);
    expect(result.transfers).toHaveLength(1);
    expect(result.transfers[0].amountKrw).toBe(15000);
  });

  it("weight=1 명시 entry는 weightedEntryCount 미증가", () => {
    const result = computeSettlement([
      makeEntry("a", 30000, [
        { name: "나" },
        { name: "영희", weight: 1 },
      ]),
    ]);
    expect(result.weightedEntryCount).toBe(0);
  });
});

describe("사이클 II — parseSplitToken (UI 입력 파서)", () => {
  it("이름만 → string", () => {
    expect(parseSplitToken("영희")).toBe("영희");
  });

  it("이름:가중치 → object", () => {
    expect(parseSplitToken("철수:2")).toEqual({ name: "철수", weight: 2 });
    expect(parseSplitToken("어른:1.5")).toEqual({ name: "어른", weight: 1.5 });
  });

  it("weight=1 입력 → object 대신 string (단순화)", () => {
    expect(parseSplitToken("나:1")).toBe("나");
  });

  it("잘못된 weight (0, 음수, NaN) → string 폴백", () => {
    expect(parseSplitToken("나:0")).toBe("나");
    expect(parseSplitToken("나:-1")).toBe("나");
    expect(parseSplitToken("나:abc")).toBe("나");
  });

  it("trim 처리", () => {
    expect(parseSplitToken("  영희  ")).toBe("영희");
    expect(parseSplitToken(" 철수 : 2 ")).toEqual({ name: "철수", weight: 2 });
  });

  it("빈 입력 → null", () => {
    expect(parseSplitToken("")).toBeNull();
    expect(parseSplitToken("   ")).toBeNull();
  });

  it("이름이 빈 ':2' → null", () => {
    expect(parseSplitToken(":2")).toBeNull();
  });
});

describe("사이클 UU (ADR-042) — settledAt 정산 완료 마커", () => {
  function makeSettled(
    id: string,
    amountKrw: number,
    splitWith: CostEntry["splitWith"],
    settledAt: string | undefined,
  ): CostEntry {
    return {
      ...makeEntry(id, amountKrw, splitWith),
      settledAt,
    };
  }

  it("settledAt 있는 entry → transfers 제외", () => {
    const result = computeSettlement([
      makeSettled("a", 10000, ["철수", "영희"], "2026-05-04T00:00:00Z"),
    ]);
    expect(result.transfers).toEqual([]);
    expect(result.splitEntryCount).toBe(0);
  });

  it("settledAt 있는 entry → netByMember 제외", () => {
    const result = computeSettlement([
      makeSettled("a", 10000, ["철수", "영희"], "2026-05-04T00:00:00Z"),
    ]);
    expect(result.netByMember).toEqual([]);
  });

  it("settledAt 있는 entry → settledEntryCount + settledTotalKrw 집계", () => {
    const result = computeSettlement([
      makeSettled("a", 10000, ["철수", "영희"], "2026-05-04T00:00:00Z"),
      makeSettled("b", 20000, ["철수", "민수"], "2026-05-05T00:00:00Z"),
    ]);
    expect(result.settledEntryCount).toBe(2);
    expect(result.settledTotalKrw).toBe(30000);
    expect(result.splitEntryCount).toBe(0);
  });

  it("미정산 + 정산완료 혼재 — 미정산만 흐름 계산", () => {
    const result = computeSettlement([
      makeEntry("u1", 10000, ["철수", "영희"]), // 미정산
      makeSettled("s1", 20000, ["철수", "영희"], "2026-05-04T00:00:00Z"),
    ]);
    expect(result.splitEntryCount).toBe(1);
    expect(result.totalSplitKrw).toBe(10000);
    expect(result.settledEntryCount).toBe(1);
    expect(result.settledTotalKrw).toBe(20000);
    expect(result.transfers).toHaveLength(1);
    expect(result.transfers[0].amountKrw).toBe(5000); // 10000/2
  });

  it("settledAt 빈 문자열은 미정산 (truthy 판정 — '' 미사용 컨벤션)", () => {
    // settledAt: undefined 만 미정산. 빈 문자열은 들어오지 않는 컨벤션.
    const result = computeSettlement([
      makeSettled("a", 10000, ["철수", "영희"], undefined),
    ]);
    expect(result.splitEntryCount).toBe(1);
    expect(result.settledEntryCount).toBe(0);
  });

  it("splitWith 없으면서 settledAt — settledEntryCount에도 미포함 (members<2)", () => {
    const result = computeSettlement([
      {
        ...makeEntry("a", 10000),
        settledAt: "2026-05-04T00:00:00Z",
      },
    ]);
    expect(result.splitEntryCount).toBe(0);
    expect(result.settledEntryCount).toBe(0);
  });

  it("모두 정산 완료 — 흐름 0 + settledEntryCount > 0", () => {
    const result = computeSettlement([
      makeSettled("a", 10000, ["철수", "영희"], "2026-05-04T00:00:00Z"),
      makeSettled("b", 30000, ["영희", "철수"], "2026-05-05T00:00:00Z"),
    ]);
    expect(result.transfers).toEqual([]);
    expect(result.netByMember).toEqual([]);
    expect(result.splitEntryCount).toBe(0);
    expect(result.settledEntryCount).toBe(2);
    expect(result.settledTotalKrw).toBe(40000);
  });

  it("가중치 + settledAt 혼재 — 미정산 가중치 보존", () => {
    const result = computeSettlement([
      makeEntry("u1", 12000, [
        { name: "철수", weight: 2 },
        { name: "영희", weight: 1 },
      ]),
      makeSettled("s1", 6000, ["철수", "영희"], "2026-05-04T00:00:00Z"),
    ]);
    expect(result.splitEntryCount).toBe(1);
    expect(result.weightedEntryCount).toBe(1);
    expect(result.settledEntryCount).toBe(1);
  });
});
