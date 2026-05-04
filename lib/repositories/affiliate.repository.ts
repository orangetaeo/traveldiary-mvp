/**
 * Affiliate AuditLog 집계 — 사이클 12c.
 * AuditLog.action="affiliate.click" 행을 OTA별 집계.
 *
 * 사이클 XXX — windowDays 옵션 도입 (RR 답습). 시그니처 옵션 객체 진화
 * (helper-evolution 6번째 답습: scalar → options | scalar with fallback).
 */

import "server-only";

import { prisma } from "../prisma";
import type { OtaProvider } from "../types";
import {
  buildWindowCutoffFilter,
  type WindowOption,
} from "../admin/window-filter";

/** OTA별 추정 commission rate (어필리에이트 계약 정확값으로 운영 단계에서 갱신) */
export const COMMISSION_RATE: Record<OtaProvider, number> = {
  klook: 0.05,
  kkday: 0.04,
  agoda: 0.04,
};

/** OTA offer ID prefix → 도시 한국어 라벨 (C4 도시별 CTR) */
export const OFFER_PREFIX_CITY: Record<string, string> = {
  pq: "푸꾸옥",
  dn: "다낭",
  ha: "하노이",
  hc: "호치민",
  ho: "호이안",
  nt: "나트랑",
  dl: "달랏",
  ct: "껀터",
  cm: "치앙마이",
  bkk: "방콕",
  tyo: "도쿄",
};

/** offerId에서 도시 prefix 추출 (e.g., "klook-pq-cablecar" → "pq") */
export function extractCityFromOfferId(offerId: string): string {
  const parts = offerId.split("-");
  return parts.length >= 2 ? parts[1] : "unknown";
}

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
  /** C4 — 도시별 클릭·commission 집계 */
  byCity: Array<{
    city: string;
    cityLabel: string;
    clicks: number;
    estimatedCommissionKrw: number;
  }>;
  /** C4 — 인기 오퍼 top N */
  topOffers: Array<{
    offerId: string;
    clicks: number;
    estimatedCommissionKrw: number;
  }>;
  recent: AffiliateClickRow[];
}

export interface GetAffiliateSummaryOptions {
  limit?: number;
  /** 사이클 XXX — 시간 윈도우(7|30). undefined = 전체. */
  windowDays?: WindowOption;
}

/**
 * @param optionsOrLimit options object 또는 scalar limit (helper-evolution fallback)
 */
export async function getAffiliateSummary(
  optionsOrLimit: GetAffiliateSummaryOptions | number = 20,
): Promise<AffiliateSummary | null> {
  // helper-evolution 6번째 답습: scalar → options | scalar with typeof fallback
  const options: GetAffiliateSummaryOptions =
    typeof optionsOrLimit === "number"
      ? { limit: optionsOrLimit }
      : optionsOrLimit;
  const limit = options.limit ?? 20;
  const windowDays = options.windowDays;

  if (!prisma) return null;
  try {
    const rows = await prisma.auditLog.findMany({
      where: {
        action: "affiliate.click",
        ...buildWindowCutoffFilter(windowDays),
      },
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

    // C4 — 도시별 집계
    const cityMap = new Map<
      string,
      { clicks: number; estimatedCommissionKrw: number }
    >();
    for (const it of items) {
      const city = extractCityFromOfferId(it.offerId);
      const cur = cityMap.get(city) ?? { clicks: 0, estimatedCommissionKrw: 0 };
      cur.clicks += 1;
      cur.estimatedCommissionKrw += it.estimatedCommissionKrw;
      cityMap.set(city, cur);
    }
    const byCity = Array.from(cityMap.entries())
      .map(([city, v]) => ({
        city,
        cityLabel: OFFER_PREFIX_CITY[city] ?? city,
        ...v,
      }))
      .sort((a, b) => b.clicks - a.clicks);

    // C4 — 인기 오퍼 집계 (top 10)
    const offerMap = new Map<
      string,
      { clicks: number; estimatedCommissionKrw: number }
    >();
    for (const it of items) {
      const cur = offerMap.get(it.offerId) ?? { clicks: 0, estimatedCommissionKrw: 0 };
      cur.clicks += 1;
      cur.estimatedCommissionKrw += it.estimatedCommissionKrw;
      offerMap.set(it.offerId, cur);
    }
    const topOffers = Array.from(offerMap.entries())
      .map(([offerId, v]) => ({ offerId, ...v }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    return {
      totalClicks: items.length,
      totalEstimatedCommissionKrw: items.reduce(
        (s, it) => s + it.estimatedCommissionKrw,
        0,
      ),
      byOta,
      byCity,
      topOffers,
      recent: items.slice(0, limit),
    };
  } catch (err) {
    console.error("[affiliate.repository] getSummary failed", err);
    return null;
  }
}
