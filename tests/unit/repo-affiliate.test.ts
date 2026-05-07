/**
 * lib/repositories/affiliate.repository.ts 단위 테스트.
 *
 * extractCityFromOfferId, COMMISSION_RATE, getAffiliateSummary.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockFindMany = vi.fn();

let mockPrisma: unknown = {
  auditLog: {
    findMany: (...args: unknown[]) => mockFindMany(...args),
  },
};

vi.mock("@/lib/prisma", () => ({
  get prisma() { return mockPrisma; },
}));

vi.mock("@/lib/admin/window-filter", () => ({
  buildWindowCutoffFilter: (w: unknown) =>
    w ? { createdAt: { gte: new Date() } } : {},
}));

import {
  extractCityFromOfferId,
  COMMISSION_RATE,
  OFFER_PREFIX_CITY,
  getAffiliateSummary,
} from "@/lib/repositories/affiliate.repository";

describe("extractCityFromOfferId", () => {
  it("klook-pq-cablecar → pq", () => {
    expect(extractCityFromOfferId("klook-pq-cablecar")).toBe("pq");
  });

  it("agoda-dn-hotel → dn", () => {
    expect(extractCityFromOfferId("agoda-dn-hotel")).toBe("dn");
  });

  it("단일 세그먼트 → unknown", () => {
    expect(extractCityFromOfferId("nohyphens")).toBe("unknown");
  });
});

describe("COMMISSION_RATE", () => {
  it("3개 OTA 커미션 존재", () => {
    expect(COMMISSION_RATE.klook).toBe(0.05);
    expect(COMMISSION_RATE.kkday).toBe(0.04);
    expect(COMMISSION_RATE.agoda).toBe(0.04);
  });
});

describe("OFFER_PREFIX_CITY", () => {
  it("주요 도시 라벨 매핑", () => {
    expect(OFFER_PREFIX_CITY.pq).toBe("푸꾸옥");
    expect(OFFER_PREFIX_CITY.dn).toBe("다낭");
    expect(OFFER_PREFIX_CITY.ha).toBe("하노이");
  });
});

describe("getAffiliateSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      auditLog: {
        findMany: (...args: unknown[]) => mockFindMany(...args),
      },
    };
  });

  it("prisma null → null", async () => {
    mockPrisma = null;
    expect(await getAffiliateSummary()).toBeNull();
  });

  it("빈 rows → 0 클릭", async () => {
    mockFindMany.mockResolvedValue([]);
    const r = await getAffiliateSummary();
    expect(r!.totalClicks).toBe(0);
    expect(r!.byOta).toEqual([]);
    expect(r!.byCity).toEqual([]);
    expect(r!.topOffers).toEqual([]);
  });

  it("클릭 집계 + 커미션 계산", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "a1",
        createdAt: new Date("2026-07-01"),
        action: "affiliate.click",
        resourceId: "klook-pq-cable",
        actorId: "u1",
        metadata: { ota: "klook", itemId: "item-1", priceKrw: 100000 },
        after: { tracked: true },
      },
      {
        id: "a2",
        createdAt: new Date("2026-07-02"),
        action: "affiliate.click",
        resourceId: "kkday-dn-tour",
        actorId: null,
        metadata: { ota: "kkday", itemId: "item-2", priceKrw: 50000 },
        after: null,
      },
    ]);

    const r = await getAffiliateSummary();
    expect(r!.totalClicks).toBe(2);
    // klook: 100000 * 0.05 = 5000, kkday: 50000 * 0.04 = 2000
    expect(r!.totalEstimatedCommissionKrw).toBe(7000);

    // byOta
    expect(r!.byOta).toHaveLength(2);

    // byCity: pq, dn
    expect(r!.byCity).toHaveLength(2);

    // topOffers
    expect(r!.topOffers).toHaveLength(2);
  });

  it("scalar limit 호환 (helper-evolution)", async () => {
    mockFindMany.mockResolvedValue([]);
    const r = await getAffiliateSummary(5);
    expect(r).not.toBeNull();
  });

  it("options 객체", async () => {
    mockFindMany.mockResolvedValue([]);
    const r = await getAffiliateSummary({ limit: 10, windowDays: 30 });
    expect(r).not.toBeNull();
  });

  it("unknown OTA → commission 0", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "a3",
        createdAt: new Date("2026-07-01"),
        action: "affiliate.click",
        resourceId: "other-pq-thing",
        actorId: null,
        metadata: { ota: "trip.com", priceKrw: 200000 },
        after: {},
      },
    ]);

    const r = await getAffiliateSummary();
    expect(r!.totalEstimatedCommissionKrw).toBe(0);
  });

  it("DB 에러 → null", async () => {
    mockFindMany.mockRejectedValue(new Error("DB"));
    expect(await getAffiliateSummary()).toBeNull();
  });
});
