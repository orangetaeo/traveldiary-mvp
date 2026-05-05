/**
 * OTA Aggregator + Geolocation 테스트 — Batch 19.
 *
 * 2 모듈:
 *  - lib/services/ota-aggregator.ts: aggregateOffersForItem (시드+실API 병합)
 *  - lib/services/geolocation.ts: getCurrentLocation (브라우저 Geolocation 래퍼)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

/* ────────── OTA Aggregator mocks ────────── */

const mockKlook = vi.fn();
const mockKKday = vi.fn();
const mockAgoda = vi.fn();

vi.mock("@/lib/services/ota/klook", () => ({
  fetchKlookOffers: (...args: unknown[]) => mockKlook(...args),
}));
vi.mock("@/lib/services/ota/kkday", () => ({
  fetchKKdayOffers: (...args: unknown[]) => mockKKday(...args),
}));
vi.mock("@/lib/services/ota/agoda", () => ({
  fetchAgodaOffers: (...args: unknown[]) => mockAgoda(...args),
}));

const mockFindOffersForItem = vi.fn();
const mockFindOffersByKeyword = vi.fn();

vi.mock("@/lib/seed/ota-offers", () => ({
  findOffersForItem: (...args: unknown[]) => mockFindOffersForItem(...args),
  findOffersByKeyword: (...args: unknown[]) => mockFindOffersByKeyword(...args),
}));

const BASE_ITEM = {
  id: "item-danang-1",
  name: "바나힐",
  location: { lat: 15.99, lng: 107.99, address: "다낭" },
  scheduledAt: "2026-05-05T09:00:00+07:00",
  durationMinutes: 120,
  flexibility: "flexible" as const,
  priority: 2 as const,
  flexMinutes: 30,
  dependencies: [],
  category: "spot" as const,
  evidence: { reasons: [], sources: [], verifiedAt: "" },
};

/* ────────── aggregateOffersForItem ────────── */

describe("services — aggregateOffersForItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindOffersForItem.mockReturnValue([]);
    mockFindOffersByKeyword.mockReturnValue([]);
    mockKlook.mockResolvedValue({ mode: "demo" });
    mockKKday.mockResolvedValue({ mode: "demo" });
    mockAgoda.mockResolvedValue({ mode: "demo" });
  });

  it("시드 + 모든 OTA demo → 시드만 반환", async () => {
    const seedOffer = { ota: "klook", matchTag: "bana-hills", priceKrw: 45000, url: "http://x" };
    mockFindOffersForItem.mockReturnValue([seedOffer]);
    const { aggregateOffersForItem } = await import("@/lib/services/ota-aggregator");
    const result = await aggregateOffersForItem(BASE_ITEM);
    expect(result).toContainEqual(seedOffer);
  });

  it("시드 없음 + keyword 시드 fallback", async () => {
    const kwOffer = { ota: "kkday", matchTag: "bana", priceKrw: 40000, url: "http://y" };
    mockFindOffersForItem.mockReturnValue([]);
    mockFindOffersByKeyword.mockReturnValue([kwOffer]);
    const { aggregateOffersForItem } = await import("@/lib/services/ota-aggregator");
    const result = await aggregateOffersForItem(BASE_ITEM);
    expect(result).toContainEqual(kwOffer);
    expect(mockFindOffersByKeyword).toHaveBeenCalledWith("바나힐");
  });

  it("실 API 결과 → 시드 동일 키 덮어쓰기", async () => {
    const seedOffer = { ota: "klook", matchTag: "bana-hills", priceKrw: 45000, url: "http://old" };
    const realOffer = { ota: "klook", matchTag: "bana-hills", priceKrw: 42000, url: "http://new" };
    mockFindOffersForItem.mockReturnValue([seedOffer]);
    mockKlook.mockResolvedValue({ mode: "ok", offers: [realOffer] });
    const { aggregateOffersForItem } = await import("@/lib/services/ota-aggregator");
    const result = await aggregateOffersForItem(BASE_ITEM);
    expect(result.length).toBe(1);
    expect(result[0].url).toBe("http://new");
  });

  it("3 OTA 병렬 호출 — 하나만 ok", async () => {
    const offer = { ota: "agoda", matchTag: "hotel-x", priceKrw: 80000, url: "http://z" };
    mockAgoda.mockResolvedValue({ mode: "ok", offers: [offer] });
    const { aggregateOffersForItem } = await import("@/lib/services/ota-aggregator");
    const result = await aggregateOffersForItem(BASE_ITEM);
    expect(result).toContainEqual(offer);
  });

  it("OTA rejected → 무시 (에러 전파 안 함)", async () => {
    mockKlook.mockRejectedValue(new Error("network"));
    mockFindOffersForItem.mockReturnValue([]);
    const { aggregateOffersForItem } = await import("@/lib/services/ota-aggregator");
    const result = await aggregateOffersForItem(BASE_ITEM);
    // rejected → allSettled에서 status=rejected → 무시
    expect(result).toEqual([]);
  });

  it("여러 OTA 결과 합산 (키 중복 없음)", async () => {
    mockKlook.mockResolvedValue({ mode: "ok", offers: [{ ota: "klook", matchTag: "a", priceKrw: 1, url: "" }] });
    mockKKday.mockResolvedValue({ mode: "ok", offers: [{ ota: "kkday", matchTag: "b", priceKrw: 2, url: "" }] });
    const { aggregateOffersForItem } = await import("@/lib/services/ota-aggregator");
    const result = await aggregateOffersForItem(BASE_ITEM);
    expect(result.length).toBe(2);
  });
});

