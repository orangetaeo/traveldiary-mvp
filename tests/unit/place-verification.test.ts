/**
 * Place Verification 오케스트레이션 테스트 — Batch 20.
 *
 * lib/services/place-verification.ts: verifyPlace
 * findPlaceFromText + getPlaceDetails → vi.mock
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockFindPlace = vi.fn();
const mockGetDetails = vi.fn();

vi.mock("@/lib/services/google-places", () => ({
  findPlaceFromText: (...args: unknown[]) => mockFindPlace(...args),
  getPlaceDetails: (...args: unknown[]) => mockGetDetails(...args),
}));

describe("services — verifyPlace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("findPlace demo → mode 'demo'", async () => {
    mockFindPlace.mockResolvedValue({ mode: "demo" });
    const { verifyPlace } = await import("@/lib/services/place-verification");
    const result = await verifyPlace({ name: "바나힐" });
    expect(result.mode).toBe("demo");
    expect(mockGetDetails).not.toHaveBeenCalled();
  });

  it("findPlace error → mode 'error' + code 전달", async () => {
    mockFindPlace.mockResolvedValue({ mode: "error", code: "network", message: "timeout" });
    const { verifyPlace } = await import("@/lib/services/place-verification");
    const result = await verifyPlace({ name: "미케비치" });
    expect(result.mode).toBe("error");
    if (result.mode === "error") {
      expect(result.code).toBe("network");
      expect(result.message).toBe("timeout");
    }
  });

  it("findPlace not_found → mode 'not_found' + placeExists false", async () => {
    mockFindPlace.mockResolvedValue({ mode: "not_found", cached: false });
    const { verifyPlace } = await import("@/lib/services/place-verification");
    const result = await verifyPlace({ name: "존재하지않는장소" });
    expect(result.mode).toBe("not_found");
    if (result.mode === "not_found") {
      expect(result.placeExists).toBe(false);
      expect(result.fetchDurationMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("findPlace found + details demo → mode 'demo'", async () => {
    mockFindPlace.mockResolvedValue({ mode: "found", placeId: "abc123", cached: true });
    mockGetDetails.mockResolvedValue({ mode: "demo" });
    const { verifyPlace } = await import("@/lib/services/place-verification");
    const result = await verifyPlace({ name: "테스트" });
    expect(result.mode).toBe("demo");
  });

  it("findPlace found + details error → mode 'error'", async () => {
    mockFindPlace.mockResolvedValue({ mode: "found", placeId: "xyz", cached: false });
    mockGetDetails.mockResolvedValue({ mode: "error", code: "quota_exceeded" });
    const { verifyPlace } = await import("@/lib/services/place-verification");
    const result = await verifyPlace({ name: "다낭 대성당" });
    expect(result.mode).toBe("error");
    if (result.mode === "error") expect(result.code).toBe("quota_exceeded");
  });

  it("findPlace found + details not_found → mode 'not_found'", async () => {
    mockFindPlace.mockResolvedValue({ mode: "found", placeId: "xyz", cached: true });
    mockGetDetails.mockResolvedValue({ mode: "not_found", cached: true });
    const { verifyPlace } = await import("@/lib/services/place-verification");
    const result = await verifyPlace({ name: "삭제된 장소" });
    expect(result.mode).toBe("not_found");
  });

  it("findPlace found + details found → mode 'verified'", async () => {
    mockFindPlace.mockResolvedValue({ mode: "found", placeId: "place-1", cached: false });
    mockGetDetails.mockResolvedValue({
      mode: "found",
      details: {
        placeId: "place-1",
        name: "바나힐",
        formattedAddress: "다낭",
        businessStatus: "OPERATIONAL",
        openNow: true,
        rating: 4.5,
        userRatingsTotal: 12000,
        types: ["amusement_park", "tourist_attraction"],
      },
      cached: true,
    });
    const { verifyPlace } = await import("@/lib/services/place-verification");
    const result = await verifyPlace({ name: "바나힐", location: { lat: 15.99, lng: 108.0 } });
    expect(result.mode).toBe("verified");
    if (result.mode === "verified") {
      expect(result.placeExists).toBe(true);
      expect(result.operatingStatus).toBe("open");
      expect(result.placeId).toBe("place-1");
      expect(result.rating).toBe(4.5);
      expect(result.userRatingsTotal).toBe(12000);
      expect(result.types).toContain("tourist_attraction");
      expect(result.fetchDurationMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("OPERATIONAL + openNow=false → 'closed'", async () => {
    mockFindPlace.mockResolvedValue({ mode: "found", placeId: "p2", cached: true });
    mockGetDetails.mockResolvedValue({
      mode: "found",
      details: {
        placeId: "p2",
        name: "레스토랑",
        formattedAddress: "x",
        businessStatus: "OPERATIONAL",
        openNow: false,
      },
      cached: true,
    });
    const { verifyPlace } = await import("@/lib/services/place-verification");
    const result = await verifyPlace({ name: "레스토랑" });
    if (result.mode === "verified") {
      expect(result.operatingStatus).toBe("closed");
    }
  });

  it("CLOSED_TEMPORARILY → 'closed'", async () => {
    mockFindPlace.mockResolvedValue({ mode: "found", placeId: "p3", cached: true });
    mockGetDetails.mockResolvedValue({
      mode: "found",
      details: {
        placeId: "p3",
        name: "공사중",
        formattedAddress: "y",
        businessStatus: "CLOSED_TEMPORARILY",
      },
      cached: true,
    });
    const { verifyPlace } = await import("@/lib/services/place-verification");
    const result = await verifyPlace({ name: "공사중" });
    if (result.mode === "verified") {
      expect(result.operatingStatus).toBe("closed");
    }
  });

  it("cached 계산 — find + details 모두 cached → true", async () => {
    mockFindPlace.mockResolvedValue({ mode: "found", placeId: "p4", cached: true });
    mockGetDetails.mockResolvedValue({
      mode: "found",
      details: { placeId: "p4", name: "X", formattedAddress: "", businessStatus: "OPERATIONAL" },
      cached: true,
    });
    const { verifyPlace } = await import("@/lib/services/place-verification");
    const result = await verifyPlace({ name: "X" });
    if (result.mode === "verified") {
      expect(result.cached).toBe(true);
    }
  });

  it("cached 계산 — find fresh → false", async () => {
    mockFindPlace.mockResolvedValue({ mode: "found", placeId: "p5", cached: false });
    mockGetDetails.mockResolvedValue({
      mode: "found",
      details: { placeId: "p5", name: "Y", formattedAddress: "", businessStatus: "OPERATIONAL" },
      cached: true,
    });
    const { verifyPlace } = await import("@/lib/services/place-verification");
    const result = await verifyPlace({ name: "Y" });
    if (result.mode === "verified") {
      expect(result.cached).toBe(false);
    }
  });

  it("findPlace에 location 전달", async () => {
    mockFindPlace.mockResolvedValue({ mode: "demo" });
    const { verifyPlace } = await import("@/lib/services/place-verification");
    await verifyPlace({ name: "호이안", location: { lat: 15.88, lng: 108.33 } });
    expect(mockFindPlace).toHaveBeenCalledWith("호이안", { lat: 15.88, lng: 108.33 });
  });
});
