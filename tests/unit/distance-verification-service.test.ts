/**
 * lib/services/distance-verification.ts 단위 테스트.
 *
 * verifyItemDistance — fetchDirections + compareDistanceVerification 오케스트레이션.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockFetchDirections = vi.fn();
vi.mock("@/lib/services/google-directions", () => ({
  fetchDirections: (...args: unknown[]) => mockFetchDirections(...args),
}));

// distance-rules는 실제 사용 (순수 함수 — mock 불필요)
// geo도 실제 사용

import { verifyItemDistance } from "@/lib/services/distance-verification";

const makeItem = (overrides?: Partial<{
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  flexMinutes: number;
  location: { lat: number; lng: number; address: string };
}>) => ({
  id: "item-1",
  scheduledAt: "2026-05-10T09:00:00Z",
  durationMinutes: 60,
  flexMinutes: 15,
  location: { lat: 16.047, lng: 108.206, address: "다낭" },
  ...overrides,
});

const makeNextItem = (overrides?: Partial<{
  scheduledAt: string;
  location: { lat: number; lng: number; address: string };
}>) => ({
  scheduledAt: "2026-05-10T11:00:00Z",
  location: { lat: 16.060, lng: 108.220, address: "호이안" },
  ...overrides,
});

describe("distance-verification service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── early return: 다음 일정 없음 ─────────────────────────

  it("nextItem null → Directions 미호출", async () => {
    const r = await verifyItemDistance({
      item: makeItem(),
      nextItem: null,
    });
    expect(r).toBeDefined();
    expect(mockFetchDirections).not.toHaveBeenCalled();
  });

  // ─── early return: 좌표 누락 ──────────────────────────────

  it("item 좌표 lat=0, lng=0 → Directions 미호출", async () => {
    const r = await verifyItemDistance({
      item: makeItem({ location: { lat: 0, lng: 0, address: "" } }),
      nextItem: makeNextItem(),
    });
    expect(r).toBeDefined();
    expect(mockFetchDirections).not.toHaveBeenCalled();
  });

  it("nextItem 좌표 누락 → Directions 미호출", async () => {
    const r = await verifyItemDistance({
      item: makeItem(),
      nextItem: makeNextItem({ location: { lat: 0, lng: 0, address: "" } }),
    });
    expect(r).toBeDefined();
    expect(mockFetchDirections).not.toHaveBeenCalled();
  });

  // ─── Directions demo → fallback ──────────────────────────

  it("Directions demo → status 포함 결과 (demo fallback)", async () => {
    mockFetchDirections.mockResolvedValue({ mode: "demo" });

    const r = await verifyItemDistance({
      item: makeItem(),
      nextItem: makeNextItem(),
    });
    expect(r).toBeDefined();
    expect(r.source).toBe("fallback");
    expect(mockFetchDirections).toHaveBeenCalledOnce();
  });

  // ─── Directions found → actualTravelMinutes 전달 ──────────

  it("Directions found → compareDistanceVerification에 실제 소요 시간 전달", async () => {
    mockFetchDirections.mockResolvedValue({
      mode: "found",
      durationSeconds: 1800, // 30분
      distanceMeters: 25000,
      cached: false,
    });

    const r = await verifyItemDistance({
      item: makeItem(),
      nextItem: makeNextItem(),
    });
    expect(r).toBeDefined();
    // 60분 활동 + 30분 이동 = 90분, 다음 일정까지 120분 → verified 가능
    expect(typeof r.status).toBe("string");
  });

  // ─── Directions not_found → fallback ──────────────────────

  it("Directions not_found → Haversine fallback", async () => {
    mockFetchDirections.mockResolvedValue({ mode: "not_found", cached: false });

    const r = await verifyItemDistance({
      item: makeItem(),
      nextItem: makeNextItem(),
    });
    expect(r).toBeDefined();
    expect(mockFetchDirections).toHaveBeenCalledOnce();
  });

  // ─── Directions error → fallback ──────────────────────────

  it("Directions error → 회귀 안전 fallback", async () => {
    mockFetchDirections.mockResolvedValue({
      mode: "error",
      code: "google_api_error",
      message: "HTTP 500",
    });

    const r = await verifyItemDistance({
      item: makeItem(),
      nextItem: makeNextItem(),
    });
    expect(r).toBeDefined();
    expect(mockFetchDirections).toHaveBeenCalledOnce();
  });

  // ─── Directions 호출 인자 확인 ─────────────────────────────

  it("Directions에 origin/destination/mode 전달", async () => {
    mockFetchDirections.mockResolvedValue({ mode: "demo" });

    await verifyItemDistance({
      item: makeItem(),
      nextItem: makeNextItem(),
    });

    const call = mockFetchDirections.mock.calls[0][0];
    expect(call).toMatchObject({
      origin: { lat: 16.047, lng: 108.206 },
      destination: { lat: 16.060, lng: 108.220 },
    });
    expect(typeof call.mode).toBe("string");
  });

  // ─── 가까운 거리 → walking, 먼 거리 → driving ────────────

  it("가까운 거리 → walking 모드", async () => {
    mockFetchDirections.mockResolvedValue({ mode: "demo" });

    await verifyItemDistance({
      item: makeItem({ location: { lat: 16.047, lng: 108.206, address: "A" } }),
      nextItem: makeNextItem({ location: { lat: 16.0475, lng: 108.2065, address: "B" } }),
    });

    const call = mockFetchDirections.mock.calls[0][0];
    expect(call.mode).toBe("walking");
  });

  it("먼 거리 → driving 모드", async () => {
    mockFetchDirections.mockResolvedValue({ mode: "demo" });

    await verifyItemDistance({
      item: makeItem({ location: { lat: 16.047, lng: 108.206, address: "다낭" } }),
      nextItem: makeNextItem({ location: { lat: 21.028, lng: 105.854, address: "하노이" } }),
    });

    const call = mockFetchDirections.mock.calls[0][0];
    expect(call.mode).toBe("driving");
  });
});
