/**
 * Google Places API — findPlaceFromText + getPlaceDetails 직접 단위 테스트.
 *
 * 커버리지: demo / 캐시 히트 / quota / HTTP 에러 / 정상 / ZERO_RESULTS / 네트워크 에러.
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

const mockRecordExternalCall = vi.fn();
const mockCheckQuotaOrBlock = vi.fn().mockReturnValue(null);
vi.mock("@/lib/usage-quota", () => ({
  recordExternalCall: (...args: unknown[]) => mockRecordExternalCall(...args),
  checkQuotaOrBlock: (...args: unknown[]) => mockCheckQuotaOrBlock(...args),
}));

/* ════════════════════════════════════════════
 * findPlaceFromText
 * ════════════════════════════════════════════ */

describe("services — findPlaceFromText", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...ORIGINAL_ENV };
    // @ts-expect-error mock fetch
    globalThis.fetch = vi.fn();
    mockGetEvidenceCache.mockResolvedValue(null);
    mockSetEvidenceCache.mockResolvedValue(undefined);
    mockCheckQuotaOrBlock.mockReturnValue(null);
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("googlePlacesAvailable — 키 없으면 false", async () => {
    delete process.env.GOOGLE_PLACES_API_KEY;
    const { googlePlacesAvailable } = await import("@/lib/services/google-places");
    expect(googlePlacesAvailable()).toBe(false);
  });

  it("googlePlacesAvailable — 키 있으면 true", async () => {
    process.env.GOOGLE_PLACES_API_KEY = "key123";
    const { googlePlacesAvailable } = await import("@/lib/services/google-places");
    expect(googlePlacesAvailable()).toBe(true);
  });

  it("키 없으면 → demo", async () => {
    delete process.env.GOOGLE_PLACES_API_KEY;
    const { findPlaceFromText } = await import("@/lib/services/google-places");
    const result = await findPlaceFromText("다낭 맛집");
    expect(result.mode).toBe("demo");
  });

  it("캐시 히트 (found) → found + cached: true", async () => {
    process.env.GOOGLE_PLACES_API_KEY = "key123";
    mockGetEvidenceCache.mockResolvedValue({ data: { placeId: "ChIJ123" } });
    const { findPlaceFromText } = await import("@/lib/services/google-places");
    const result = await findPlaceFromText("다낭 맛집");
    expect(result.mode).toBe("found");
    if (result.mode === "found") {
      expect(result.placeId).toBe("ChIJ123");
      expect(result.cached).toBe(true);
    }
  });

  it("캐시 히트 (not_found) → not_found + cached: true", async () => {
    process.env.GOOGLE_PLACES_API_KEY = "key123";
    mockGetEvidenceCache.mockResolvedValue({ data: { placeId: null } });
    const { findPlaceFromText } = await import("@/lib/services/google-places");
    const result = await findPlaceFromText("없는장소");
    expect(result.mode).toBe("not_found");
    if (result.mode === "not_found") expect(result.cached).toBe(true);
  });

  it("QuotaExceeded → error + 'quota_exceeded'", async () => {
    process.env.GOOGLE_PLACES_API_KEY = "key123";
    mockCheckQuotaOrBlock.mockReturnValue({ mode: "error", code: "quota_exceeded", message: "cap=5000" });
    const { findPlaceFromText } = await import("@/lib/services/google-places");
    const result = await findPlaceFromText("다낭 맛집");
    expect(result.mode).toBe("error");
    if (result.mode === "error") expect(result.code).toBe("quota_exceeded");
  });

  it("HTTP 에러 → error + 'google_api_error'", async () => {
    process.env.GOOGLE_PLACES_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 403 });
    const { findPlaceFromText } = await import("@/lib/services/google-places");
    const result = await findPlaceFromText("다낭 맛집");
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.code).toBe("google_api_error");
      expect(result.message).toContain("403");
    }
  });

  it("정상 응답 OK → found + cached: false", async () => {
    process.env.GOOGLE_PLACES_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "OK",
        candidates: [{ place_id: "ChIJ456" }],
      }),
    });
    const { findPlaceFromText } = await import("@/lib/services/google-places");
    const result = await findPlaceFromText("다낭 맛집");
    expect(result.mode).toBe("found");
    if (result.mode === "found") {
      expect(result.placeId).toBe("ChIJ456");
      expect(result.cached).toBe(false);
    }
    expect(mockSetEvidenceCache).toHaveBeenCalled();
  });

  it("ZERO_RESULTS → not_found + cached: false", async () => {
    process.env.GOOGLE_PLACES_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ZERO_RESULTS" }),
    });
    const { findPlaceFromText } = await import("@/lib/services/google-places");
    const result = await findPlaceFromText("없는장소");
    expect(result.mode).toBe("not_found");
    if (result.mode === "not_found") expect(result.cached).toBe(false);
    expect(mockSetEvidenceCache).toHaveBeenCalled();
  });

  it("API 에러 status → error + error_message", async () => {
    process.env.GOOGLE_PLACES_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ status: "REQUEST_DENIED", error_message: "Invalid key" }),
    });
    const { findPlaceFromText } = await import("@/lib/services/google-places");
    const result = await findPlaceFromText("다낭 맛집");
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.code).toBe("google_api_error");
      expect(result.message).toBe("Invalid key");
    }
  });

  it("네트워크 에러 → error + 'network'", async () => {
    process.env.GOOGLE_PLACES_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("ECONNREFUSED"));
    const { findPlaceFromText } = await import("@/lib/services/google-places");
    const result = await findPlaceFromText("다낭 맛집");
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.code).toBe("network");
      expect(result.message).toBe("ECONNREFUSED");
    }
  });

  it("location 파라미터 전달 시 locationbias 포함", async () => {
    process.env.GOOGLE_PLACES_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ status: "OK", candidates: [{ place_id: "ChIJ789" }] }),
    });
    const { findPlaceFromText } = await import("@/lib/services/google-places");
    await findPlaceFromText("다낭 맛집", { lat: 16.05, lng: 108.24 });
    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain("locationbias");
    expect(calledUrl).toContain("16.05");
  });

  it("recordExternalCall 호출됨", async () => {
    process.env.GOOGLE_PLACES_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ status: "OK", candidates: [{ place_id: "ChIJ000" }] }),
    });
    const { findPlaceFromText } = await import("@/lib/services/google-places");
    await findPlaceFromText("다낭 맛집");
    expect(mockRecordExternalCall).toHaveBeenCalledWith("google-places");
  });
});

