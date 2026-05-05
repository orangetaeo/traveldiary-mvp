/**
 * Allergens + Settlement 순수 함수 테스트 — Batch 18.
 *
 * 2 모듈:
 *  - lib/allergens.ts: normalizeExclude, matchAllergens, buildWarning, ALLERGEN_CHIPS
 *  - lib/services/settlement.ts: normalizeSplitWith, computeSettlement, formatKrw, parseSplitToken
 */

import { describe, it, expect } from "vitest";
import {
  normalizeExclude,
  matchAllergens,
  buildWarning,
  ALLERGEN_CHIPS,
} from "@/lib/allergens";
import {
  normalizeSplitWith,
  computeSettlement,
  formatKrw,
  parseSplitToken,
} from "@/lib/services/settlement";
import type { CostEntry } from "@/lib/types";

/* ────────── allergens ────────── */

describe("allergens — normalizeExclude", () => {
  it("정확한 alias → 카테고리 반환", () => {
    expect(normalizeExclude("새우 알레르기")).toBe("새우");
    expect(normalizeExclude("돼지고기 안 먹음")).toBe("돼지고기");
    expect(normalizeExclude("비건")).toBe("비건");
  });

  it("카테고리 직접 입력 → 그대로 반환", () => {
    expect(normalizeExclude("갑각류")).toBe("갑각류");
    expect(normalizeExclude("글루텐")).toBe("글루텐");
  });

  it("공백 trim 처리", () => {
    expect(normalizeExclude("  새우 알레르기  ")).toBe("새우");
  });

  it("인식 불가 → null", () => {
    expect(normalizeExclude("포도")).toBeNull();
  });

  it("빈 문자열 → 첫 alias 반환 (부분 매칭 특성)", () => {
    // 빈 문자열은 alias.includes("")가 true이므로 첫 alias 카테고리 반환
    const result = normalizeExclude("");
    expect(result).not.toBeNull();
  });

  it("부분 포함 매칭 (alias에 포함된 텍스트)", () => {
    expect(normalizeExclude("갑각류")).toBe("갑각류");
  });
});

describe("allergens — matchAllergens", () => {
  it("키워드 매칭 — 한국어", () => {
    const matches = matchAllergens("새우볶음밥", ["새우 알레르기"]);
    expect(matches.length).toBe(1);
    expect(matches[0].category).toBe("새우");
    expect(matches[0].keyword).toBe("새우");
    expect(matches[0].severity).toBe("critical");
  });

  it("키워드 매칭 — 베트남어", () => {
    const matches = matchAllergens("Tôm hùm nướng", ["갑각류 알레르기"]);
    expect(matches.length).toBe(1);
    expect(matches[0].category).toBe("갑각류");
  });

  it("매칭 없음 → 빈 배열", () => {
    const matches = matchAllergens("야채 볶음", ["새우 알레르기"]);
    expect(matches).toEqual([]);
  });

  it("중복 카테고리 dedup", () => {
    const matches = matchAllergens("새우 대하 왕새우", ["새우 알레르기"]);
    expect(matches.length).toBe(1);
  });

  it("여러 카테고리 동시 매칭", () => {
    const matches = matchAllergens("새우 치즈 그라탕", [
      "새우 알레르기",
      "우유 알레르기",
    ]);
    expect(matches.length).toBe(2);
  });

  it("severity — '안 먹음' → preference", () => {
    const matches = matchAllergens("돼지 구이", ["돼지고기 안 먹음"]);
    expect(matches[0].severity).toBe("preference");
  });

  it("인식 불가 exclude → 무시 (에러 아님)", () => {
    const matches = matchAllergens("야채", ["포도 알레르기"]);
    expect(matches).toEqual([]);
  });

  it("대소문자 무시", () => {
    const matches = matchAllergens("SHRIMP fried rice", ["새우 알레르기"]);
    expect(matches.length).toBe(1);
  });
});

