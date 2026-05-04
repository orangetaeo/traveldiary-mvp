/**
 * ADR-047 모델 라우팅 분포 측정 (사이클 AAAA5b).
 *
 * R1+T13 결정: pickModel은 권장만(부수효과 없음 유지). 분포는 `recordSpend.byModel`
 * 누적치를 read-only로 집계. 호출 경로 무 개입.
 *
 * ADR-047 §분포 목표:
 *   - Haiku: 5~10%
 *   - Sonnet: 70~75%
 *   - Opus: 15~25%
 *
 * 측정 대상은 비용($) 기준. 호출 횟수 기준은 단가 차이(Haiku $1 vs Opus $15)로 왜곡되므로 비용 가중.
 */

import { readBudgetState } from "./budget";

const HAIKU_PATTERN = /haiku/i;
const SONNET_PATTERN = /sonnet/i;
const OPUS_PATTERN = /opus/i;

export type ModelTier = "haiku" | "sonnet" | "opus";

export interface ModelTierMetrics {
  count: number;
  costUsd: number;
  pct: number; // 비용 기준 %
}

export interface ModelDistribution {
  haiku: ModelTierMetrics;
  sonnet: ModelTierMetrics;
  opus: ModelTierMetrics;
  unclassified: ModelTierMetrics;
  total: { count: number; costUsd: number };
}

export function classifyModel(modelName: string): ModelTier | null {
  if (HAIKU_PATTERN.test(modelName)) return "haiku";
  if (SONNET_PATTERN.test(modelName)) return "sonnet";
  if (OPUS_PATTERN.test(modelName)) return "opus";
  return null;
}

export function getDailyModelDistribution(
  now: number = Date.now(),
  dir?: string,
): ModelDistribution {
  const state = readBudgetState(now, dir);

  const acc = {
    haiku: { count: 0, costUsd: 0 },
    sonnet: { count: 0, costUsd: 0 },
    opus: { count: 0, costUsd: 0 },
    unclassified: { count: 0, costUsd: 0 },
    total: { count: 0, costUsd: 0 },
  };

  for (const provider of Object.values(state.byProvider)) {
    if (!provider.byModel) continue;
    for (const [modelName, m] of Object.entries(provider.byModel)) {
      const tier = classifyModel(modelName);
      const target = tier ? acc[tier] : acc.unclassified;
      target.count += m.count;
      target.costUsd += m.costUsd;
      acc.total.count += m.count;
      acc.total.costUsd += m.costUsd;
    }
  }

  const pct = (cost: number) =>
    acc.total.costUsd > 0 ? (cost / acc.total.costUsd) * 100 : 0;

  return {
    haiku: { ...acc.haiku, pct: pct(acc.haiku.costUsd) },
    sonnet: { ...acc.sonnet, pct: pct(acc.sonnet.costUsd) },
    opus: { ...acc.opus, pct: pct(acc.opus.costUsd) },
    unclassified: { ...acc.unclassified, pct: pct(acc.unclassified.costUsd) },
    total: acc.total,
  };
}

export interface DistributionAlerts {
  ok: boolean;
  alerts: string[];
}

/**
 * ADR-047 §분포 목표 대비 일탈 검사.
 *
 * - Haiku 5~10% 목표: 5% 미만 = 미사용 (Triage가 Sonnet/Opus로 처리됨)
 * - Sonnet 70~75% 목표: 70% 미만 = 회의·구현이 Opus로 처리됨 (비용 폭증)
 * - Opus 15~25% 목표: 25% 초과 = 4-체크 미준수
 *
 * total.costUsd === 0이면 데이터 부족으로 ok=true (alerts=[]).
 */
export function isWithinTargetDistribution(
  d: ModelDistribution,
): DistributionAlerts {
  const alerts: string[] = [];
  if (d.total.costUsd === 0) return { ok: true, alerts };

  if (d.haiku.pct < 5) {
    alerts.push(
      `haiku underused (${d.haiku.pct.toFixed(1)}% < 5% target — Triage가 상위 모델로 처리됨)`,
    );
  }
  if (d.sonnet.pct < 70) {
    alerts.push(
      `sonnet underused (${d.sonnet.pct.toFixed(1)}% < 70% target — 회의·구현이 Opus 사용 의심)`,
    );
  }
  if (d.opus.pct > 25) {
    alerts.push(
      `opus overused (${d.opus.pct.toFixed(1)}% > 25% target — 4-체크 미준수 의심)`,
    );
  }
  if (d.unclassified.costUsd > 0) {
    alerts.push(
      `unclassified models detected (${d.unclassified.count} calls, $${d.unclassified.costUsd.toFixed(4)}) — model name 패턴 검토 필요`,
    );
  }

  return { ok: alerts.length === 0, alerts };
}
