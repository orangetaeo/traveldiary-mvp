/**
 * 사이클 II — setChecklistItemsDone 회귀.
 *
 * R1 사인오프 조건 3종:
 *  1. cross-trip injection 차단 (where 절에 tripId 포함)
 *  2. partial count → throw로 트랜잭션 롤백 ("count_mismatch")
 *  3. 정상 케이스 (모든 itemIds 매칭)
 *
 * 답습: 사이클 HH share-comment-fk-fallback.test.ts (vi.hoisted + vi.mock prisma).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockUpdateMany, mockTransaction } = vi.hoisted(() => ({
  mockUpdateMany: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    checklistItem: { updateMany: mockUpdateMany },
    $transaction: mockTransaction,
  },
  isDbConnected: true,
}));

vi.mock("server-only", () => ({}));

import { setChecklistItemsDone } from "@/lib/repositories/checklist.repository";

interface TxStub {
  checklistItem: { updateMany: typeof mockUpdateMany };
}

beforeEach(() => {
  mockUpdateMany.mockReset();
  mockTransaction.mockReset();
  // $transaction(callback) — callback에 tx 객체를 넘겨 실행. throw가 곧 롤백 표현.
  mockTransaction.mockImplementation(async (cb: (tx: TxStub) => Promise<unknown>) => {
    return cb({ checklistItem: { updateMany: mockUpdateMany } });
  });
});

describe("사이클 II — setChecklistItemsDone strict count", () => {
  it("itemIds 모두 매칭 → updatedCount 일치 + 정상 반환", async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 3 });

    const result = await setChecklistItemsDone({
      tripId: "trip-A",
      itemIds: ["i-1", "i-2", "i-3"],
      done: true,
    });

    expect(result).not.toBe(null);
    expect(result).not.toBe("count_mismatch");
    if (result && typeof result === "object") {
      expect(result.updatedCount).toBe(3);
      expect(result.done).toBe(true);
    }

    // where 절에 tripId가 포함되어 cross-trip injection 차단
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ["i-1", "i-2", "i-3"] }, tripId: "trip-A" },
      data: { done: true },
    });
  });

  it("cross-trip itemId 섞임 → updatedMany.count 부족 → count_mismatch (throw 롤백)", async () => {
    // 3개 요청했지만 1개는 다른 trip 소속이라 where: { tripId } 매칭 실패 → 2개만 update
    mockUpdateMany.mockResolvedValueOnce({ count: 2 });

    const result = await setChecklistItemsDone({
      tripId: "trip-A",
      itemIds: ["i-1", "i-2", "i-from-trip-B"],
      done: true,
    });

    expect(result).toBe("count_mismatch");
  });

  it("not_found itemId 섞임 → count_mismatch", async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 1 });

    const result = await setChecklistItemsDone({
      tripId: "trip-A",
      itemIds: ["i-1", "i-deleted"],
      done: false,
    });

    expect(result).toBe("count_mismatch");
  });

  it("itemIds 빈 배열 → 'empty' 반환 (DB 호출 X)", async () => {
    const result = await setChecklistItemsDone({
      tripId: "trip-A",
      itemIds: [],
      done: true,
    });

    expect(result).toBe("empty");
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("done=false 일괄 미완료 정상 케이스", async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 2 });

    const result = await setChecklistItemsDone({
      tripId: "trip-A",
      itemIds: ["i-1", "i-2"],
      done: false,
    });

    if (result && typeof result === "object") {
      expect(result.done).toBe(false);
      expect(result.itemIds).toEqual(["i-1", "i-2"]);
    }
  });

  it("DB 에러 → null 반환 (count_mismatch와 구분)", async () => {
    mockUpdateMany.mockRejectedValueOnce(new Error("connection lost"));

    const result = await setChecklistItemsDone({
      tripId: "trip-A",
      itemIds: ["i-1"],
      done: true,
    });

    expect(result).toBe(null);
  });
});
