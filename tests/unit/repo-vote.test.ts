/**
 * lib/repositories/vote.repository.ts 단위 테스트.
 *
 * listVotesByTrip, createVoteRow, castVoteToggle.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@prisma/client", () => ({ Prisma: {} }));

const mockFindMany = vi.fn();
const mockCreate = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

const mockTx = {
  vote: {
    findUnique: (...args: unknown[]) => mockFindUnique(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
};

let mockPrisma: unknown = {
  vote: {
    findMany: (...args: unknown[]) => mockFindMany(...args),
    create: (...args: unknown[]) => mockCreate(...args),
  },
  $transaction: (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx),
};

vi.mock("@/lib/prisma", () => ({
  get prisma() { return mockPrisma; },
}));

import {
  listVotesByTrip,
  createVoteRow,
  castVoteToggle,
} from "@/lib/repositories/vote.repository";

const MOCK_ROW = {
  id: "v-1",
  tripId: "t-1",
  question: "저녁 메뉴?",
  options: [
    { label: "쌀국수", voters: ["u1"] },
    { label: "반미", voters: [] },
  ],
  status: "open",
  decidedAt: null,
  createdBy: "u1",
  createdAt: new Date("2026-07-01"),
  actorId: "u1",
};

describe("vote.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      vote: {
        findMany: (...args: unknown[]) => mockFindMany(...args),
        create: (...args: unknown[]) => mockCreate(...args),
      },
      $transaction: (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx),
    };
  });

  // ─── listVotesByTrip ───────────────────────────────────────

  describe("listVotesByTrip", () => {
    it("prisma null → null", async () => {
      mockPrisma = null;
      expect(await listVotesByTrip("t-1")).toBeNull();
    });

    it("성공 → Vote[] 변환", async () => {
      mockFindMany.mockResolvedValue([MOCK_ROW]);
      const r = await listVotesByTrip("t-1");
      expect(r).toHaveLength(1);
      expect(r![0].question).toBe("저녁 메뉴?");
      expect(r![0].options).toHaveLength(2);
    });

    it("DB 에러 → null", async () => {
      mockFindMany.mockRejectedValue(new Error("DB"));
      expect(await listVotesByTrip("t-1")).toBeNull();
    });
  });

  // ─── createVoteRow ─────────────────────────────────────────

  describe("createVoteRow", () => {
    it("prisma null → null", async () => {
      mockPrisma = null;
      expect(await createVoteRow({ tripId: "t-1", question: "?", optionLabels: ["A", "B"] })).toBeNull();
    });

    it("성공 → 빈 voters 배열로 초기화", async () => {
      mockCreate.mockResolvedValue(MOCK_ROW);
      await createVoteRow({ tripId: "t-1", question: "?", optionLabels: ["쌀국수", "반미"] });

      const data = mockCreate.mock.calls[0][0].data;
      expect(data.options).toEqual([
        { label: "쌀국수", voters: [] },
        { label: "반미", voters: [] },
      ]);
    });

    it("DB 에러 → null", async () => {
      mockCreate.mockRejectedValue(new Error("DB"));
      expect(await createVoteRow({ tripId: "t-1", question: "?", optionLabels: ["A"] })).toBeNull();
    });
  });

  // ─── castVoteToggle ────────────────────────────────────────

  describe("castVoteToggle", () => {
    it("prisma null → null", async () => {
      mockPrisma = null;
      expect(await castVoteToggle("v-1", 0, "u2")).toBeNull();
    });

    it("not_found → 'not_found'", async () => {
      mockFindUnique.mockResolvedValue(null);
      expect(await castVoteToggle("v-1", 0, "u2")).toBe("not_found");
    });

    it("새 투표 → 해당 옵션에 voterId 추가", async () => {
      mockFindUnique.mockResolvedValue({
        ...MOCK_ROW,
        options: [
          { label: "A", voters: ["u1"] },
          { label: "B", voters: [] },
        ],
      });
      mockUpdate.mockImplementation(({ data }: { data: { options: unknown } }) => ({
        ...MOCK_ROW,
        options: data.options,
      }));

      const r = await castVoteToggle("v-1", 1, "u2");
      if (r && r !== "not_found") {
        expect(r.options[1].voters).toContain("u2");
      }
    });

    it("같은 옵션 재클릭 → 표 회수 (toggle)", async () => {
      mockFindUnique.mockResolvedValue({
        ...MOCK_ROW,
        options: [
          { label: "A", voters: ["u1"] },
          { label: "B", voters: [] },
        ],
      });
      mockUpdate.mockImplementation(({ data }: { data: { options: unknown } }) => ({
        ...MOCK_ROW,
        options: data.options,
      }));

      const r = await castVoteToggle("v-1", 0, "u1");
      if (r && r !== "not_found") {
        // u1이 A에서 제거됨 (토글)
        expect(r.options[0].voters).not.toContain("u1");
      }
    });

    it("다른 옵션으로 이동 → 기존 제거 + 새 옵션 추가", async () => {
      mockFindUnique.mockResolvedValue({
        ...MOCK_ROW,
        options: [
          { label: "A", voters: ["u1"] },
          { label: "B", voters: [] },
        ],
      });
      mockUpdate.mockImplementation(({ data }: { data: { options: unknown } }) => ({
        ...MOCK_ROW,
        options: data.options,
      }));

      const r = await castVoteToggle("v-1", 1, "u1");
      if (r && r !== "not_found") {
        expect(r.options[0].voters).not.toContain("u1");
        expect(r.options[1].voters).toContain("u1");
      }
    });

    it("DB 에러 → null", async () => {
      mockPrisma = {
        ...mockPrisma as object,
        $transaction: () => Promise.reject(new Error("deadlock")),
      };
      expect(await castVoteToggle("v-1", 0, "u1")).toBeNull();
    });
  });
});
