/**
 * 사이클 A5 — cost-split-suggestions 단위 테스트.
 *
 * 검증:
 *  - extractCommonMembers: 빈도 카운트, 동일 entry 중복 방지, 빈도 desc 정렬
 *  - buildEqualSplit: payer + others, 빈 입력, 중복 제거
 */

import { describe, it, expect } from "vitest";
import {
  extractCommonMembers,
  buildEqualSplit,
} from "@/lib/cost-split-suggestions";
import type { CostEntry } from "@/lib/types";

function entry(splitWith: CostEntry["splitWith"]): CostEntry {
  return {
    id: `e-${Math.random()}`,
    tripId: "t1",
    date: "2026-05-07",
    label: "lab",
    amountKrw: 10000,
    status: "paid",
    category: "food",
    createdAt: "2026-05-07T00:00:00Z",
    updatedAt: "2026-05-07T00:00:00Z",
    splitWith,
  };
}

describe("사이클 A5 — extractCommonMembers", () => {
  it("entries 비어있으면 빈 배열", () => {
    expect(extractCommonMembers([])).toEqual([]);
  });

  it("splitWith 없는 entry는 카운트 0", () => {
    const e = entry(undefined);
    expect(extractCommonMembers([e])).toEqual([]);
  });

  it("string[] splitWith 빈도 카운트", () => {
    const entries = [
      entry(["나", "영희", "철수"]),
      entry(["나", "영희"]),
      entry(["나", "민수"]),
    ];
    const result = extractCommonMembers(entries);
    expect(result).toEqual([
      { name: "나", count: 3 },
      { name: "영희", count: 2 },
      { name: "민수", count: 1 },
      { name: "철수", count: 1 },
    ]);
  });

  it("동일 entry 안에서 같은 이름은 1회만 카운트", () => {
    const entries = [entry(["나", "나", "영희"])];
    const result = extractCommonMembers(entries);
    expect(result).toEqual([
      { name: "나", count: 1 },
      { name: "영희", count: 1 },
    ]);
  });

  it("WeightedMember 형식도 카운트", () => {
    const entries = [
      entry([
        { name: "나", weight: 1 },
        { name: "영희", weight: 2 },
      ]),
      entry([{ name: "영희" }]),
    ];
    const result = extractCommonMembers(entries);
    expect(result).toEqual([
      { name: "영희", count: 2 },
      { name: "나", count: 1 },
    ]);
  });

  it("빈도 동률은 한국어 사전순", () => {
    const entries = [entry(["철수", "영희"])];
    const result = extractCommonMembers(entries);
    expect(result.map((m) => m.name)).toEqual(["영희", "철수"]);
  });

  it("settledAt 무관하게 카운트", () => {
    const settled = entry(["나", "영희"]);
    settled.settledAt = "2026-05-07T01:00:00Z";
    const unsettled = entry(["나"]);
    const result = extractCommonMembers([settled, unsettled]);
    expect(result).toEqual([
      { name: "나", count: 2 },
      { name: "영희", count: 1 },
    ]);
  });
});

describe("사이클 A5 — buildEqualSplit", () => {
  it("payer 빈 문자열 → null", () => {
    expect(buildEqualSplit("", ["영희"])).toBeNull();
    expect(buildEqualSplit("   ", ["영희"])).toBeNull();
  });

  it("others 모두 빈 문자열 → null", () => {
    expect(buildEqualSplit("나", [])).toBeNull();
    expect(buildEqualSplit("나", ["", "  "])).toBeNull();
  });

  it("payer + others 정상 → splitWith 배열 (payer 첫 위치)", () => {
    expect(buildEqualSplit("나", ["영희", "철수"])).toEqual([
      "나",
      "영희",
      "철수",
    ]);
  });

  it("others에 payer 동일 이름 있으면 제외", () => {
    expect(buildEqualSplit("나", ["나", "영희"])).toEqual(["나", "영희"]);
  });

  it("others 중복 제거 + trim", () => {
    expect(buildEqualSplit("나", ["영희", "영희", " 철수 "])).toEqual([
      "나",
      "영희",
      "철수",
    ]);
  });
});
