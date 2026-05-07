/**
 * lib/repositories/share.repository.ts 단위 테스트.
 *
 * createShareLinkRow, fetchShareLinkBySyncKey, revokeShareLink.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@prisma/client", () => ({ Prisma: {} }));

const mockCreate = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockFetchTripFromDb = vi.fn();

vi.mock("@/lib/repositories/trip.repository", () => ({
  fetchTripFromDb: (...args: unknown[]) => mockFetchTripFromDb(...args),
}));

let mockPrisma: unknown = {
  shareLink: {
    create: (...args: unknown[]) => mockCreate(...args),
    findUnique: (...args: unknown[]) => mockFindUnique(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
};

vi.mock("@/lib/prisma", () => ({
  get prisma() { return mockPrisma; },
}));

import {
  createShareLinkRow,
  fetchShareLinkBySyncKey,
  revokeShareLink,
} from "@/lib/repositories/share.repository";

const MOCK_ROW = {
  id: "sl-1",
  tripId: "t-1",
  syncKey: "sync-abc",
  permission: "view",
  expiresAt: new Date("2026-08-01"),
  createdBy: "u1",
  createdAt: new Date("2026-07-01"),
  revokedAt: null,
};

describe("share.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      shareLink: {
        create: (...args: unknown[]) => mockCreate(...args),
        findUnique: (...args: unknown[]) => mockFindUnique(...args),
        update: (...args: unknown[]) => mockUpdate(...args),
      },
    };
  });

  // ─── createShareLinkRow ────────────────────────────────────

  describe("createShareLinkRow", () => {
    it("prisma null → null", async () => {
      mockPrisma = null;
      expect(await createShareLinkRow({ tripId: "t-1", syncKey: "k" })).toBeNull();
    });

    it("성공 → ShareLink 반환", async () => {
      mockCreate.mockResolvedValue(MOCK_ROW);
      const r = await createShareLinkRow({ tripId: "t-1", syncKey: "sync-abc" });
      expect(r!.id).toBe("sl-1");
      expect(r!.syncKey).toBe("sync-abc");
      expect(r!.permission).toBe("view");
    });

    it("기본 permission = view", async () => {
      mockCreate.mockResolvedValue(MOCK_ROW);
      await createShareLinkRow({ tripId: "t-1", syncKey: "k" });
      expect(mockCreate.mock.calls[0][0].data.permission).toBe("view");
    });

    it("DB 에러 → null", async () => {
      mockCreate.mockRejectedValue(new Error("DB"));
      expect(await createShareLinkRow({ tripId: "t-1", syncKey: "k" })).toBeNull();
    });
  });

  // ─── fetchShareLinkBySyncKey ───────────────────────────────

  describe("fetchShareLinkBySyncKey", () => {
    it("prisma null → null", async () => {
      mockPrisma = null;
      expect(await fetchShareLinkBySyncKey("k")).toBeNull();
    });

    it("없는 키 → null", async () => {
      mockFindUnique.mockResolvedValue(null);
      expect(await fetchShareLinkBySyncKey("k")).toBeNull();
    });

    it("revoked → null", async () => {
      mockFindUnique.mockResolvedValue({ ...MOCK_ROW, revokedAt: new Date() });
      expect(await fetchShareLinkBySyncKey("k")).toBeNull();
    });

    it("expired → null", async () => {
      mockFindUnique.mockResolvedValue({
        ...MOCK_ROW,
        expiresAt: new Date("2020-01-01"), // 과거
      });
      expect(await fetchShareLinkBySyncKey("k")).toBeNull();
    });

    it("bundle 없음 → null", async () => {
      mockFindUnique.mockResolvedValue(MOCK_ROW);
      mockFetchTripFromDb.mockResolvedValue(null);
      expect(await fetchShareLinkBySyncKey("sync-abc")).toBeNull();
    });

    it("유효 → { link, bundle }", async () => {
      const futureExpiry = new Date(Date.now() + 86400000);
      mockFindUnique.mockResolvedValue({ ...MOCK_ROW, expiresAt: futureExpiry });
      const mockBundle = { trip: { id: "t-1" }, items: [] };
      mockFetchTripFromDb.mockResolvedValue(mockBundle);

      const r = await fetchShareLinkBySyncKey("sync-abc");
      expect(r).not.toBeNull();
      expect(r!.link.id).toBe("sl-1");
      expect(r!.bundle).toBe(mockBundle);
    });

    it("DB 에러 → null", async () => {
      mockFindUnique.mockRejectedValue(new Error("DB"));
      expect(await fetchShareLinkBySyncKey("k")).toBeNull();
    });
  });

  // ─── revokeShareLink ──────────────────────────────────────

  describe("revokeShareLink", () => {
    it("prisma null → null", async () => {
      mockPrisma = null;
      expect(await revokeShareLink("sl-1")).toBeNull();
    });

    it("성공 → { revoked: true }", async () => {
      mockUpdate.mockResolvedValue({});
      const r = await revokeShareLink("sl-1");
      expect(r).toEqual({ revoked: true });
    });

    it("DB 에러 → null", async () => {
      mockUpdate.mockRejectedValue(new Error("DB"));
      expect(await revokeShareLink("sl-1")).toBeNull();
    });
  });
});
