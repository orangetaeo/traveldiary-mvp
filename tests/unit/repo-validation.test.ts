/**
 * lib/repositories/validation.repository.ts 단위 테스트.
 *
 * getRecentValidation, createValidation, canValidateItem.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockFindFirst = vi.fn();
const mockCreate = vi.fn();
const mockFindUnique = vi.fn();

let mockPrisma: unknown = {
  validationResult: {
    findFirst: (...args: unknown[]) => mockFindFirst(...args),
    create: (...args: unknown[]) => mockCreate(...args),
  },
  itineraryItem: {
    findUnique: (...args: unknown[]) => mockFindUnique(...args),
  },
};

vi.mock("@/lib/prisma", () => ({
  get prisma() { return mockPrisma; },
}));

import {
  getRecentValidation,
  createValidation,
  canValidateItem,
} from "@/lib/repositories/validation.repository";

const MOCK_VALIDATION = {
  id: "v-1",
  itemId: "item-1",
  placeExists: true,
  operatingStatus: "OPERATIONAL",
  bookingRequired: false,
  distanceVerified: true,
  priceVerified: true,
  priceStatus: "exact",
  distanceStatus: "within_range",
  validatedAt: new Date("2026-07-01"),
};

describe("validation.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      validationResult: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
        create: (...args: unknown[]) => mockCreate(...args),
      },
      itineraryItem: {
        findUnique: (...args: unknown[]) => mockFindUnique(...args),
      },
    };
  });

  // ─── getRecentValidation ────────────────────────────────

  describe("getRecentValidation", () => {
    it("prisma null → null", async () => {
      mockPrisma = null;
      expect(await getRecentValidation("item-1")).toBeNull();
    });

    it("캐시 hit → row 반환", async () => {
      mockFindFirst.mockResolvedValue(MOCK_VALIDATION);
      const r = await getRecentValidation("item-1");
      expect(r!.id).toBe("v-1");
      expect(r!.placeExists).toBe(true);
    });

    it("캐시 miss → null", async () => {
      mockFindFirst.mockResolvedValue(null);
      expect(await getRecentValidation("item-1")).toBeNull();
    });

    it("커스텀 TTL 전달", async () => {
      mockFindFirst.mockResolvedValue(null);
      await getRecentValidation("item-1", 3600000);
      expect(mockFindFirst).toHaveBeenCalledTimes(1);
    });

    it("DB 에러 → null", async () => {
      mockFindFirst.mockRejectedValue(new Error("DB"));
      expect(await getRecentValidation("item-1")).toBeNull();
    });
  });

  // ─── createValidation ──────────────────────────────────

  describe("createValidation", () => {
    it("prisma null → null", async () => {
      mockPrisma = null;
      expect(
        await createValidation({
          itemId: "item-1",
          placeExists: true,
          operatingStatus: "OPERATIONAL",
          bookingRequired: false,
          distanceVerified: true,
          priceVerified: true,
        }),
      ).toBeNull();
    });

    it("성공 → row 반환", async () => {
      mockCreate.mockResolvedValue(MOCK_VALIDATION);
      const r = await createValidation({
        itemId: "item-1",
        placeExists: true,
        operatingStatus: "OPERATIONAL",
        bookingRequired: false,
        distanceVerified: true,
        priceVerified: true,
        priceStatus: "exact",
        distanceStatus: "within_range",
      });
      expect(r!.id).toBe("v-1");
    });

    it("DB 에러 → null", async () => {
      mockCreate.mockRejectedValue(new Error("DB"));
      expect(
        await createValidation({
          itemId: "item-1",
          placeExists: true,
          operatingStatus: "OPERATIONAL",
          bookingRequired: false,
          distanceVerified: true,
          priceVerified: true,
        }),
      ).toBeNull();
    });
  });

  // ─── canValidateItem ────────────────────────────────────

  describe("canValidateItem", () => {
    it("prisma null → null", async () => {
      mockPrisma = null;
      expect(await canValidateItem("item-1", "u1")).toBeNull();
    });

    it("item 없음 → null", async () => {
      mockFindUnique.mockResolvedValue(null);
      expect(await canValidateItem("item-1", "u1")).toBeNull();
    });

    it("actorId null → tripId (단일 사용자 모드)", async () => {
      mockFindUnique.mockResolvedValue({
        tripId: "t-1",
        trip: { ownerId: "u1", members: [] },
      });
      expect(await canValidateItem("item-1", null)).toBe("t-1");
    });

    it("owner → tripId", async () => {
      mockFindUnique.mockResolvedValue({
        tripId: "t-1",
        trip: { ownerId: "u1", members: [] },
      });
      expect(await canValidateItem("item-1", "u1")).toBe("t-1");
    });

    it("member → tripId", async () => {
      mockFindUnique.mockResolvedValue({
        tripId: "t-1",
        trip: { ownerId: "u2", members: [{ userId: "u1" }] },
      });
      expect(await canValidateItem("item-1", "u1")).toBe("t-1");
    });

    it("비권한 → null", async () => {
      mockFindUnique.mockResolvedValue({
        tripId: "t-1",
        trip: { ownerId: "u2", members: [] },
      });
      expect(await canValidateItem("item-1", "u1")).toBeNull();
    });

    it("DB 에러 → null", async () => {
      mockFindUnique.mockRejectedValue(new Error("DB"));
      expect(await canValidateItem("item-1", "u1")).toBeNull();
    });
  });
});
