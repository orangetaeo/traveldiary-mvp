/**
 * 온보딩 퍼널 AuditLog 집계 — 시나리오 C Phase C4.
 *
 * AuditLog.action="funnel.onboarding" 행을 step별 카운트.
 * 전환율 = 다음 step 카운트 / 현재 step 카운트.
 */

import "server-only";

import { prisma } from "../prisma";
import {
  buildWindowCutoffFilter,
  type WindowOption,
} from "../admin/window-filter";

const STEP_ORDER = ["view", "step1", "step2", "step3", "step4", "submit", "complete"] as const;

export interface FunnelStepCount {
  step: string;
  count: number;
  /** 이전 step 대비 전환율 (첫 step은 1.0) */
  conversionRate: number;
}

export interface FunnelSummary {
  steps: FunnelStepCount[];
  totalViews: number;
  totalCompletes: number;
  /** view → complete 전체 전환율 */
  overallConversionRate: number;
}

export interface GetFunnelSummaryOptions {
  windowDays?: WindowOption;
}

export async function getFunnelSummary(
  options: GetFunnelSummaryOptions = {},
): Promise<FunnelSummary | null> {
  if (!prisma) return null;
  try {
    const rows = await prisma.auditLog.findMany({
      where: {
        action: "funnel.onboarding",
        ...buildWindowCutoffFilter(options.windowDays),
      },
      select: { resourceId: true },
    });

    // resourceId = "onboarding-{step}"
    const counts = new Map<string, number>();
    for (const row of rows) {
      const step = row.resourceId.replace("onboarding-", "");
      counts.set(step, (counts.get(step) ?? 0) + 1);
    }

    const totalViews = counts.get("view") ?? 0;
    const totalCompletes = counts.get("complete") ?? 0;

    const steps: FunnelStepCount[] = STEP_ORDER.map((step, i) => {
      const count = counts.get(step) ?? 0;
      const prevCount = i === 0 ? count : (counts.get(STEP_ORDER[i - 1]) ?? 0);
      const conversionRate = prevCount > 0 ? count / prevCount : 0;
      return { step, count, conversionRate };
    });

    return {
      steps,
      totalViews,
      totalCompletes,
      overallConversionRate: totalViews > 0 ? totalCompletes / totalViews : 0,
    };
  } catch (err) {
    console.error("[funnel.repository] getFunnelSummary failed", err);
    return null;
  }
}
