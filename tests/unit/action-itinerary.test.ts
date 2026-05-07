/**
 * actions/itinerary.ts 단위 테스트.
 *
 * addItineraryItem + reorderItineraryItems — 데모/권한/DB/audit 분기.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockWriteAuditLog = vi.fn();
vi.mock("@/lib/audit-log", () => ({
  writeAuditLog: (...args: unknown[]) => mockWriteAuditLog(...args),
}));

const mockGetActorId = vi.fn();
vi.mock("@/lib/auth/session", () => ({
  getActorId: () => mockGetActorId(),
}));

const mockCanWriteTrip = vi.fn();
vi.mock("@/lib/auth/authorize", () => ({
  canWriteTrip: (...args: unknown[]) => mockCanWriteTrip(...args),
  canWriteTripOrViaShareLink: (...args: unknown[]) => mockCanWriteTrip(...args),
}));

const mockResolveActorIdForTrip = vi.fn();
vi.mock("@/lib/auth/actor-resolution", () => ({
  resolveActorIdForTrip: (...args: unknown[]) => mockResolveActorIdForTrip(...args),
}));

const mockRepoAddItem = vi.fn();
const mockRepoReorder = vi.fn();
vi.mock("@/lib/repositories/trip.repository", () => ({
  addItineraryItem: (...args: unknown[]) => mockRepoAddItem(...args),
  reorderItineraryItems: (...args: unknown[]) => mockRepoReorder(...args),
}));

let mockIsDbConnected = true;
vi.mock("@/lib/prisma", () => ({
  get isDbConnected() { return mockIsDbConnected; },
}));

vi.mock("@/lib/seed", () => ({
  DEMO_TRIP_ID: "demo-trip-danang",
}));

import { addItineraryItem, reorderItineraryItems } from "@/actions/itinerary";

describe("itinerary actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsDbConnected = true;
    mockGetActorId.mockResolvedValue("user-1");
    mockCanWriteTrip.mockResolvedValue(true);
    mockResolveActorIdForTrip.mockReturnValue("actor-1");
    mockWriteAuditLog.mockResolvedValue(undefined);
  });

  // ─── addItineraryItem ────────────────────────────────────────

  describe("addItineraryItem", () => {
    const input = {
      tripId: "t1",
      dayIndex: 0,
      scheduledAt: "2026-07-01T10:00:00Z",
      name: "미케 비치",
      category: "spot" as const,
    };

    it("DB 미연결 → demo", async () => {
      mockIsDbConnected = false;
      expect(await addItineraryItem(input)).toEqual({ ok: true, demo: true });
    });

    it("데모 trip ID → demo", async () => {
      expect(await addItineraryItem({ ...input, tripId: "demo-trip-danang" })).toEqual({ ok: true, demo: true });
    });

    it("권한 없음 → forbidden", async () => {
      mockCanWriteTrip.mockResolvedValue(false);
      expect(await addItineraryItem(input)).toEqual({ ok: false, code: "forbidden" });
    });

    it("DB 실패 → internal", async () => {
      mockRepoAddItem.mockResolvedValue(null);
      expect(await addItineraryItem(input)).toEqual({ ok: false, code: "internal" });
    });

    it("성공 → ok + audit itinerary.create", async () => {
      const item = { id: "i-1", tripId: "t1", dayIndex: 0, scheduledAt: "2026-07-01T10:00:00Z", name: "미케 비치", category: "spot" };
      mockRepoAddItem.mockResolvedValue(item);

      const r = await addItineraryItem(input);
      expect(r).toMatchObject({ ok: true, demo: false, data: item });
      const log = mockWriteAuditLog.mock.calls[0][0];
      expect(log.action).toBe("itinerary.create");
      expect(log.metadata.origin).toBe("manual");
    });
  });

  // ─── reorderItineraryItems ───────────────────────────────────

  describe("reorderItineraryItems", () => {
    const input = {
      tripId: "t1",
      changes: [{ id: "i-1", scheduledAt: "2026-07-01T11:00:00Z" }],
    };

    it("DB 미연결 → demo", async () => {
      mockIsDbConnected = false;
      expect(await reorderItineraryItems(input)).toEqual({ ok: true, demo: true });
    });

    it("데모 trip ID → demo", async () => {
      expect(await reorderItineraryItems({ ...input, tripId: "demo-trip-danang" })).toEqual({ ok: true, demo: true });
    });

    it("권한 없음 → forbidden", async () => {
      mockCanWriteTrip.mockResolvedValue(false);
      expect(await reorderItineraryItems(input)).toEqual({ ok: false, code: "forbidden" });
    });

    it("빈 changes → internal", async () => {
      expect(await reorderItineraryItems({ tripId: "t1", changes: [] })).toEqual({ ok: false, code: "internal" });
    });

    it("DB 실패 → internal", async () => {
      mockRepoReorder.mockResolvedValue(null);
      expect(await reorderItineraryItems(input)).toEqual({ ok: false, code: "internal" });
    });

    it("성공 → ok + changedCount + audit", async () => {
      mockRepoReorder.mockResolvedValue({ tripUpdatedAt: "2026-07-01T01:00:00Z" });

      const r = await reorderItineraryItems(input);
      expect(r).toMatchObject({ ok: true, demo: false, changedCount: 1, tripUpdatedAt: "2026-07-01T01:00:00Z" });
      const log = mockWriteAuditLog.mock.calls[0][0];
      expect(log.action).toBe("itinerary.reorder");
      expect(log.metadata.origin).toBe("drag");
      expect(log.metadata.changedCount).toBe(1);
    });
  });
});
