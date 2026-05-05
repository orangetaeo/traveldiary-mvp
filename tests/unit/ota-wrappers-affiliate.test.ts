/**
 * OTA Wrappers (Klook/KKday/Agoda) + Affiliate URL 테스트 — Batch 27.
 *
 * 4 모듈:
 *  - lib/services/ota/klook.ts: fetchKlookOffers
 *  - lib/services/ota/kkday.ts: fetchKKdayOffers
 *  - lib/services/ota/agoda.ts: fetchAgodaOffers
 *  - lib/utils/affiliate.ts: buildAffiliateUrl
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

/* ────────── 공통 mocks ────────── */

const mockGetEvidenceCache = vi.fn();
const mockSetEvidenceCache = vi.fn();
vi.mock("@/lib/repositories/evidence-cache.repository", () => ({
  getEvidenceCache: (...args: unknown[]) => mockGetEvidenceCache(...args),
  setEvidenceCache: (...args: unknown[]) => mockSetEvidenceCache(...args),
}));

const mockAssertQuota = vi.fn();
const mockRecordExternalCall = vi.fn();
class TestQuotaExceededError extends Error {
  name = "QuotaExceededError";
  cap = 5;
  resetAt = Date.now() + 3600000;
}
vi.mock("@/lib/usage-quota", () => ({
  assertQuota: (...args: unknown[]) => mockAssertQuota(...args),
  recordExternalCall: (...args: unknown[]) => mockRecordExternalCall(...args),
  QuotaExceededError: TestQuotaExceededError,
}));

/* ════════════════════════════════════════════
 * Klook — fetchKlookOffers
 * ════════════════════════════════════════════ */

describe("ota/klook — fetchKlookOffers", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...ORIGINAL_ENV };
    // @ts-expect-error mock fetch
    globalThis.fetch = vi.fn();
    mockGetEvidenceCache.mockResolvedValue(null);
    mockSetEvidenceCache.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("키 없으면 → demo", async () => {
    delete process.env.KLOOK_API_KEY;
    const { fetchKlookOffers } = await import("@/lib/services/ota/klook");
    const result = await fetchKlookOffers("다낭 투어");
    expect(result.mode).toBe("demo");
  });

  it("캐시 히트 → ok + cached: true", async () => {
    process.env.KLOOK_API_KEY = "test-key";
    const offers = [{ id: "klook-123", title: "다낭 바나힐", priceKrw: 50000, ota: "klook", matchTag: "test", url: "http://test" }];
    mockGetEvidenceCache.mockResolvedValue({ data: { offers } });
    const { fetchKlookOffers } = await import("@/lib/services/ota/klook");
    const result = await fetchKlookOffers("바나힐");
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.cached).toBe(true);
      expect(result.offers).toEqual(offers);
    }
  });

  it("QuotaExceeded → error + 'quota_exceeded'", async () => {
    process.env.KLOOK_API_KEY = "test-key";
    mockAssertQuota.mockImplementation(() => { throw new TestQuotaExceededError(); });
    const { fetchKlookOffers } = await import("@/lib/services/ota/klook");
    const result = await fetchKlookOffers("투어");
    expect(result.mode).toBe("error");
    if (result.mode === "error") expect(result.code).toBe("quota_exceeded");
  });

  it("HTTP 에러 → error + 'klook_api_error'", async () => {
    process.env.KLOOK_API_KEY = "test-key";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 500 });
    const { fetchKlookOffers } = await import("@/lib/services/ota/klook");
    const result = await fetchKlookOffers("투어");
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.code).toBe("klook_api_error");
      expect(result.message).toContain("500");
    }
  });

  it("정상 응답 → ok + offers 매핑", async () => {
    process.env.KLOOK_API_KEY = "test-key";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { activity_id: "101", title: "바나힐 투어", price: { selling_price: 40, market_price: 50 }, rating: 4.5, review_count: 200, url: "https://klook.com/101" },
          { activity_id: "102", title: "호이안 야시장", price: { selling_price: 20 }, rating: 4.2 },
        ],
      }),
    });
    const { fetchKlookOffers } = await import("@/lib/services/ota/klook");
    const result = await fetchKlookOffers("다낭");
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.cached).toBe(false);
      expect(result.offers.length).toBe(2);
      expect(result.offers[0].ota).toBe("klook");
      expect(result.offers[0].priceKrw).toBe(Math.round(40 * 1300));
      expect(result.offers[0].originalPriceKrw).toBe(Math.round(50 * 1300));
      expect(result.offers[1].originalPriceKrw).toBeUndefined();
    }
  });

  it("네트워크 에러 → error + 'network'", async () => {
    process.env.KLOOK_API_KEY = "test-key";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("TIMEOUT"));
    const { fetchKlookOffers } = await import("@/lib/services/ota/klook");
    const result = await fetchKlookOffers("투어");
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.code).toBe("network");
      expect(result.message).toContain("TIMEOUT");
    }
  });

  it("recordExternalCall 호출됨", async () => {
    process.env.KLOOK_API_KEY = "test-key";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    });
    const { fetchKlookOffers } = await import("@/lib/services/ota/klook");
    await fetchKlookOffers("투어");
    expect(mockRecordExternalCall).toHaveBeenCalledWith("ota");
  });

  it("빈 results → ok + 빈 offers", async () => {
    process.env.KLOOK_API_KEY = "test-key";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    });
    const { fetchKlookOffers } = await import("@/lib/services/ota/klook");
    const result = await fetchKlookOffers("없는것");
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") expect(result.offers.length).toBe(0);
  });
});

