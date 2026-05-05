/**
 * Place Verification Server Action 단위 테스트 — Batch 41a.
 *
 * actions/place.ts:
 *  - verifyPlaceAction (deprecated, 4 경로: verified fresh, not_found fresh, cached, error)
 *  - validateItemAction (forbidden, cached hit, fresh ok, try/catch fallbacks)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

/* ──────── Mocks ──────── */

const mockWriteAuditLog = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/audit-log", () => ({
  writeAuditLog: (...args: unknown[]) => mockWriteAuditLog(...args),
}));

const mockGetActorId = vi.fn<() => Promise<string | null>>();
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
const mockCreateValidation = vi.fn();
const mockGetRecentValidation = vi.fn();
vi.mock("@/lib/repositories/validation.repository", () => ({
  canValidateItem: (...args: unknown[]) => mockCanValidateItem(...args),
  createValidation: (...args: unknown[]) => mockCreateValidation(...args),
  getRecentValidation: (...args: unknown[]) => mockGetRecentValidation(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {},
  isDbConnected: true,
}));

/* ════════════════════════════════════════════
 * verifyPlaceAction (deprecated)
 * ════════════════════════════════════════════ */

describe("actions/place — verifyPlaceAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockGetActorId.mockResolvedValue("user-1");
  });

  it("verified + fresh → audit 기록", async () => {
    mockVerifyPlace.mockResolvedValue({
      mode: "verified",
      cached: false,
      placeExists: true,
      operatingStatus: "open",
      placeId: "ChIJ...",
      rating: 4.5,
      userRatingsTotal: 200,
      fetchDurationMs: 150,
    });
    const { verifyPlaceAction } = await import("@/actions/place");
    const result = await verifyPlaceAction({ itemId: "it-1", name: "바나힐" });
    expect(result.mode).toBe("verified");
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "evidence.gathered",
        resourceId: "it-1",
        metadata: expect.objectContaining({ source: "google", cached: false }),
      }),
    );
  });

  it("verified + cached → audit 미기록", async () => {
    mockVerifyPlace.mockResolvedValue({
      mode: "verified",
      cached: true,
      placeExists: true,
      operatingStatus: "open",
      placeId: "ChIJ...",
    });
    const { verifyPlaceAction } = await import("@/actions/place");
    await verifyPlaceAction({ itemId: "it-1", name: "바나힐" });
    expect(mockWriteAuditLog).not.toHaveBeenCalled();
  });

  it("not_found + fresh → audit 기록 (placeExists: false)", async () => {
    mockVerifyPlace.mockResolvedValue({
      mode: "not_found",
      cached: false,
      placeExists: false,
      fetchDurationMs: 80,
    });
    const { verifyPlaceAction } = await import("@/actions/place");
    const result = await verifyPlaceAction({ itemId: "it-2", name: "없는곳" });
    expect(result.mode).toBe("not_found");
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        after: { placeExists: false },
      }),
    );
  });

  it("error → audit with error metadata", async () => {
    mockVerifyPlace.mockResolvedValue({
      mode: "error",
      code: "api_error",
      message: "quota exceeded",
    });
    const { verifyPlaceAction } = await import("@/actions/place");
    const result = await verifyPlaceAction({ itemId: "it-3", name: "문제" });
    expect(result.mode).toBe("error");
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ error: "api_error" }),
      }),
    );
  });
});

/* ════════════════════════════════════════════
 * validateItemAction
 * ════════════════════════════════════════════ */

