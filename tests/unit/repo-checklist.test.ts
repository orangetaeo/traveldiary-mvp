/**
 * lib/repositories/checklist.repository.ts 단위 테스트.
 *
 * listChecklistByTrip, createChecklistItem, bulkCreateChecklistItems,
 * toggleChecklistItem, moveChecklistItem, setChecklistItemsDone,
 * bulkDeleteChecklistItems, deleteChecklistItem.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@prisma/client", () => ({ Prisma: {} }));

const mockFindMany = vi.fn();
const mockCreateOuter = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockFindFirst = vi.fn();
const mockFindUniqueOrThrow = vi.fn();
const mockUpdateMany = vi.fn();
const mockDeleteMany = vi.fn();
const mockDeleteSingle = vi.fn();
const mockCreateTx = vi.fn();
const mockFindManyTx = vi.fn();

const mockTx = {
  checklistItem: {
    findUnique: (...args: unknown[]) => mockFindUnique(...args),
    findUniqueOrThrow: (...args: unknown[]) => mockFindUniqueOrThrow(...args),
    findFirst: (...args: unknown[]) => mockFindFirst(...args),
    findMany: (...args: unknown[]) => mockFindManyTx(...args),
    create: (...args: unknown[]) => mockCreateTx(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    updateMany: (...args: unknown[]) => mockUpdateMany(...args),
    delete: (...args: unknown[]) => mockDeleteSingle(...args),
    deleteMany: (...args: unknown[]) => mockDeleteMany(...args),
  },
};

let mockPrisma: unknown = {
  checklistItem: {
    findMany: (...args: unknown[]) => mockFindMany(...args),
    create: (...args: unknown[]) => mockCreateOuter(...args),
  },
  $transaction: (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx),
};

vi.mock("@/lib/prisma", () => ({
  get prisma() { return mockPrisma; },
}));

import {
  listChecklistByTrip,
  createChecklistItem,
  bulkCreateChecklistItems,
  toggleChecklistItem,
  moveChecklistItem,
  setChecklistItemsDone,
  bulkDeleteChecklistItems,
  deleteChecklistItem,
  BULK_DELETE_SNAPSHOT_LIMIT,
} from "@/lib/repositories/checklist.repository";

const MOCK_ROW = {
  id: "cl-1",
  tripId: "t-1",
  category: "essentials",
  text: "여권",
  dDayBucket: "d-30",
  done: false,
  cityNote: null,
  sortOrder: 0,
  actorId: null,
  createdAt: new Date("2026-07-01"),
  updatedAt: new Date("2026-07-01"),
};

function makeRow(overrides: Record<string, unknown> = {}) {
  return { ...MOCK_ROW, ...overrides };
}

describe("checklist.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      checklistItem: {
        findMany: (...args: unknown[]) => mockFindMany(...args),
        create: (...args: unknown[]) => mockCreateOuter(...args),
      },
      $transaction: (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx),
    };
  });

  // ─── listChecklistByTrip ──────────────────────────────

  describe("listChecklistByTrip", () => {
    it("prisma null → null", async () => {
      mockPrisma = null;
      expect(await listChecklistByTrip("t-1")).toBeNull();
    });

    it("성공 → ChecklistItem[] 변환", async () => {
      mockFindMany.mockResolvedValue([MOCK_ROW]);
      const r = await listChecklistByTrip("t-1");
      expect(r).toHaveLength(1);
      expect(r![0].id).toBe("cl-1");
      expect(r![0].text).toBe("여권");
      expect(r![0].cityNote).toBeUndefined();
      expect(r![0].createdAt).toBe("2026-07-01T00:00:00.000Z");
    });

    it("DB 에러 → null", async () => {
      mockFindMany.mockRejectedValue(new Error("DB"));
      expect(await listChecklistByTrip("t-1")).toBeNull();
    });
  });

  // ─── createChecklistItem ──────────────────────────────

  describe("createChecklistItem", () => {
    it("prisma null → null", async () => {
      mockPrisma = null;
      expect(
        await createChecklistItem({ tripId: "t-1", category: "essentials", text: "여권", dDayBucket: "d-30" }),
      ).toBeNull();
    });

    it("성공 → ChecklistItem", async () => {
      mockCreateOuter.mockResolvedValue(MOCK_ROW);
      const r = await createChecklistItem({ tripId: "t-1", category: "essentials", text: "여권", dDayBucket: "d-30" });
      expect(r!.id).toBe("cl-1");
    });

    it("기본 sortOrder = 0", async () => {
      mockCreateOuter.mockResolvedValue(MOCK_ROW);
      await createChecklistItem({ tripId: "t-1", category: "essentials", text: "a", dDayBucket: "d-30" });
      expect(mockCreateOuter.mock.calls[0][0].data.sortOrder).toBe(0);
    });

    it("DB 에러 → null", async () => {
      mockCreateOuter.mockRejectedValue(new Error("DB"));
      expect(
        await createChecklistItem({ tripId: "t-1", category: "essentials", text: "a", dDayBucket: "d-30" }),
      ).toBeNull();
    });
  });

  // ─── bulkCreateChecklistItems ─────────────────────────

  describe("bulkCreateChecklistItems", () => {
    it("prisma null → null", async () => {
      mockPrisma = null;
      expect(await bulkCreateChecklistItems("t-1", [])).toBeNull();
    });

    it("성공 → ChecklistItem[]", async () => {
      mockCreateTx
        .mockResolvedValueOnce(makeRow({ id: "cl-1" }))
        .mockResolvedValueOnce(makeRow({ id: "cl-2" }));

      const r = await bulkCreateChecklistItems("t-1", [
        { category: "essentials", text: "여권", dDayBucket: "d-30" },
        { category: "essentials", text: "비자", dDayBucket: "d-30" },
      ]);
      expect(r).toHaveLength(2);
    });

    it("DB 에러 → null", async () => {
      mockPrisma = {
        ...mockPrisma as object,
        $transaction: () => Promise.reject(new Error("DB")),
      };
      expect(await bulkCreateChecklistItems("t-1", [{ category: "essentials", text: "a", dDayBucket: "d-30" }])).toBeNull();
    });
  });

  // ─── toggleChecklistItem ──────────────────────────────

  describe("toggleChecklistItem", () => {
    it("prisma null → null", async () => {
      mockPrisma = null;
      expect(await toggleChecklistItem("cl-1")).toBeNull();
    });

    it("not_found", async () => {
      mockFindUnique.mockResolvedValue(null);
      expect(await toggleChecklistItem("cl-1")).toBe("not_found");
    });

    it("done=false → done=true 토글", async () => {
      mockFindUnique.mockResolvedValue(makeRow({ done: false }));
      mockUpdate.mockResolvedValue(makeRow({ done: true }));

      const r = await toggleChecklistItem("cl-1");
      if (r && r !== "not_found") {
        expect(r.before.done).toBe(false);
        expect(r.after.done).toBe(true);
      }
    });
  });

  // ─── moveChecklistItem ────────────────────────────────

  describe("moveChecklistItem", () => {
    it("prisma null → null", async () => {
      mockPrisma = null;
      expect(await moveChecklistItem("cl-1", "up")).toBeNull();
    });

    it("not_found", async () => {
      mockFindUnique.mockResolvedValue(null);
      expect(await moveChecklistItem("cl-1", "up")).toBe("not_found");
    });

    it("이웃 없음 → no_op", async () => {
      mockFindUnique.mockResolvedValue(makeRow({ sortOrder: 0 }));
      mockFindFirst.mockResolvedValue(null);
      expect(await moveChecklistItem("cl-1", "up")).toBe("no_op");
    });

    it("swap 성공", async () => {
      mockFindUnique.mockResolvedValue(makeRow({ id: "cl-1", sortOrder: 1 }));
      mockFindFirst.mockResolvedValue(makeRow({ id: "cl-2", sortOrder: 0 }));
      mockUpdate.mockResolvedValue({});
      mockFindUniqueOrThrow.mockResolvedValue(makeRow({ id: "cl-1", sortOrder: 0 }));

      const r = await moveChecklistItem("cl-1", "up");
      if (r && r !== "not_found" && r !== "no_op") {
        expect(r.before.sortOrder).toBe(1);
        expect(r.after.sortOrder).toBe(0);
        expect(r.swappedWithId).toBe("cl-2");
      }
    });
  });

  // ─── setChecklistItemsDone ────────────────────────────

  describe("setChecklistItemsDone", () => {
    it("prisma null → null", async () => {
      mockPrisma = null;
      expect(await setChecklistItemsDone({ tripId: "t-1", itemIds: ["cl-1"], done: true })).toBeNull();
    });

    it("빈 배열 → empty", async () => {
      expect(await setChecklistItemsDone({ tripId: "t-1", itemIds: [], done: true })).toBe("empty");
    });

    it("성공 → updatedCount", async () => {
      mockUpdateMany.mockResolvedValue({ count: 2 });
      const r = await setChecklistItemsDone({ tripId: "t-1", itemIds: ["cl-1", "cl-2"], done: true });
      if (r && r !== "count_mismatch" && r !== "empty") {
        expect(r.updatedCount).toBe(2);
        expect(r.done).toBe(true);
      }
    });

    it("count mismatch → count_mismatch", async () => {
      mockUpdateMany.mockResolvedValue({ count: 1 }); // expected 2
      const r = await setChecklistItemsDone({ tripId: "t-1", itemIds: ["cl-1", "cl-2"], done: true });
      expect(r).toBe("count_mismatch");
    });
  });

  // ─── bulkDeleteChecklistItems ─────────────────────────

  describe("bulkDeleteChecklistItems", () => {
    it("prisma null → null", async () => {
      mockPrisma = null;
      expect(await bulkDeleteChecklistItems({ tripId: "t-1", itemIds: ["cl-1"] })).toBeNull();
    });

    it("빈 배열 → empty", async () => {
      expect(await bulkDeleteChecklistItems({ tripId: "t-1", itemIds: [] })).toBe("empty");
    });

    it("성공 → deletedCount + snapshot", async () => {
      mockFindManyTx.mockResolvedValue([MOCK_ROW]);
      mockDeleteMany.mockResolvedValue({ count: 1 });

      const r = await bulkDeleteChecklistItems({ tripId: "t-1", itemIds: ["cl-1"] });
      if (r && r !== "count_mismatch" && r !== "empty") {
        expect(r.deletedCount).toBe(1);
        expect(r.beforeSnapshot).toHaveLength(1);
        expect(r.omittedSnapshotCount).toBe(0);
      }
    });

    it("count mismatch → count_mismatch", async () => {
      mockFindManyTx.mockResolvedValue([]);
      mockDeleteMany.mockResolvedValue({ count: 0 }); // expected 1
      const r = await bulkDeleteChecklistItems({ tripId: "t-1", itemIds: ["cl-1"] });
      expect(r).toBe("count_mismatch");
    });

    it("BULK_DELETE_SNAPSHOT_LIMIT = 50", () => {
      expect(BULK_DELETE_SNAPSHOT_LIMIT).toBe(50);
    });
  });

  // ─── deleteChecklistItem ──────────────────────────────

  describe("deleteChecklistItem", () => {
    it("prisma null → null", async () => {
      mockPrisma = null;
      expect(await deleteChecklistItem("cl-1")).toBeNull();
    });

    it("not_found", async () => {
      mockFindUnique.mockResolvedValue(null);
      expect(await deleteChecklistItem("cl-1")).toBe("not_found");
    });

    it("성공 → { before }", async () => {
      mockFindUnique.mockResolvedValue(MOCK_ROW);
      mockDeleteSingle.mockResolvedValue(MOCK_ROW);

      const r = await deleteChecklistItem("cl-1");
      if (r && r !== "not_found") {
        expect(r.before.id).toBe("cl-1");
        expect(r.before.text).toBe("여권");
      }
    });
  });
});
