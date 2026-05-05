/**
 * OTA fetch 공통 래퍼 — fetchOtaWithCache + normalizeMatchTag + OtaHttpError 단위 테스트.
 *
 * 커버리지: demo / 캐시 히트 / quota 차단 / 정상 fetch / OtaHttpError / 네트워크 에러 /
 *           location 포함 캐시 키 / setEvidenceCache TTL / normalizeMatchTag 5건.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

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

import { fetchOtaWithCache, normalizeMatchTag, OtaHttpError } from "@/lib/services/ota/fetch-ota";
import type { OtaFetchConfig } from "@/lib/services/ota/fetch-ota";
import type { OtaOffer } from "@/lib/types";

function makeConfig(overrides?: Partial<OtaFetchConfig>): OtaFetchConfig {
  return {
    prefix: "test",
    platform: "ota.test",
    apiKey: "test-key",
    query: "다낭 투어",
    doFetch: vi.fn().mockResolvedValue([]),
    apiErrorCode: "test_api_error",
    ...overrides,
  };
}

const sampleOffers: OtaOffer[] = [
  {
    platform: "test",
    title: "다낭 반나절 투어",
    price: 45000,
    currency: "KRW",
    url: "https://example.com/tour",
    matchTag: "tour:danang",
  },
];

describe("ota/fetch-ota — fetchOtaWithCache", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockGetEvidenceCache.mockResolvedValue(null);
    mockSetEvidenceCache.mockResolvedValue(undefined);
    mockCheckQuotaOrBlock.mockReturnValue(null);
  });

  it("apiKey null → demo", async () => {
    const result = await fetchOtaWithCache(makeConfig({ apiKey: null }));
    expect(result.mode).toBe("demo");
    expect(mockGetEvidenceCache).not.toHaveBeenCalled();
  });

  it("캐시 히트 → ok + cached: true", async () => {
    mockGetEvidenceCache.mockResolvedValue({ data: { offers: sampleOffers } });
    const result = await fetchOtaWithCache(makeConfig());
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.offers).toEqual(sampleOffers);
      expect(result.cached).toBe(true);
    }
    expect(mockCheckQuotaOrBlock).not.toHaveBeenCalled();
  });

  it("quota 차단 → error + quota_exceeded", async () => {
    mockCheckQuotaOrBlock.mockReturnValue({ mode: "error", code: "quota_exceeded", message: "cap=1000" });
    const result = await fetchOtaWithCache(makeConfig());
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.code).toBe("quota_exceeded");
    }
  });

  it("정상 fetch → ok + cached: false + recordExternalCall", async () => {
    const doFetch = vi.fn().mockResolvedValue(sampleOffers);
    const result = await fetchOtaWithCache(makeConfig({ doFetch }));
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.offers).toEqual(sampleOffers);
      expect(result.cached).toBe(false);
    }
    expect(doFetch).toHaveBeenCalledWith("test-key");
    expect(mockRecordExternalCall).toHaveBeenCalledWith("ota");
  });

  it("정상 fetch → setEvidenceCache 호출 (TTL 6시간)", async () => {
    const doFetch = vi.fn().mockResolvedValue(sampleOffers);
    await fetchOtaWithCache(makeConfig({ doFetch }));
    expect(mockSetEvidenceCache).toHaveBeenCalledWith(
      expect.objectContaining({
        platform: "ota.test",
        data: { offers: sampleOffers },
        ttlMs: 6 * 60 * 60 * 1000,
      }),
    );
  });

  it("OtaHttpError → error + apiErrorCode + recordExternalCall", async () => {
    const doFetch = vi.fn().mockRejectedValue(new OtaHttpError(403));
    const result = await fetchOtaWithCache(makeConfig({ doFetch, apiErrorCode: "agoda_api_error" }));
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.code).toBe("agoda_api_error");
      expect(result.message).toContain("403");
    }
    expect(mockRecordExternalCall).toHaveBeenCalledWith("ota");
  });

  it("네트워크 에러 → error + 'network' (recordExternalCall 미호출)", async () => {
    const doFetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    const result = await fetchOtaWithCache(makeConfig({ doFetch }));
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.code).toBe("network");
      expect(result.message).toBe("ECONNREFUSED");
    }
    expect(mockRecordExternalCall).not.toHaveBeenCalled();
  });

  it("location 포함 시 캐시 키에 좌표 반영", async () => {
    const doFetch = vi.fn().mockResolvedValue([]);
    await fetchOtaWithCache(makeConfig({ doFetch, location: { lat: 16.05, lng: 108.24 } }));
    // getEvidenceCache 호출 시 캐시 키에 좌표 포함 확인
    const cacheCallKey = mockGetEvidenceCache.mock.calls[0][0] as string;
    expect(cacheCallKey).toBeTruthy();
    // 같은 query but 다른 location → 다른 캐시 키
    mockGetEvidenceCache.mockClear();
    await fetchOtaWithCache(makeConfig({ doFetch, location: { lat: 10.82, lng: 106.63 } }));
    const cacheCallKey2 = mockGetEvidenceCache.mock.calls[0][0] as string;
    expect(cacheCallKey2).not.toBe(cacheCallKey);
  });

  it("location 없으면 빈 좌표로 캐시 키 생성", async () => {
    const doFetch = vi.fn().mockResolvedValue([]);
    await fetchOtaWithCache(makeConfig({ doFetch }));
    expect(mockGetEvidenceCache).toHaveBeenCalledWith(expect.any(String), "ota.test");
  });

  it("빈 offers 배열도 정상 처리", async () => {
    const doFetch = vi.fn().mockResolvedValue([]);
    const result = await fetchOtaWithCache(makeConfig({ doFetch }));
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.offers).toEqual([]);
      expect(result.cached).toBe(false);
    }
  });
});

describe("normalizeMatchTag", () => {
  it("소문자 변환 + 공백→하이픈", () => {
    expect(normalizeMatchTag("Da Nang Tour")).toBe("da-nang-tour");
  });

  it("연속 공백 → 단일 하이픈", () => {
    expect(normalizeMatchTag("foo   bar")).toBe("foo-bar");
  });

  it("40자 초과 잘림", () => {
    const long = "a".repeat(50);
    expect(normalizeMatchTag(long)).toHaveLength(40);
  });

  it("빈 문자열 → 빈 문자열", () => {
    expect(normalizeMatchTag("")).toBe("");
  });

  it("한국어 키워드 보존", () => {
    expect(normalizeMatchTag("다낭 바나힐")).toBe("다낭-바나힐");
  });
});

describe("OtaHttpError", () => {
  it("name = 'OtaHttpError'", () => {
    const err = new OtaHttpError(500);
    expect(err.name).toBe("OtaHttpError");
    expect(err.message).toBe("HTTP 500");
    expect(err).toBeInstanceOf(Error);
  });
});
