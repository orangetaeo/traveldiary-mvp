/**
 * lib/utils/place-photo.ts + app/api/places/photo/route.ts 단위 테스트.
 *
 * getPlacePhotoUrl 유틸 + Photo 프록시 API 라우트.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── getPlacePhotoUrl ───────────────────────────────────

import { getPlacePhotoUrl } from "@/lib/utils/place-photo";

describe("getPlacePhotoUrl", () => {
  it("기본 width=400", () => {
    const url = getPlacePhotoUrl("abc123");
    expect(url).toBe("/api/places/photo?ref=abc123&w=400");
  });

  it("커스텀 width", () => {
    const url = getPlacePhotoUrl("ref-xyz", 800);
    expect(url).toBe("/api/places/photo?ref=ref-xyz&w=800");
  });

  it("특수문자 인코딩", () => {
    const url = getPlacePhotoUrl("a+b/c=d");
    expect(url).toContain("ref=a%2Bb%2Fc%3Dd");
  });
});

// ─── API route /api/places/photo ────────────────────────

vi.mock("server-only", () => ({}));

const mockGetEnvKey = vi.fn();
vi.mock("@/lib/utils/env", () => ({
  getEnvKey: (...args: unknown[]) => mockGetEnvKey(...args),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("GET /api/places/photo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ref 누락 → 400", async () => {
    const { GET } = await import("@/app/api/places/photo/route");
    const req = { nextUrl: new URL("http://test/api/places/photo") };
    const resp = await GET(req as never);
    expect(resp.status).toBe(400);
  });

  it("API 키 미설정 → 503", async () => {
    mockGetEnvKey.mockReturnValue(null);
    const { GET } = await import("@/app/api/places/photo/route");
    const req = { nextUrl: new URL("http://test/api/places/photo?ref=abc") };
    const resp = await GET(req as never);
    expect(resp.status).toBe(503);
  });

  it("Google 응답 실패 → 404", async () => {
    mockGetEnvKey.mockReturnValue("test-key");
    mockFetch.mockResolvedValue({ ok: false, status: 404 });
    const { GET } = await import("@/app/api/places/photo/route");
    const req = { nextUrl: new URL("http://test/api/places/photo?ref=abc&w=400") };
    const resp = await GET(req as never);
    expect(resp.status).toBe(404);
  });

  it("성공 → 이미지 바이트 + 캐시 헤더", async () => {
    mockGetEnvKey.mockReturnValue("test-key");
    const imgBuffer = new ArrayBuffer(8);
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(imgBuffer),
      headers: new Headers({ "Content-Type": "image/jpeg" }),
    });
    const { GET } = await import("@/app/api/places/photo/route");
    const req = { nextUrl: new URL("http://test/api/places/photo?ref=abc&w=400") };
    const resp = await GET(req as never);
    expect(resp.status).toBe(200);
    expect(resp.headers.get("Content-Type")).toBe("image/jpeg");
    expect(resp.headers.get("Cache-Control")).toContain("max-age=86400");
  });

  it("fetch 예외 → 502", async () => {
    mockGetEnvKey.mockReturnValue("test-key");
    mockFetch.mockRejectedValue(new Error("network error"));
    const { GET } = await import("@/app/api/places/photo/route");
    const req = { nextUrl: new URL("http://test/api/places/photo?ref=abc") };
    const resp = await GET(req as never);
    expect(resp.status).toBe(502);
  });

  it("Google API URL에 key 포함", async () => {
    mockGetEnvKey.mockReturnValue("my-api-key");
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
      headers: new Headers({ "Content-Type": "image/png" }),
    });
    const { GET } = await import("@/app/api/places/photo/route");
    const req = { nextUrl: new URL("http://test/api/places/photo?ref=test-ref&w=200") };
    await GET(req as never);
    const fetchUrl = mockFetch.mock.calls[0][0] as string;
    expect(fetchUrl).toContain("key=my-api-key");
    expect(fetchUrl).toContain("photo_reference=test-ref");
    expect(fetchUrl).toContain("maxwidth=200");
  });
});