describe("actions/place — validateItemAction", () => {
  const baseItem = {
    id: "item-1",
    name: "바나힐",
    category: "spot" as const,
    location: { lat: 15.9, lng: 107.9, address: "Da Nang" },
    scheduledAt: "2026-06-01T09:00:00Z",
    durationMinutes: 120,
    flexibility: "flexible" as const,
    priority: 3 as const,
    flexMinutes: 30,
    dependencies: [],
    evidence: { sources: [], reasons: [] },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mockGetActorId.mockResolvedValue("user-1");
    mockCanValidateItem.mockResolvedValue("trip-1");
    mockGetRecentValidation.mockResolvedValue(null);
    mockCreateValidation.mockResolvedValue({ id: "vr-1", validatedAt: new Date("2026-06-01T10:00:00Z") });
    mockVerifyPlace.mockResolvedValue({
      mode: "verified",
      cached: false,
      placeExists: true,
      operatingStatus: "open",
      placeId: "ChIJ...",
      types: ["tourist_attraction"],
      rating: 4.5,
      userRatingsTotal: 200,
      fetchDurationMs: 100,
    });
    mockDetermineBookingRequired.mockReturnValue({
      required: false,
      reason: "관광지 예약 불필요",
      source: "rule",
    });
    mockVerifyItemPrice.mockResolvedValue({
      status: "no_offers",
      verified: false,
      reason: "OTA 매칭 없음",
      deltaPct: null,
      medianOtaPriceKrw: null,
      otaSourceCount: 0,
    });
    mockVerifyItemDistance.mockResolvedValue({
      status: "verified",
      verified: true,
      reason: "이동 거리 적정",
      travelMinutes: 15,
      gapMinutes: 30,
      distanceKm: 5.2,
      mode: "driving",
      source: "google_directions",
    });
  });

  it("forbidden (DB 연결 + 권한 없음) → { mode: 'forbidden' }", async () => {
    mockCanValidateItem.mockResolvedValue(null);
    const { validateItemAction } = await import("@/actions/place");
    const result = await validateItemAction({ item: baseItem });
    expect(result).toEqual({ mode: "forbidden" });
  });

  it("24h 캐시 hit → cached: true, audit 미기록", async () => {
    mockGetRecentValidation.mockResolvedValue({
      id: "vr-cached",
      placeExists: true,
      operatingStatus: "open",
      bookingRequired: false,
      distanceVerified: true,
      priceVerified: false,
      priceStatus: "no_offers",
      distanceStatus: "verified",
      validatedAt: new Date("2026-06-01T08:00:00Z"),
    });
    const { validateItemAction } = await import("@/actions/place");
    const result = await validateItemAction({ item: baseItem });
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.cached).toBe(true);
      expect(result.validationId).toBe("vr-cached");
    }
    expect(mockWriteAuditLog).not.toHaveBeenCalled();
    expect(mockVerifyPlace).not.toHaveBeenCalled();
  });

  it("fresh 전체 검증 → mode: 'ok', cached: false, audit 2건", async () => {
    const { validateItemAction } = await import("@/actions/place");
    const result = await validateItemAction({ item: baseItem });
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.cached).toBe(false);
      expect(result.placeExists).toBe(true);
      expect(result.operatingStatus).toBe("open");
      expect(result.validationId).toBe("vr-1");
    }
    // validation.completed + evidence.gathered (place fresh)
    expect(mockWriteAuditLog).toHaveBeenCalledTimes(2);
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "validation.completed" }),
    );
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "evidence.gathered", metadata: expect.objectContaining({ viaValidateItem: true }) }),
    );
  });

  it("place not_found → placeExists: false, operatingStatus: 'closed'", async () => {
    mockVerifyPlace.mockResolvedValue({
      mode: "not_found",
      cached: false,
      placeExists: false,
      fetchDurationMs: 50,
    });
    const { validateItemAction } = await import("@/actions/place");
    const result = await validateItemAction({ item: baseItem });
    expect(result.mode).toBe("ok");
    if (result.mode === "ok") {
      expect(result.placeExists).toBe(false);
      expect(result.operatingStatus).toBe("closed");
    }
  });

  it("place demo → placeExists: true, operatingStatus: 'demo'", async () => {
    mockVerifyPlace.mockResolvedValue({ mode: "demo" });
    const { validateItemAction } = await import("@/actions/place");
    const result = await validateItemAction({ item: baseItem });
    if (result.mode === "ok") {
      expect(result.placeExists).toBe(true);
      expect(result.operatingStatus).toBe("demo");
    }
  });

  it("booking rule throw → fallback", async () => {
    mockDetermineBookingRequired.mockImplementation(() => { throw new Error("rule crash"); });
    const { validateItemAction } = await import("@/actions/place");
    const result = await validateItemAction({ item: baseItem });
    if (result.mode === "ok") {
      expect(result.booking.required).toBe(false);
      expect(result.booking.source).toBe("fallback");
    }
  });

  it("price verify throw → fallback", async () => {
    mockVerifyItemPrice.mockRejectedValue(new Error("OTA down"));
    const { validateItemAction } = await import("@/actions/place");
    const result = await validateItemAction({ item: baseItem });
    if (result.mode === "ok") {
      expect(result.price.status).toBe("no_offers");
      expect(result.price.verified).toBe(false);
    }
  });

  it("distance verify throw → fallback", async () => {
    mockVerifyItemDistance.mockRejectedValue(new Error("directions API err"));
    const { validateItemAction } = await import("@/actions/place");
    const result = await validateItemAction({ item: baseItem });
    if (result.mode === "ok") {
      expect(result.distance.status).toBe("missing_location");
      expect(result.distance.verified).toBe(false);
    }
  });

  it("createValidation null → validationId: null", async () => {
    mockCreateValidation.mockResolvedValue(null);
    const { validateItemAction } = await import("@/actions/place");
    const result = await validateItemAction({ item: baseItem });
    if (result.mode === "ok") {
      expect(result.validationId).toBeNull();
    }
  });
});
