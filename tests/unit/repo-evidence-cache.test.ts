/**
 * lib/repositories/evidence-cache.repository.ts 단위 테스트.
 *
 * getEvidenceCache, setEvidenceCache — TTL 기반 캐시.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockFindUnique = vi.fn();
const mockUpsert = vi.fn();

let mockPrisma: unknown = {
  evidenceCache: {
    findUnique: (...args: unknown[]) => mockFindUnique(...args),
    upsert: (...args: unknown[]) => mockUpsert(...args),
  },
};

vi.mock("@/lib/prisma", () => ({
  get prisma() { return mockPrisma; },
}));

import {
  getEvidenceCache,
  setEvidenceCache,
} from "@/lib/repositories/evidence-cache.repository";

describe("evidence-cache.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      evidenceCache: {
        findUnique: (...args: unknown[]) => mockFindUnique(...args),
        upsert: (...args: unknown[]) => mockUpsert(...args),
      },
    };
  });

  // ─── getEvidenceCache ──────────────────────────────────────

  describe("getEvidenceCache", () => {
    it("prisma null → null", async () => {
      mockPrisma = null;
      expect(await getEvidenceCache("p1", "google")).toBeNull();
    });

    it("row 없음 → null", async () => {
      mockFindUnique.mockResolvedValue(null);
      expect(await getEvidenceCache("p1", "google")).toBeNull();
    });

    it("만료됨 → null", async () => {
      mockFindUnique.mockResolvedValue({
        data: { foo: "bar" },
        fetchedAt: new Date("2026-01-01"),
        expiresAt: new Date("2020-01-01"), // 과거
      });
      expect(await getEvidenceCache("p1", "google")).toBeNull();
    });

    it("유효 → { data, fetchedAt, expiresAt }", async () => {
      const futureDate = new Date(Date.now() + 3600000);
      const fetchedAt = new Date("2026-07-01");
      mockFindUnique.mockResolvedValue({
        data: { rating: 4.5 },
        fetchedAt,
        expiresAt: futureDate,
      });

      const r = await getEvidenceCache<{ rating: number }>("p1", "google");
      expect(r).not.toBeNull();
      expect(r!.data.rating).toBe(4.5);
      expect(r!.fetchedAt).toEqual(fetchedAt);
    });

    it("DB 에러 → null", async () => {
      mockFindUnique.mockRejectedValue(new Error("DB"));
      expect(await getEvidenceCache("p1", "google")).toBeNull();
    });
  });

  // ─── setEvidenceCache ──────────────────────────────────────

  describe("setEvidenceCache", () => {
    it("prisma null → 무시 (에러 없음)", async () => {
      mockPrisma = null;
      await expect(
        setEvidenceCache({ placeId: "p1", platform: "google", data: {}, ttlMs: 3600000 }),
      ).resolves.toBeUndefined();
    });

    it("upsert 호출 (placeId + platform 복합키)", async () => {
      mockUpsert.mockResolvedValue({});
      await setEvidenceCache({
        placeId: "p1",
        platform: "naver",
        data: { results: [] },
        ttlMs: 7200000,
      });

      const call = mockUpsert.mock.calls[0][0];
      expect(call.where.placeId_platform).toEqual({
        placeId: "p1",
        platform: "naver",
      });
      expect(call.create.placeId).toBe("p1");
      expect(call.create.platform).toBe("naver");
      expect(call.create.data).toEqual({ results: [] });
      // expiresAt은 now + ttlMs이므로 미래 시점
      expect(call.create.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("DB 에러 → 무시 (throw 안 함)", async () => {
      mockUpsert.mockRejectedValue(new Error("DB"));
      await expect(
        setEvidenceCache({ placeId: "p1", platform: "google", data: {}, ttlMs: 1000 }),
      ).resolves.toBeUndefined();
    });
  });
});
