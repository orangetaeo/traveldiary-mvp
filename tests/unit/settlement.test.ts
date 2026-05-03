/**
 * 사이클 E1 — Settlement (정산 흐름) 단위 테스트.
 *
 * splitWith[0] = 결제자 컨벤션 (ADR-039).
 */

import { describe, it, expect } from "vitest";
import { computeSettlement, formatKrw } from "@/lib/services/settlement";
import type { CostEntry } from "@/lib/types";

function makeEntry(
  id: string,
  amountKrw: number,
  splitWith?: string[],
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
