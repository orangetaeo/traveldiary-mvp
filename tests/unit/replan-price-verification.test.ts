/**
 * Replan + Price Verification 순수 함수 테스트 — Batch 23.
 *
 * 2 모듈:
 *  - lib/replan.ts: calculateAffectedRange, generateReplanOptions, validateDag
 *  - lib/services/price-verification.ts: toKrw, comparePriceVerification, PRICE_TOLERANCE, FX_RATES_TO_KRW
 */

import { describe, it, expect } from "vitest";
import {
  calculateAffectedRange,
  generateReplanOptions,
  validateDag,
  type ReplanTrigger,
} from "@/lib/replan";
import {
  toKrw,
  comparePriceVerification,
  PRICE_TOLERANCE,
  FX_RATES_TO_KRW,
} from "@/lib/services/price-verification";
import type { ItineraryItem } from "@/lib/types";

/* ════════════════════════════════════════════
 * Fixtures
 * ════════════════════════════════════════════ */

function makeItem(overrides: Partial<ItineraryItem> & { id: string }): ItineraryItem {
  return {
    tripId: "trip-1",
    dayIndex: 0,
    scheduledAt: "2026-05-10T09:00:00Z",
    durationMinutes: 60,
    flexibility: "flexible",
    priority: 3,
    flexMinutes: 30,
    name: "테스트 장소",
    category: "spot",
    location: { lat: 16.05, lng: 108.24, address: "다낭" },
    evidence: { reasons: [], sources: [], verifiedAt: "" },
    dependencies: [],
    ...overrides,
  } as ItineraryItem;
}

const ITEMS_DAY0: ItineraryItem[] = [
  makeItem({ id: "a", scheduledAt: "2026-05-10T08:00:00Z", durationMinutes: 60, dayIndex: 0 }),
  makeItem({ id: "b", scheduledAt: "2026-05-10T10:00:00Z", durationMinutes: 90, dayIndex: 0, flexibility: "booked" }),
  makeItem({ id: "c", scheduledAt: "2026-05-10T12:00:00Z", durationMinutes: 60, dayIndex: 0 }),
  makeItem({ id: "d", scheduledAt: "2026-05-10T14:00:00Z", durationMinutes: 120, dayIndex: 0, flexibility: "fixed" }),
];

const ITEMS_MULTI_DAY: ItineraryItem[] = [
  ...ITEMS_DAY0,
  makeItem({ id: "e", scheduledAt: "2026-05-11T09:00:00Z", durationMinutes: 60, dayIndex: 1 }),
  makeItem({ id: "f", scheduledAt: "2026-05-11T11:00:00Z", durationMinutes: 60, dayIndex: 1 }),
];

/* ════════════════════════════════════════════
 * replan — calculateAffectedRange
 * ════════════════════════════════════════════ */

describe("replan — calculateAffectedRange", () => {
  it("첫 번째 item 변경 → 같은 Day 후속 모두", () => {
    const affected = calculateAffectedRange(ITEMS_DAY0, "a");
    expect(affected).toEqual(["b", "c", "d"]);
  });

  it("중간 item 변경 → 후속만", () => {
    const affected = calculateAffectedRange(ITEMS_DAY0, "b");
    expect(affected).toEqual(["c", "d"]);
  });

  it("마지막 item 변경 → 빈 배열", () => {
    const affected = calculateAffectedRange(ITEMS_DAY0, "d");
    expect(affected).toEqual([]);
  });

  it("존재하지 않는 ID → 빈 배열", () => {
    const affected = calculateAffectedRange(ITEMS_DAY0, "unknown");
    expect(affected).toEqual([]);
  });

  it("다른 Day 항목은 포함 안 함", () => {
    const affected = calculateAffectedRange(ITEMS_MULTI_DAY, "a");
    expect(affected).not.toContain("e");
    expect(affected).not.toContain("f");
  });

  it("Day 1의 첫 item → Day 1 후속만", () => {
    const affected = calculateAffectedRange(ITEMS_MULTI_DAY, "e");
    expect(affected).toEqual(["f"]);
  });
});

/* ════════════════════════════════════════════
 * replan — generateReplanOptions
 * ════════════════════════════════════════════ */

