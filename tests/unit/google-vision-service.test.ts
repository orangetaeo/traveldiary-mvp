/**
 * lib/services/google-vision.ts 단위 테스트.
 *
 * ocrFromBase64Image + visionAvailable — env 분기, 캐시, 쿼터, fetch 응답 파싱.
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

// global fetch mock
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { ocrFromBase64Image, visionAvailable } from "@/lib/services/google-vision";

describe("google-vision service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEnvKey.mockReturnValue(null);
    mockGetCache.mockResolvedValue(null);
    mockSetCache.mockResolvedValue(undefined);
    mockCheckQuota.mockReturnValue(null);
  });

  // ─── visionAvailable ──────────────────────────────────────

  it("env 미설정 → visionAvailable=false", () => {
    expect(visionAvailable()).toBe(false);
  });

  it("env 설정 → visionAvailable=true", () => {
    mockGetEnvKey.mockReturnValue("test-key");
    expect(visionAvailable()).toBe(true);
  });

  // ─── demo 분기 ────────────────────────────────────────────

  it("API key 미설정 → demo", async () => {
    const result = await ocrFromBase64Image("base64data");
    expect(result).toEqual({ mode: "demo" });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // ─── 캐시 히트 (텍스트 존재) ──────────────────────────────

  it("캐시에 텍스트 있음 → ok + cached", async () => {
    mockGetEnvKey.mockReturnValue("test-key");
    mockGetCache.mockResolvedValue({ data: { text: "Phở bò" } });

    const result = await ocrFromBase64Image("img");
    expect(result).toMatchObject({ mode: "ok", text: "Phở bò", cached: true });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // ─── 캐시 히트 (텍스트 null) ──────────────────────────────

  it("캐시에 text=null → no_text + cached", async () => {
    mockGetEnvKey.mockReturnValue("test-key");
    mockGetCache.mockResolvedValue({ data: { text: null } });

    const result = await ocrFromBase64Image("img");
    expect(result).toMatchObject({ mode: "no_text", cached: true });
  });

  // ─── 쿼터 차단 ────────────────────────────────────────────

  it("쿼터 초과 → quota_exceeded 반환", async () => {
    mockGetEnvKey.mockReturnValue("test-key");
    mockCheckQuota.mockReturnValue({ mode: "error", code: "quota_exceeded" });

    const result = await ocrFromBase64Image("img");
    expect(result).toEqual({ mode: "error", code: "quota_exceeded" });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // ─── fetch 성공 → 텍스트 추출 ─────────────────────────────

  it("API 응답 OK + 텍스트 → ok + cached=false", async () => {
    mockGetEnvKey.mockReturnValue("test-key");
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        responses: [{
          textAnnotations: [{ description: "Cơm tấm sườn" }],
        }],
      }),
    });

    const result = await ocrFromBase64Image("img");
    expect(result).toMatchObject({
      mode: "ok",
      text: "Cơm tấm sườn",
      cached: false,
    });
    expect(mockRecordCall).toHaveBeenCalledWith("google-vision");
    expect(mockSetCache).toHaveBeenCalledOnce();
  });

  // ─── fetch 성공 → 텍스트 없음 ─────────────────────────────

  it("API 응답 OK + textAnnotations 비어 → no_text", async () => {
    mockGetEnvKey.mockReturnValue("test-key");
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ responses: [{ textAnnotations: [] }] }),
    });

    const result = await ocrFromBase64Image("img");
    expect(result).toMatchObject({ mode: "no_text", cached: false });
    expect(mockSetCache).toHaveBeenCalledOnce();
  });

  // ─── API 에러 응답 ─────────────────────────────────────────

  it("API HTTP 에러 → vision_api_error", async () => {
    mockGetEnvKey.mockReturnValue("test-key");
    mockFetch.mockResolvedValue({ ok: false, status: 403 });

    const result = await ocrFromBase64Image("img");
    expect(result).toEqual({
      mode: "error",
      code: "vision_api_error",
      message: "HTTP 403",
    });
  });

  // ─── API 내부 에러 메시지 ──────────────────────────────────

  it("API 응답 내 error → vision_api_error + message", async () => {
    mockGetEnvKey.mockReturnValue("test-key");
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        responses: [{ error: { message: "BILLING_DISABLED" } }],
      }),
    });

    const result = await ocrFromBase64Image("img");
    expect(result).toEqual({
      mode: "error",
      code: "vision_api_error",
      message: "BILLING_DISABLED",
    });
  });

  // ─── 네트워크 에러 ─────────────────────────────────────────

  it("fetch throw → network 에러", async () => {
    mockGetEnvKey.mockReturnValue("test-key");
    mockFetch.mockRejectedValue(new Error("fetch failed"));

    const result = await ocrFromBase64Image("img");
    expect(result).toEqual({
      mode: "error",
      code: "network",
      message: "fetch failed",
    });
  });
});