/* ════════════════════════════════════════════
 * KKday — fetchKKdayOffers
 * ════════════════════════════════════════════ */

describe("ota/kkday — fetchKKdayOffers", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...ORIGINAL_ENV };
    // @ts-expect-error mock fetch
    globalThis.fetch = vi.fn();
    mockGetEvidenceCache.mockResolvedValue(null);
    mockSetEvidenceCache.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("키 없으면 → demo", async () => {
    delete process.env.KKDAY_API_KEY;
    const { fetchKKdayOffers } = await import("@/lib/services/ota/kkday");
    const result = await fetchKKdayOffers("다낭");
    expect(result.mode).toBe("demo");
  });

  it("캐시 히트 → ok + cached: true", async () => {
    process.env.KKDAY_API_KEY = "test-key";
    const offers = [{ id: "kkday-456", title: "메콩 델타", priceKrw: 35000, ota: "kkday", matchTag: "test", url: "http://test" }];
    mockGetEvidenceCache.mockResolvedValue({ data: { offers } });
    const { fetchKKdayOffers } = await import("@/lib/services/ota/kkday");
    const result = await fetchKKdayOffers("메콩");
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.cached).toBe(true);
      expect(result.offers).toEqual(offers);
    }
  });

  it("QuotaExceeded → error + 'quota_exceeded'", async () => {
    process.env.KKDAY_API_KEY = "test-key";
    mockAssertQuota.mockImplementation(() => { throw new TestQuotaExceededError(); });
    const { fetchKKdayOffers } = await import("@/lib/services/ota/kkday");
    const result = await fetchKKdayOffers("투어");
    expect(result.mode).toBe("error");
    if (result.mode === "error") expect(result.code).toBe("quota_exceeded");
  });

  it("HTTP 에러 → error + 'kkday_api_error'", async () => {
    process.env.KKDAY_API_KEY = "test-key";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 403 });
    const { fetchKKdayOffers } = await import("@/lib/services/ota/kkday");
    const result = await fetchKKdayOffers("투어");
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.code).toBe("kkday_api_error");
      expect(result.message).toContain("403");
    }
  });

  it("정상 응답 → ok + offers 매핑 (priceKrw 직접)", async () => {
    process.env.KKDAY_API_KEY = "test-key";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { product_id: "P001", product_name: "구찌섬 투어", price: { sale_price: 45000, original_price: 60000 }, rating_avg: 4.7, rating_count: 150, product_url: "https://kkday.com/p001" },
          { product_id: "P002", product_name: "호이안 자전거", price: { sale_price: 25000 } },
        ],
      }),
    });
    const { fetchKKdayOffers } = await import("@/lib/services/ota/kkday");
    const result = await fetchKKdayOffers("다낭");
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.cached).toBe(false);
      expect(result.offers.length).toBe(2);
      expect(result.offers[0].ota).toBe("kkday");
      expect(result.offers[0].priceKrw).toBe(45000);
      expect(result.offers[0].originalPriceKrw).toBe(60000);
      expect(result.offers[1].originalPriceKrw).toBeUndefined();
    }
  });

  it("네트워크 에러 → error + 'network'", async () => {
    process.env.KKDAY_API_KEY = "test-key";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("CONNECTION_REFUSED"));
    const { fetchKKdayOffers } = await import("@/lib/services/ota/kkday");
    const result = await fetchKKdayOffers("투어");
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.code).toBe("network");
      expect(result.message).toContain("CONNECTION_REFUSED");
    }
  });

  it("recordExternalCall 호출됨", async () => {
    process.env.KKDAY_API_KEY = "test-key";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
    const { fetchKKdayOffers } = await import("@/lib/services/ota/kkday");
    await fetchKKdayOffers("투어");
    expect(mockRecordExternalCall).toHaveBeenCalledWith("ota");
  });
});

