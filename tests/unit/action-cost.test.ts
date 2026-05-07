/**
 * actions/cost.ts 단위 테스트.
 *
 * addCost, updateCost, settleCost, deleteCost.
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
}));

const mockResolveActorIdForTrip = vi.fn();
vi.mock("@/lib/auth/actor-resolution", () => ({
  resolveActorIdForTrip: (...args: unknown[]) => mockResolveActorIdForTrip(...args),
}));

const mockCreateCostEntry = vi.fn();
const mockUpdateCostEntry = vi.fn();
const mockSettleCostEntry = vi.fn();
const mockDeleteCostEntry = vi.fn();
vi.mock("@/lib/repositories/cost.repository", () => ({
  createCostEntry: (...args: unknown[]) => mockCreateCostEntry(...args),
  updateCostEntry: (...args: unknown[]) => mockUpdateCostEntry(...args),
  settleCostEntry: (...args: unknown[]) => mockSettleCostEntry(...args),
  deleteCostEntry: (...args: unknown[]) => mockDeleteCostEntry(...args),
}));

vi.mock("@/lib/repositories/trip.repository", () => ({
  ensureDemoTripInDb: vi.fn(),
}));

let mockIsDbConnected = true;
vi.mock("@/lib/prisma", () => ({
  get isDbConnected() { return mockIsDbConnected; },
}));

import { addCost, updateCost, settleCost, deleteCost } from "@/actions/cost";

describe("cost actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsDbConnected = true;
    mockGetActorId.mockResolvedValue("user-1");
    mockCanWriteTrip.mockResolvedValue(true);
    mockResolveActorIdForTrip.mockReturnValue("actor-1");
    mockWriteAuditLog.mockResolvedValue(undefined);
  });

  // ─── addCost ─────────────────────────────────────────────────

  describe("addCost", () => {
    const input = { tripId: "t1", label: "커피", amountKrw: 5000, category: "food" };

    it("DB 미연결 → demo", async () => {
      mockIsDbConnected = false;
      expect(await addCost(input)).toEqual({ ok: true, demo: true });
    });

    it("권한 없음 → forbidden", async () => {
      mockCanWriteTrip.mockResolvedValue(false);
      expect(await addCost(input)).toEqual({ ok: false, code: "forbidden" });
    });

    it("DB 실패 → internal", async () => {
      mockCreateCostEntry.mockResolvedValue(null);
      expect(await addCost(input)).toEqual({ ok: false, code: "internal" });
    });

    it("성공 → ok + audit cost.add", async () => {
      const entry = { id: "c-1", tripId: "t1", label: "커피", amountKrw: 5000, status: "planned" };
      mockCreateCostEntry.mockResolvedValue(entry);

      const r = await addCost(input);
      expect(r).toMatchObject({ ok: true, demo: false, data: entry });
      expect(mockWriteAuditLog.mock.calls[0][0].action).toBe("cost.add");
    });
  });

  // ─── updateCost ──────────────────────────────────────────────

  describe("updateCost", () => {
    it("DB 미연결 → demo", async () => {
      mockIsDbConnected = false;
      expect(await updateCost({ data: { id: "c-1" }, tripId: "t1" })).toEqual({ ok: true, demo: true });
    });

    it("not_found → not_found", async () => {
      mockUpdateCostEntry.mockResolvedValue("not_found");
      expect(await updateCost({ data: { id: "c-1" }, tripId: "t1" })).toEqual({ ok: false, code: "not_found" });
    });

    it("성공 → ok + audit before/after", async () => {
      mockUpdateCostEntry.mockResolvedValue({
        before: { label: "커피", amountKrw: 5000, status: "planned" },
        after: { label: "카페", amountKrw: 6000, status: "planned" },
      });

      const r = await updateCost({ data: { id: "c-1", label: "카페", amountKrw: 6000 }, tripId: "t1" });
      expect(r).toMatchObject({ ok: true, demo: false });
      const log = mockWriteAuditLog.mock.calls[0][0];
      expect(log.action).toBe("cost.update");
      expect(log.before.amountKrw).toBe(5000);
      expect(log.after.amountKrw).toBe(6000);
    });
  });

  // ─── settleCost ──────────────────────────────────────────────

  describe("settleCost", () => {
    it("DB 미연결 → demo", async () => {
      mockIsDbConnected = false;
      expect(await settleCost({ id: "c-1", tripId: "t1", settled: true })).toEqual({ ok: true, demo: true });
    });

    it("not_found → not_found", async () => {
      mockSettleCostEntry.mockResolvedValue("not_found");
      expect(await settleCost({ id: "c-1", tripId: "t1", settled: true })).toEqual({ ok: false, code: "not_found" });
    });

    it("settled=true → audit cost.settle", async () => {
      mockSettleCostEntry.mockResolvedValue({
        before: { settledAt: null },
        after: { settledAt: "2026-05-07T00:00:00Z" },
      });

      await settleCost({ id: "c-1", tripId: "t1", settled: true });
      expect(mockWriteAuditLog.mock.calls[0][0].action).toBe("cost.settle");
    });

    it("settled=false → audit cost.unsettle", async () => {
      mockSettleCostEntry.mockResolvedValue({
        before: { settledAt: "2026-05-07T00:00:00Z" },
        after: { settledAt: null },
      });

      await settleCost({ id: "c-1", tripId: "t1", settled: false });
      expect(mockWriteAuditLog.mock.calls[0][0].action).toBe("cost.unsettle");
    });
  });

  // ─── deleteCost ──────────────────────────────────────────────

  describe("deleteCost", () => {
    it("DB 미연결 → demo", async () => {
      mockIsDbConnected = false;
      expect(await deleteCost({ id: "c-1", tripId: "t1" })).toEqual({ ok: true, demo: true });
    });

    it("not_found → not_found", async () => {
      mockDeleteCostEntry.mockResolvedValue("not_found");
      expect(await deleteCost({ id: "c-1", tripId: "t1" })).toEqual({ ok: false, code: "not_found" });
    });

    it("성공 → ok + audit before snapshot + after=null", async () => {
      mockDeleteCostEntry.mockResolvedValue({
        before: { tripId: "t1", label: "커피", amountKrw: 5000 },
      });

      const r = await deleteCost({ id: "c-1", tripId: "t1" });
      expect(r).toMatchObject({ ok: true, demo: false, data: { id: "c-1" } });
      const log = mockWriteAuditLog.mock.calls[0][0];
      expect(log.action).toBe("cost.delete");
      expect(log.before.label).toBe("커피");
      expect(log.after).toBeNull();
    });
  });
});
