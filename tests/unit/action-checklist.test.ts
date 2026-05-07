/**
 * actions/checklist.ts 단위 테스트.
 *
 * addChecklistItem, addFromTemplate, toggleChecklist,
 * moveChecklist, bulkToggleChecklist, bulkDeleteChecklist, deleteChecklist.
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

const mockCreateChecklistItem = vi.fn();
const mockBulkCreateChecklistItems = vi.fn();
const mockToggleChecklistItem = vi.fn();
const mockMoveChecklistItem = vi.fn();
const mockSetChecklistItemsDone = vi.fn();
const mockBulkDeleteChecklistItems = vi.fn();
const mockDeleteChecklistItem = vi.fn();
vi.mock("@/lib/repositories/checklist.repository", () => ({
  createChecklistItem: (...args: unknown[]) => mockCreateChecklistItem(...args),
  bulkCreateChecklistItems: (...args: unknown[]) => mockBulkCreateChecklistItems(...args),
  toggleChecklistItem: (...args: unknown[]) => mockToggleChecklistItem(...args),
  moveChecklistItem: (...args: unknown[]) => mockMoveChecklistItem(...args),
  setChecklistItemsDone: (...args: unknown[]) => mockSetChecklistItemsDone(...args),
  bulkDeleteChecklistItems: (...args: unknown[]) => mockBulkDeleteChecklistItems(...args),
  deleteChecklistItem: (...args: unknown[]) => mockDeleteChecklistItem(...args),
}));

vi.mock("@/lib/repositories/trip.repository", () => ({
  ensureDemoTripInDb: vi.fn(),
}));

vi.mock("@/lib/seed/checklist-template", () => ({
  DEFAULT_CHECKLIST_TEMPLATE: [
    { category: "필수", text: "여권", dDayBucket: "d-7" },
    { category: "필수", text: "보험", dDayBucket: "d-7" },
  ],
}));

let mockIsDbConnected = true;
vi.mock("@/lib/prisma", () => ({
  get isDbConnected() { return mockIsDbConnected; },
}));

import {
  addChecklistItem,
  addFromTemplate,
  toggleChecklist,
  moveChecklist,
  bulkToggleChecklist,
  bulkDeleteChecklist,
  deleteChecklist,
} from "@/actions/checklist";

describe("checklist actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsDbConnected = true;
    mockGetActorId.mockResolvedValue("user-1");
    mockCanWriteTrip.mockResolvedValue(true);
    mockResolveActorIdForTrip.mockReturnValue("actor-1");
    mockWriteAuditLog.mockResolvedValue(undefined);
  });

  // ─── addChecklistItem ────────────────────────────────────────

  describe("addChecklistItem", () => {
    const input = { tripId: "t1", category: "필수", text: "여권", dDayBucket: "d-7" };

    it("DB 미연결 → demo", async () => {
      mockIsDbConnected = false;
      expect(await addChecklistItem(input)).toEqual({ ok: true, demo: true });
    });

    it("권한 없음 → forbidden", async () => {
      mockCanWriteTrip.mockResolvedValue(false);
      expect(await addChecklistItem(input)).toEqual({ ok: false, code: "forbidden" });
    });

    it("DB 실패 → internal", async () => {
      mockCreateChecklistItem.mockResolvedValue(null);
      expect(await addChecklistItem(input)).toEqual({ ok: false, code: "internal" });
    });

    it("성공 → ok + audit log", async () => {
      const item = { id: "cl-1", tripId: "t1", category: "필수", text: "여권", dDayBucket: "d-7" };
      mockCreateChecklistItem.mockResolvedValue(item);

      const r = await addChecklistItem(input);
      expect(r).toMatchObject({ ok: true, demo: false, data: item });
      expect(mockWriteAuditLog).toHaveBeenCalledOnce();
      expect(mockWriteAuditLog.mock.calls[0][0].action).toBe("checklist.add");
    });
  });

  // ─── addFromTemplate ─────────────────────────────────────────

  describe("addFromTemplate", () => {
    it("DB 미연결 → demo", async () => {
      mockIsDbConnected = false;
      expect(await addFromTemplate({ tripId: "t1" })).toEqual({ ok: true, demo: true });
    });

    it("권한 없음 → forbidden", async () => {
      mockCanWriteTrip.mockResolvedValue(false);
      expect(await addFromTemplate({ tripId: "t1" })).toEqual({ ok: false, code: "forbidden" });
    });

    it("성공 → audit log N건", async () => {
      const items = [
        { id: "cl-1", tripId: "t1", category: "필수", text: "여권", dDayBucket: "d-7" },
        { id: "cl-2", tripId: "t1", category: "필수", text: "보험", dDayBucket: "d-7" },
      ];
      mockBulkCreateChecklistItems.mockResolvedValue(items);

      const r = await addFromTemplate({ tripId: "t1" });
      expect(r).toMatchObject({ ok: true, demo: false });
      expect(mockWriteAuditLog).toHaveBeenCalledTimes(2);
      expect(mockWriteAuditLog.mock.calls[0][0].metadata.origin).toBe("template");
    });
  });

  // ─── toggleChecklist ─────────────────────────────────────────

  describe("toggleChecklist", () => {
    it("DB 미연결 → demo", async () => {
      mockIsDbConnected = false;
      expect(await toggleChecklist({ itemId: "cl-1", tripId: "t1" })).toEqual({ ok: true, demo: true });
    });

    it("not_found → not_found", async () => {
      mockToggleChecklistItem.mockResolvedValue("not_found");
      expect(await toggleChecklist({ itemId: "x", tripId: "t1" })).toEqual({ ok: false, code: "not_found" });
    });

    it("성공 → ok + audit (before/after done)", async () => {
      mockToggleChecklistItem.mockResolvedValue({
        item: { id: "cl-1", done: true },
        before: { done: false },
        after: { done: true },
      });

      const r = await toggleChecklist({ itemId: "cl-1", tripId: "t1" });
      expect(r).toMatchObject({ ok: true, demo: false });
      const log = mockWriteAuditLog.mock.calls[0][0];
      expect(log.action).toBe("checklist.toggle");
      expect(log.before).toEqual({ done: false });
      expect(log.after).toEqual({ done: true });
    });
  });

  // ─── moveChecklist ───────────────────────────────────────────

  describe("moveChecklist", () => {
    it("no_op → not_found", async () => {
      mockMoveChecklistItem.mockResolvedValue("no_op");
      const r = await moveChecklist({ itemId: "cl-1", tripId: "t1", direction: "up" });
      expect(r).toEqual({ ok: false, code: "not_found" });
    });

    it("성공 → audit (before/after sortOrder)", async () => {
      mockMoveChecklistItem.mockResolvedValue({
        item: { id: "cl-1" },
        before: { sortOrder: 0 },
        after: { sortOrder: 1 },
        swappedWithId: "cl-2",
      });

      const r = await moveChecklist({ itemId: "cl-1", tripId: "t1", direction: "down" });
      expect(r).toMatchObject({ ok: true, demo: false });
      const log = mockWriteAuditLog.mock.calls[0][0];
      expect(log.action).toBe("checklist.reorder");
      expect(log.metadata.direction).toBe("down");
    });
  });

  // ─── bulkToggleChecklist ─────────────────────────────────────

  describe("bulkToggleChecklist", () => {
    it("빈 배열 → not_found", async () => {
      const r = await bulkToggleChecklist({ tripId: "t1", itemIds: [], done: true });
      expect(r).toEqual({ ok: false, code: "not_found" });
    });

    it("count_mismatch → forbidden", async () => {
      mockSetChecklistItemsDone.mockResolvedValue("count_mismatch");
      const r = await bulkToggleChecklist({ tripId: "t1", itemIds: ["cl-1"], done: true });
      expect(r).toEqual({ ok: false, code: "forbidden" });
    });

    it("성공 → ok + audit bulk_toggle", async () => {
      mockSetChecklistItemsDone.mockResolvedValue({
        updatedCount: 2,
        done: true,
        itemIds: ["cl-1", "cl-2"],
      });

      const r = await bulkToggleChecklist({ tripId: "t1", itemIds: ["cl-1", "cl-2"], done: true });
      expect(r).toMatchObject({ ok: true, demo: false, data: { updatedCount: 2, done: true } });
      expect(mockWriteAuditLog.mock.calls[0][0].action).toBe("checklist.bulk_toggle");
    });
  });

  // ─── bulkDeleteChecklist ─────────────────────────────────────

  describe("bulkDeleteChecklist", () => {
    it("빈 배열 → not_found", async () => {
      const r = await bulkDeleteChecklist({ tripId: "t1", itemIds: [] });
      expect(r).toEqual({ ok: false, code: "not_found" });
    });

    it("성공 → ok + audit bulk_delete + beforeSnapshot", async () => {
      mockBulkDeleteChecklistItems.mockResolvedValue({
        deletedCount: 1,
        itemIds: ["cl-1"],
        beforeSnapshot: [{ id: "cl-1", text: "여권", category: "필수", dDayBucket: "d-7" }],
        omittedSnapshotCount: 0,
      });

      const r = await bulkDeleteChecklist({ tripId: "t1", itemIds: ["cl-1"] });
      expect(r).toMatchObject({ ok: true, demo: false, data: { deletedCount: 1 } });
      const log = mockWriteAuditLog.mock.calls[0][0];
      expect(log.action).toBe("checklist.bulk_delete");
      expect(log.before).toHaveLength(1);
    });
  });

  // ─── deleteChecklist ─────────────────────────────────────────

  describe("deleteChecklist", () => {
    it("not_found → not_found", async () => {
      mockDeleteChecklistItem.mockResolvedValue("not_found");
      expect(await deleteChecklist({ itemId: "x", tripId: "t1" })).toEqual({ ok: false, code: "not_found" });
    });

    it("성공 → ok + audit (before snapshot)", async () => {
      mockDeleteChecklistItem.mockResolvedValue({
        before: { tripId: "t1", text: "여권", category: "필수", dDayBucket: "d-7" },
      });

      const r = await deleteChecklist({ itemId: "cl-1", tripId: "t1" });
      expect(r).toMatchObject({ ok: true, demo: false, data: { id: "cl-1" } });
      const log = mockWriteAuditLog.mock.calls[0][0];
      expect(log.action).toBe("checklist.delete");
      expect(log.before.text).toBe("여권");
      expect(log.after).toBeNull();
    });
  });
});
