/**
 * lib/services/place-verification.ts 단위 테스트.
 *
 * verifyPlace — 2단계 검증 (Find Place → Place Details).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockFindPlace = vi.fn();
const mockGetDetails = vi.fn();

vi.mock("@/lib/services/google-places", () => ({
  findPlaceFromText: (...args: unknown[]) => mockFindPlace(...args),
  getPlaceDetails: (...args: unknown[]) => mockGetDetails(...args),
}));

import { verifyPlace } from "@/lib/services/place-verification";

describe("verifyPlace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("findPlace demo → demo 반환", async () => {
    mockFindPlace.mockResolvedValue({ mode: "demo" });
    const r = await verifyPlace({ name: "미케비치" });
    expect(r.mode).toBe("demo");
    expect(mockGetDetails).not.toHaveBeenCalled();
  });

  it("findPlace error → error 전파", async () => {
    mockFindPlace.mockResolvedValue({
      mode: "error",
      code: "quota_exceeded",
      message: "quota",
    });
    const r = await verifyPlace({ name: "test" });
    expect(r).toEqual({
      mode: "error",
      code: "quota_exceeded",
      message: "quota",
    });
  });

  it("findPlace not_found → not_found 반환", async () => {
    mockFindPlace.mockResolvedValue({
      mode: "not_found",
      cached: false,
    });
    const r = await verifyPlace({ name: "없는 장소" });
    expect(r.mode).toBe("not_found");
    if (r.mode === "not_found") {
      expect(r.placeExists).toBe(false);
      expect(r.cached).toBe(false);
      expect(r.fetchDurationMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("getDetails demo → demo 반환", async () => {
    mockFindPlace.mockResolvedValue({
      mode: "found",
      placeId: "gid-1",
      cached: false,
    });
    mockGetDetails.mockResolvedValue({ mode: "demo" });
    const r = await verifyPlace({ name: "test" });
    expect(r.mode).toBe("demo");
  });

  it("getDetails error → error 전파", async () => {
    mockFindPlace.mockResolvedValue({
      mode: "found",
      placeId: "gid-1",
      cached: false,
    });
    mockGetDetails.mockResolvedValue({
      mode: "error",
      code: "network",
      message: "timeout",
    });
    const r = await verifyPlace({ name: "test" });
    expect(r).toEqual({ mode: "error", code: "network", message: "timeout" });
  });

  it("getDetails not_found → not_found 반환", async () => {
    mockFindPlace.mockResolvedValue({
      mode: "found",
      placeId: "gid-1",
      cached: true,
    });
    mockGetDetails.mockResolvedValue({ mode: "not_found", cached: false });
    const r = await verifyPlace({ name: "test" });
    expect(r.mode).toBe("not_found");
    if (r.mode === "not_found") {
      expect(r.placeExists).toBe(false);
    }
  });

  it("성공 — OPERATIONAL + openNow=true → 'open'", async () => {
    mockFindPlace.mockResolvedValue({
      mode: "found",
      placeId: "gid-1",
      cached: true,
    });
    mockGetDetails.mockResolvedValue({
      mode: "ok",
      cached: true,
      details: {
        placeId: "gid-1",
        businessStatus: "OPERATIONAL",
        openNow: true,
        rating: 4.5,
        userRatingsTotal: 300,
        types: ["restaurant"],
      },
    });
    const r = await verifyPlace({ name: "미케비치" });
    expect(r.mode).toBe("verified");
    if (r.mode === "verified") {
      expect(r.placeExists).toBe(true);
      expect(r.operatingStatus).toBe("open");
      expect(r.placeId).toBe("gid-1");
      expect(r.rating).toBe(4.5);
      expect(r.userRatingsTotal).toBe(300);
      expect(r.types).toEqual(["restaurant"]);
      expect(r.cached).toBe(true); // both cached
    }
  });

  it("OPERATIONAL + openNow=false → 'closed'", async () => {
    mockFindPlace.mockResolvedValue({
      mode: "found",
      placeId: "gid-1",
      cached: false,
    });
    mockGetDetails.mockResolvedValue({
      mode: "ok",
      cached: true,
      details: {
        placeId: "gid-1",
        businessStatus: "OPERATIONAL",
        openNow: false,
        rating: 4.0,
      },
    });
    const r = await verifyPlace({ name: "test" });
    if (r.mode === "verified") {
      expect(r.operatingStatus).toBe("closed");
      expect(r.cached).toBe(false); // find not cached
    }
  });

  it("비-OPERATIONAL → 'closed'", async () => {
    mockFindPlace.mockResolvedValue({
      mode: "found",
      placeId: "gid-1",
      cached: true,
    });
    mockGetDetails.mockResolvedValue({
      mode: "ok",
      cached: true,
      details: {
        placeId: "gid-1",
        businessStatus: "CLOSED_PERMANENTLY",
        openNow: true,
      },
    });
    const r = await verifyPlace({ name: "test" });
    if (r.mode === "verified") {
      expect(r.operatingStatus).toBe("closed");
    }
  });

  it("location 전달", async () => {
    mockFindPlace.mockResolvedValue({ mode: "demo" });
    await verifyPlace({ name: "test", location: { lat: 16, lng: 108 } });
    expect(mockFindPlace).toHaveBeenCalledWith("test", { lat: 16, lng: 108 });
  });
});
