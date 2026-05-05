/**
 * Distance Verification 오케스트레이션 테스트 — Batch 17.
 *
 * lib/services/distance-verification.ts: verifyItemDistance
 * fetchDirections → vi.mock, compareDistanceVerification → 실 호출 (순수 함수)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockFetchDirections = vi.fn();
vi.mock("@/lib/services/google-directions", () => ({
  fetchDirections: (...args: unknown[]) => mockFetchDirections(...args),
}));

const BASE_ITEM = {
  id: "item-1",
  scheduledAt: "2026-05-05T09:00:00+07:00",
  durationMinutes: 60,
  flexMinutes: 15,
  location: { lat: 10.22, lng: 103.96 },
};

const NEXT_ITEM = {
  scheduledAt: "2026-05-05T11:00:00+07:00",
  location: { lat: 10.23, lng: 103.97 },
};

describe("services — verifyItemDistance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("nextItem null → status 'no_next'", async () => {
    const { verifyItemDistance } = await import("@/lib/services/distance-verification");
    const result = await verifyItemDistance({ item: BASE_ITEM, nextItem: null });
    expect(result.status).toBe("no_next");
    expect(result.verified).toBe(false);
    expect(mockFetchDirections).not.toHaveBeenCalled();
  });

  it("item 좌표 (0,0) → API 미호출", async () => {
    const zeroItem = { ...BASE_ITEM, location: { lat: 0, lng: 0 } };
    const { verifyItemDistance } = await import("@/lib/services/distance-verification");
    const result = await verifyItemDistance({ item: zeroItem, nextItem: NEXT_ITEM });
    expect(mockFetchDirections).not.toHaveBeenCalled();
    expect(result.reason).toContain("좌표");
  });

  it("nextItem 좌표 (0,0) → API 미호출", async () => {
    const zeroNext = { ...NEXT_ITEM, location: { lat: 0, lng: 0 } };
    const { verifyItemDistance } = await import("@/lib/services/distance-verification");
    const result = await verifyItemDistance({ item: BASE_ITEM, nextItem: zeroNext });
    expect(mockFetchDirections).not.toHaveBeenCalled();
    expect(result.reason).toContain("좌표");
  });

  it("Directions 'demo' → source 'fallback' + verified false", async () => {
    mockFetchDirections.mockResolvedValue({ mode: "demo" });
    const { verifyItemDistance } = await import("@/lib/services/distance-verification");
    const result = await verifyItemDistance({ item: BASE_ITEM, nextItem: NEXT_ITEM });
    expect(result.source).toBe("fallback");
    expect(result.verified).toBe(false);
  });

  it("Directions 'found' + 충분한 갭 → status 'verified'", async () => {
    mockFetchDirections.mockResolvedValue({
      mode: "found",
      durationSeconds: 600, // 10분
      distanceMeters: 2000,
      cached: false,
    });
    const { verifyItemDistance } = await import("@/lib/services/distance-verification");
    const result = await verifyItemDistance({ item: BASE_ITEM, nextItem: NEXT_ITEM });
    expect(result.travelMinutes).toBeCloseTo(10);
    expect(result.status).toBe("verified");
    expect(result.verified).toBe(true);
  });

  it("Directions 'not_found' → fallback Haversine 사용", async () => {
    mockFetchDirections.mockResolvedValue({ mode: "not_found", cached: false });
    const { verifyItemDistance } = await import("@/lib/services/distance-verification");
    const result = await verifyItemDistance({ item: BASE_ITEM, nextItem: NEXT_ITEM });
    expect(result.distanceKm).not.toBeNull();
    expect(result.source).not.toBe("none");
  });

  it("Directions 'error' → fallback Haversine 사용", async () => {
    mockFetchDirections.mockResolvedValue({ mode: "error", code: "network" });
    const { verifyItemDistance } = await import("@/lib/services/distance-verification");
    const result = await verifyItemDistance({ item: BASE_ITEM, nextItem: NEXT_ITEM });
    expect(result.distanceKm).not.toBeNull();
  });

  it("API에 올바른 origin/destination 전달", async () => {
    mockFetchDirections.mockResolvedValue({ mode: "demo" });
    const { verifyItemDistance } = await import("@/lib/services/distance-verification");
    await verifyItemDistance({ item: BASE_ITEM, nextItem: NEXT_ITEM });
    expect(mockFetchDirections).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: BASE_ITEM.location,
        destination: NEXT_ITEM.location,
      }),
    );
  });

  it("먼 거리 (50km+) → driving mode 전달", async () => {
    const farNext = { ...NEXT_ITEM, location: { lat: 10.7, lng: 103.96 } };
    mockFetchDirections.mockResolvedValue({ mode: "demo" });
    const { verifyItemDistance } = await import("@/lib/services/distance-verification");
    await verifyItemDistance({ item: BASE_ITEM, nextItem: farNext });
    expect(mockFetchDirections).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "driving" }),
    );
  });

  it("가까운 거리 (1km 이내) → walking mode 전달", async () => {
    const nearNext = { ...NEXT_ITEM, location: { lat: 10.225, lng: 103.965 } };
    mockFetchDirections.mockResolvedValue({ mode: "demo" });
    const { verifyItemDistance } = await import("@/lib/services/distance-verification");
    await verifyItemDistance({ item: BASE_ITEM, nextItem: nearNext });
    expect(mockFetchDirections).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "walking" }),
    );
  });

  it("갭 부족 + 이동시간 초과 → 'mismatch'", async () => {
    // 갭: (11:00 - 09:00) - 60min = 60분, gapWithFlex = 60 + 15 = 75분
    // actualTravel: 90분 > 75분 → mismatch
    mockFetchDirections.mockResolvedValue({
      mode: "found",
      durationSeconds: 5400, // 90분
      distanceMeters: 50000,
      cached: false,
    });
    const { verifyItemDistance } = await import("@/lib/services/distance-verification");
    const result = await verifyItemDistance({ item: BASE_ITEM, nextItem: NEXT_ITEM });
    expect(result.status).toBe("mismatch");
    expect(result.verified).toBe(false);
  });
});