describe("replan — generateReplanOptions", () => {
  const trigger: ReplanTrigger = { type: "delay", itemId: "a", minutes: 30 };

  it("항상 3개 옵션 반환 (추천/안전/강행)", () => {
    const options = generateReplanOptions(ITEMS_DAY0, trigger);
    expect(options.length).toBe(3);
    expect(options[0].option.id).toBe("option-recommend");
    expect(options[1].option.id).toBe("option-safe");
    expect(options[2].option.id).toBe("option-force");
  });

  it("추천 — booked/fixed 항목 보호 (시간 불변)", () => {
    const options = generateReplanOptions(ITEMS_DAY0, trigger);
    const recommend = options[0];
    const bookedItem = recommend.itemsAfter.find((it) => it.id === "b")!;
    const fixedItem = recommend.itemsAfter.find((it) => it.id === "d")!;
    // booked/fixed는 원본 시간 유지
    expect(bookedItem.scheduledAt).toBe("2026-05-10T10:00:00Z");
    expect(fixedItem.scheduledAt).toBe("2026-05-10T14:00:00Z");
  });

  it("추천 — flexible 항목 시프트 (flexMinutes 한도)", () => {
    const options = generateReplanOptions(ITEMS_DAY0, trigger);
    const recommend = options[0];
    const flexibleItem = recommend.itemsAfter.find((it) => it.id === "c")!;
    // c는 flexible, 원본 12:00 → 시프트됨
    expect(flexibleItem.scheduledAt).not.toBe("2026-05-10T12:00:00Z");
  });

  it("추천 — 트리거 item 자체 시프트", () => {
    const options = generateReplanOptions(ITEMS_DAY0, trigger);
    const recommend = options[0];
    const triggerItem = recommend.itemsAfter.find((it) => it.id === "a")!;
    // a: 08:00 + 30분 = 08:30
    expect(triggerItem.scheduledAt).toBe("2026-05-10T08:30:00.000Z");
  });

  it("안전 — 후속 전체 +trigger.minutes+30분 시프트", () => {
    const options = generateReplanOptions(ITEMS_DAY0, trigger);
    const safe = options[1];
    const itemC = safe.itemsAfter.find((it) => it.id === "c")!;
    // c: 12:00 + (30+30)분 = 13:00
    expect(itemC.scheduledAt).toBe("2026-05-10T13:00:00.000Z");
  });

  it("강행 — 모든 후속 동일 분량 시프트", () => {
    const options = generateReplanOptions(ITEMS_DAY0, trigger);
    const force = options[2];
    const itemB = force.itemsAfter.find((it) => it.id === "b")!;
    const itemD = force.itemsAfter.find((it) => it.id === "d")!;
    // b: 10:00 + 30분 = 10:30, d: 14:00 + 30분 = 14:30
    expect(itemB.scheduledAt).toBe("2026-05-10T10:30:00.000Z");
    expect(itemD.scheduledAt).toBe("2026-05-10T14:30:00.000Z");
  });

  it("impacts 메시지 포함", () => {
    const options = generateReplanOptions(ITEMS_DAY0, trigger);
    expect(options[0].option.impacts.length).toBeGreaterThan(0);
    expect(options[0].option.impacts[0].value).toContain("30분");
  });

  it("존재하지 않는 item → throw", () => {
    const badTrigger: ReplanTrigger = { type: "delay", itemId: "xxx", minutes: 10 };
    expect(() => generateReplanOptions(ITEMS_DAY0, badTrigger)).toThrow();
  });

  it("원본 배열 불변 (immutability)", () => {
    const before = ITEMS_DAY0.map((it) => ({ ...it }));
    generateReplanOptions(ITEMS_DAY0, trigger);
    expect(ITEMS_DAY0).toEqual(before);
  });
});

/* ════════════════════════════════════════════
 * replan — validateDag
 * ════════════════════════════════════════════ */

describe("replan — validateDag", () => {
  it("의존성 없는 DAG → ok", () => {
    const result = validateDag(ITEMS_DAY0);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("존재하지 않는 의존성 → error", () => {
    const items = [
      makeItem({ id: "x", dependencies: ["ghost"] }),
    ];
    const result = validateDag(items);
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("ghost");
  });

  it("사이클 탐지", () => {
    const items = [
      makeItem({ id: "p", dependencies: ["q"] }),
      makeItem({ id: "q", dependencies: ["p"] }),
    ];
    const result = validateDag(items);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("cycle"))).toBe(true);
  });

  it("빈 배열 → ok", () => {
    expect(validateDag([]).ok).toBe(true);
  });

  it("정상 의존성 체인 → ok", () => {
    const items = [
      makeItem({ id: "1", dependencies: [] }),
      makeItem({ id: "2", dependencies: ["1"] }),
      makeItem({ id: "3", dependencies: ["2"] }),
    ];
    expect(validateDag(items).ok).toBe(true);
  });
});

/* ════════════════════════════════════════════
 * price-verification — toKrw
 * ════════════════════════════════════════════ */

describe("price-verification — toKrw", () => {
  it("KRW → 그대로", () => {
    expect(toKrw(10000, "KRW")).toBe(10000);
  });

  it("USD → KRW 환산", () => {
    const result = toKrw(10, "USD");
    expect(result).toBe(Math.round(10 * FX_RATES_TO_KRW.USD));
  });

  it("VND → KRW 환산", () => {
    const result = toKrw(100000, "VND");
    expect(result).toBe(Math.round(100000 * FX_RATES_TO_KRW.VND));
  });

  it("대소문자 무시", () => {
    expect(toKrw(100, "usd")).toBe(toKrw(100, "USD"));
    expect(toKrw(100, "krw")).toBe(100);
  });

  it("미지원 통화 → null", () => {
    expect(toKrw(100, "BTC")).toBeNull();
    expect(toKrw(100, "XYZ")).toBeNull();
  });

  it("FX_RATES_TO_KRW 기본 통화 6종", () => {
    expect(Object.keys(FX_RATES_TO_KRW).length).toBeGreaterThanOrEqual(6);
  });
});

