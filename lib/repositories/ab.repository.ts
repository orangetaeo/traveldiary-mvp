/**
 * A/B 실험 결과 집계 — 시나리오 C Phase C4.
 *
 * AuditLog action="ab.impression" / "ab.conversion" 행을
 * 실험·variant별 노출수/전환수/전환율로 집계.
 */

import "server-only";

import { prisma } from "../prisma";
import {
  buildWindowCutoffFilter,
  type WindowOption,
} from "../admin/window-filter";

export interface VariantStats {
  variant: string;
  impressions: number;
  conversions: number;
  conversionRate: number;
}

export interface ExperimentStats {
  experimentId: string;
  variants: VariantStats[];
  totalImpressions: number;
  totalConversions: number;
}

export interface AbSummary {
  experiments: ExperimentStats[];
}

export interface GetAbSummaryOptions {
  windowDays?: WindowOption;
}

export async function getAbSummary(
  options: GetAbSummaryOptions = {},
): Promise<AbSummary | null> {
  if (!prisma) return null;

  try {
    const windowFilter = buildWindowCutoffFilter(options.windowDays);

    const rows = await prisma.auditLog.findMany({
      where: {
        action: { startsWith: "ab." },
        ...windowFilter,
      },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    // experimentId → variant → { impressions, conversions }
    const expMap = new Map<
      string,
      Map<string, { impressions: number; conversions: number }>
    >();

    for (const r of rows) {
      const meta = (r.metadata ?? {}) as {
        experimentId?: string;
        variant?: string;
        event?: string;
      };
      const expId = meta.experimentId ?? r.resourceId;
      const variant = meta.variant ?? "unknown";
      const event = meta.event ?? r.action.replace("ab.", "");

      if (!expMap.has(expId)) {
        expMap.set(expId, new Map());
      }
      const varMap = expMap.get(expId)!;
      const cur = varMap.get(variant) ?? { impressions: 0, conversions: 0 };

      if (event === "impression") {
        cur.impressions += 1;
      } else if (event === "conversion") {
        cur.conversions += 1;
      }
      varMap.set(variant, cur);
    }

    const experiments: ExperimentStats[] = Array.from(expMap.entries()).map(
      ([experimentId, varMap]) => {
        const variants: VariantStats[] = Array.from(varMap.entries())
          .map(([variant, stats]) => ({
            variant,
            ...stats,
            conversionRate:
              stats.impressions > 0
                ? stats.conversions / stats.impressions
                : 0,
          }))
          .sort((a, b) => b.impressions - a.impressions);

        return {
          experimentId,
          variants,
          totalImpressions: variants.reduce((s, v) => s + v.impressions, 0),
          totalConversions: variants.reduce((s, v) => s + v.conversions, 0),
        };
      },
    );

    return { experiments };
  } catch (err) {
    console.error("[ab.repository] getAbSummary failed", err);
    return null;
  }
}