describe("allergens — buildWarning", () => {
  it("빈 배열 → null", () => {
    expect(buildWarning([])).toBeNull();
  });

  it("critical → '⚠️ ... 알레르기 위험'", () => {
    const warning = buildWarning([
      { category: "새우", keyword: "새우", severity: "critical" },
    ]);
    expect(warning).toContain("⚠️");
    expect(warning).toContain("새우");
    expect(warning).toContain("알레르기 위험");
  });

  it("preference만 → '포함' (⚠️ 없음)", () => {
    const warning = buildWarning([
      { category: "돼지고기", keyword: "돼지", severity: "preference" },
    ]);
    expect(warning).not.toContain("⚠️");
    expect(warning).toContain("포함");
  });

  it("critical + preference 혼합 → critical 우선", () => {
    const warning = buildWarning([
      { category: "새우", keyword: "새우", severity: "critical" },
      { category: "돼지고기", keyword: "돼지", severity: "preference" },
    ]);
    expect(warning).toContain("⚠️");
    expect(warning).toContain("알레르기 위험");
  });
});

describe("allergens — ALLERGEN_CHIPS", () => {
  it("7개 이상 칩 존재", () => {
    expect(ALLERGEN_CHIPS.length).toBeGreaterThanOrEqual(7);
  });

  it("모든 칩 — label + raw 존재", () => {
    for (const chip of ALLERGEN_CHIPS) {
      expect(chip.label).toBeTruthy();
      expect(chip.raw).toBeTruthy();
    }
  });

  it("raw → normalizeExclude 가능", () => {
    for (const chip of ALLERGEN_CHIPS) {
      expect(normalizeExclude(chip.raw)).not.toBeNull();
    }
  });
});

/* ────────── settlement ────────── */

describe("settlement — normalizeSplitWith", () => {
  it("string[] → weight=1 모두", () => {
    const { members, isWeighted } = normalizeSplitWith(["철수", "영희"]);
    expect(members.length).toBe(2);
    expect(members[0]).toEqual({ name: "철수", weight: 1 });
    expect(isWeighted).toBe(false);
  });

  it("WeightedMember[] → weight 적용", () => {
    const { members, isWeighted } = normalizeSplitWith([
      { name: "철수", weight: 2 },
      { name: "영희" },
    ]);
    expect(members[0].weight).toBe(2);
    expect(members[1].weight).toBe(1);
    expect(isWeighted).toBe(true);
  });

  it("빈 배열 → 빈 결과", () => {
    expect(normalizeSplitWith([]).members.length).toBe(0);
  });

  it("non-array → 빈 결과", () => {
    expect(normalizeSplitWith(null).members.length).toBe(0);
    expect(normalizeSplitWith("test").members.length).toBe(0);
  });

  it("빈 이름 제거", () => {
    const { members } = normalizeSplitWith(["철수", "", "  "]);
    expect(members.length).toBe(1);
  });

  it("weight ≤ 0 → 1로 보정", () => {
    const { members } = normalizeSplitWith([{ name: "A", weight: -1 }]);
    expect(members[0].weight).toBe(1);
  });
});