/* ════════════════════════════════════════════
 * Agoda — fetchAgodaOffers
 * ════════════════════════════════════════════ */

describe("ota/agoda — fetchAgodaOffers", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...ORIGINAL_ENV };
    // @ts-expect-error mock fetch
    globalThis.fetch = vi.fn();
    mockGetEvidenceCache.mockResolvedValue(null);
    mockSetEvidenceCache.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("키 없으면 → demo", async () => {
    delete process.env.AGODA_API_KEY;
    const { fetchAgodaOffers } = await import("@/lib/services/ota/agoda");
    const result = await fetchAgodaOffers("다낭");
    expect(result.mode).toBe("demo");
  });

  it("캐시 히트 → ok + cached: true", async () => {
    process.env.AGODA_API_KEY = "test-key";
    const offers = [{ id: "agoda-789", title: "스파 패키지", priceKrw: 70000, ota: "agoda", matchTag: "test", url: "http://test" }];
    mockGetEvidenceCache.mockResolvedValue({ data: { offers } });
    const { fetchAgodaOffers } = await import("@/lib/services/ota/agoda");
    const result = await fetchAgodaOffers("스파");
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.cached).toBe(true);
      expect(result.offers).toEqual(offers);
    }
  });

  it("QuotaExceeded → error + 'quota_exceeded'", async () => {
    process.env.AGODA_API_KEY = "test-key";
    mockAssertQuota.mockImplementation(() => { throw new TestQuotaExceededError(); });
    const { fetchAgodaOffers } = await import("@/lib/services/ota/agoda");
    const result = await fetchAgodaOffers("투어");
    expect(result.mode).toBe("error");
    if (result.mode === "error") expect(result.code).toBe("quota_exceeded");
  });

  it("HTTP 에러 → error + 'agoda_api_error'", async () => {
    process.env.AGODA_API_KEY = "test-key";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 429 });
    const { fetchAgodaOffers } = await import("@/lib/services/ota/agoda");
    const result = await fetchAgodaOffers("투어");
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.code).toBe("agoda_api_error");
      expect(result.message).toContain("429");
    }
  });

  it("정상 응답 → ok + offers 매핑", async () => {
    process.env.AGODA_API_KEY = "test-key";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        activities: [
          { id: "A01", name: "선셋 크루즈", price: { current: 55000, was: 70000 }, review: { score: 4.8, count: 300 }, bookingUrl: "https://agoda.com/a01" },
          { id: "A02", name: "시티 투어", price: { current: 30000 }, review: { score: 4.3, count: 90 } },
        ],
      }),
    });
    const { fetchAgodaOffers } = await import("@/lib/services/ota/agoda");
    const result = await fetchAgodaOffers("다낭", { lat: 16.05, lng: 108.24 });
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.cached).toBe(false);
      expect(result.offers.length).toBe(2);
      expect(result.offers[0].ota).toBe("agoda");
      expect(result.offers[0].priceKrw).toBe(55000);
      expect(result.offers[0].originalPriceKrw).toBe(70000);
      expect(result.offers[1].originalPriceKrw).toBeUndefined();
    }
  });

  it("네트워크 에러 → error + 'network'", async () => {
    process.env.AGODA_API_KEY = "test-key";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("ENOTFOUND"));
    const { fetchAgodaOffers } = await import("@/lib/services/ota/agoda");
    const result = await fetchAgodaOffers("투어");
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.code).toBe("network");
      expect(result.message).toContain("ENOTFOUND");
    }
  });

  it("recordExternalCall 호출됨", async () => {
    process.env.AGODA_API_KEY = "test-key";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ activities: [] }),
    });
    const { fetchAgodaOffers } = await import("@/lib/services/ota/agoda");
    await fetchAgodaOffers("투어");
    expect(mockRecordExternalCall).toHaveBeenCalledWith("ota");
  });

  it("POST body에 location 포함", async () => {
    process.env.AGODA_API_KEY = "test-key";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ activities: [] }),
    });
    const { fetchAgodaOffers } = await import("@/lib/services/ota/agoda");
    await fetchAgodaOffers("스파", { lat: 16.0, lng: 108.2 });
    const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.location.latitude).toBe(16.0);
    expect(body.location.longitude).toBe(108.2);
    expect(body.currency).toBe("KRW");
  });
});

