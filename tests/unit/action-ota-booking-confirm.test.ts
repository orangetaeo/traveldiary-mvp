/**
 * actions/ota-booking-confirm.ts 단위 테스트.
 *
 * confirmOtaBookingAction — confirmed/declined 분기 + dwellMs 계산 + audit log.
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

import { confirmOtaBookingAction } from "@/actions/ota-booking-confirm";

describe("confirmOtaBookingAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetActorId.mockResolvedValue("user-1");
    mockWriteAuditLog.mockResolvedValue(undefined);
  });

  const BASE_INPUT = {
    offerId: "offer-1",
    itemId: "item-1",
    ota: "klook",
    priceKrw: 39000,
    clickedAt: Date.now() - 5000,
    decision: "confirmed" as const,
  };

  it("confirmed → ok + affiliate.confirmed audit", async () => {
    const result = await confirmOtaBookingAction(BASE_INPUT);

    expect(result).toEqual({ ok: true });
    expect(mockWriteAuditLog).toHaveBeenCalledOnce();
    const log = mockWriteAuditLog.mock.calls[0][0];
    expect(log.action).toBe("affiliate.confirmed");
    expect(log.after).toEqual({ decision: "confirmed" });
  });

  it("declined → ok + affiliate.declined audit", async () => {
    const result = await confirmOtaBookingAction({
      ...BASE_INPUT,
      decision: "declined",
    });

    expect(result).toEqual({ ok: true });
    const log = mockWriteAuditLog.mock.calls[0][0];
    expect(log.action).toBe("affiliate.declined");
    expect(log.after).toEqual({ decision: "declined" });
  });

  it("audit log — resource + resourceId", async () => {
    await confirmOtaBookingAction(BASE_INPUT);

    const log = mockWriteAuditLog.mock.calls[0][0];
    expect(log.resource).toBe("OtaOffer");
    expect(log.resourceId).toBe("offer-1");
  });

  it("audit metadata — ota, itemId, priceKrw, dwellMs", async () => {
    await confirmOtaBookingAction(BASE_INPUT);

    const log = mockWriteAuditLog.mock.calls[0][0];
    expect(log.metadata.source).toBe("web");
    expect(log.metadata.ota).toBe("klook");
    expect(log.metadata.itemId).toBe("item-1");
    expect(log.metadata.priceKrw).toBe(39000);
    expect(log.metadata.dwellMs).toBeGreaterThanOrEqual(0);
  });

  it("dwellMs = Date.now() - clickedAt (음수 방어)", async () => {
    // clickedAt이 미래 → dwellMs = Math.max(0, ...) = 0
    await confirmOtaBookingAction({
      ...BASE_INPUT,
      clickedAt: Date.now() + 10000,
    });

    const log = mockWriteAuditLog.mock.calls[0][0];
    expect(log.metadata.dwellMs).toBe(0);
  });

  it("actorId 전달", async () => {
    mockGetActorId.mockResolvedValue("user-xyz");

    await confirmOtaBookingAction(BASE_INPUT);

    const log = mockWriteAuditLog.mock.calls[0][0];
    expect(log.actorId).toBe("user-xyz");
  });

  it("미인증 → actorId=null", async () => {
    mockGetActorId.mockResolvedValue(null);

    await confirmOtaBookingAction(BASE_INPUT);

    const log = mockWriteAuditLog.mock.calls[0][0];
    expect(log.actorId).toBeNull();
  });
});
