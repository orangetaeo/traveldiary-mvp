"use server";

/**
 * Evidence Server Actions — 사이클 5b-6.5.
 * Naver Local + Blog 결과를 Evidence로 가져와 audit log 기록.
 */

import { writeAuditLog } from "@/lib/audit-log";
import { getActorId } from "@/lib/auth/session";
import {
  gatherKoreanEvidence,
  type KoreanEvidenceOutcome,
} from "@/lib/services/korean-evidence";

export interface GatherKoreanEvidenceInput {
  itemId: string;
  query: string;
}

export async function gatherKoreanEvidenceAction(
  input: GatherKoreanEvidenceInput,
): Promise<KoreanEvidenceOutcome> {
  const result = await gatherKoreanEvidence(input.query);

  // 캐시 히트 외 fresh fetch만 audit (5b-3 정책)
  const isFresh = result.mode === "ok" && !result.cached;
  if (isFresh) {
    await writeAuditLog({
      actorId: await getActorId(),
      action: "evidence.gathered",
      resource: "ItineraryItem",
      resourceId: input.itemId,
      after: {
        sourceCount: result.evidence.sources.length,
        reasonCount: result.evidence.reasons.length,
      },
      metadata: {
        source: "naver",
        query: input.query,
      },
    });
  }

  return result;
}
