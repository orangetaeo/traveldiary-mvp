/**
 * lib/services/google-places.ts 단위 테스트.
 *
 * findPlaceFromText + getPlaceDetails + googlePlacesAvailable.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetCache = vi.fn();
const mockSetCache = vi.fn();
vi.mock("@/lib/repositories/evidence-cache.repository", () => ({
  getEvidenceCache: (...args: unknown[]) => mockGetCache(...args),
  setEvidenceCache: (...args: unknown[]) => mockSetCache(...args),
}));

const mockCheckQuota = vi.fn();
const mockRecordCall = vi.fn();
vi.mock("@/lib/usage-quota", () => ({
  checkQuotaOrBlock: (...args: unknown[]) => mockCheckQuota(...args),
  recordExternalCall: (...args: unknown[]) => mockRecordCall(...args),
}));

const mockGetEnvKey = vi.fn();
vi.mock("@/lib/utils/env", () => ({
  getEnvKey: (...args: unknown[]) => mockGetEnvKey(...args),
}));

vi.mock("@/lib/utils/cache-key", () => ({
  hashCacheKey: (s: string) => `hash-${s.slice(0, 8)}`,
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import {
  findPlaceFromText,
  getPlaceDetails,
  googlePlacesAvailable,
} from "@/lib/services/google-places";

describe("google-places service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEnvKey.mockReturnValue(null);
    mockGetCache.mockResolvedValue(null);
    mockSetCache.mockResolvedValue(undefined);
    mockCheckQuota.mockReturnValue(null);
  });

  // ─── available ─────────────────────────────────────────────

  it("env 미설정 → false", () => {
    expect(googlePlacesAvailable()).toBe(false);
  });

  it("env 설정 → true", () => {
    mockGetEnvKey.mockReturnValue("key");
    expect(googlePlacesAvailable()).toBe(true);
  });

  // ═══════════════════════════════════════════════════════════
  // findPlaceFromText
  // ═══════════════════════════════════════════════════════════

  describe("findPlaceFromText", () => {
    it("API key 미설정 → demo", async () => {
      const r = await findPlaceFromText("Phở 2000");
      expect(r).toEqual({ mode: "demo" });
    });

    it("캐시 히트 placeId → found + cached", async () => {
      mockGetEnvKey.mockReturnValue("key");
      mockGetCache.mockResolvedValue({ data: { placeId: "place-123" } });

      const r = await findPlaceFromText("test");
      expect(r).toMatchObject({ mode: "found", placeId: "place-123", cached: true });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("캐시 히트 placeId=null → not_found + cached", async () => {
      mockGetEnvKey.mockReturnValue("key");
      mockGetCache.mockResolvedValue({ data: { placeId: null } });

      const r = await findPlaceFromText("test");
      expect(r).toMatchObject({ mode: "not_found", cached: true });
    });

    it("쿼터 초과 → quota_exceeded", async () => {
      mockGetEnvKey.mockReturnValue("key");
      mockCheckQuota.mockReturnValue({ mode: "error", code: "quota_exceeded" });

      const r = await findPlaceFromText("test");
      expect(r).toEqual({ mode: "error", code: "quota_exceeded" });
    });

    it("API OK + candidate → found", async () => {
      mockGetEnvKey.mockReturnValue("key");
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          status: "OK",
          candidates: [{ place_id: "ChIJ-abc" }],
        }),
      });

      const r = await findPlaceFromText("Phở 2000");
      expect(r).toMatchObject({ mode: "found", placeId: "ChIJ-abc", cached: false });
      expect(mockRecordCall).toHaveBeenCalledWith("google-places");
      expect(mockSetCache).toHaveBeenCalledOnce();
    });

    it("API ZERO_RESULTS → not_found + 캐시 저장", async () => {
      mockGetEnvKey.mockReturnValue("key");
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: "ZERO_RESULTS" }),
      });

      const r = await findPlaceFromText("없는장소");
      expect(r).toMatchObject({ mode: "not_found", cached: false });
      expect(mockSetCache).toHaveBeenCalledOnce();
    });

    it("HTTP 에러 → google_api_error", async () => {
      mockGetEnvKey.mockReturnValue("key");
      mockFetch.mockResolvedValue({ ok: false, status: 400 });

      const r = await findPlaceFromText("test");
      expect(r).toEqual({ mode: "error", code: "google_api_error", message: "HTTP 400" });
    });

    it("네트워크 에러 → network", async () => {
      mockGetEnvKey.mockReturnValue("key");
      mockFetch.mockRejectedValue(new Error("DNS fail"));

      const r = await findPlaceFromText("test");
      expect(r).toEqual({ mode: "error", code: "network", message: "DNS fail" });
    });

    it("location bias 포함 시 fetch 호출", async () => {
      mockGetEnvKey.mockReturnValue("key");
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          status: "OK",
          candidates: [{ place_id: "ChIJ-xyz" }],
        }),
      });

      await findPlaceFromText("Bánh mì", { lat: 10.0, lng: 105.0 });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("locationbias");
    });
  });

  // ═══════════════════════════════════════════════════════════
  // getPlaceDetails
  // ═══════════════════════════════════════════════════════════

  describe("getPlaceDetails", () => {
    it("API key 미설정 → demo", async () => {
      const r = await getPlaceDetails("place-123");
      expect(r).toEqual({ mode: "demo" });
    });

    it("캐시 히트 details → found + cached", async () => {
      mockGetEnvKey.mockReturnValue("key");
      const details = { placeId: "p1", name: "Phở", formattedAddress: "addr" };
      mockGetCache.mockResolvedValue({ data: details });

      const r = await getPlaceDetails("p1");
      expect(r).toMatchObject({ mode: "found", details, cached: true });
    });

    it("캐시 히트 null → not_found + cached", async () => {
      mockGetEnvKey.mockReturnValue("key");
      mockGetCache.mockResolvedValue({ data: null });

      const r = await getPlaceDetails("p1");
      expect(r).toMatchObject({ mode: "not_found", cached: true });
    });

    it("API OK + result → found + details 매핑", async () => {
      mockGetEnvKey.mockReturnValue("key");
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          status: "OK",
          result: {
            place_id: "ChIJ-abc",
            name: "Phở 2000",
            formatted_address: "123 Street",
            business_status: "OPERATIONAL",
            opening_hours: { open_now: true },
            rating: 4.5,
            user_ratings_total: 200,
            types: ["restaurant"],
          },
        }),
      });

      const r = await getPlaceDetails("ChIJ-abc");
      expect(r).toMatchObject({
        mode: "found",
        cached: false,
        details: {
          placeId: "ChIJ-abc",
          name: "Phở 2000",
          formattedAddress: "123 Street",
          businessStatus: "OPERATIONAL",
          openNow: true,
          rating: 4.5,
          userRatingsTotal: 200,
          types: ["restaurant"],
        },
      });
    });

    it("API NOT_FOUND → not_found + 캐시 저장", async () => {
      mockGetEnvKey.mockReturnValue("key");
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: "NOT_FOUND" }),
      });

      const r = await getPlaceDetails("bad-id");
      expect(r).toMatchObject({ mode: "not_found", cached: false });
      expect(mockSetCache).toHaveBeenCalledOnce();
    });

    it("HTTP 에러 → google_api_error", async () => {
      mockGetEnvKey.mockReturnValue("key");
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      const r = await getPlaceDetails("p1");
      expect(r).toEqual({ mode: "error", code: "google_api_error", message: "HTTP 500" });
    });

    it("네트워크 에러 → network", async () => {
      mockGetEnvKey.mockReturnValue("key");
      mockFetch.mockRejectedValue(new Error("connection reset"));

      const r = await getPlaceDetails("p1");
      expect(r).toEqual({ mode: "error", code: "network", message: "connection reset" });
    });
  });
});
