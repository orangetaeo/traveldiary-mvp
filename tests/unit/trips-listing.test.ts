/**
 * /trips 라우트 카드 빌드 + 필터 회귀 테스트 — 사이클 I (ADR-033).
 *
 * 시드 잦은 영역 답습: toBe(N) 대신 toBeGreaterThanOrEqual + toContain
 * (feedback_regression_test_minimums).
 */

import { describe, it, expect } from "vitest";
import { listDemoTrips } from "@/lib/seed";
import { listCities } from "@/lib/seed/cities";
import {
  buildCards,
  applyFilter,
  parseFilter,
  countVerifiedItems,
  cardSurface,
  type CardData,
} from "@/lib/services/trips-listing";

const bundles = listDemoTrips();
const cities = listCities();
const cards = buildCards(bundles, cities);

describe("사이클 I — /trips 카드 빌드", () => {
  it("trip 카드는 모든 demo trip을 노출한다", () => {
    const tripCards = cards.filter((c) => c.kind === "trip");
    expect(tripCards.length).toBe(bundles.length);
    expect(tripCards.length).toBeGreaterThanOrEqual(5);
    const codes = tripCards.map((c) => cardSurface(c).code).sort();
    expect(codes).toContain("PQC");
    expect(codes).toContain("DAD");
    expect(codes).toContain("SGN");
    expect(codes).toContain("HAN");
    expect(codes).toContain("NHA");
  });

  it("HOI(호이안)은 city-only 카드로 분류된다", () => {
    const hoi = cards.find((c) => cardSurface(c).code === "HOI");
    expect(hoi).toBeDefined();
    expect(hoi?.kind).toBe("city-only");
  });

  it("BKK·TYO는 coming-soon 카드로 분류된다 (Link 차단)", () => {
    const bkk = cards.find((c) => cardSurface(c).code === "BKK");
    const tyo = cards.find((c) => cardSurface(c).code === "TYO");
    expect(bkk?.kind).toBe("coming-soon");
    expect(tyo?.kind).toBe("coming-soon");
  });

  it("정렬: trip → city-only → coming-soon 순", () => {
    const order: CardData["kind"][] = ["trip", "city-only", "coming-soon"];
    let lastIdx = -1;
    for (const c of cards) {
      const idx = order.indexOf(c.kind);
      expect(idx).toBeGreaterThanOrEqual(lastIdx);
      lastIdx = Math.max(lastIdx, idx);
    }
  });

  it("trip 카드는 ResolvedTrip을 통해 itemCount + verifiedCount를 가진다 (verified ≥ 0, ≤ item)", () => {
    const tripCards = cards.filter(
      (c): c is Extract<CardData, { kind: "trip" }> => c.kind === "trip",
    );
    for (const c of tripCards) {
      // 사이클 J (ADR-034) — ResolvedTrip 기반
      expect(c.resolved.itemCount).toBeGreaterThan(0);
      expect(c.resolved.verifiedCount).toBeGreaterThanOrEqual(0);
      expect(c.resolved.verifiedCount).toBeLessThanOrEqual(c.resolved.itemCount);
    }
  });
});

describe("사이클 I — 필터 분기", () => {
  it("filter=VN: 베트남 도시만 (trip + city-only) — coming-soon 제외", () => {
    const vnOnly = applyFilter(cards, "VN");
    expect(vnOnly.length).toBeGreaterThanOrEqual(6); // 5 trip + HOI
    for (const c of vnOnly) {
      expect(c.kind).not.toBe("coming-soon");
      const cc =
        c.kind === "trip" ? c.resolved.city.countryCode : c.city.countryCode;
      expect(cc).toBe("VN");
    }
  });

  it("filter=coming-soon: BKK·TYO만 노출", () => {
    const cs = applyFilter(cards, "coming-soon");
    expect(cs.length).toBeGreaterThanOrEqual(2);
    for (const c of cs) {
      expect(c.kind).toBe("coming-soon");
    }
  });

  it("filter=all: 전체 노출", () => {
    expect(applyFilter(cards, "all").length).toBe(cards.length);
  });

  it("parseFilter: VN/coming-soon만 통과, 그 외는 all로 폴백", () => {
    expect(parseFilter("VN")).toBe("VN");
    expect(parseFilter("coming-soon")).toBe("coming-soon");
    expect(parseFilter(undefined)).toBe("all");
    expect(parseFilter("")).toBe("all");
    expect(parseFilter("unknown")).toBe("all");
    expect(parseFilter(["VN", "x"])).toBe("VN"); // 배열 첫 요소
  });
});

describe("사이클 I — countVerifiedItems", () => {
  it("evidence.sources 길이 > 0인 item만 카운트", () => {
    const fakeItems = [
      {
        evidence: { sources: [{ platform: "google" }], reasons: [], verifiedAt: "" },
      },
      { evidence: { sources: [], reasons: [], verifiedAt: "" } },
      {
        evidence: { sources: [{ platform: "naver" }, { platform: "ota" }], reasons: [], verifiedAt: "" },
      },
    ] as unknown as Parameters<typeof countVerifiedItems>[0];
    expect(countVerifiedItems(fakeItems)).toBe(2);
  });
});
