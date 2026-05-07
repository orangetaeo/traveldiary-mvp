/**
 * lib/repositories/ab.repository.ts 단위 테스트.
 *
 * getAbSummary — A/B 실험 AuditLog 집계.
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

import { getAbSummary } from "@/lib/repositories/ab.repository";

describe("ab.repository", () => {
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
    expect(await getAbSummary()).toBeNull();
  });

  it("빈 rows → experiments 빈 배열", async () => {
    mockFindMany.mockResolvedValue([]);
    const r = await getAbSummary();
    expect(r).not.toBeNull();
    expect(r!.experiments).toEqual([]);
  });

  it("impression + conversion 집계", async () => {
    mockFindMany.mockResolvedValue([
      {
        action: "ab.impression",
        resourceId: "exp-1",
        metadata: { experimentId: "exp-1", variant: "A", event: "impression" },
      },
      {
        action: "ab.impression",
        resourceId: "exp-1",
        metadata: { experimentId: "exp-1", variant: "A", event: "impression" },
      },
      {
        action: "ab.conversion",
        resourceId: "exp-1",
        metadata: { experimentId: "exp-1", variant: "A", event: "conversion" },
      },
      {
        action: "ab.impression",
        resourceId: "exp-1",
        metadata: { experimentId: "exp-1", variant: "B", event: "impression" },
      },
    ]);

    const r = await getAbSummary();
    expect(r!.experiments).toHaveLength(1);
    const exp = r!.experiments[0];
    expect(exp.experimentId).toBe("exp-1");
    expect(exp.totalImpressions).toBe(3);
    expect(exp.totalConversions).toBe(1);
    // A: 2 impressions, 1 conversion — sorted first (more impressions)
    expect(exp.variants[0].variant).toBe("A");
    expect(exp.variants[0].impressions).toBe(2);
    expect(exp.variants[0].conversionRate).toBe(0.5);
    // B: 1 impression, 0 conversions
    expect(exp.variants[1].variant).toBe("B");
    expect(exp.variants[1].impressions).toBe(1);
    expect(exp.variants[1].conversionRate).toBe(0);
  });

  it("metadata 없을 때 fallback (resourceId, action)", async () => {
    mockFindMany.mockResolvedValue([
      {
        action: "ab.impression",
        resourceId: "exp-2",
        metadata: null,
      },
    ]);

    const r = await getAbSummary();
    const exp = r!.experiments[0];
    expect(exp.experimentId).toBe("exp-2");
    expect(exp.variants[0].variant).toBe("unknown");
    expect(exp.variants[0].impressions).toBe(1);
  });

  it("여러 실험 분리 집계", async () => {
    mockFindMany.mockResolvedValue([
      { action: "ab.impression", resourceId: "exp-1", metadata: { experimentId: "exp-1", variant: "A", event: "impression" } },
      { action: "ab.impression", resourceId: "exp-2", metadata: { experimentId: "exp-2", variant: "X", event: "impression" } },
    ]);

    const r = await getAbSummary();
    expect(r!.experiments).toHaveLength(2);
  });

  it("conversionRate = 0 when impressions = 0", async () => {
    mockFindMany.mockResolvedValue([
      { action: "ab.conversion", resourceId: "exp-1", metadata: { experimentId: "exp-1", variant: "A", event: "conversion" } },
    ]);

    const r = await getAbSummary();
    // only conversions, no impressions — rate should be 0
    expect(r!.experiments[0].variants[0].conversionRate).toBe(0);
  });

  it("windowDays 전달", async () => {
    mockFindMany.mockResolvedValue([]);
    await getAbSummary({ windowDays: 7 });
    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });

  it("DB 에러 → null", async () => {
    mockFindMany.mockRejectedValue(new Error("DB"));
    expect(await getAbSummary()).toBeNull();
  });
});