/* ════════════════════════════════════════════
 * affiliate — buildAffiliateUrl
 * ════════════════════════════════════════════ */

describe("utils/affiliate — buildAffiliateUrl", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("klook — aid 파라미터 추가", async () => {
    process.env.KLOOK_AFFILIATE_ID = "my-aid";
    const { buildAffiliateUrl } = await import("@/lib/utils/affiliate");
    const result = buildAffiliateUrl("klook", "https://www.klook.com/activity/101");
    expect(result.tracked).toBe(true);
    expect(result.url).toContain("aid=my-aid");
  });

  it("kkday — cid 파라미터 추가", async () => {
    process.env.KKDAY_AFFILIATE_ID = "my-cid";
    const { buildAffiliateUrl } = await import("@/lib/utils/affiliate");
    const result = buildAffiliateUrl("kkday", "https://www.kkday.com/product/P001");
    expect(result.tracked).toBe(true);
    expect(result.url).toContain("cid=my-cid");
  });

  it("agoda — cid 파라미터 추가", async () => {
    process.env.AGODA_AFFILIATE_ID = "agoda-cid";
    const { buildAffiliateUrl } = await import("@/lib/utils/affiliate");
    const result = buildAffiliateUrl("agoda", "https://www.agoda.com/activities/A01");
    expect(result.tracked).toBe(true);
    expect(result.url).toContain("cid=agoda-cid");
  });

  it("키 없으면 → baseUrl 그대로 + tracked: false", async () => {
    delete process.env.KLOOK_AFFILIATE_ID;
    const { buildAffiliateUrl } = await import("@/lib/utils/affiliate");
    const base = "https://www.klook.com/activity/101";
    const result = buildAffiliateUrl("klook", base);
    expect(result.tracked).toBe(false);
    expect(result.url).toBe(base);
  });

  it("잘못된 URL → baseUrl 그대로 + tracked: false", async () => {
    process.env.KLOOK_AFFILIATE_ID = "my-aid";
    const { buildAffiliateUrl } = await import("@/lib/utils/affiliate");
    const result = buildAffiliateUrl("klook", "not-a-valid-url");
    expect(result.tracked).toBe(false);
    expect(result.url).toBe("not-a-valid-url");
  });

  it("기존 쿼리 파라미터 유지", async () => {
    process.env.KLOOK_AFFILIATE_ID = "aid-123";
    const { buildAffiliateUrl } = await import("@/lib/utils/affiliate");
    const result = buildAffiliateUrl("klook", "https://www.klook.com/activity/101?lang=ko");
    expect(result.url).toContain("lang=ko");
    expect(result.url).toContain("aid=aid-123");
    expect(result.tracked).toBe(true);
  });
});
