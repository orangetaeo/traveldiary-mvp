/**
 * 사이클 JJ — bulkDeleteChecklistItems 회귀.
 *
 * R1 사인오프 조건:
 *  - 성공 + before snapshot 50 제한 + omittedSnapshotCount
 *  - strict count fail (cross-trip / not_found) → "count_mismatch"
 *  - empty itemIds → "empty"
 *  - DB 에러 → null
 *
 * 답습: 사이클 II checklist-bulk-toggle.test.ts (vi.hoisted + vi.mock prisma).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockDeleteMany, mockFindMany, mockTransaction } = vi.hoisted(() => ({
  mockDeleteMany: vi.fn(),
  mockFindMany: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    checklistItem: {
      deleteMany: mockDeleteMany,
      findMany: mockFindMany,
    },
    $transaction: mockTransaction,
  },
  isDbConnected: true,
}));

vi.mock("server-only", () => ({}));

import {
  bulkDeleteChecklistItems,
  BULK_DELETE_SNAPSHOT_LIMIT,
} from "@/lib/repositories/checklist.repository";

interface TxStub {
  checklistItem: {
    deleteMany: typeof mockDeleteMany;
    findMany: typeof mockFindMany;
  };
}

function buildRow(id: string, text = "test", category = "custom") {
  return {
    id,
    tripId: "trip-A",
    category,
    text,
    dDayBucket: "D-7",
    done: false,
    cityNote: null,
    sortOrder: 0,
    createdAt: new Date("2026-05-03T00:00:00Z"),
    updatedAt: new Date("2026-05-03T00:00:00Z"),
  };
}

beforeEach(() => {
  mockDeleteMany.mockReset();
  mockFindMany.mockReset();
  mockTransaction.mockReset();
  mockTransaction.mockImplementation(async (cb: (tx: TxStub) => Promise<unknown>) => {
    return cb({
      checklistItem: { deleteMany: mockDeleteMany, findMany: mockFindMany },
    });
  });
});

describe("사이클 JJ — bulkDeleteChecklistItems strict count", () => {
  it("정상 케이스 — 모든 itemIds 매칭 → before snapshot 보존 + deletedCount", async () => {
    const ids = ["i-1", "i-2", "i-3"];
    mockFindMany.mockResolvedValueOnce(ids.map((id) => buildRow(id)));
    mockDeleteMany.mockResolvedValueOnce({ count: 3 });

    const result = await bulkDeleteChecklistItems({
      tripId: "trip-A",
      itemIds: ids,
    });

    expect(result).not.toBe(null);
    if (result && typeof result === "object") {
      expect(result.deletedCount).toBe(3);
      expect(result.beforeSnapshot).toHaveLength(3);
      expect(result.omittedSnapshotCount).toBe(0);
      expect(result.beforeSnapshot[0].id).toBe("i-1");
    }

    // tripId where 절 강제 검증
    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { id: { in: ids }, tripId: "trip-A" },
    });
  });

  it("cross-trip itemId → count !== expected → count_mismatch (트랜잭션 롤백)", async () => {
    mockFindMany.mockResolvedValueOnce([buildRow("i-1"), buildRow("i-2")]);
    mockDeleteMany.mockResolvedValueOnce({ count: 2 });

    const result = await bulkDeleteChecklistItems({
      tripId: "trip-A",
      itemIds: ["i-1", "i-2", "i-from-trip-B"],
    });

    expect(result).toBe("count_mismatch");
  });

  it("not_found itemId → count_mismatch", async () => {
    mockFindMany.mockResolvedValueOnce([buildRow("i-1")]);
    mockDeleteMany.mockResolvedValueOnce({ count: 1 });

    const result = await bulkDeleteChecklistItems({
      tripId: "trip-A",
      itemIds: ["i-1", "i-deleted"],
    });

    expect(result).toBe("count_mismatch");
  });

  it("itemIds 빈 배열 → 'empty' (DB 호출 X)", async () => {
    const result = await bulkDeleteChecklistItems({
      tripId: "trip-A",
      itemIds: [],
    });

    expect(result).toBe("empty");
    expect(mockDeleteMany).not.toHaveBeenCalled();
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("50개 초과 → snapshot 50개로 제한 + omittedSnapshotCount", async () => {
    const ids = Array.from({ length: 75 }, (_, i) => `i-${i}`);
    // findMany는 처리할 수 있는 최대치 = LIMIT (50)
    mockFindMany.mockResolvedValueOnce(
      ids.slice(0, BULK_DELETE_SNAPSHOT_LIMIT).map((id) => buildRow(id)),
    );
    mockDeleteMany.mockResolvedValueOnce({ count: 75 });

    const result = await bulkDeleteChecklistItems({
      tripId: "trip-A",
      itemIds: ids,
    });

    if (result && typeof result === "object") {
      expect(result.deletedCount).toBe(75);
      expect(result.beforeSnapshot).toHaveLength(BULK_DELETE_SNAPSHOT_LIMIT);
      expect(result.omittedSnapshotCount).toBe(25);
    }

    // findMany 호출 시 첫 50개만 조회
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        id: { in: ids.slice(0, BULK_DELETE_SNAPSHOT_LIMIT) },
        tripId: "trip-A",
      },
    });
  });

  it("DB 에러 → null (count_mismatch와 구분)", async () => {
    mockFindMany.mockRejectedValueOnce(new Error("connection lost"));

    const result = await bulkDeleteChecklistItems({
      tripId: "trip-A",
      itemIds: ["i-1"],
    });

    expect(result).toBe(null);
  });

  it("정확히 50개 → omittedSnapshotCount 0", async () => {
    const ids = Array.from({ length: BULK_DELETE_SNAPSHOT_LIMIT }, (_, i) => `i-${i}`);
    mockFindMany.mockResolvedValueOnce(ids.map((id) => buildRow(id)));
    mockDeleteMany.mockResolvedValueOnce({ count: BULK_DELETE_SNAPSHOT_LIMIT });

    const result = await bulkDeleteChecklistItems({
      tripId: "trip-A",
      itemIds: ids,
    });

    if (result && typeof result === "object") {
      expect(result.beforeSnapshot).toHaveLength(BULK_DELETE_SNAPSHOT_LIMIT);
      expect(result.omittedSnapshotCount).toBe(0);
    }
  });
});
