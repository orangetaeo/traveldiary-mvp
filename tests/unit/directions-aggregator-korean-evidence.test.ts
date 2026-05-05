/**
 * Google Directions + OTA Aggregator + Korean Evidence 테스트 — Batch 28.
 *
 * 3 모듈:
 *  - lib/services/google-directions.ts: fetchDirections, googleDirectionsAvailable
 *  - lib/services/ota-aggregator.ts: aggregateOffersForItem
 *  - lib/services/korean-evidence.ts: gatherKoreanEvidence
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

/* ────────── OTA aggregator mocks ────────── */

const mockFetchKlookOffers = vi.fn();
const mockFetchKKdayOffers = vi.fn();
const mockFetchAgodaOffers = vi.fn();
vi.mock("@/lib/services/ota/klook", () => ({
  fetchKlookOffers: (...args: unknown[]) => mockFetchKlookOffers(...args),
}));
vi.mock("@/lib/services/ota/kkday", () => ({
  fetchKKdayOffers: (...args: unknown[]) => mockFetchKKdayOffers(...args),
}));
vi.mock("@/lib/services/ota/agoda", () => ({
  fetchAgodaOffers: (...args: unknown[]) => mockFetchAgodaOffers(...args),
}));

const mockFindOffersForItem = vi.fn();
const mockFindOffersByKeyword = vi.fn();
vi.mock("@/lib/seed/ota-offers", () => ({
  findOffersForItem: (...args: unknown[]) => mockFindOffersForItem(...args),
  findOffersByKeyword: (...args: unknown[]) => mockFindOffersByKeyword(...args),
}));

/* ────────── Korean evidence mocks ────────── */

const mockSearchNaverLocal = vi.fn();
const mockSearchNaverBlog = vi.fn();
vi.mock("@/lib/services/naver-search", () => ({
  searchNaverLocal: (...args: unknown[]) => mockSearchNaverLocal(...args),
  searchNaverBlog: (...args: unknown[]) => mockSearchNaverBlog(...args),
}));

/* ════════════════════════════════════════════
 * Google Directions — fetchDirections
 * ════════════════════════════════════════════ */

