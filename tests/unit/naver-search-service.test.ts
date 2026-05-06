/**
 * lib/services/naver-search.ts 단위 테스트.
 *
 * searchNaverLocal + searchNaverBlog + naverAvailable.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

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

vi.mock("@/lib/utils/cache-key", () => ({
  hashCacheKey: (s: string) => `hash-${s.slice(0, 8)}`,
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import {
  searchNaverLocal,
  searchNaverBlog,
  naverAvailable,
} from "@/lib/services/naver-search";

describe("naver-search service", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NAVER_CLIENT_ID;
    delete process.env.NAVER_CLIENT_SECRET;
    mockGetCache.mockResolvedValue(null);
    mockSetCache.mockResolvedValue(undefined);
    mockCheckQuota.mockReturnValue(null);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  function setNaverCreds() {
    process.env.NAVER_CLIENT_ID = "test-id";
    process.env.NAVER_CLIENT_SECRET = "test-secret";
  }

  // ─── naverAvailable ────────────────────────────────────────

  it("env 미설정 → false", () => {
    expect(naverAvailable()).toBe(false);
  });

  it("ID만 설정 → false", () => {
    process.env.NAVER_CLIENT_ID = "test-id";
    expect(naverAvailable()).toBe(false);
  });

  it("ID + SECRET 모두 설정 → true", () => {
    setNaverCreds();
    expect(naverAvailable()).toBe(true);
  });

  // ═══════════════════════════════════════════════════════════
  // searchNaverLocal
  // ═══════════════════════════════════════════════════════════

  describe("searchNaverLocal", () => {
    it("cred 미설정 → demo", async () => {
      const r = await searchNaverLocal("다낭 맛집");
      expect(r).toEqual({ mode: "demo" });
    });

    it("캐시 히트 → ok + cached", async () => {
      setNaverCreds();
      mockGetCache.mockResolvedValue({
        data: { items: [{ title: "식당", link: "", category: "", address: "addr", roadAddress: "" }] },
      });

      const r = await searchNaverLocal("test");
      expect(r).toMatchObject({ mode: "ok", cached: true });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("쿼터 차단 → quota_exceeded", async () => {
      setNaverCreds();
      mockCheckQuota.mockReturnValue({ mode: "error", code: "quota_exceeded" });

      const r = await searchNaverLocal("test");
      expect(r).toEqual({ mode: "error", code: "quota_exceeded" });
    });

    it("API OK → ok + HTML strip + 캐시 저장", async () => {
      setNaverCreds();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            {
              title: "<b>맛있는</b> 쌀국수",
              link: "http://place.naver.com/1",
              category: "음식점",
              address: "호치민 1군",
              roadAddress: "로드주소",
              telephone: "028-1234",
            },
          ],
        }),
      });

      const r = await searchNaverLocal("쌀국수");
      expect(r).toMatchObject({ mode: "ok", cached: false });
      if (r.mode === "ok") {
        expect(r.items[0].title).toBe("맛있는 쌀국수"); // HTML stripped
        expect(r.items[0].address).toBe("호치민 1군");
      }
      expect(mockRecordCall).toHaveBeenCalledWith("naver-search");
      expect(mockSetCache).toHaveBeenCalledOnce();
    });

    it("API OK + title/address 누락 → 필터링됨", async () => {
      setNaverCreds();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            { title: "", link: "", category: "", address: "" },
            { title: "유효", link: "", category: "", address: "주소" },
          ],
        }),
      });

      const r = await searchNaverLocal("test");
      if (r.mode === "ok") {
        expect(r.items).toHaveLength(1);
        expect(r.items[0].title).toBe("유효");
      }
    });

    it("HTTP 에러 → naver_api_error", async () => {
      setNaverCreds();
      mockFetch.mockResolvedValue({ ok: false, status: 429 });

      const r = await searchNaverLocal("test");
      expect(r).toEqual({ mode: "error", code: "naver_api_error", message: "HTTP 429" });
    });

    it("네트워크 에러 → network", async () => {
      setNaverCreds();
      mockFetch.mockRejectedValue(new Error("ECONNREFUSED"));

      const r = await searchNaverLocal("test");
      expect(r).toEqual({ mode: "error", code: "network", message: "ECONNREFUSED" });
    });
  });

  // ═══════════════════════════════════════════════════════════
  // searchNaverBlog
  // ═══════════════════════════════════════════════════════════

  describe("searchNaverBlog", () => {
    it("cred 미설정 → demo", async () => {
      const r = await searchNaverBlog("다낭 맛집");
      expect(r).toEqual({ mode: "demo" });
    });

    it("캐시 히트 → ok + cached", async () => {
      setNaverCreds();
      mockGetCache.mockResolvedValue({
        data: { items: [], total: 100, positiveHeuristic: 85 },
      });

      const r = await searchNaverBlog("test");
      expect(r).toMatchObject({
        mode: "ok",
        total: 100,
        positiveHeuristic: 85,
        cached: true,
      });
    });

    it("API OK + 긍정 키워드 → positiveHeuristic 높음", async () => {
      setNaverCreds();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          total: 50,
          items: [
            { title: "추천 맛집", description: "정말 맛있는 곳", bloggername: "B", postdate: "20260101" },
            { title: "강추", description: "최고의 경험", bloggername: "C", postdate: "20260102" },
          ],
        }),
      });

      const r = await searchNaverBlog("맛집");
      expect(r.mode).toBe("ok");
      if (r.mode === "ok") {
        expect(r.positiveHeuristic).toBeGreaterThan(50);
        expect(r.total).toBe(50);
        expect(r.cached).toBe(false);
      }
    });

    it("API OK + 부정 키워드만 → positiveHeuristic 0", async () => {
      setNaverCreds();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          total: 10,
          items: [
            { title: "최악의 경험", description: "후회만 남은 여행", bloggername: "X", postdate: "20260101" },
          ],
        }),
      });

      const r = await searchNaverBlog("별로");
      if (r.mode === "ok") {
        expect(r.positiveHeuristic).toBe(0);
      }
    });

    it("API OK + 키워드 없음 → 기본 80", async () => {
      setNaverCreds();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          total: 5,
          items: [
            { title: "평범한 곳", description: "그냥 갔다 왔다", bloggername: "Y", postdate: "20260101" },
          ],
        }),
      });

      const r = await searchNaverBlog("평범");
      if (r.mode === "ok") {
        expect(r.positiveHeuristic).toBe(80);
      }
    });

    it("HTML strip + 5건 제한", async () => {
      setNaverCreds();
      const items = Array.from({ length: 8 }, (_, i) => ({
        title: `<b>블로그${i}</b>`,
        description: `설명${i}`,
        bloggername: `B${i}`,
        postdate: "20260101",
        link: `http://blog.naver.com/${i}`,
      }));
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ total: 100, items }),
      });

      const r = await searchNaverBlog("test");
      if (r.mode === "ok") {
        expect(r.items.length).toBeLessThanOrEqual(5);
        expect(r.items[0].title).not.toContain("<b>");
      }
    });

    it("HTTP 에러 → naver_api_error", async () => {
      setNaverCreds();
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      const r = await searchNaverBlog("test");
      expect(r).toEqual({ mode: "error", code: "naver_api_error", message: "HTTP 500" });
    });

    it("네트워크 에러 → network", async () => {
      setNaverCreds();
      mockFetch.mockRejectedValue(new Error("timeout"));

      const r = await searchNaverBlog("test");
      expect(r).toEqual({ mode: "error", code: "network", message: "timeout" });
    });
  });
});