/* ════════════════════════════════════════════
 * getPlaceDetails
 * ════════════════════════════════════════════ */

describe("services — getPlaceDetails", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...ORIGINAL_ENV };
    // @ts-expect-error mock fetch
    globalThis.fetch = vi.fn();
    mockGetEvidenceCache.mockResolvedValue(null);
    mockSetEvidenceCache.mockResolvedValue(undefined);
    mockCheckQuotaOrBlock.mockReturnValue(null);
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("키 없으면 → demo", async () => {
    delete process.env.GOOGLE_PLACES_API_KEY;
    const { getPlaceDetails } = await import("@/lib/services/google-places");
    const result = await getPlaceDetails("ChIJ123");
    expect(result.mode).toBe("demo");
  });

  it("캐시 히트 (found) → found + cached: true", async () => {
    process.env.GOOGLE_PLACES_API_KEY = "key123";
    const details = { placeId: "ChIJ123", name: "다낭 맛집", formattedAddress: "Da Nang" };
    mockGetEvidenceCache.mockResolvedValue({ data: details });
    const { getPlaceDetails } = await import("@/lib/services/google-places");
    const result = await getPlaceDetails("ChIJ123");
    expect(result.mode).toBe("found");
    if (result.mode === "found") {
      expect(result.details.name).toBe("다낭 맛집");
      expect(result.cached).toBe(true);
    }
  });

  it("캐시 히트 (not_found) → not_found + cached: true", async () => {
    process.env.GOOGLE_PLACES_API_KEY = "key123";
    mockGetEvidenceCache.mockResolvedValue({ data: null });
    const { getPlaceDetails } = await import("@/lib/services/google-places");
    const result = await getPlaceDetails("ChIJ000");
    expect(result.mode).toBe("not_found");
    if (result.mode === "not_found") expect(result.cached).toBe(true);
  });

  it("QuotaExceeded → error + 'quota_exceeded'", async () => {
    process.env.GOOGLE_PLACES_API_KEY = "key123";
    mockCheckQuotaOrBlock.mockReturnValue({ mode: "error", code: "quota_exceeded", message: "cap=5000" });
    const { getPlaceDetails } = await import("@/lib/services/google-places");
    const result = await getPlaceDetails("ChIJ123");
    expect(result.mode).toBe("error");
    if (result.mode === "error") expect(result.code).toBe("quota_exceeded");
  });

  it("HTTP 에러 → error + 'google_api_error'", async () => {
    process.env.GOOGLE_PLACES_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 500 });
    const { getPlaceDetails } = await import("@/lib/services/google-places");
    const result = await getPlaceDetails("ChIJ123");
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.code).toBe("google_api_error");
      expect(result.message).toContain("500");
    }
  });

  it("정상 응답 OK → found + details 매핑", async () => {
    process.env.GOOGLE_PLACES_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "OK",
        result: {
          place_id: "ChIJ123",
          name: "Pho 36",
          formatted_address: "123 Tran Phu, Da Nang",
          business_status: "OPERATIONAL",
          opening_hours: { open_now: true },
          rating: 4.5,
          user_ratings_total: 200,
          types: ["restaurant", "food"],
        },
      }),
    });
    const { getPlaceDetails } = await import("@/lib/services/google-places");
    const result = await getPlaceDetails("ChIJ123");
    expect(result.mode).toBe("found");
    if (result.mode === "found") {
      expect(result.details.placeId).toBe("ChIJ123");
      expect(result.details.name).toBe("Pho 36");
      expect(result.details.businessStatus).toBe("OPERATIONAL");
      expect(result.details.openNow).toBe(true);
      expect(result.details.rating).toBe(4.5);
      expect(result.details.userRatingsTotal).toBe(200);
      expect(result.details.types).toContain("restaurant");
      expect(result.cached).toBe(false);
    }
    expect(mockSetEvidenceCache).toHaveBeenCalled();
  });

  it("NOT_FOUND → not_found + cached: false", async () => {
    process.env.GOOGLE_PLACES_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ status: "NOT_FOUND" }),
    });
    const { getPlaceDetails } = await import("@/lib/services/google-places");
    const result = await getPlaceDetails("ChIJBad");
    expect(result.mode).toBe("not_found");
    if (result.mode === "not_found") expect(result.cached).toBe(false);
    expect(mockSetEvidenceCache).toHaveBeenCalled();
  });

  it("ZERO_RESULTS → not_found + cached: false", async () => {
    process.env.GOOGLE_PLACES_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ZERO_RESULTS" }),
    });
    const { getPlaceDetails } = await import("@/lib/services/google-places");
    const result = await getPlaceDetails("ChIJZero");
    expect(result.mode).toBe("not_found");
    if (result.mode === "not_found") expect(result.cached).toBe(false);
  });

  it("네트워크 에러 → error + 'network'", async () => {
    process.env.GOOGLE_PLACES_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("timeout"));
    const { getPlaceDetails } = await import("@/lib/services/google-places");
    const result = await getPlaceDetails("ChIJ123");
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.code).toBe("network");
      expect(result.message).toBe("timeout");
    }
  });

  it("recordExternalCall 호출됨", async () => {
    process.env.GOOGLE_PLACES_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "OK",
        result: { place_id: "ChIJ123", name: "Test" },
      }),
    });
    const { getPlaceDetails } = await import("@/lib/services/google-places");
    await getPlaceDetails("ChIJ123");
    expect(mockRecordExternalCall).toHaveBeenCalledWith("google-places");
  });
});
