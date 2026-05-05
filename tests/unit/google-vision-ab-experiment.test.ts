/**
 * Google Vision OCR + A/B Experiment 테스트 — Batch 26.
 *
 * 2 모듈:
 *  - lib/services/google-vision.ts: ocrFromBase64Image, visionAvailable
 *  - lib/ab/experiment.ts: getVariant, trackAbEvent, EXPERIMENTS
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

/* ────────── google-vision mocks ────────── */

const mockGetEvidenceCache = vi.fn();
const mockSetEvidenceCache = vi.fn();
vi.mock("@/lib/repositories/evidence-cache.repository", () => ({
  getEvidenceCache: (...args: unknown[]) => mockGetEvidenceCache(...args),
  setEvidenceCache: (...args: unknown[]) => mockSetEvidenceCache(...args),
}));

const mockAssertQuota = vi.fn();
const mockRecordExternalCall = vi.fn();
class TestQuotaExceededError extends Error { name = "QuotaExceededError"; cap = 5; resetAt = Date.now() + 3600000; }
vi.mock("@/lib/usage-quota", () => ({
  assertQuota: (...args: unknown[]) => mockAssertQuota(...args),
  recordExternalCall: (...args: unknown[]) => mockRecordExternalCall(...args),
  QuotaExceededError: TestQuotaExceededError,
}));

/* ════════════════════════════════════════════
 * Google Vision — ocrFromBase64Image
 * ════════════════════════════════════════════ */

describe("services — ocrFromBase64Image", () => {
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

  it("visionAvailable — 키 없으면 false", async () => {
    delete process.env.GOOGLE_VISION_API_KEY;
    const { visionAvailable } = await import("@/lib/services/google-vision");
    expect(visionAvailable()).toBe(false);
  });

  it("visionAvailable — 키 있으면 true", async () => {
    process.env.GOOGLE_VISION_API_KEY = "key123";
    const { visionAvailable } = await import("@/lib/services/google-vision");
    expect(visionAvailable()).toBe(true);
  });

  it("키 없으면 → demo", async () => {
    delete process.env.GOOGLE_VISION_API_KEY;
    const { ocrFromBase64Image } = await import("@/lib/services/google-vision");
    const result = await ocrFromBase64Image("base64data");
    expect(result.mode).toBe("demo");
  });

  it("캐시 히트 (text 있음) → ok + cached: true", async () => {
    process.env.GOOGLE_VISION_API_KEY = "key123";
    mockGetEvidenceCache.mockResolvedValue({ data: { text: "Phở bò 80.000đ" } });
    const { ocrFromBase64Image } = await import("@/lib/services/google-vision");
    const result = await ocrFromBase64Image("img");
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.text).toBe("Phở bò 80.000đ");
      expect(result.cached).toBe(true);
    }
  });

  it("캐시 히트 (text null) → no_text + cached: true", async () => {
    process.env.GOOGLE_VISION_API_KEY = "key123";
    mockGetEvidenceCache.mockResolvedValue({ data: { text: null } });
    const { ocrFromBase64Image } = await import("@/lib/services/google-vision");
    const result = await ocrFromBase64Image("img");
    expect(result.mode).toBe("no_text");
    if (result.mode === "no_text") expect(result.cached).toBe(true);
  });

  it("QuotaExceeded → error + 'quota_exceeded'", async () => {
    process.env.GOOGLE_VISION_API_KEY = "key123";
    mockAssertQuota.mockImplementation(() => { throw new TestQuotaExceededError(); });
    const { ocrFromBase64Image } = await import("@/lib/services/google-vision");
    const result = await ocrFromBase64Image("img");
    expect(result.mode).toBe("error");
    if (result.mode === "error") expect(result.code).toBe("quota_exceeded");
  });

  it("HTTP 에러 → error + 'vision_api_error'", async () => {
    process.env.GOOGLE_VISION_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 403 });
    const { ocrFromBase64Image } = await import("@/lib/services/google-vision");
    const result = await ocrFromBase64Image("img");
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.code).toBe("vision_api_error");
      expect(result.message).toContain("403");
    }
  });

  it("API 응답 error 필드 → error", async () => {
    process.env.GOOGLE_VISION_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ responses: [{ error: { message: "INVALID_IMAGE" } }] }),
    });
    const { ocrFromBase64Image } = await import("@/lib/services/google-vision");
    const result = await ocrFromBase64Image("bad-img");
    expect(result.mode).toBe("error");
    if (result.mode === "error") expect(result.message).toBe("INVALID_IMAGE");
  });

  it("텍스트 없는 이미지 → no_text + cached: false", async () => {
    process.env.GOOGLE_VISION_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ responses: [{ textAnnotations: [] }] }),
    });
    const { ocrFromBase64Image } = await import("@/lib/services/google-vision");
    const result = await ocrFromBase64Image("img-no-text");
    expect(result.mode).toBe("no_text");
    if (result.mode === "no_text") expect(result.cached).toBe(false);
  });

  it("정상 OCR → ok + text", async () => {
    process.env.GOOGLE_VISION_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        responses: [{
          textAnnotations: [{ description: "Bánh mì 30.000đ\nCà phê sữa 25.000đ" }],
        }],
      }),
    });
    const { ocrFromBase64Image } = await import("@/lib/services/google-vision");
    const result = await ocrFromBase64Image("img-menu");
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.text).toContain("Bánh mì");
      expect(result.cached).toBe(false);
      expect(result.fetchDurationMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("네트워크 에러 → error + 'network'", async () => {
    process.env.GOOGLE_VISION_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("DNS_FAIL"));
    const { ocrFromBase64Image } = await import("@/lib/services/google-vision");
    const result = await ocrFromBase64Image("img");
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.code).toBe("network");
      expect(result.message).toContain("DNS_FAIL");
    }
  });

  it("recordExternalCall 호출됨", async () => {
    process.env.GOOGLE_VISION_API_KEY = "key123";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ responses: [{ textAnnotations: [{ description: "X" }] }] }),
    });
    const { ocrFromBase64Image } = await import("@/lib/services/google-vision");
    await ocrFromBase64Image("img");
    expect(mockRecordExternalCall).toHaveBeenCalledWith("google-vision");
  });
});

