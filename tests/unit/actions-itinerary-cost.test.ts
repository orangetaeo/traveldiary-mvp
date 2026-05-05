/**
 * Itinerary + Cost Server Action 단위 테스트 — Batch 38.
 *
 * actions/itinerary.ts: addItineraryItem, reorderItineraryItems
 * actions/cost.ts: addCost (대표 1개 — 나머지는 동일 패턴)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

/* ──────── Mocks ──────── */

vi.mock("server-only", () => ({}));

const mockWriteAuditLog = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/audit-log", () => ({
  writeAuditLog: (...args: unknown[]) => mockWriteAuditLog(...args),
}));

const mockGetActorId = vi.fn<() => Promise<string | null>>();
vi.mock("@/lib/auth/session", () => ({
  getActorId: () => mockGetActorId(),
  getOwnerId: () => Promise.resolve("user-1"),
}));

const mockCanWriteTrip = vi.fn<() => Promise<boolean>>();
vi.mock("@/lib/auth/authorize", () => ({
  canWriteTrip: () => mockCanWriteTrip(),
}));

vi.mock("@/lib/auth/actor-resolution", () => ({
  resolveActorIdForTrip: (tripId: string, actorId: string | null) => {
    if (tripId === "demo-trip-pqc") return null;
    return actorId;
  },
}));

const mockAddItineraryItem = vi.fn();
const mockReorderItineraryItems = vi.fn();
const mockEnsureDemoTrip = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/repositories/trip.repository", () => ({
  addItineraryItem: (...args: unknown[]) => mockAddItineraryItem(...args),
  reorderItineraryItems: (...args: unknown[]) => mockReorderItineraryItems(...args),
  ensureDemoTripInDb: (...args: unknown[]) => mockEnsureDemoTrip(...args),
}));

const mockCreateCostEntry = vi.fn();
vi.mock("@/lib/repositories/cost.repository", () => ({
  createCostEntry: (...args: unknown[]) => mockCreateCostEntry(...args),
  deleteCostEntry: vi.fn(),
  settleCostEntry: vi.fn(),
  updateCostEntry: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {},
  isDbConnected: true,
}));

vi.mock("@/lib/seed", () => ({
  DEMO_TRIP_ID: "demo-trip-pqc",
  DEMO_TRIP_IDS: ["demo-trip-pqc"],
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

/* ════════════════════════════════════════════
 * actions/itinerary — addItineraryItem
 * ════════════════════════════════════════════ */

describe("actions/itinerary — addItineraryItem", () => {
  const input = {
    tripId: "trip-1",
    name: "바나힐",
    category: "spot" as const,
    dayIndex: 0,
    scheduledAt: "2026-06-01T09:00:00Z",
    durationMinutes: 120,
    location: { lat: 15.9, lng: 107.9, address: "Da Nang" },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mockCanWriteTrip.mockResolvedValue(true);
    mockGetActorId.mockResolvedValue("user-1");
  });

  it("DEMO trip → { ok: true, demo: true }", async () => {
    const { addItineraryItem } = await import("@/actions/itinerary");
    const result = await addItineraryItem({ ...input, tripId: "demo-trip-pqc" });
    expect(result).toEqual({ ok: true, demo: true });
  });

  it("forbidden → { ok: false, code: 'forbidden' }", async () => {
    mockCanWriteTrip.mockResolvedValue(false);
    const { addItineraryItem } = await import("@/actions/itinerary");
    const result = await addItineraryItem(input);
    expect(result).toEqual({ ok: false, code: "forbidden" });
  });

  it("repo 실패 → { ok: false, code: 'internal' }", async () => {
    mockAddItineraryItem.mockResolvedValue(null);
    const { addItineraryItem } = await import("@/actions/itinerary");
    const result = await addItineraryItem(input);
    expect(result).toEqual({ ok: false, code: "internal" });
  });

  it("성공 → { ok: true, demo: false, data } + audit", async () => {
    const mockItem = { id: "it-1", tripId: "trip-1", dayIndex: 0, scheduledAt: "2026-06-01T09:00:00Z", name: "바나힐", category: "spot" };
    mockAddItineraryItem.mockResolvedValue(mockItem);
    const { addItineraryItem } = await import("@/actions/itinerary");
    const result = await addItineraryItem(input);
    expect(result).toEqual({ ok: true, demo: false, data: mockItem });
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "itinerary.create",
        resource: "ItineraryItem",
        resourceId: "it-1",
      }),
    );
  });
});