describe("services — fetchDirections", () => {
  const ORIGINAL_ENV = process.env;
  const input = {
    origin: { lat: 16.05, lng: 108.24 },
    destination: { lat: 16.06, lng: 108.25 },
    mode: "driving" as const,
  };

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

  it("googleDirectionsAvailable — 키 없으면 false", async () => {
    delete process.env.GOOGLE_DIRECTIONS_API_KEY;
    const { googleDirectionsAvailable } = await import("@/lib/services/google-directions");
    expect(googleDirectionsAvailable()).toBe(false);
  });

  it("googleDirectionsAvailable — 키 있으면 true", async () => {
    process.env.GOOGLE_DIRECTIONS_API_KEY = "key123";
    const { googleDirectionsAvailable } = await import("@/lib/services/google-directions");
    expect(googleDirectionsAvailable()).toBe(true);
  });

  it("키 없으면 → demo", async () => {
    delete process.env.GOOGLE_DIRECTIONS_API_KEY;
    const { fetchDirections } = await import("@/lib/services/google-directions");
    const result = await fetchDirections(input);
    expect(result.mode).toBe("demo");
  });

  it("캐시 히트 (found) → found + cached: true", async () => {
    process.env.GOOGLE_DIRECTIONS_API_KEY = "key123";
    mockGetEvidenceCache.mockResolvedValue({ data: { durationSeconds: 600, distanceMeters: 3000 } });
    const { fetchDirections } = await import("@/lib/services/google-directions");
    const result = await fetchDirections(input);
    expect(result.mode).toBe("found");
    if (result.mode === "found") {
      expect(result.durationSeconds).toBe(600);
      expect(result.distanceMeters).toBe(3000);
      expect(result.cached).toBe(true);
    }
  });

  it("캐시 히트 (not_found) → not_found + cached: true", async () => {
    process.env.GOOGLE_DIRECTIONS_API_KEY = "key123";
    mockGetEvidenceCache.mockResolvedValue({ data: { durationSeconds: null, distanceMeters: null } });
    const { fetchDirections } = await import("@/lib/services/google-directions");
    const result = await fetchDirections(input);
    expect(result.mode).toBe("not_found");
    if (result.mode === "not_found") expect(result.cached).toBe(true);
  });

  it("QuotaExceeded → error + 'quota_exceeded'", async () => {
    process.env.GOOGLE_DIRECTIONS_API_KEY = "key123";
    mockAssertQuota.mockImplementation(() => { throw new TestQuotaExceededError(); });
    const { fetchDirections } = await import("@/lib/services/google-directions");
    const result = await fetchDirections(input);
    expect(result.mode).toBe("error");
    if (result.mode === "error") expect(result.code).toBe("quota_exceeded");
  });

  it("HTTP 에러 → error + 'google_api_error'", async () => {
    process.env.GOOGLE_DIRECTIONS_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 403 });
    const { fetchDirections } = await import("@/lib/services/google-directions");
    const result = await fetchDirections(input);
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.code).toBe("google_api_error");
      expect(result.message).toContain("403");
    }
  });

  it("정상 응답 OK → found + cached: false", async () => {
    process.env.GOOGLE_DIRECTIONS_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "OK",
        routes: [{ legs: [{ duration: { value: 900 }, distance: { value: 5000 } }] }],
      }),
    });
    const { fetchDirections } = await import("@/lib/services/google-directions");
    const result = await fetchDirections(input);
    expect(result.mode).toBe("found");
    if (result.mode === "found") {
      expect(result.durationSeconds).toBe(900);
      expect(result.distanceMeters).toBe(5000);
      expect(result.cached).toBe(false);
    }
  });

  it("ZERO_RESULTS → not_found + cached: false", async () => {
    process.env.GOOGLE_DIRECTIONS_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ZERO_RESULTS" }),
    });
    const { fetchDirections } = await import("@/lib/services/google-directions");
    const result = await fetchDirections(input);
    expect(result.mode).toBe("not_found");
    if (result.mode === "not_found") expect(result.cached).toBe(false);
  });

  it("NOT_FOUND → not_found", async () => {
    process.env.GOOGLE_DIRECTIONS_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ status: "NOT_FOUND" }),
    });
    const { fetchDirections } = await import("@/lib/services/google-directions");
    const result = await fetchDirections(input);
    expect(result.mode).toBe("not_found");
  });

  it("INVALID_REQUEST → error", async () => {
    process.env.GOOGLE_DIRECTIONS_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ status: "INVALID_REQUEST", error_message: "Bad origin" }),
    });
    const { fetchDirections } = await import("@/lib/services/google-directions");
    const result = await fetchDirections(input);
    expect(result.mode).toBe("error");
    if (result.mode === "error") expect(result.message).toBe("Bad origin");
  });

  it("네트워크 에러 → error + 'network'", async () => {
    process.env.GOOGLE_DIRECTIONS_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("ECONNRESET"));
    const { fetchDirections } = await import("@/lib/services/google-directions");
    const result = await fetchDirections(input);
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.code).toBe("network");
      expect(result.message).toContain("ECONNRESET");
    }
  });

  it("recordExternalCall 호출됨", async () => {
    process.env.GOOGLE_DIRECTIONS_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ status: "OK", routes: [{ legs: [{ duration: { value: 100 }, distance: { value: 500 } }] }] }),
    });
    const { fetchDirections } = await import("@/lib/services/google-directions");
    await fetchDirections(input);
    expect(mockRecordExternalCall).toHaveBeenCalledWith("google-directions");
  });

  it("OK + leg 누락 → not_found", async () => {
    process.env.GOOGLE_DIRECTIONS_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ status: "OK", routes: [{ legs: [] }] }),
    });
    const { fetchDirections } = await import("@/lib/services/google-directions");
    const result = await fetchDirections(input);
    expect(result.mode).toBe("not_found");
  });
});

/* ════════════════════════════════════════════
 * OTA Aggregator — aggregateOffersForItem
 * ════════════════════════════════════════════ */

