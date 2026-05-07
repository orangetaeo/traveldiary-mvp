/**
 * lib/services/ota/klook.ts + kkday.ts + agoda.ts 단위 테스트.
 *
 * 각 provider는 fetchOtaWithCache에 doFetch 콜백을 전달하는 thin wrapper.
 * fetchOtaWithCache 자체는 fetch-ota.test.ts에서 커버.
 * 여기서는 doFetch 콜백 내부의 API 응답 파싱 로직 테스트.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetEnvKey = vi.fn();
vi.mock("@/lib/utils/env", () => ({
  getEnvKey: (...args: unknown[]) => mockGetEnvKey(...args),
}));

// fetchOtaWithCache를 스파이해서 doFetch 콜백을 추출하고 직접 실행
const mockFetchOtaWithCache = vi.fn();
vi.mock("@/lib/services/ota/fetch-ota", () => ({
  fetchOtaWithCache: (...args: unknown[]) => mockFetchOtaWithCache(...args),
  normalizeMatchTag: (q: string) => q.toLowerCase().replace(/\s+/g, "-").slice(0, 40),
  OtaHttpError: class extends Error {
    constructor(status: number) {
      super(`HTTP ${status}`);
      this.name = "OtaHttpError";
    }
  },
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { fetchKlookOffers } from "@/lib/services/ota/klook";
import { fetchKKdayOffers } from "@/lib/services/ota/kkday";
import { fetchAgodaOffers } from "@/lib/services/ota/agoda";

describe("OTA providers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEnvKey.mockReturnValue("test-key");
    mockFetchOtaWithCache.mockResolvedValue({ mode: "demo" });
  });

  // ═══════════════════════════════════════════════════════════
  // Klook
  // ═══════════════════════════════════════════════════════════

  describe("klook", () => {
    it("fetchOtaWithCache에 올바른 config 전달", async () => {
      await fetchKlookOffers("다낭 투어", { lat: 16.0, lng: 108.0 });

      expect(mockFetchOtaWithCache).toHaveBeenCalledOnce();
      const config = mockFetchOtaWithCache.mock.calls[0][0];
      expect(config.prefix).toBe("klook");
      expect(config.platform).toBe("ota.klook");
      expect(config.query).toBe("다낭 투어");
      expect(config.apiErrorCode).toBe("klook_api_error");
      expect(typeof config.doFetch).toBe("function");
    });

    it("doFetch — API 응답 파싱", async () => {
      mockFetchOtaWithCache.mockImplementation(async (config: { doFetch: (key: string) => Promise<unknown[]> }) => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            results: [
              {
                activity_id: "101",
                title: "다낭 시티 투어",
                price: { selling_price: 30, market_price: 50 },
                rating: 4.5,
                review_count: 200,
                url: "https://klook.com/101",
              },
              // 필수 필드 누락 → 필터링됨
              { activity_id: "102", title: null, price: null },
            ],
          }),
        });
        const offers = await config.doFetch("test-key");
        return { mode: "ok", offers, cached: false };
      });

      const r = await fetchKlookOffers("다낭 투어");
      if (r.mode === "ok") {
        expect(r.offers).toHaveLength(1);
        expect(r.offers[0]).toMatchObject({
          id: "klook-101",
          ota: "klook",
          title: "다낭 시티 투어",
          rating: 4.5,
          reviewCount: 200,
        });
        // USD→KRW 가정 (1300 환율)
        expect(r.offers[0].priceKrw).toBe(39000);
        expect(r.offers[0].originalPriceKrw).toBe(65000);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════
  // KKday
  // ═══════════════════════════════════════════════════════════

  describe("kkday", () => {
    it("fetchOtaWithCache에 올바른 config 전달", async () => {
      await fetchKKdayOffers("호이안 쿠킹클래스");

      const config = mockFetchOtaWithCache.mock.calls[0][0];
      expect(config.prefix).toBe("kkday");
      expect(config.platform).toBe("ota.kkday");
      expect(config.apiErrorCode).toBe("kkday_api_error");
    });

    it("doFetch — API 응답 파싱 (KRW 직접)", async () => {
      mockFetchOtaWithCache.mockImplementation(async (config: { doFetch: (key: string) => Promise<unknown[]> }) => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            data: [
              {
                product_id: "201",
                product_name: "호이안 쿠킹클래스",
                price: { sale_price: 35000, original_price: 45000 },
                rating_avg: 4.8,
                rating_count: 150,
                product_url: "https://kkday.com/201",
              },
            ],
          }),
        });
        const offers = await config.doFetch("test-key");
        return { mode: "ok", offers, cached: false };
      });

      const r = await fetchKKdayOffers("호이안 쿠킹클래스");
      if (r.mode === "ok") {
        expect(r.offers).toHaveLength(1);
        expect(r.offers[0]).toMatchObject({
          id: "kkday-201",
          ota: "kkday",
          title: "호이안 쿠킹클래스",
          priceKrw: 35000,
          originalPriceKrw: 45000,
          rating: 4.8,
        });
      }
    });

    it("doFetch — location 포함 시 params 전달", async () => {
      mockFetchOtaWithCache.mockImplementation(async (config: { doFetch: (key: string) => Promise<unknown[]> }) => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ data: [] }),
        });
        await config.doFetch("test-key");
        return { mode: "ok", offers: [], cached: false };
      });

      await fetchKKdayOffers("test", { lat: 16.0, lng: 108.0 });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("latitude=16");
      expect(url).toContain("longitude=108");
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Agoda
  // ═══════════════════════════════════════════════════════════

  describe("agoda", () => {
    it("fetchOtaWithCache에 올바른 config 전달", async () => {
      await fetchAgodaOffers("나트랑 스노클링");

      const config = mockFetchOtaWithCache.mock.calls[0][0];
      expect(config.prefix).toBe("agoda");
      expect(config.platform).toBe("ota.agoda");
      expect(config.apiErrorCode).toBe("agoda_api_error");
    });

    it("doFetch — POST 방식 + 응답 파싱", async () => {
      mockFetchOtaWithCache.mockImplementation(async (config: { doFetch: (key: string) => Promise<unknown[]> }) => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            activities: [
              {
                id: "301",
                name: "나트랑 스노클링 투어",
                price: { current: 55000, was: 70000 },
                review: { score: 4.2, count: 80 },
                bookingUrl: "https://agoda.com/301",
              },
            ],
          }),
        });
        const offers = await config.doFetch("test-key");
        return { mode: "ok", offers, cached: false };
      });

      const r = await fetchAgodaOffers("나트랑 스노클링");
      if (r.mode === "ok") {
        expect(r.offers).toHaveLength(1);
        expect(r.offers[0]).toMatchObject({
          id: "agoda-301",
          ota: "agoda",
          title: "나트랑 스노클링 투어",
          priceKrw: 55000,
          originalPriceKrw: 70000,
          rating: 4.2,
          reviewCount: 80,
        });
      }
    });

    it("doFetch — Agoda는 POST 호출", async () => {
      mockFetchOtaWithCache.mockImplementation(async (config: { doFetch: (key: string) => Promise<unknown[]> }) => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ activities: [] }),
        });
        await config.doFetch("test-key");
        return { mode: "ok", offers: [], cached: false };
      });

      await fetchAgodaOffers("test", { lat: 16.0, lng: 108.0 });
      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.method).toBe("POST");
      const body = JSON.parse(opts.body as string);
      expect(body.currency).toBe("KRW");
      expect(body.location).toMatchObject({ latitude: 16.0, longitude: 108.0 });
    });
  });
});
