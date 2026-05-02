/**
 * Affiliate AuditLog 집계 — 사이클 12c.
 * AuditLog.action="affiliate.click" 행을 OTA별 집계.
 */

import "server-only";

import { prisma } from "../prisma";
import type { OtaProvider } from "../types";

/** OTA별 추정 commission rate (어필리에이트 계약 정확값으로 운영 단계에서 갱신) */
export const COMMISSION_RATE: Record<OtaProvider, number> = {
  klook: 0.05,
  kkday: 0.04,
  agoda: 0.04,
};

export interface AffiliateClickRow {
  id: string;
  createdAt: string;
  ota: OtaProvider | string;
  itemId: string;
  offerId: string;
  priceKrw: number;
  estimatedCommissionKrw: number;
  actorId: string | null;
  tracked: boolean;
}

export interface AffiliateSummary {
  totalClicks: number;
  totalEstimatedCommissionKrw: number;
  byOta: Array<{
    ota: OtaProvider | string;
    clicks: number;
    estimatedCommissionKrw: number;
  }>;
  recent: AffiliateClickRow[];
}

export async function getAffiliateSummary(
  limit = 20,
): Promise<AffiliateSummary | null> {
  if (!prisma) return null;
  try {
    const rows = await prisma.auditLog.findMany({
      where: { action: "affiliate.click" },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const items: AffiliateClickRow[] = rows.map((r) => {
      const meta = (r.metadata ?? {}) as {
        ota?: string;
        itemId?: string;
        priceKrw?: number;
      };
      const after = (r.after ?? {}) as { tracked?: boolean };
      const ota = (meta.ota ?? "unknown") as OtaProvider;
      const priceKrw = meta.priceKrw ?? 0;
      const rate =
        ota in COMMISSION_RATE ? COMMISSION_RATE[ota as OtaProvider] : 0;
      return {
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        ota,
        itemId: meta.itemId ?? "",
        offerId: r.resourceId,
        priceKrw,
        estimatedCommissionKrw: Math.round(priceKrw * rate),
        actorId: r.actorId,
        tracked: after.tracked ?? false,
      };
    });

    const otaMap = new Map<
      string,
      { clicks: number; estimatedCommissionKrw: number }
    >();
    for (const it of items) {
      const cur = otaMap.get(it.ota) ?? { clicks: 0, estimatedCommissionKrw: 0 };
      cur.clicks += 1;
      cur.estimatedCommissionKrw += it.estimatedCommissionKrw;
      otaMap.set(it.ota, cur);
    }

    const byOta = Array.from(otaMap.entries())
      .map(([ota, v]) => ({ ota, ...v }))
      .sort((a, b) => b.clicks - a.clicks);

    return {
      totalClicks: items.length,
      totalEstimatedCommissionKrw: items.reduce(
        (s, it) => s + it.estimatedCommissionKrw,
        0,
      ),
      byOta,
      recent: items.slice(0, limit),
    };
  } catch (err) {
    console.error("[affiliate.repository] getSummary failed", err);
    return null;
  }
}