/* ────────── getCurrentLocation ────────── */

describe("services — getCurrentLocation", () => {
  const origWindow = globalThis.window;

  afterEach(() => {
    // @ts-expect-error restore
    globalThis.window = origWindow;
  });

  it("window undefined (SSR) → 'unsupported'", async () => {
    // @ts-expect-error SSR simulation
    globalThis.window = undefined;
    const { getCurrentLocation } = await import("@/lib/services/geolocation");
    const result = await getCurrentLocation();
    expect(result.mode).toBe("unsupported");
  });

  it("geolocation 미지원 → 'unsupported'", async () => {
    // @ts-expect-error mock
    globalThis.window = { navigator: {} };
    const { getCurrentLocation } = await import("@/lib/services/geolocation");
    const result = await getCurrentLocation();
    expect(result.mode).toBe("unsupported");
  });

  it("성공 → mode 'ok' + 좌표", async () => {
    const mockGetCurrentPosition = vi.fn((success) => {
      success({ coords: { latitude: 16.05, longitude: 108.2, accuracy: 50 } });
    });
    // @ts-expect-error mock
    globalThis.window = {
      navigator: { geolocation: { getCurrentPosition: mockGetCurrentPosition } },
    };
    const { getCurrentLocation } = await import("@/lib/services/geolocation");
    const result = await getCurrentLocation();
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.lat).toBe(16.05);
      expect(result.lng).toBe(108.2);
      expect(result.accuracy).toBe(50);
    }
  });

  it("PERMISSION_DENIED → 'denied'", async () => {
    const mockGetCurrentPosition = vi.fn((_success, error) => {
      error({ code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
    });
    // @ts-expect-error mock
    globalThis.window = {
      navigator: { geolocation: { getCurrentPosition: mockGetCurrentPosition } },
    };
    const { getCurrentLocation } = await import("@/lib/services/geolocation");
    const result = await getCurrentLocation();
    expect(result.mode).toBe("denied");
  });

  it("POSITION_UNAVAILABLE → 'unavailable'", async () => {
    const mockGetCurrentPosition = vi.fn((_success, error) => {
      error({ code: 2, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
    });
    // @ts-expect-error mock
    globalThis.window = {
      navigator: { geolocation: { getCurrentPosition: mockGetCurrentPosition } },
    };
    const { getCurrentLocation } = await import("@/lib/services/geolocation");
    const result = await getCurrentLocation();
    expect(result.mode).toBe("unavailable");
  });

  it("TIMEOUT → 'timeout'", async () => {
    const mockGetCurrentPosition = vi.fn((_success, error) => {
      error({ code: 3, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
    });
    // @ts-expect-error mock
    globalThis.window = {
      navigator: { geolocation: { getCurrentPosition: mockGetCurrentPosition } },
    };
    const { getCurrentLocation } = await import("@/lib/services/geolocation");
    const result = await getCurrentLocation();
    expect(result.mode).toBe("timeout");
  });
});