/* ════════════════════════════════════════════
 * price-verification — comparePriceVerification
 * ════════════════════════════════════════════ */

describe("price-verification — comparePriceVerification", () => {
  const makeOffer = (ota: string, priceKrw: number) => ({
    ota,
    matchTag: "test",
    priceKrw,
    url: "http://test",
  });

  it("estimatedPriceKrw 없음 → 'no_estimate'", () => {
    const result = comparePriceVerification({ offers: [makeOffer("klook", 5000)] });
    expect(result.status).toBe("no_estimate");
    expect(result.verified).toBe(false);
  });

  it("estimatedPriceKrw ≤ 0 → 'no_estimate'", () => {
    const result = comparePriceVerification({ estimatedPriceKrw: 0, offers: [makeOffer("klook", 5000)] });
    expect(result.status).toBe("no_estimate");
  });

  it("offers 0건 → 'no_offers'", () => {
    const result = comparePriceVerification({ estimatedPriceKrw: 10000, offers: [] });
    expect(result.status).toBe("no_offers");
  });

  it("OTA 1개 출처 → 'single_source'", () => {
    const result = comparePriceVerification({
      estimatedPriceKrw: 10000,
      offers: [makeOffer("klook", 10000), makeOffer("klook", 11000)],
    });
    expect(result.status).toBe("single_source");
    expect(result.otaSourceCount).toBe(1);
  });

  it("±20% 이내 → 'verified'", () => {
    const result = comparePriceVerification({
      estimatedPriceKrw: 10000,
      offers: [makeOffer("klook", 10500), makeOffer("kkday", 11000)],
    });
    expect(result.status).toBe("verified");
    expect(result.verified).toBe(true);
    expect(result.deltaPct).not.toBeNull();
    expect(Math.abs(result.deltaPct!)).toBeLessThanOrEqual(20);
  });

  it("20~50% 차이 → 'warn'", () => {
    // estimate: 10000, OTA median: 13500 → +35%
    const result = comparePriceVerification({
      estimatedPriceKrw: 10000,
      offers: [makeOffer("klook", 13000), makeOffer("kkday", 14000)],
    });
    expect(result.status).toBe("warn");
    expect(result.verified).toBe(false);
    expect(Math.abs(result.deltaPct!)).toBeGreaterThan(20);
    expect(Math.abs(result.deltaPct!)).toBeLessThanOrEqual(50);
  });

  it("50% 초과 → 'mismatch'", () => {
    // estimate: 10000, OTA median: 20000 → +100%
    const result = comparePriceVerification({
      estimatedPriceKrw: 10000,
      offers: [makeOffer("klook", 20000), makeOffer("kkday", 20000)],
    });
    expect(result.status).toBe("mismatch");
    expect(result.verified).toBe(false);
  });

  it("OTA가 시드보다 싼 경우 (음수 delta) → mismatch", () => {
    // estimate: 20000, OTA median: 8000 → -60%
    const result = comparePriceVerification({
      estimatedPriceKrw: 20000,
      offers: [makeOffer("klook", 8000), makeOffer("kkday", 8000)],
    });
    expect(result.deltaPct!).toBeLessThan(0);
    expect(result.status).toBe("mismatch");
  });

  it("medianOtaPriceKrw 정확한 중앙값 계산 (홀수)", () => {
    const result = comparePriceVerification({
      estimatedPriceKrw: 10000,
      offers: [makeOffer("klook", 9000), makeOffer("kkday", 10000), makeOffer("agoda", 11000)],
    });
    expect(result.medianOtaPriceKrw).toBe(10000);
  });

  it("medianOtaPriceKrw 정확한 중앙값 계산 (짝수)", () => {
    const result = comparePriceVerification({
      estimatedPriceKrw: 10000,
      offers: [makeOffer("klook", 9000), makeOffer("kkday", 10000), makeOffer("agoda", 11000), makeOffer("klook", 12000)],
    });
    // sorted: [9000, 10000, 11000, 12000], mid = 2 → (10000+11000)/2 = 10500
    expect(result.medianOtaPriceKrw).toBe(10500);
  });

  it("PRICE_TOLERANCE 상수 확인", () => {
    expect(PRICE_TOLERANCE.verifiedPct).toBe(20);
    expect(PRICE_TOLERANCE.warnPct).toBe(50);
  });

  it("otaSourceCount — distinct OTA 수", () => {
    const result = comparePriceVerification({
      estimatedPriceKrw: 10000,
      offers: [
        makeOffer("klook", 10000),
        makeOffer("kkday", 10500),
        makeOffer("agoda", 10200),
      ],
    });
    expect(result.otaSourceCount).toBe(3);
  });
});
