/**
 * lib/services/ota-aggregator.ts 단위 테스트.
 *
 * aggregateOffersForItem — 3 OTA 병렬 + 시드 fallback + 중복 제거.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockFetchKlook = vi.fn();
const mockFetchKKday = vi.fn();
const mockFetchAgoda = vi.fn();
vi.mock("@/lib/services/ota/klook", () => ({
  fetchKlookOffers: (...args: unknown[]) => mockFetchKlook(...args),
}));
vi.mock("@/lib/services/ota/kkday", () => ({
  fetchKKdayOffers: (...args: unknown[]) => mockFetchKKday(...args),
}));
vi.mock("@/lib/services/ota/agoda", () => ({
  fetchAgodaOffers: (...args: unknown[]) => mockFetchAgoda(...args),
}));

const mockFindOffersForItem = vi.fn();
const mockFindOffersByKeyword = vi.fn();
vi.mock("@/lib/seed/ota-offers", () => ({
  findOffersForItem: (...args: unknown[]) => mockFindOffersForItem(...args),
  findOffersByKeyword: (...args: unknown[]) => mockFindOffersByKeyword(...args),
}));

import { aggregateOffersForItem } from "@/lib/services/ota-aggregator";

const MOCK_ITEM = {
  id: "item-1",
  name: "미케 비치",
  category: "spot" as const,
  location: { lat: 16.06, lng: 108.24, address: "다낭" },
  scheduledAt: "2026-07-01T10:00:00Z",
  durationMinutes: 90,
  flexibility: "flexible" as const,
  priority: 2 as const,
  flexMinutes: 30,
  dependencies: [],
  evidence: {
    overall: "verified" as const,
    breakdown: [],
    lastChecked: new Date().toISOString(),
  },
};

describe("aggregateOffersForItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindOffersForItem.mockReturnValue([]);
    mockFindOffersByKeyword.mockReturnValue([]);
    mockFetchKlook.mockResolvedValue({ mode: "demo" });
    mockFetchKKday.mockResolvedValue({ mode: "demo" });
    mockFetchAgoda.mockResolvedValue({ mode: "demo" });
  });

  it("시드 + API 모두 없으면 → 빈 배열", async () => {
    const r = await aggregateOffersForItem(MOCK_ITEM);
    expect(r).toEqual([]);
  });

  it("시드 exact → 시드 오퍼 반환", async () => {
    mockFindOffersForItem.mockReturnValue([
      { ota: "klook", matchTag: "beach-tour", title: "비치 투어", priceKrw: 50000, url: "https://klook.com" },
    ]);

    const r = await aggregateOffersForItem(MOCK_ITEM);
    expect(r).toHaveLength(1);
    expect(r[0].ota).toBe("klook");
  });

  it("시드 exact 없으면 keyword fallback", async () => {
    mockFindOffersForItem.mockReturnValue([]);
    mockFindOffersByKeyword.mockReturnValue([
      { ota: "kkday", matchTag: "keyword-match", title: "투어" },
    ]);

    const r = await aggregateOffersForItem(MOCK_ITEM);
    expect(r).toHaveLength(1);
    expect(r[0].matchTag).toBe("keyword-match");
  });

  it("시드 exact 있으면 keyword 스킵", async () => {
    mockFindOffersForItem.mockReturnValue([
      { ota: "klook", matchTag: "exact", title: "정확" },
    ]);
    mockFindOffersByKeyword.mockReturnValue([
      { ota: "kkday", matchTag: "keyword", title: "키워드" },
    ]);

    const r = await aggregateOffersForItem(MOCK_ITEM);
    expect(r).toHaveLength(1);
    expect(r[0].matchTag).toBe("exact");
    expect(mockFindOffersByKeyword).not.toHaveBeenCalled();
  });

  it("실 API 결과 반환 (Klook ok)", async () => {
    mockFetchKlook.mockResolvedValue({
      mode: "ok",
      offers: [{ ota: "klook", matchTag: "real-1", title: "실제 오퍼" }],
    });

    const r = await aggregateOffersForItem(MOCK_ITEM);
    expect(r).toHaveLength(1);
    expect(r[0].matchTag).toBe("real-1");
  });

  it("실 API가 시드 중복 시 API 우선", async () => {
    mockFindOffersForItem.mockReturnValue([
      { ota: "klook", matchTag: "same-tag", title: "시드 버전", priceKrw: 40000 },
    ]);
    mockFetchKlook.mockResolvedValue({
      mode: "ok",
      offers: [{ ota: "klook", matchTag: "same-tag", title: "실시간 버전", priceKrw: 45000 }],
    });

    const r = await aggregateOffersForItem(MOCK_ITEM);
    expect(r).toHaveLength(1);
    expect(r[0].title).toBe("실시간 버전");
    expect(r[0].priceKrw).toBe(45000);
  });

  it("다른 OTA → 중복 아님 (ota:matchTag 조합)", async () => {
    mockFindOffersForItem.mockReturnValue([
      { ota: "klook", matchTag: "tag-1", title: "Klook 시드" },
    ]);
    mockFetchKKday.mockResolvedValue({
      mode: "ok",
      offers: [{ ota: "kkday", matchTag: "tag-1", title: "KKday 실제" }],
    });

    const r = await aggregateOffersForItem(MOCK_ITEM);
    expect(r).toHaveLength(2);
  });

  it("3 OTA 병렬 (Promise.allSettled) — 일부 실패해도 진행", async () => {
    mockFetchKlook.mockRejectedValue(new Error("network"));
    mockFetchKKday.mockResolvedValue({
      mode: "ok",
      offers: [{ ota: "kkday", matchTag: "ok-1", title: "OK" }],
    });
    mockFetchAgoda.mockResolvedValue({ mode: "demo" });

    const r = await aggregateOffersForItem(MOCK_ITEM);
    expect(r).toHaveLength(1);
    expect(r[0].ota).toBe("kkday");
  });

  it("item 정보를 OTA fetcher에 전달", async () => {
    await aggregateOffersForItem(MOCK_ITEM);

    expect(mockFetchKlook).toHaveBeenCalledWith("미케 비치", { lat: 16.06, lng: 108.24 });
    expect(mockFetchKKday).toHaveBeenCalledWith("미케 비치", { lat: 16.06, lng: 108.24 });
    expect(mockFetchAgoda).toHaveBeenCalledWith("미케 비치", { lat: 16.06, lng: 108.24 });
  });
});
