/**
 * actions/place.ts 단위 테스트.
 *
 * validateItemAction — 5단계 종합 검증.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockWriteAuditLog = vi.fn();
vi.mock("@/lib/audit-log", () => ({
  writeAuditLog: (...args: unknown[]) => mockWriteAuditLog(...args),
}));

const mockGetActorId = vi.fn();
vi.mock("@/lib/auth/session", () => ({
  getActorId: () => mockGetActorId(),
}));

const mockVerifyPlace = vi.fn();
vi.mock("@/lib/services/place-verification", () => ({
  verifyPlace: (...args: unknown[]) => mockVerifyPlace(...args),
}));

const mockDetermineBookingRequired = vi.fn();
vi.mock("@/lib/services/booking-rules", () => ({
  determineBookingRequired: (...args: unknown[]) => mockDetermineBookingRequired(...args),
}));

const mockVerifyItemPrice = vi.fn();
vi.mock("@/lib/services/price-verification", () => ({
  verifyItemPrice: (...args: unknown[]) => mockVerifyItemPrice(...args),
}));

const mockVerifyItemDistance = vi.fn();
vi.mock("@/lib/services/distance-verification", () => ({
  verifyItemDistance: (...args: unknown[]) => mockVerifyItemDistance(...args),
}));

const mockCanValidateItem = vi.fn();
const mockGetRecentValidation = vi.fn();
const mockCreateValidation = vi.fn();
vi.mock("@/lib/repositories/validation.repository", () => ({
  canValidateItem: (...args: unknown[]) => mockCanValidateItem(...args),
  getRecentValidation: (...args: unknown[]) => mockGetRecentValidation(...args),
  createValidation: (...args: unknown[]) => mockCreateValidation(...args),
}));

let mockIsDbConnected = true;
vi.mock("@/lib/prisma", () => ({
  get isDbConnected() { return mockIsDbConnected; },
}));

vi.mock("@/actions/place-cache-utils", () => ({
  deriveCachedOpStatus: (s: string) => s === "open" || s === "closed" ? s : "demo",
  derivePriceFromCache: () => ({ status: "verified", verified: true, reason: "캐시", deltaPct: null, medianOtaPriceKrw: null, otaSourceCount: 0 }),
  deriveDistanceFromCache: () => ({ status: "verified", verified: true, reason: "캐시", travelMinutes: null, gapMinutes: null, distanceKm: null, mode: null, source: "none" }),
  deriveGoogleFromCache: () => ({ mode: "demo" }),
}));

import { validateItemAction } from "@/actions/place";

const MOCK_ITEM = {
  id: "item-1",
  name: "미케 비치",
  category: "spot" as const,
  location: { lat: 16.06, lng: 108.24, address: "다낭" },
  scheduledAt: "2026-07-01T10:00:00Z",
  durationMinutes: 90,
  flexibility: "flexible" as const,
  priority: 2 as const,
  flexMinutes: 30,
  dependencies: [],
  evidence: {
    overall: "verified" as const,
    breakdown: [],
    lastChecked: new Date().toISOString(),
  },
};

// ═══════════════════════════════════════════════════════════════
// validateItemAction
// ═══════════════════════════════════════════════════════════════

describe("validateItemAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsDbConnected = true;
    mockGetActorId.mockResolvedValue("user-1");
    mockWriteAuditLog.mockResolvedValue(undefined);
    mockCanValidateItem.mockResolvedValue("trip-1");
    mockGetRecentValidation.mockResolvedValue(null);
    mockCreateValidation.mockResolvedValue({ id: "vr-1", validatedAt: new Date("2026-07-01") });

    // 기본 서비스 mock
    mockVerifyPlace.mockResolvedValue({ mode: "demo" });
    mockDetermineBookingRequired.mockReturnValue({
      required: false,
      reason: "관광지",
      source: "rule",
    });
    mockVerifyItemPrice.mockResolvedValue({
      status: "no_offers",
      verified: false,
      reason: "OTA 미응답",
      deltaPct: null,
      medianOtaPriceKrw: null,
      otaSourceCount: 0,
    });
    mockVerifyItemDistance.mockResolvedValue({
      status: "no_next",
      verified: false,
      reason: "다음 일정 없음",
      travelMinutes: null,
      gapMinutes: null,
      distanceKm: null,
      mode: null,
      source: "none",
    });
  });

  it("권한 없음 (DB 연결) → forbidden", async () => {
    mockCanValidateItem.mockResolvedValue(null);
    const r = await validateItemAction({ item: MOCK_ITEM });
    expect(r.mode).toBe("forbidden");
  });

  it("24h 캐시 hit → ok + cached=true (서비스 미호출)", async () => {
    mockGetRecentValidation.mockResolvedValue({
      id: "vr-cached",
      placeExists: true,
      operatingStatus: "open",
      bookingRequired: false,
      distanceVerified: true,
      priceVerified: true,
      priceStatus: null,
      distanceStatus: null,
      validatedAt: new Date("2026-07-01"),
    });

    const r = await validateItemAction({ item: MOCK_ITEM });
    expect(r.mode).toBe("ok");
    if (r.mode === "ok") {
      expect(r.cached).toBe(true);
      expect(r.validationId).toBe("vr-cached");
    }
    expect(mockVerifyPlace).not.toHaveBeenCalled();
    expect(mockVerifyItemPrice).not.toHaveBeenCalled();
  });

  it("verified place → placeExists=true + operatingStatus", async () => {
    mockVerifyPlace.mockResolvedValue({
      mode: "verified",
      placeExists: true,
      operatingStatus: "open",
      types: ["restaurant"],
      rating: 4.5,
      userRatingsTotal: 200,
      cached: false,
      fetchDurationMs: 100,
    });

    const r = await validateItemAction({ item: MOCK_ITEM });
    if (r.mode === "ok") {
      expect(r.placeExists).toBe(true);
      expect(r.operatingStatus).toBe("open");
      expect(r.cached).toBe(false);
    }
  });

  it("not_found place → placeExists=false + closed", async () => {
    mockVerifyPlace.mockResolvedValue({
      mode: "not_found",
      placeExists: false,
      cached: false,
      fetchDurationMs: 80,
    });

    const r = await validateItemAction({ item: MOCK_ITEM });
    if (r.mode === "ok") {
      expect(r.placeExists).toBe(false);
      expect(r.operatingStatus).toBe("closed");
    }
  });

  it("error place → demo fallback (placeExists=true)", async () => {
    mockVerifyPlace.mockResolvedValue({
      mode: "error",
      code: "network",
      message: "timeout",
    });

    const r = await validateItemAction({ item: MOCK_ITEM });
    if (r.mode === "ok") {
      expect(r.placeExists).toBe(true);
      expect(r.operatingStatus).toBe("demo");
    }
  });

  it("audit validation.completed 기록 (fresh)", async () => {
    const r = await validateItemAction({ item: MOCK_ITEM });
    expect(r.mode).toBe("ok");

    // 최소 1회 validation.completed audit log
    const validationLog = mockWriteAuditLog.mock.calls.find(
      (c: unknown[]) => (c[0] as { action: string }).action === "validation.completed",
    );
    expect(validationLog).toBeTruthy();
  });

  it("booking rule 예외 → fallback", async () => {
    mockDetermineBookingRequired.mockImplementation(() => {
      throw new Error("rule error");
    });

    const r = await validateItemAction({ item: MOCK_ITEM });
    if (r.mode === "ok") {
      expect(r.booking.required).toBe(false);
      expect(r.booking.source).toBe("fallback");
    }
  });

  it("price 예외 → no_offers fallback", async () => {
    mockVerifyItemPrice.mockRejectedValue(new Error("OTA crash"));

    const r = await validateItemAction({ item: MOCK_ITEM });
    if (r.mode === "ok") {
      expect(r.price.status).toBe("no_offers");
      expect(r.price.verified).toBe(false);
    }
  });

  it("distance 예외 → missing_location fallback", async () => {
    mockVerifyItemDistance.mockRejectedValue(new Error("Directions fail"));

    const r = await validateItemAction({ item: MOCK_ITEM });
    if (r.mode === "ok") {
      expect(r.distance.status).toBe("missing_location");
      expect(r.distance.verified).toBe(false);
    }
  });

  it("DB 저장 성공 → validationId 반환", async () => {
    const r = await validateItemAction({ item: MOCK_ITEM });
    if (r.mode === "ok") {
      expect(r.validationId).toBe("vr-1");
    }
  });

  it("DB 저장 실패 → validationId=null (에러 안 남)", async () => {
    mockCreateValidation.mockResolvedValue(null);

    const r = await validateItemAction({ item: MOCK_ITEM });
    if (r.mode === "ok") {
      expect(r.validationId).toBeNull();
    }
  });

  it("place fresh → evidence.gathered audit 추가 발행", async () => {
    mockVerifyPlace.mockResolvedValue({
      mode: "verified",
      placeExists: true,
      operatingStatus: "open",
      cached: false,
      fetchDurationMs: 100,
    });

    await validateItemAction({ item: MOCK_ITEM });

    const evidenceLogs = mockWriteAuditLog.mock.calls.filter(
      (c: unknown[]) => (c[0] as { action: string }).action === "evidence.gathered",
    );
    expect(evidenceLogs.length).toBeGreaterThan(0);
    expect(evidenceLogs[0][0].metadata.viaValidateItem).toBe(true);
  });

  it("googleResult 반환 (5단계 E ADR-031)", async () => {
    mockVerifyPlace.mockResolvedValue({ mode: "demo" });

    const r = await validateItemAction({ item: MOCK_ITEM });
    if (r.mode === "ok") {
      expect(r.googleResult).toEqual({ mode: "demo" });
    }
  });
});
