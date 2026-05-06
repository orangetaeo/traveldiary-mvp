/**
 * lib/services/korean-evidence.ts 통합 단위 테스트.
 *
 * Naver API (searchNaverLocal, searchNaverBlog)만 mock.
 * gatherKoreanEvidence 오케스트레이션 로직 검증.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockSearchNaverLocal = vi.fn();
const mockSearchNaverBlog = vi.fn();

vi.mock("@/lib/services/naver-search", () => ({
  searchNaverLocal: (...args: unknown[]) => mockSearchNaverLocal(...args),
  searchNaverBlog: (...args: unknown[]) => mockSearchNaverBlog(...args),
}));

describe("gatherKoreanEvidence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("둘 다 demo → mode='demo'", async () => {
    mockSearchNaverLocal.mockResolvedValue({ mode: "demo" });
    mockSearchNaverBlog.mockResolvedValue({ mode: "demo" });
    const { gatherKoreanEvidence } = await import("@/lib/services/korean-evidence");
    const result = await gatherKoreanEvidence("푸꾸옥 맛집");
    expect(result.mode).toBe("demo");
  });

  it("local ok + blog ok → mode='ok' + evidence 포함", async () => {
    mockSearchNaverLocal.mockResolvedValue({
      mode: "ok",
      items: [{ title: "맛집 A", link: "https://naver.com/a" }],
      cached: false,
    });
    mockSearchNaverBlog.mockResolvedValue({
      mode: "ok",
      items: [{ title: "후기 1" }],
      total: 1234,
      positiveHeuristic: 85,
      cached: false,
    });
    const { gatherKoreanEvidence } = await import("@/lib/services/korean-evidence");
    const result = await gatherKoreanEvidence("푸꾸옥 맛집");
    expect(result.mode).toBe("ok");
    if (result.mode !== "ok") throw new Error("expected ok");
    expect(result.evidence.reasons).toHaveLength(2);
    expect(result.evidence.reasons[0]).toContain("네이버 지도");
    expect(result.evidence.reasons[1]).toContain("네이버 블로그");
    expect(result.evidence.reasons[1]).toContain("1,234건");
    expect(result.evidence.reasons[1]).toContain("85%");
    expect(result.evidence.sources).toHaveLength(2);
    expect(result.evidence.sources[0].platform).toBe("naver");
    expect(result.evidence.verifiedAt).toBeDefined();
  });

  it("local ok + blog demo → reasons 1개 (지도만)", async () => {
    mockSearchNaverLocal.mockResolvedValue({
      mode: "ok",
      items: [{ title: "맛집 B", link: "" }],
      cached: true,
    });
    mockSearchNaverBlog.mockResolvedValue({ mode: "demo" });
    const { gatherKoreanEvidence } = await import("@/lib/services/korean-evidence");
    const result = await gatherKoreanEvidence("다낭 맛집");
    expect(result.mode).toBe("ok");
    if (result.mode !== "ok") throw new Error("expected ok");
    expect(result.evidence.reasons).toHaveLength(1);
    expect(result.evidence.sources).toHaveLength(1);
  });

  it("local demo + blog ok → reasons 1개 (블로그만)", async () => {
    mockSearchNaverLocal.mockResolvedValue({ mode: "demo" });
    mockSearchNaverBlog.mockResolvedValue({
      mode: "ok",
      items: [{ title: "후기" }],
      total: 500,
      positiveHeuristic: 90,
      cached: true,
    });
    const { gatherKoreanEvidence } = await import("@/lib/services/korean-evidence");
    const result = await gatherKoreanEvidence("호이안 맛집");
    expect(result.mode).toBe("ok");
    if (result.mode !== "ok") throw new Error("expected ok");
    expect(result.evidence.reasons).toHaveLength(1);
    expect(result.evidence.reasons[0]).toContain("블로그");
  });

  it("local ok (items 빈) + blog ok (items 빈) → no_data", async () => {
    mockSearchNaverLocal.mockResolvedValue({
      mode: "ok",
      items: [],
      cached: false,
    });
    mockSearchNaverBlog.mockResolvedValue({
      mode: "ok",
      items: [],
      total: 0,
      positiveHeuristic: 0,
      cached: false,
    });
    const { gatherKoreanEvidence } = await import("@/lib/services/korean-evidence");
    const result = await gatherKoreanEvidence("존재하지않는곳");
    expect(result.mode).toBe("no_data");
  });

  it("local link 없으면 map.naver.com fallback URL", async () => {
    mockSearchNaverLocal.mockResolvedValue({
      mode: "ok",
      items: [{ title: "맛집 C", link: "" }],
      cached: false,
    });
    mockSearchNaverBlog.mockResolvedValue({ mode: "demo" });
    const { gatherKoreanEvidence } = await import("@/lib/services/korean-evidence");
    const result = await gatherKoreanEvidence("나트랑 맛집");
    if (result.mode !== "ok") throw new Error("expected ok");
    expect(result.evidence.sources[0].url).toContain("map.naver.com");
  });

  it("cached — 둘 다 cached → cached=true", async () => {
    mockSearchNaverLocal.mockResolvedValue({
      mode: "ok",
      items: [{ title: "맛집", link: "" }],
      cached: true,
    });
    mockSearchNaverBlog.mockResolvedValue({
      mode: "ok",
      items: [{ title: "후기" }],
      total: 100,
      positiveHeuristic: 80,
      cached: true,
    });
    const { gatherKoreanEvidence } = await import("@/lib/services/korean-evidence");
    const result = await gatherKoreanEvidence("달랏");
    if (result.mode !== "ok") throw new Error("expected ok");
    expect(result.cached).toBe(true);
  });

  it("cached — 하나라도 미캐시 → cached=false", async () => {
    mockSearchNaverLocal.mockResolvedValue({
      mode: "ok",
      items: [{ title: "맛집", link: "" }],
      cached: false,
    });
    mockSearchNaverBlog.mockResolvedValue({
      mode: "ok",
      items: [{ title: "후기" }],
      total: 100,
      positiveHeuristic: 80,
      cached: true,
    });
    const { gatherKoreanEvidence } = await import("@/lib/services/korean-evidence");
    const result = await gatherKoreanEvidence("호치민");
    if (result.mode !== "ok") throw new Error("expected ok");
    expect(result.cached).toBe(false);
  });

  it("blog source에 reviewCount + positiveRate 포함", async () => {
    mockSearchNaverLocal.mockResolvedValue({ mode: "demo" });
    mockSearchNaverBlog.mockResolvedValue({
      mode: "ok",
      items: [{ title: "후기" }],
      total: 2500,
      positiveHeuristic: 92,
      cached: false,
    });
    const { gatherKoreanEvidence } = await import("@/lib/services/korean-evidence");
    const result = await gatherKoreanEvidence("하노이 쌀국수");
    if (result.mode !== "ok") throw new Error("expected ok");
    const blogSource = result.evidence.sources[0];
    expect(blogSource.reviewCount).toBe(2500);
    expect(blogSource.positiveRate).toBe(92);
  });
});
