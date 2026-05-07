/**
 * lib/repositories/cost.repository.ts 단위 테스트.
 *
 * listCostByTrip, createCostEntry, updateCostEntry, settleCostEntry, deleteCostEntry.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@prisma/client", () => ({ Prisma: {} }));

const mockFindMany = vi.fn();
const mockCreate = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

const mockTx = {
  costEntry: {
    findUnique: (...args: unknown[]) => mockFindUnique(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
};

let mockPrisma: unknown = {
  costEntry: {
    findMany: (...args: unknown[]) => mockFindMany(...args),
    create: (...args: unknown[]) => mockCreate(...args),
  },
  $transaction: (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx),
};

vi.mock("@/lib/prisma", () => ({
  get prisma() { return mockPrisma; },
}));

import {
  listCostByTrip,
  createCostEntry,
  updateCostEntry,
  settleCostEntry,
  deleteCostEntry,
} from "@/lib/repositories/cost.repository";

const MOCK_ROW = {
  id: "c-1",
  tripId: "t-1",
  date: new Date("2026-07-01T00:00:00Z"),
  label: "커피",
  amountKrw: 5000,
  amountLocal: null,
  status: "planned",
  category: "food",
  splitWith: null,
  settledAt: null,
  createdAt: new Date("2026-07-01T10:00:00Z"),
  updatedAt: new Date("2026-07-01T10:00:00Z"),
  actorId: null,
};

describe("cost.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      costEntry: {
        findMany: (...args: unknown[]) => mockFindMany(...args),
        create: (...args: unknown[]) => mockCreate(...args),
      },
      $transaction: (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx),
    };
  });

  // ─── listCostByTrip ────────────────────────────────────────

  describe("listCostByTrip", () => {
    it("prisma null → null", async () => {
      mockPrisma = null;
      expect(await listCostByTrip("t-1")).toBeNull();
    });

    it("성공 → CostEntry[] 변환", async () => {
      mockFindMany.mockResolvedValue([MOCK_ROW]);
      const r = await listCostByTrip("t-1");
      expect(r).toHaveLength(1);
      expect(r![0].id).toBe("c-1");
      expect(r![0].date).toBe("2026-07-01");
      expect(r![0].amountLocal).toBeUndefined();
    });

    it("amountLocal JSON → 객체 반환", async () => {
      mockFindMany.mockResolvedValue([
        { ...MOCK_ROW, amountLocal: { value: 120000, currency: "VND" } },
      ]);
      const r = await listCostByTrip("t-1");
      expect(r![0].amountLocal).toEqual({ value: 120000, currency: "VND" });
    });

    it("DB 에러 → null", async () => {
      mockFindMany.mockRejectedValue(new Error("DB"));
      expect(await listCostByTrip("t-1")).toBeNull();
    });
  });

  // ─── createCostEntry ───────────────────────────────────────

  describe("createCostEntry", () => {
    it("prisma null → null", async () => {
      mockPrisma = null;
      expect(await createCostEntry({ tripId: "t-1", date: "2026-07-01", label: "a", amountKrw: 1000 })).toBeNull();
    });

    it("성공 → CostEntry 반환", async () => {
      mockCreate.mockResolvedValue(MOCK_ROW);
      const r = await createCostEntry({ tripId: "t-1", date: "2026-07-01", label: "커피", amountKrw: 5000 });
      expect(r!.id).toBe("c-1");
      expect(r!.label).toBe("커피");
    });

    it("기본 status = planned", async () => {
      mockCreate.mockResolvedValue(MOCK_ROW);
      await createCostEntry({ tripId: "t-1", date: "2026-07-01", label: "a", amountKrw: 1000 });
      expect(mockCreate.mock.calls[0][0].data.status).toBe("planned");
    });

    it("DB 에러 → null", async () => {
      mockCreate.mockRejectedValue(new Error("DB"));
      expect(await createCostEntry({ tripId: "t-1", date: "2026-07-01", label: "a", amountKrw: 1 })).toBeNull();
    });
  });

  // ─── updateCostEntry ───────────────────────────────────────

  describe("updateCostEntry", () => {
    it("prisma null → null", async () => {
      mockPrisma = null;
      expect(await updateCostEntry({ id: "c-1" })).toBeNull();
    });

    it("not_found → 'not_found'", async () => {
      mockFindUnique.mockResolvedValue(null);
      expect(await updateCostEntry({ id: "c-1", label: "카페" })).toBe("not_found");
    });

    it("성공 → { before, after }", async () => {
      mockFindUnique.mockResolvedValue(MOCK_ROW);
      mockUpdate.mockResolvedValue({ ...MOCK_ROW, label: "카페", amountKrw: 6000 });

      const r = await updateCostEntry({ id: "c-1", label: "카페", amountKrw: 6000 });
      expect(r).not.toBe("not_found");
      if (r && r !== "not_found") {
        expect(r.before.label).toBe("커피");
        expect(r.after.label).toBe("카페");
      }
    });
  });

  // ─── settleCostEntry ───────────────────────────────────────

  describe("settleCostEntry", () => {
    it("prisma null → null", async () => {
      mockPrisma = null;
      expect(await settleCostEntry("c-1", true)).toBeNull();
    });

    it("not_found → 'not_found'", async () => {
      mockFindUnique.mockResolvedValue(null);
      expect(await settleCostEntry("c-1", true)).toBe("not_found");
    });

    it("settled=true → settledAt 설정", async () => {
      mockFindUnique.mockResolvedValue(MOCK_ROW);
      mockUpdate.mockResolvedValue({ ...MOCK_ROW, settledAt: new Date("2026-07-02") });

      const r = await settleCostEntry("c-1", true);
      if (r && r !== "not_found") {
        expect(r.before.settledAt).toBeUndefined();
        expect(r.after.settledAt).toBeDefined();
      }
    });

    it("settled=false → settledAt null", async () => {
      const settled = { ...MOCK_ROW, settledAt: new Date("2026-07-02") };
      mockFindUnique.mockResolvedValue(settled);
      mockUpdate.mockResolvedValue({ ...settled, settledAt: null });

      const r = await settleCostEntry("c-1", false);
      if (r && r !== "not_found") {
        expect(r.after.settledAt).toBeUndefined();
      }
    });
  });

  // ─── deleteCostEntry ───────────────────────────────────────

  describe("deleteCostEntry", () => {
    it("prisma null → null", async () => {
      mockPrisma = null;
      expect(await deleteCostEntry("c-1")).toBeNull();
    });

    it("not_found → 'not_found'", async () => {
      mockFindUnique.mockResolvedValue(null);
      expect(await deleteCostEntry("c-1")).toBe("not_found");
    });

    it("성공 → { before }", async () => {
      mockFindUnique.mockResolvedValue(MOCK_ROW);
      mockDelete.mockResolvedValue(MOCK_ROW);

      const r = await deleteCostEntry("c-1");
      if (r && r !== "not_found") {
        expect(r.before.id).toBe("c-1");
        expect(r.before.label).toBe("커피");
      }
    });
  });
});
