/**
 * lib/repositories/invite.repository.ts 단위 테스트.
 *
 * getInviteSummary — 초대 코드 AuditLog 집계.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockFindMany = vi.fn();

let mockPrisma: unknown = {
  auditLog: {
    findMany: (...args: unknown[]) => mockFindMany(...args),
  },
};

vi.mock("@/lib/prisma", () => ({
  get prisma() { return mockPrisma; },
}));

vi.mock("@/lib/admin/window-filter", () => ({
  buildWindowCutoffFilter: (w: unknown) =>
    w ? { createdAt: { gte: new Date() } } : {},
}));

import { getInviteSummary } from "@/lib/repositories/invite.repository";

describe("invite.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      auditLog: {
        findMany: (...args: unknown[]) => mockFindMany(...args),
      },
    };
  });

  it("prisma null → null", async () => {
    mockPrisma = null;
    expect(await getInviteSummary()).toBeNull();
  });

  it("빈 rows → 0", async () => {
    mockFindMany.mockResolvedValue([]);
    const r = await getInviteSummary();
    expect(r!.totalUses).toBe(0);
    expect(r!.uniqueCodes).toBe(0);
    expect(r!.byCodes).toEqual([]);
  });

  it("코드별 집계 + 정렬", async () => {
    mockFindMany.mockResolvedValue([
      { resourceId: "CODE-A", createdAt: new Date("2026-07-01") },
      { resourceId: "CODE-A", createdAt: new Date("2026-07-03") },
      { resourceId: "CODE-A", createdAt: new Date("2026-07-02") },
      { resourceId: "CODE-B", createdAt: new Date("2026-07-05") },
    ]);

    const r = await getInviteSummary();
    expect(r!.totalUses).toBe(4);
    expect(r!.uniqueCodes).toBe(2);
    // CODE-A (3 uses) first
    expect(r!.byCodes[0].code).toBe("CODE-A");
    expect(r!.byCodes[0].uses).toBe(3);
    expect(r!.byCodes[0].firstUsed).toBe(new Date("2026-07-01").toISOString());
    expect(r!.byCodes[0].lastUsed).toBe(new Date("2026-07-03").toISOString());
    // CODE-B (1 use)
    expect(r!.byCodes[1].code).toBe("CODE-B");
    expect(r!.byCodes[1].uses).toBe(1);
  });

  it("windowDays 전달", async () => {
    mockFindMany.mockResolvedValue([]);
    await getInviteSummary({ windowDays: 30 });
    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });

  it("DB 에러 → null", async () => {
    mockFindMany.mockRejectedValue(new Error("DB"));
    expect(await getInviteSummary()).toBeNull();
  });
});
