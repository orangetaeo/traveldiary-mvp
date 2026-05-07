/**
 * lib/repositories/place.repository.ts 단위 테스트.
 *
 * getPlaces, getDiscoverPlaces, getPlaceByGoogleId.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockFindMany = vi.fn();
const mockFindUnique = vi.fn();

let mockPrisma: unknown = {
  place: {
    findMany: (...args: unknown[]) => mockFindMany(...args),
    findUnique: (...args: unknown[]) => mockFindUnique(...args),
  },
};

vi.mock("@/lib/prisma", () => ({
  get prisma() { return mockPrisma; },
}));

vi.mock("@/lib/seed/cities", () => ({
  getCityByCode: (code: string) =>
    code === "da-nang" ? { name: "다낭", code: "da-nang" } : null,
}));

import { getPlaces, getDiscoverPlaces, getPlaceByGoogleId } from "@/lib/repositories/place.repository";

describe("place.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      place: {
        findMany: (...args: unknown[]) => mockFindMany(...args),
        findUnique: (...args: unknown[]) => mockFindUnique(...args),
      },
    };
  });

  // ── getPlaces ──────────────────────────────────────────

  describe("getPlaces", () => {
    it("prisma null → 빈 배열", async () => {
      mockPrisma = null;
      expect(await getPlaces({ cityCode: "da-nang" })).toEqual([]);
    });

    it("기본 조회 (category 미지정)", async () => {
      mockFindMany.mockResolvedValue([{ id: "p1", name: "미케비치" }]);
      const r = await getPlaces({ cityCode: "da-nang" });
      expect(r).toHaveLength(1);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ cityCode: "da-nang", isActive: true }),
          orderBy: { qualityScore: "desc" },
          take: 100,
        }),
      );
    });

    it("category + limit 필터", async () => {
      mockFindMany.mockResolvedValue([]);
      await getPlaces({ cityCode: "da-nang", category: "food", limit: 10 });
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: "food" }),
          take: 10,
        }),
      );
    });

    it("minQualityScore 필터", async () => {
      mockFindMany.mockResolvedValue([]);
      await getPlaces({ cityCode: "da-nang", minQualityScore: 50 });
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ qualityScore: { gte: 50 } }),
        }),
      );
    });

    it("DB 에러 → 빈 배열", async () => {
      mockFindMany.mockRejectedValue(new Error("DB"));
      expect(await getPlaces({ cityCode: "da-nang" })).toEqual([]);
    });
  });

  // ── getDiscoverPlaces ──────────────────────────────────

  describe("getDiscoverPlaces", () => {
    it("prisma null → 빈 배열", async () => {
      mockPrisma = null;
      expect(await getDiscoverPlaces("da-nang")).toEqual([]);
    });

    it("기본 변환 (spot, qualityScore 60)", async () => {
      mockFindMany.mockResolvedValue([
        {
          id: "p1",
          name: "미케비치",
          category: "spot",
          subCategory: null,
          rating: 4.5,
          userRatingsTotal: 500,
          qualityScore: 65,
          zone: "dn-my-khe",
          cityCode: "da-nang",
        },
      ]);
      const r = await getDiscoverPlaces("da-nang");
      expect(r).toHaveLength(1);
      expect(r[0].name).toBe("미케비치");
      expect(r[0].category).toBe("spot");
      expect(r[0].badge).toBe("popular"); // 60+
      expect(r[0].distance).toBe("미케"); // ZONE_LABEL
      expect(r[0].destination).toBe("다낭");
    });

    it("qualityScore 50~59 → 'ai' 배지", async () => {
      mockFindMany.mockResolvedValue([
        {
          id: "p2",
          name: "테스트",
          category: "food",
          subCategory: null,
          rating: 4.0,
          userRatingsTotal: 100,
          qualityScore: 55,
          zone: null,
          cityCode: "da-nang",
        },
      ]);
      const r = await getDiscoverPlaces("da-nang");
      expect(r[0].badge).toBe("ai");
      expect(r[0].distance).toBe("시내"); // zone null → 기본값
    });

    it("qualityScore < 50 → 배지 없음", async () => {
      mockFindMany.mockResolvedValue([
        {
          id: "p3",
          name: "로컬",
          category: "food",
          subCategory: null,
          rating: 3.5,
          userRatingsTotal: 50,
          qualityScore: 40,
          zone: null,
          cityCode: "da-nang",
        },
      ]);
      const r = await getDiscoverPlaces("da-nang");
      expect(r[0].badge).toBeUndefined();
    });

    it("subCategory '카페' → category 'cafe'", async () => {
      mockFindMany.mockResolvedValue([
        {
          id: "p4",
          name: "콩카페",
          category: "food",
          subCategory: "카페",
          rating: 4.2,
          userRatingsTotal: 300,
          qualityScore: 50,
          zone: null,
          cityCode: "da-nang",
        },
      ]);
      const r = await getDiscoverPlaces("da-nang");
      expect(r[0].category).toBe("cafe");
    });

    it("subCategory '해변' → category 'nature'", async () => {
      mockFindMany.mockResolvedValue([
        {
          id: "p5",
          name: "비치",
          category: "spot",
          subCategory: "해변",
          rating: 4.0,
          userRatingsTotal: 200,
          qualityScore: 50,
          zone: null,
          cityCode: "da-nang",
        },
      ]);
      const r = await getDiscoverPlaces("da-nang");
      expect(r[0].category).toBe("nature");
    });

    it("rest + 비-스파/뷰티 subCategory → 필터 제외", async () => {
      mockFindMany.mockResolvedValue([
        {
          id: "p6",
          name: "호텔",
          category: "rest",
          subCategory: "숙소",
          rating: 4.0,
          userRatingsTotal: 100,
          qualityScore: 50,
          zone: null,
          cityCode: "da-nang",
        },
      ]);
      const r = await getDiscoverPlaces("da-nang");
      expect(r).toHaveLength(0); // 숙소 제외
    });

    it("rest + '스파/마사지' → 포함", async () => {
      mockFindMany.mockResolvedValue([
        {
          id: "p7",
          name: "스파",
          category: "rest",
          subCategory: "스파/마사지",
          rating: 4.5,
          userRatingsTotal: 150,
          qualityScore: 60,
          zone: null,
          cityCode: "da-nang",
        },
      ]);
      const r = await getDiscoverPlaces("da-nang");
      expect(r).toHaveLength(1);
    });

    it("알 수 없는 cityCode → destination = cityCode", async () => {
      mockFindMany.mockResolvedValue([
        {
          id: "p8",
          name: "장소",
          category: "spot",
          subCategory: null,
          rating: 4.0,
          userRatingsTotal: 100,
          qualityScore: 50,
          zone: null,
          cityCode: "unknown-city",
        },
      ]);
      const r = await getDiscoverPlaces("unknown-city");
      expect(r[0].destination).toBe("unknown-city"); // getCityByCode returns null
    });

    it("DB 에러 → 빈 배열", async () => {
      mockFindMany.mockRejectedValue(new Error("DB"));
      expect(await getDiscoverPlaces("da-nang")).toEqual([]);
    });
  });

  // ── getPlaceByGoogleId ─────────────────────────────────

  describe("getPlaceByGoogleId", () => {
    it("prisma null → null", async () => {
      mockPrisma = null;
      expect(await getPlaceByGoogleId("gid-1")).toBeNull();
    });

    it("장소 조회 성공", async () => {
      mockFindUnique.mockResolvedValue({ id: "p1", googlePlaceId: "gid-1" });
      const r = await getPlaceByGoogleId("gid-1");
      expect(r).toEqual({ id: "p1", googlePlaceId: "gid-1" });
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { googlePlaceId: "gid-1" },
      });
    });

    it("DB 에러 → null", async () => {
      mockFindUnique.mockRejectedValue(new Error("DB"));
      expect(await getPlaceByGoogleId("gid-1")).toBeNull();
    });
  });
});
