/**
 * lib/repositories/funnel.repository.ts 단위 테스트.
 *
 * getFunnelSummary — 온보딩 퍼널 AuditLog 집계.
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

import { getFunnelSummary } from "@/lib/repositories/funnel.repository";

describe("funnel.repository", () => {
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
    expect(await getFunnelSummary()).toBeNull();
  });

  it("빈 rows → 0", async () => {
    mockFindMany.mockResolvedValue([]);
    const r = await getFunnelSummary();
    expect(r!.totalViews).toBe(0);
    expect(r!.totalCompletes).toBe(0);
    expect(r!.overallConversionRate).toBe(0);
    expect(r!.steps).toHaveLength(7);
    // 모든 step count = 0
    for (const s of r!.steps) {
      expect(s.count).toBe(0);
    }
  });

  it("step별 전환율 계산", async () => {
    mockFindMany.mockResolvedValue([
      { resourceId: "onboarding-view" },
      { resourceId: "onboarding-view" },
      { resourceId: "onboarding-view" },
      { resourceId: "onboarding-view" },
      { resourceId: "onboarding-step1" },
      { resourceId: "onboarding-step1" },
      { resourceId: "onboarding-step1" },
      { resourceId: "onboarding-step2" },
      { resourceId: "onboarding-step2" },
      { resourceId: "onboarding-complete" },
    ]);

    const r = await getFunnelSummary();
    expect(r!.totalViews).toBe(4);
    expect(r!.totalCompletes).toBe(1);
    expect(r!.overallConversionRate).toBe(0.25);

    // view: 4, conversionRate = 1.0 (첫 step)
    expect(r!.steps[0].step).toBe("view");
    expect(r!.steps[0].count).toBe(4);
    expect(r!.steps[0].conversionRate).toBe(1);

    // step1: 3, conversionRate = 3/4 = 0.75
    expect(r!.steps[1].step).toBe("step1");
    expect(r!.steps[1].count).toBe(3);
    expect(r!.steps[1].conversionRate).toBe(0.75);

    // step2: 2, conversionRate = 2/3
    expect(r!.steps[2].count).toBe(2);
  });

  it("STEP_ORDER 7단계", async () => {
    mockFindMany.mockResolvedValue([]);
    const r = await getFunnelSummary();
    const stepNames = r!.steps.map((s) => s.step);
    expect(stepNames).toEqual(["view", "step1", "step2", "step3", "step4", "submit", "complete"]);
  });

  it("windowDays 전달", async () => {
    mockFindMany.mockResolvedValue([]);
    await getFunnelSummary({ windowDays: 7 });
    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });

  it("DB 에러 → null", async () => {
    mockFindMany.mockRejectedValue(new Error("DB"));
    expect(await getFunnelSummary()).toBeNull();
  });
});
