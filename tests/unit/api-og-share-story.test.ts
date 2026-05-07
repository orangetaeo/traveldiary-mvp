/**
 * /api/og/share/[key]/story/route.tsx 단위 테스트.
 *
 * Instagram Story 이미지 생성 (1080×1920) — D5.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockFetchShareLinkBySyncKey = vi.fn();
vi.mock("@/lib/repositories/share.repository", () => ({
  fetchShareLinkBySyncKey: (...args: unknown[]) => mockFetchShareLinkBySyncKey(...args),
}));

// ImageResponse를 검사 가능한 mock으로 대체
vi.mock("next/og", () => ({
  ImageResponse: class MockImageResponse {
    body: string;
    status: number;
    headers: Headers;
    _width: number;
    _height: number;
    constructor(element: unknown, options?: { width?: number; height?: number; headers?: Record<string, string> }) {
      this.body = JSON.stringify(element);
      this.status = 200;
      this._width = options?.width ?? 0;
      this._height = options?.height ?? 0;
      this.headers = new Headers(options?.headers ?? {});
    }
  },
}));

import { GET } from "@/app/api/og/share/[key]/story/route";

const SAMPLE_BUNDLE = {
  bundle: {
    trip: {
      destination: "푸꾸옥",
      nights: 3,
      startDate: "2026-07-01",
    },
    items: [
      { id: "1", dayIndex: 0, name: "빈펄 사파리", category: "spot", scheduledAt: "2026-07-01T09:00:00", durationMinutes: 120 },
      { id: "2", dayIndex: 0, name: "즈엉동 야시장", category: "food", scheduledAt: "2026-07-01T18:00:00", durationMinutes: 90 },
      { id: "3", dayIndex: 1, name: "혼톰 케이블카", category: "spot", scheduledAt: "2026-07-02T10:00:00", durationMinutes: 180 },
    ],
  },
};

describe("GET /api/og/share/[key]/story", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("키 없음 → 기본 이미지 (1080×1920)", async () => {
    mockFetchShareLinkBySyncKey.mockResolvedValue(null);

    const res = await GET(
      new Request("http://localhost/api/og/share/invalid/story"),
      { params: { key: "invalid" } },
    );

    expect(mockFetchShareLinkBySyncKey).toHaveBeenCalledWith("invalid");
    const body = JSON.stringify((res as unknown as { body: string }).body);
    expect(body).toContain("TravelDiary");
    expect((res as unknown as { _width: number })._width).toBe(1080);
    expect((res as unknown as { _height: number })._height).toBe(1920);
  });

  it("유효한 키 → 도시명 포함 Story 이미지", async () => {
    mockFetchShareLinkBySyncKey.mockResolvedValue(SAMPLE_BUNDLE);

    const res = await GET(
      new Request("http://localhost/api/og/share/valid/story"),
      { params: { key: "valid" } },
    );

    const body = JSON.stringify((res as unknown as { body: string }).body);
    expect(body).toContain("푸꾸옥");
    expect(body).toContain("Day 1");
    expect((res as unknown as { _width: number })._width).toBe(1080);
    expect((res as unknown as { _height: number })._height).toBe(1920);
  });

  it("Day 1 항목만 표시 (dayIndex===0)", async () => {
    mockFetchShareLinkBySyncKey.mockResolvedValue(SAMPLE_BUNDLE);

    const res = await GET(
      new Request("http://localhost/api/og/share/k/story"),
      { params: { key: "k" } },
    );

    const body = JSON.stringify((res as unknown as { body: string }).body);
    // Day 1 항목 (빈펄 사파리, 즈엉동 야시장) 포함
    expect(body).toContain("빈펄 사파리");
    expect(body).toContain("즈엉동 야시장");
    // Day 2 항목 (혼톰 케이블카) 미포함 — Day 1만 표시
    expect(body).not.toContain("혼톰 케이블카");
  });

  it("여행 기본 정보 표시 (박/일, 장소 수)", async () => {
    mockFetchShareLinkBySyncKey.mockResolvedValue(SAMPLE_BUNDLE);

    const res = await GET(
      new Request("http://localhost/api/og/share/k/story"),
      { params: { key: "k" } },
    );

    const body = JSON.stringify((res as unknown as { body: string }).body);
    expect(body).toContain("3");   // 3박
    expect(body).toContain("박 ");
    expect(body).toContain("곳");  // 3곳
  });

  it("캐시 헤더 + Content-Disposition 설정", async () => {
    mockFetchShareLinkBySyncKey.mockResolvedValue(SAMPLE_BUNDLE);

    const res = await GET(
      new Request("http://localhost/api/og/share/k/story"),
      { params: { key: "k" } },
    );

    const headers = (res as unknown as { headers: Headers }).headers;
    expect(headers.get("Cache-Control")).toBe("public, max-age=3600, s-maxage=3600");
    expect(headers.get("Content-Disposition")).toContain("traveldiary-");
  });

  it("카테고리 이모지 매핑", async () => {
    mockFetchShareLinkBySyncKey.mockResolvedValue(SAMPLE_BUNDLE);

    const res = await GET(
      new Request("http://localhost/api/og/share/k/story"),
      { params: { key: "k" } },
    );

    const body = JSON.stringify((res as unknown as { body: string }).body);
    expect(body).toContain("🏛️");  // spot
    expect(body).toContain("🍜");  // food
  });
});

describe("ShareModal 스토리 버튼 소스 검증", () => {
  it("ShareModal에 인스타 스토리 버튼 존재", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const src = fs.readFileSync(
      path.resolve("components/share/ShareModal.tsx"),
      "utf-8",
    );
    expect(src).toContain("handleStoryDownload");
    expect(src).toContain("인스타 스토리 카드 저장");
    expect(src).toContain("/api/og/share/");
    expect(src).toContain("/story");
  });
});
