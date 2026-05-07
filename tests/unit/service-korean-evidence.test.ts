/**
 * lib/services/korean-evidence.ts 단위 테스트.
 *
 * gatherKoreanEvidence — Naver Local + Blog 병렬 통합.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockSearchNaverLocal = vi.fn();
const mockSearchNaverBlog = vi.fn();
vi.mock("@/lib/services/naver-search", () => ({
  searchNaverLocal: (...args: unknown[]) => mockSearchNaverLocal(...args),
  searchNaverBlog: (...args: unknown[]) => mockSearchNaverBlog(...args),
}));

import { gatherKoreanEvidence } from "@/lib/services/korean-evidence";

describe("gatherKoreanEvidence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchNaverLocal.mockResolvedValue({ mode: "demo" });
    mockSearchNaverBlog.mockResolvedValue({ mode: "demo" });
  });

  it("둘 다 demo → demo", async () => {
    const r = await gatherKoreanEvidence("미케 비치");
    expect(r.mode).toBe("demo");
  });

  it("Local ok + Blog demo → ok (Local 소스만)", async () => {
    mockSearchNaverLocal.mockResolvedValue({
      mode: "ok",
      items: [{ title: "미케 비치", link: "https://map.naver.com/place/123" }],
      cached: false,
    });

    const r = await gatherKoreanEvidence("미케 비치");
    expect(r.mode).toBe("ok");
    if (r.mode === "ok") {
      expect(r.evidence.sources).toHaveLength(1);
      expect(r.evidence.sources[0].platform).toBe("naver");
      expect(r.evidence.reasons[0]).toContain("네이버 지도");
      // Blog가 demo(=cached)이고 Local이 fresh → cached=false
      expect(r.cached).toBe(false);
    }
  });

  it("Local demo + Blog ok → ok (Blog 소스만)", async () => {
    mockSearchNaverBlog.mockResolvedValue({
      mode: "ok",
      items: [{ title: "후기" }],
      total: 1500,
      positiveHeuristic: 85,
      cached: true,
    });

    const r = await gatherKoreanEvidence("미케 비치");
    expect(r.mode).toBe("ok");
    if (r.mode === "ok") {
      expect(r.evidence.sources).toHaveLength(1);
      expect(r.evidence.reasons[0]).toContain("네이버 블로그");
      expect(r.evidence.reasons[0]).toContain("1,500건");
      expect(r.evidence.reasons[0]).toContain("85%");
      expect(r.cached).toBe(true);
    }
  });

  it("둘 다 ok → 2개 소스 통합", async () => {
    mockSearchNaverLocal.mockResolvedValue({
      mode: "ok",
      items: [{ title: "미케 비치", link: "" }],
      cached: false,
    });
    mockSearchNaverBlog.mockResolvedValue({
      mode: "ok",
      items: [{ title: "후기" }],
      total: 500,
      positiveHeuristic: 90,
      cached: false,
    });

    const r = await gatherKoreanEvidence("미케 비치");
    if (r.mode === "ok") {
      expect(r.evidence.sources).toHaveLength(2);
      expect(r.evidence.reasons).toHaveLength(2);
      expect(r.cached).toBe(false);
    }
  });

  it("둘 다 ok + 둘 다 cached → cached=true", async () => {
    mockSearchNaverLocal.mockResolvedValue({
      mode: "ok",
      items: [{ title: "A", link: "" }],
      cached: true,
    });
    mockSearchNaverBlog.mockResolvedValue({
      mode: "ok",
      items: [{ title: "B" }],
      total: 100,
      positiveHeuristic: 70,
      cached: true,
    });

    const r = await gatherKoreanEvidence("test");
    if (r.mode === "ok") {
      expect(r.cached).toBe(true);
    }
  });

  it("Local ok (items 비어있음) + Blog demo → no_data", async () => {
    mockSearchNaverLocal.mockResolvedValue({
      mode: "ok",
      items: [],
      cached: false,
    });

    const r = await gatherKoreanEvidence("없는장소");
    expect(r.mode).toBe("no_data");
  });

  it("Local ok + Blog ok (items 비어있음) → Local 소스만", async () => {
    mockSearchNaverLocal.mockResolvedValue({
      mode: "ok",
      items: [{ title: "장소", link: "https://test" }],
      cached: false,
    });
    mockSearchNaverBlog.mockResolvedValue({
      mode: "ok",
      items: [],
      total: 0,
      positiveHeuristic: 0,
      cached: false,
    });

    const r = await gatherKoreanEvidence("test");
    if (r.mode === "ok") {
      expect(r.evidence.sources).toHaveLength(1);
    }
  });

  it("Local link 없으면 → 지도 검색 URL 생성", async () => {
    mockSearchNaverLocal.mockResolvedValue({
      mode: "ok",
      items: [{ title: "장소", link: "" }],
      cached: false,
    });

    const r = await gatherKoreanEvidence("미케 비치");
    if (r.mode === "ok") {
      expect(r.evidence.sources[0].url).toContain("map.naver.com");
      expect(r.evidence.sources[0].url).toContain(encodeURIComponent("미케 비치"));
    }
  });

  it("query를 두 API에 전달", async () => {
    await gatherKoreanEvidence("다낭 맛집");
    expect(mockSearchNaverLocal).toHaveBeenCalledWith("다낭 맛집");
    expect(mockSearchNaverBlog).toHaveBeenCalledWith("다낭 맛집");
  });
});
