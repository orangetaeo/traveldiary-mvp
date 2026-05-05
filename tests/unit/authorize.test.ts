/**
 * authorize.ts — 권한 검증 헬퍼 테스트 (Prisma + session mock).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  getActorId: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    trip: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/seed", () => ({
  DEMO_TRIP_ID: "demo-trip-pqc",
}));

import { getActorId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { canWriteTrip, canWriteTripResource } from "@/lib/auth/authorize";

const mockGetActorId = getActorId as unknown as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma!.trip.findUnique as unknown as ReturnType<typeof vi.fn>;

describe("authorize — 권한 검증", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("canWriteTrip", () => {
    it("DEMO_TRIP_ID면 항상 true", async () => {
      expect(await canWriteTrip("demo-trip-pqc")).toBe(true);
      expect(mockGetActorId).not.toHaveBeenCalled();
    });

    it("미인증 (actorId null) 시 true (단일 사용자 모드)", async () => {
      mockGetActorId.mockResolvedValue(null);
      expect(await canWriteTrip("trip-123")).toBe(true);
    });

    it("인증됨 + ownerId 일치 시 true", async () => {
      mockGetActorId.mockResolvedValue("user-abc");
      mockFindUnique.mockResolvedValue({ ownerId: "user-abc" });
      expect(await canWriteTrip("trip-456")).toBe(true);
    });

    it("인증됨 + ownerId 불일치 시 false", async () => {
      mockGetActorId.mockResolvedValue("user-abc");
      mockFindUnique.mockResolvedValue({ ownerId: "user-xyz" });
      expect(await canWriteTrip("trip-789")).toBe(false);
    });

    it("trip 없으면 false", async () => {
      mockGetActorId.mockResolvedValue("user-abc");
      mockFindUnique.mockResolvedValue(null);
      expect(await canWriteTrip("nonexistent")).toBe(false);
    });

    it("DB 에러 시 false", async () => {
      mockGetActorId.mockResolvedValue("user-abc");
      mockFindUnique.mockRejectedValue(new Error("DB connection lost"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(await canWriteTrip("trip-err")).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        "[authorize] canWriteTrip failed",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });

    it("findUnique에 올바른 파라미터 전달", async () => {
      mockGetActorId.mockResolvedValue("user-abc");
      mockFindUnique.mockResolvedValue({ ownerId: "user-abc" });
      await canWriteTrip("trip-check");
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: "trip-check" },
        select: { ownerId: true },
      });
    });
  });

  describe("canWriteTripResource", () => {
    it("canWriteTrip에 위임", async () => {
      expect(await canWriteTripResource("demo-trip-pqc")).toBe(true);
    });

    it("비데모 trip도 동일 동작", async () => {
      mockGetActorId.mockResolvedValue("user-abc");
      mockFindUnique.mockResolvedValue({ ownerId: "user-abc" });
      expect(await canWriteTripResource("trip-456")).toBe(true);
    });
  });
});