/* ════════════════════════════════════════════
 * actions/itinerary — reorderItineraryItems
 * ════════════════════════════════════════════ */

describe("actions/itinerary — reorderItineraryItems", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockCanWriteTrip.mockResolvedValue(true);
    mockGetActorId.mockResolvedValue("user-1");
  });

  it("DEMO trip → { ok: true, demo: true }", async () => {
    const { reorderItineraryItems } = await import("@/actions/itinerary");
    const result = await reorderItineraryItems({
      tripId: "demo-trip-pqc",
      changes: [{ id: "a", scheduledAt: "T" }],
    });
    expect(result).toEqual({ ok: true, demo: true });
  });

  it("forbidden → forbidden", async () => {
    mockCanWriteTrip.mockResolvedValue(false);
    const { reorderItineraryItems } = await import("@/actions/itinerary");
    const result = await reorderItineraryItems({
      tripId: "trip-1",
      changes: [{ id: "a", scheduledAt: "T" }],
    });
    expect(result).toEqual({ ok: false, code: "forbidden" });
  });

  it("빈 changes → internal", async () => {
    const { reorderItineraryItems } = await import("@/actions/itinerary");
    const result = await reorderItineraryItems({
      tripId: "trip-1",
      changes: [],
    });
    expect(result).toEqual({ ok: false, code: "internal" });
  });

  it("repo null → internal", async () => {
    mockReorderItineraryItems.mockResolvedValue(null);
    const { reorderItineraryItems } = await import("@/actions/itinerary");
    const result = await reorderItineraryItems({
      tripId: "trip-1",
      changes: [{ id: "a", scheduledAt: "2026-06-01T10:00:00Z" }],
    });
    expect(result).toEqual({ ok: false, code: "internal" });
  });

  it("성공 → ok + changedCount + audit", async () => {
    mockReorderItineraryItems.mockResolvedValue({ tripUpdatedAt: "2026-06-01T12:00:00Z" });
    const { reorderItineraryItems } = await import("@/actions/itinerary");
    const result = await reorderItineraryItems({
      tripId: "trip-1",
      changes: [
        { id: "a", scheduledAt: "T1" },
        { id: "b", scheduledAt: "T2" },
      ],
    });
    expect(result).toEqual({
      ok: true,
      demo: false,
      tripUpdatedAt: "2026-06-01T12:00:00Z",
      changedCount: 2,
    });
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "itinerary.reorder",
        metadata: expect.objectContaining({ changedCount: 2 }),
      }),
    );
  });
});

/* ════════════════════════════════════════════
 * actions/cost — addCost
 * ════════════════════════════════════════════ */

describe("actions/cost — addCost", () => {
  const input = {
    tripId: "trip-1",
    label: "쌀국수",
    amountKrw: 5000,
    category: "food" as const,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mockCanWriteTrip.mockResolvedValue(true);
    mockGetActorId.mockResolvedValue("user-1");
  });

  it("forbidden → { ok: false, code: 'forbidden' }", async () => {
    mockCanWriteTrip.mockResolvedValue(false);
    const { addCost } = await import("@/actions/cost");
    const result = await addCost(input);
    expect(result).toEqual({ ok: false, code: "forbidden" });
  });

  it("repo 실패 → internal", async () => {
    mockCreateCostEntry.mockResolvedValue(null);
    const { addCost } = await import("@/actions/cost");
    const result = await addCost(input);
    expect(result).toEqual({ ok: false, code: "internal" });
  });

  it("성공 → ok + data + audit", async () => {
    const mockCost = { id: "c1", tripId: "trip-1", label: "쌀국수", amountKrw: 5000, status: "pending" };
    mockCreateCostEntry.mockResolvedValue(mockCost);
    const { addCost } = await import("@/actions/cost");
    const result = await addCost(input);
    expect(result).toEqual({ ok: true, demo: false, data: mockCost });
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "cost.add",
        resource: "CostEntry",
        resourceId: "c1",
      }),
    );
  });

  it("ensureDemoTripInDb 호출 확인", async () => {
    mockCreateCostEntry.mockResolvedValue({ id: "c2" });
    const { addCost } = await import("@/actions/cost");
    await addCost(input);
    expect(mockEnsureDemoTrip).toHaveBeenCalledWith("trip-1");
  });
});
