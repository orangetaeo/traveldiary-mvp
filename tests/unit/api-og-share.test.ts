/**
 * /api/og/share/[key]/route.tsx 단위 테스트.
 *
 * OG 이미지 생성 라우트 — fetchShareLinkBySyncKey mock + ImageResponse 검증.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockFetchShareLinkBySyncKey = vi.fn();
vi.mock("@/lib/repositories/share.repository", () => ({
  fetchShareLinkBySyncKey: (...args: unknown[]) => mockFetchShareLinkBySyncKey(...args),
}));

// ImageResponse를 일반 Response로 대체 (JSX → text 변환)
vi.mock("next/og", () => ({
  ImageResponse: class MockImageResponse {
    body: string;
    status: number;
    headers: Headers;
    constructor(element: unknown, options?: { width?: number; height?: number; headers?: Record<string, string> }) {
      this.body = JSON.stringify(element);
      this.status = 200;
      this.headers = new Headers(options?.headers ?? {});
    }
  },
}));

import { GET } from "@/app/api/og/share/[key]/route";

describe("GET /api/og/share/[key]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("키 없음 → 기본 TravelDiary 이미지", async () => {
    mockFetchShareLinkBySyncKey.mockResolvedValue(null);

    const res = await GET(
      new Request("http://localhost/api/og/share/invalid-key"),
      { params: { key: "invalid-key" } },
    );

    expect(mockFetchShareLinkBySyncKey).toHaveBeenCalledWith("invalid-key");
    const body = JSON.stringify((res as unknown as { body: string }).body);
    // 기본 이미지에 "TravelDiary" 텍스트 포함
    expect(body).toContain("TravelDiary");
  });

  it("유효한 키 → 여행 정보 이미지", async () => {
    mockFetchShareLinkBySyncKey.mockResolvedValue({
      bundle: {
        trip: {
          destination: "다낭",
          nights: 3,
          startDate: "2026-07-01",
        },
        items: [
          { dayIndex: 0, name: "미케 비치" },
          { dayIndex: 0, name: "한시장" },
          { dayIndex: 1, name: "바나힐" },
        ],
      },
    });

    const res = await GET(
      new Request("http://localhost/api/og/share/valid-key"),
      { params: { key: "valid-key" } },
    );

    const body = JSON.stringify((res as unknown as { body: string }).body);
    expect(body).toContain("다낭");
    // JSX 템플릿은 children 배열로 분리됨: [3, "박 ", 4, "일 · 일정 ", 3, "개"]
    expect(body).toContain("박 ");
    expect(body).toContain("일 · 일정 ");
  });

  it("캐시 헤더 설정 (유효한 키)", async () => {
    mockFetchShareLinkBySyncKey.mockResolvedValue({
      bundle: {
        trip: { destination: "하노이", nights: 2, startDate: "2026-08-01" },
        items: [{ dayIndex: 0, name: "호안끼엠" }],
      },
    });

    const res = await GET(
      new Request("http://localhost/api/og/share/k"),
      { params: { key: "k" } },
    );

    // MockImageResponse headers 검증
    const headers = (res as unknown as { headers: Headers }).headers;
    expect(headers.get("Cache-Control")).toBe("public, max-age=3600, s-maxage=3600");
  });

  it("Day 1 일정 수 계산", async () => {
    mockFetchShareLinkBySyncKey.mockResolvedValue({
      bundle: {
        trip: { destination: "호치민", nights: 1, startDate: "2026-09-01" },
        items: [
          { dayIndex: 0, name: "A" },
          { dayIndex: 0, name: "B" },
          { dayIndex: 0, name: "C" },
          { dayIndex: 1, name: "D" },
        ],
      },
    });

    const res = await GET(
      new Request("http://localhost/api/og/share/x"),
      { params: { key: "x" } },
    );

    const body = JSON.stringify((res as unknown as { body: string }).body);
    // Day 1에 dayIndex===0인 항목 3개 → children: ["✨ Day 1 — ", 3, "곳"]
    expect(body).toContain("Day 1");
    expect(body).toContain("곳");
  });

  it("syncKey를 repository에 전달", async () => {
    mockFetchShareLinkBySyncKey.mockResolvedValue(null);

    await GET(
      new Request("http://localhost/api/og/share/my-sync-key-123"),
      { params: { key: "my-sync-key-123" } },
    );

    expect(mockFetchShareLinkBySyncKey).toHaveBeenCalledWith("my-sync-key-123");
  });
});