describe("services — aggregateOffersForItem", () => {
  const mockItem = {
    id: "item-1",
    tripId: "trip-1",
    dayIndex: 0,
    scheduledAt: "2026-05-10T09:00:00Z",
    durationMinutes: 60,
    flexibility: "flexible" as const,
    priority: 3 as const,
    flexMinutes: 30,
    name: "바나힐",
    category: "spot" as const,
    location: { lat: 16.0, lng: 108.2, address: "다낭" },
    evidence: { reasons: [], sources: [], verifiedAt: "" },
    dependencies: [],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mockFindOffersForItem.mockReturnValue([]);
    mockFindOffersByKeyword.mockReturnValue([]);
    mockFetchKlookOffers.mockResolvedValue({ mode: "demo" });
    mockFetchKKdayOffers.mockResolvedValue({ mode: "demo" });
    mockFetchAgodaOffers.mockResolvedValue({ mode: "demo" });
  });

  it("모든 소스 빈 결과 → 빈 배열", async () => {
    const { aggregateOffersForItem } = await import("@/lib/services/ota-aggregator");
    const result = await aggregateOffersForItem(mockItem);
    expect(result).toEqual([]);
  });

  it("시드만 있을 때 → 시드 반환", async () => {
    const seedOffers = [
      { id: "seed-1", ota: "klook", matchTag: "바나힐", title: "바나힐 투어", priceKrw: 45000, url: "http://test" },
    ];
    mockFindOffersForItem.mockReturnValue(seedOffers);
    const { aggregateOffersForItem } = await import("@/lib/services/ota-aggregator");
    const result = await aggregateOffersForItem(mockItem);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("seed-1");
  });

  it("시드 없고 keyword 매칭 → keyword 시드 사용", async () => {
    mockFindOffersForItem.mockReturnValue([]);
    mockFindOffersByKeyword.mockReturnValue([
      { id: "kw-1", ota: "kkday", matchTag: "바나힐", title: "바나힐 케이블카", priceKrw: 50000, url: "http://test" },
    ]);
    const { aggregateOffersForItem } = await import("@/lib/services/ota-aggregator");
    const result = await aggregateOffersForItem(mockItem);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("kw-1");
  });

  it("실 API 결과가 시드를 덮어씀 (같은 ota:matchTag)", async () => {
    const seedOffer = { id: "seed-1", ota: "klook", matchTag: "바나힐", title: "시드", priceKrw: 40000, url: "http://seed" };
    const realOffer = { id: "klook-live", ota: "klook", matchTag: "바나힐", title: "실시간", priceKrw: 42000, url: "http://live" };
    mockFindOffersForItem.mockReturnValue([seedOffer]);
    mockFetchKlookOffers.mockResolvedValue({ mode: "ok", offers: [realOffer], cached: false });
    const { aggregateOffersForItem } = await import("@/lib/services/ota-aggregator");
    const result = await aggregateOffersForItem(mockItem);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("klook-live"); // 실 API 우선
  });

  it("다른 matchTag → 시드 + 실 API 병합", async () => {
    const seedOffer = { id: "seed-1", ota: "klook", matchTag: "바나힐-입장권", title: "시드", priceKrw: 40000, url: "http://seed" };
    const realOffer = { id: "klook-live", ota: "klook", matchTag: "바나힐-투어", title: "실시간", priceKrw: 55000, url: "http://live" };
    mockFindOffersForItem.mockReturnValue([seedOffer]);
    mockFetchKlookOffers.mockResolvedValue({ mode: "ok", offers: [realOffer], cached: false });
    const { aggregateOffersForItem } = await import("@/lib/services/ota-aggregator");
    const result = await aggregateOffersForItem(mockItem);
    expect(result.length).toBe(2);
  });

  it("3 OTA 병렬 성공 → 모든 결과 통합", async () => {
    mockFetchKlookOffers.mockResolvedValue({ mode: "ok", offers: [{ id: "k1", ota: "klook", matchTag: "a", title: "K", priceKrw: 10000, url: "u" }], cached: false });
    mockFetchKKdayOffers.mockResolvedValue({ mode: "ok", offers: [{ id: "d1", ota: "kkday", matchTag: "b", title: "D", priceKrw: 20000, url: "u" }], cached: false });
    mockFetchAgodaOffers.mockResolvedValue({ mode: "ok", offers: [{ id: "a1", ota: "agoda", matchTag: "c", title: "A", priceKrw: 30000, url: "u" }], cached: false });
    const { aggregateOffersForItem } = await import("@/lib/services/ota-aggregator");
    const result = await aggregateOffersForItem(mockItem);
    expect(result.length).toBe(3);
  });

  it("OTA rejected → 무시 (Promise.allSettled)", async () => {
    mockFetchKlookOffers.mockRejectedValue(new Error("crash"));
    mockFetchKKdayOffers.mockResolvedValue({ mode: "ok", offers: [{ id: "d1", ota: "kkday", matchTag: "x", title: "D", priceKrw: 10000, url: "u" }], cached: false });
    mockFetchAgodaOffers.mockResolvedValue({ mode: "demo" });
    const { aggregateOffersForItem } = await import("@/lib/services/ota-aggregator");
    const result = await aggregateOffersForItem(mockItem);
    expect(result.length).toBe(1);
    expect(result[0].ota).toBe("kkday");
  });

  it("OTA error 모드 → 무시", async () => {
    mockFetchKlookOffers.mockResolvedValue({ mode: "error", code: "network" });
    const { aggregateOffersForItem } = await import("@/lib/services/ota-aggregator");
    const result = await aggregateOffersForItem(mockItem);
    expect(result).toEqual([]);
  });
});

