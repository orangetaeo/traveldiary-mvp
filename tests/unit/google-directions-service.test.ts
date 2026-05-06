/**
 * lib/services/google-directions.ts 단위 테스트.
 *
 * fetchDirections + googleDirectionsAvailable — env 분기, 캐시, 쿼터, fetch 응답 파싱.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── 의존성 mock ──────────────────────────────────────────────
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

vi.mock("@/lib/services/distance-rules", () => ({}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import {
  fetchDirections,
  googleDirectionsAvailable,
} from "@/lib/services/google-directions";

const INPUT = {
  origin: { lat: 10.045, lng: 105.767 },
  destination: { lat: 10.048, lng: 105.770 },
  mode: "driving" as const,
};

describe("google-directions service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEnvKey.mockReturnValue(null);
    mockGetCache.mockResolvedValue(null);
    mockSetCache.mockResolvedValue(undefined);
    mockCheckQuota.mockReturnValue(null);
  });

  // ─── available ─────────────────────────────────────────────

  it("env 미설정 → false", () => {
    expect(googleDirectionsAvailable()).toBe(false);
  });

  it("env 설정 → true", () => {
    mockGetEnvKey.mockReturnValue("key");
    expect(googleDirectionsAvailable()).toBe(true);
  });

  // ─── demo ──────────────────────────────────────────────────

  it("API key 미설정 → demo", async () => {
    const result = await fetchDirections(INPUT);
    expect(result).toEqual({ mode: "demo" });
  });

  // ─── 캐시 히트 (found) ────────────────────────────────────

  it("캐시 duration/distance 있음 → found + cached", async () => {
    mockGetEnvKey.mockReturnValue("key");
    mockGetCache.mockResolvedValue({
      data: { durationSeconds: 600, distanceMeters: 3200 },
    });

    const result = await fetchDirections(INPUT);
    expect(result).toMatchObject({
      mode: "found",
      durationSeconds: 600,
      distanceMeters: 3200,
      cached: true,
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // ─── 캐시 히트 (not_found) ────────────────────────────────

  it("캐시 null/null → not_found + cached", async () => {
    mockGetEnvKey.mockReturnValue("key");
    mockGetCache.mockResolvedValue({
      data: { durationSeconds: null, distanceMeters: null },
    });

    const result = await fetchDirections(INPUT);
    expect(result).toMatchObject({ mode: "not_found", cached: true });
  });

  // ─── 쿼터 차단 ────────────────────────────────────────────

  it("쿼터 초과 → 그대로 반환", async () => {
    mockGetEnvKey.mockReturnValue("key");
    mockCheckQuota.mockReturnValue({ mode: "error", code: "quota_exceeded" });

    const result = await fetchDirections(INPUT);
    expect(result).toEqual({ mode: "error", code: "quota_exceeded" });
  });

  // ─── fetch OK → found ─────────────────────────────────────

  it("API OK + route → found + cached=false", async () => {
    mockGetEnvKey.mockReturnValue("key");
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "OK",
        routes: [{
          legs: [{
            duration: { value: 900 },
            distance: { value: 5000 },
          }],
        }],
      }),
    });

    const result = await fetchDirections(INPUT);
    expect(result).toMatchObject({
      mode: "found",
      durationSeconds: 900,
      distanceMeters: 5000,
      cached: false,
    });
    expect(mockRecordCall).toHaveBeenCalledWith("google-directions");
    expect(mockSetCache).toHaveBeenCalledOnce();
  });

  // ─── ZERO_RESULTS ─────────────────────────────────────────

  it("API ZERO_RESULTS → not_found", async () => {
    mockGetEnvKey.mockReturnValue("key");
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ZERO_RESULTS" }),
    });

    const result = await fetchDirections(INPUT);
    expect(result).toMatchObject({ mode: "not_found", cached: false });
    expect(mockSetCache).toHaveBeenCalledOnce();
  });

  // ─── NOT_FOUND ─────────────────────────────────────────────

  it("API NOT_FOUND → not_found", async () => {
    mockGetEnvKey.mockReturnValue("key");
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "NOT_FOUND" }),
    });

    const result = await fetchDirections(INPUT);
    expect(result).toMatchObject({ mode: "not_found", cached: false });
  });

  // ─── API 에러 상태 ─────────────────────────────────────────

  it("API REQUEST_DENIED → google_api_error", async () => {
    mockGetEnvKey.mockReturnValue("key");
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "REQUEST_DENIED",
        error_message: "API key invalid",
      }),
    });

    const result = await fetchDirections(INPUT);
    expect(result).toEqual({
      mode: "error",
      code: "google_api_error",
      message: "API key invalid",
    });
  });

  // ─── HTTP 에러 ─────────────────────────────────────────────

  it("HTTP 500 → google_api_error", async () => {
    mockGetEnvKey.mockReturnValue("key");
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const result = await fetchDirections(INPUT);
    expect(result).toEqual({
      mode: "error",
      code: "google_api_error",
      message: "HTTP 500",
    });
  });

  // ─── 네트워크 에러 ─────────────────────────────────────────

  it("fetch throw → network", async () => {
    mockGetEnvKey.mockReturnValue("key");
    mockFetch.mockRejectedValue(new Error("timeout"));

    const result = await fetchDirections(INPUT);
    expect(result).toEqual({
      mode: "error",
      code: "network",
      message: "timeout",
    });
  });

  // ─── OK 상태지만 leg 누락 → not_found ──────────────────────

  it("OK + routes 빈 배열 → not_found", async () => {
    mockGetEnvKey.mockReturnValue("key");
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "OK", routes: [{ legs: [] }] }),
    });

    const result = await fetchDirections(INPUT);
    expect(result).toMatchObject({ mode: "not_found", cached: false });
  });
});