describe("settlement — computeSettlement", () => {
  const makeEntry = (
    amountKrw: number,
    splitWith: unknown,
    settledAt?: string | null,
  ): CostEntry =>
    ({
      id: `entry-${Math.random()}`,
      amountKrw,
      splitWith,
      settledAt: settledAt ?? null,
    }) as unknown as CostEntry;

  it("빈 entries → EMPTY_RESULT", () => {
    const result = computeSettlement([]);
    expect(result.transfers).toEqual([]);
    expect(result.totalSplitKrw).toBe(0);
    expect(result.splitEntryCount).toBe(0);
  });

  it("2명 균등 분할 — 1건", () => {
    const result = computeSettlement([
      makeEntry(10000, ["철수", "영희"]),
    ]);
    expect(result.splitEntryCount).toBe(1);
    expect(result.totalSplitKrw).toBe(10000);
    expect(result.transfers.length).toBe(1);
    expect(result.transfers[0].from).toBe("영희");
    expect(result.transfers[0].to).toBe("철수");
    expect(result.transfers[0].amountKrw).toBe(5000);
  });

  it("3명 균등 분할", () => {
    const result = computeSettlement([
      makeEntry(30000, ["A", "B", "C"]),
    ]);
    // A가 결제 30000, 각 10000 부담 → A net=+20000, B,C net=-10000
    expect(result.netByMember.find((m) => m.name === "A")!.netKrw).toBe(20000);
    expect(result.transfers.length).toBe(2);
    const totalTransfer = result.transfers.reduce((s, t) => s + t.amountKrw, 0);
    expect(totalTransfer).toBe(20000);
  });

  it("가중치 분할 (2:1)", () => {
    const result = computeSettlement([
      makeEntry(30000, [{ name: "A", weight: 2 }, { name: "B", weight: 1 }]),
    ]);
    // totalWeight=3, A share=20000, B share=10000
    // A paid 30000, net = 30000 - 20000 = 10000
    // B paid 0, net = -10000
    expect(result.transfers[0].from).toBe("B");
    expect(result.transfers[0].to).toBe("A");
    expect(result.transfers[0].amountKrw).toBe(10000);
    expect(result.weightedEntryCount).toBe(1);
  });

  it("settledAt 있는 entry → 흐름 계산 제외", () => {
    const result = computeSettlement([
      makeEntry(20000, ["A", "B"], "2026-05-01T10:00:00Z"),
      makeEntry(10000, ["A", "B"]),
    ]);
    expect(result.splitEntryCount).toBe(1);
    expect(result.settledEntryCount).toBe(1);
    expect(result.settledTotalKrw).toBe(20000);
    expect(result.totalSplitKrw).toBe(10000);
  });

  it("1명만 split → 정산 대상 아님", () => {
    const result = computeSettlement([makeEntry(10000, ["A"])]);
    expect(result.splitEntryCount).toBe(0);
    expect(result.transfers).toEqual([]);
  });

  it("여러 entry 복합 정산", () => {
    const result = computeSettlement([
      makeEntry(20000, ["철수", "영희"]), // 영희 → 철수 10000
      makeEntry(30000, ["영희", "철수"]), // 철수 → 영희 15000
    ]);
    // net: 철수 10000 - 15000 = -5000, 영희 15000 - 10000 = +5000
    expect(result.transfers.length).toBe(1);
    expect(result.transfers[0].from).toBe("철수");
    expect(result.transfers[0].to).toBe("영희");
    expect(result.transfers[0].amountKrw).toBe(5000);
  });
});

describe("settlement — formatKrw", () => {
  it("양수 포맷", () => {
    expect(formatKrw(10000)).toBe("₩10,000");
  });

  it("음수 → 절대값 포맷", () => {
    expect(formatKrw(-5000)).toBe("₩5,000");
  });

  it("0 → ₩0", () => {
    expect(formatKrw(0)).toBe("₩0");
  });
});

describe("settlement — parseSplitToken", () => {
  it("이름만 → 문자열 반환", () => {
    expect(parseSplitToken("철수")).toBe("철수");
  });

  it("이름:가중치 → WeightedMember 객체", () => {
    expect(parseSplitToken("철수:2")).toEqual({ name: "철수", weight: 2 });
  });

  it("빈 문자열 → null", () => {
    expect(parseSplitToken("")).toBeNull();
    expect(parseSplitToken("   ")).toBeNull();
  });

  it("weight=1 → 문자열 반환 (v1 호환)", () => {
    expect(parseSplitToken("영희:1")).toBe("영희");
  });

  it("weight ≤ 0 → 문자열 반환", () => {
    expect(parseSplitToken("A:0")).toBe("A");
    expect(parseSplitToken("B:-1")).toBe("B");
  });

  it("weight NaN → 문자열 반환", () => {
    expect(parseSplitToken("C:abc")).toBe("C");
  });

  it("이름에 콜론 포함 → 마지막 콜론 기준 분리", () => {
    expect(parseSplitToken("A:B:2")).toEqual({ name: "A:B", weight: 2 });
  });

  it("콜론 뒤 이름 빈 값 → null", () => {
    expect(parseSplitToken(":2")).toBeNull();
  });
});
