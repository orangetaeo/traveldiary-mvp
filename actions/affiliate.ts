"use server";

/**
 * Affiliate Server Action — 사이클 12a M8 (ADR-025).
 * 클릭 추적 + 어필리에이트 URL wrap + audit log.
 */

import { writeAuditLog } from "@/lib/audit-log";
import { buildAffiliateUrl } from "@/lib/utils/affiliate";
import { getActorId } from "@/lib/auth/session";
import type { OtaProvider } from "@/lib/types";

export interface TrackAffiliateClickInput {
  offerId: string;
  itemId: string;
  ota: OtaProvider;
  priceKrw: number;
  baseUrl: string;
}

export interface TrackAffiliateClickResult {
  ok: true;
  /** 어필리에이트 wrapper 적용된 또는 원본 URL */
  redirectUrl: string;
  tracked: boolean;
}

export async function trackAffiliateClick(
  input: TrackAffiliateClickInput,
): Promise<TrackAffiliateClickResult> {
  const { url, tracked } = buildAffiliateUrl(input.ota, input.baseUrl);

  await writeAuditLog({
    actorId: await getActorId(),
    action: "affiliate.click",
    resource: "OtaOffer",
    resourceId: input.offerId,
    after: { redirectUrl: url, tracked },
    metadata: {
      source: "web",
      ota: input.ota,
      itemId: input.itemId,
      priceKrw: input.priceKrw,
    },
  });

  return { ok: true, redirectUrl: url, tracked };
}