/* ════════════════════════════════════════════
 * A/B Experiment — getVariant + trackAbEvent
 * ════════════════════════════════════════════ */

describe("ab/experiment", () => {
  let origWindow: typeof globalThis.window;
  let store: Record<string, string>;

  beforeEach(() => {
    origWindow = globalThis.window;
    store = {};
    const mockLs = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
    };
    // @ts-expect-error mock window + localStorage
    globalThis.window = { localStorage: mockLs };
    // experiment.ts uses bare `localStorage` not `window.localStorage`
    // @ts-expect-error mock global localStorage
    globalThis.localStorage = mockLs;
  });

  afterEach(() => {
    // @ts-expect-error restore
    globalThis.window = origWindow;
    // @ts-expect-error cleanup
    delete globalThis.localStorage;
  });

  it("EXPERIMENTS — 2개 이상 존재", async () => {
    const { EXPERIMENTS } = await import("@/lib/ab/experiment");
    expect(EXPERIMENTS.length).toBeGreaterThanOrEqual(2);
  });

  it("EXPERIMENTS — 모든 실험에 id + variants 2+ 존재", async () => {
    const { EXPERIMENTS } = await import("@/lib/ab/experiment");
    for (const exp of EXPERIMENTS) {
      expect(exp.id).toBeTruthy();
      expect(exp.variants.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("getVariant — 존재하지 않는 실험 → 'control'", async () => {
    const { getVariant } = await import("@/lib/ab/experiment");
    expect(getVariant("nonexistent")).toBe("control");
  });

  it("getVariant — 첫 호출 시 variant 할당 + localStorage 저장", async () => {
    const { getVariant, EXPERIMENTS } = await import("@/lib/ab/experiment");
    const expId = EXPERIMENTS[0].id;
    const variant = getVariant(expId);
    expect(EXPERIMENTS[0].variants).toContain(variant);
    expect(store[`td_ab_${expId}`]).toBe(variant);
  });

  it("getVariant — 이미 할당된 variant → 동일 반환", async () => {
    const { getVariant, EXPERIMENTS } = await import("@/lib/ab/experiment");
    const expId = EXPERIMENTS[0].id;
    store[`td_ab_${expId}`] = EXPERIMENTS[0].variants[1];
    expect(getVariant(expId)).toBe(EXPERIMENTS[0].variants[1]);
  });

  it("getVariant — SSR (window undefined) → 첫 번째 variant", async () => {
    // @ts-expect-error SSR simulation
    globalThis.window = undefined;
    const { getVariant, EXPERIMENTS } = await import("@/lib/ab/experiment");
    expect(getVariant(EXPERIMENTS[0].id)).toBe(EXPERIMENTS[0].variants[0]);
  });

  it("trackAbEvent — navigator.sendBeacon 호출 (에러 없음)", async () => {
    const mockBeacon = vi.fn();
    Object.defineProperty(globalThis, "navigator", {
      value: { sendBeacon: mockBeacon },
      writable: true,
      configurable: true,
    });
    const { trackAbEvent } = await import("@/lib/ab/experiment");
    trackAbEvent("ota_cta_text", "최저가 보기", "impression");
    expect(mockBeacon).toHaveBeenCalled();
  });

  it("trackAbEvent — sendBeacon 없으면 fetch fallback (에러 없음)", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {},
      writable: true,
      configurable: true,
    });
    const mockFetch = vi.fn().mockResolvedValue({});
    // @ts-expect-error mock fetch
    globalThis.fetch = mockFetch;
    const { trackAbEvent } = await import("@/lib/ab/experiment");
    trackAbEvent("ota_cta_text", "가격 비교하기", "conversion");
    expect(mockFetch).toHaveBeenCalled();
  });
});