/* ════════════════════════════════════════════
 * Korean Evidence — gatherKoreanEvidence
 * ════════════════════════════════════════════ */

describe("services — gatherKoreanEvidence", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("둘 다 demo → demo", async () => {
    mockSearchNaverLocal.mockResolvedValue({ mode: "demo" });
    mockSearchNaverBlog.mockResolvedValue({ mode: "demo" });
    const { gatherKoreanEvidence } = await import("@/lib/services/korean-evidence");
    const result = await gatherKoreanEvidence("다낭 맛집");
    expect(result.mode).toBe("demo");
  });

  it("Local ok + Blog ok → ok + evidence 2 소스", async () => {
    mockSearchNaverLocal.mockResolvedValue({
      mode: "ok",
      items: [{ title: "Phở 24", link: "https://map.naver.com/pho24" }],
      total: 5,
      cached: false,
    });
    mockSearchNaverBlog.mockResolvedValue({
      mode: "ok",
      items: [{ title: "포24 맛집 후기", link: "http://blog" }],
      total: 1200,
      positiveHeuristic: 78,
      cached: false,
    });
    const { gatherKoreanEvidence } = await import("@/lib/services/korean-evidence");
    const result = await gatherKoreanEvidence("포24 다낭");
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.evidence.sources.length).toBe(2);
      expect(result.evidence.reasons.length).toBe(2);
      expect(result.evidence.reasons[0]).toContain("Phở 24");
      expect(result.evidence.reasons[1]).toContain("1,200");
      expect(result.cached).toBe(false);
    }
  });

  it("Local ok + Blog demo → ok + 1 소스", async () => {
    mockSearchNaverLocal.mockResolvedValue({
      mode: "ok",
      items: [{ title: "미케 비치", link: "https://map.naver.com/mke" }],
      total: 1,
      cached: true,
    });
    mockSearchNaverBlog.mockResolvedValue({ mode: "demo" });
    const { gatherKoreanEvidence } = await import("@/lib/services/korean-evidence");
    const result = await gatherKoreanEvidence("미케 비치");
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.evidence.sources.length).toBe(1);
      expect(result.evidence.sources[0].platform).toBe("naver");
    }
  });

  it("Local demo + Blog ok → ok + 1 소스", async () => {
    mockSearchNaverLocal.mockResolvedValue({ mode: "demo" });
    mockSearchNaverBlog.mockResolvedValue({
      mode: "ok",
      items: [{ title: "바나힐 후기" }],
      total: 500,
      positiveHeuristic: 85,
      cached: true,
    });
    const { gatherKoreanEvidence } = await import("@/lib/services/korean-evidence");
    const result = await gatherKoreanEvidence("바나힐");
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.evidence.sources.length).toBe(1);
      expect(result.evidence.reasons[0]).toContain("500");
    }
  });

  it("Local ok 빈 items + Blog ok 빈 items → no_data", async () => {
    mockSearchNaverLocal.mockResolvedValue({ mode: "ok", items: [], total: 0, cached: false });
    mockSearchNaverBlog.mockResolvedValue({ mode: "ok", items: [], total: 0, positiveHeuristic: 0, cached: false });
    const { gatherKoreanEvidence } = await import("@/lib/services/korean-evidence");
    const result = await gatherKoreanEvidence("존재하지않는곳");
    expect(result.mode).toBe("no_data");
  });

  it("cached 판정 — 둘 다 cached → true", async () => {
    mockSearchNaverLocal.mockResolvedValue({
      mode: "ok",
      items: [{ title: "X", link: "http://x" }],
      total: 1,
      cached: true,
    });
    mockSearchNaverBlog.mockResolvedValue({
      mode: "ok",
      items: [{ title: "Y" }],
      total: 10,
      positiveHeuristic: 60,
      cached: true,
    });
    const { gatherKoreanEvidence } = await import("@/lib/services/korean-evidence");
    const result = await gatherKoreanEvidence("테스트");
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") expect(result.cached).toBe(true);
  });

  it("cached 판정 — 하나라도 fresh → false", async () => {
    mockSearchNaverLocal.mockResolvedValue({
      mode: "ok",
      items: [{ title: "X", link: "http://x" }],
      total: 1,
      cached: false,
    });
    mockSearchNaverBlog.mockResolvedValue({
      mode: "ok",
      items: [{ title: "Y" }],
      total: 10,
      positiveHeuristic: 60,
      cached: true,
    });
    const { gatherKoreanEvidence } = await import("@/lib/services/korean-evidence");
    const result = await gatherKoreanEvidence("테스트");
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") expect(result.cached).toBe(false);
  });
});
