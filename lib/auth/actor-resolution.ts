/**
 * 사이클 TT (ADR-045) — actorId 해석 헬퍼.
 *
 * "use server" 파일에서는 async export만 허용되므로 sync 헬퍼는 별도 lib 모듈로 분리.
 *
 * 정책:
 *   - DEMO_TRIP_ID에는 actorId=null 강제 — XX(ADR-044) 도입 후 DEMO trip이
 *     DB에 영속화되므로, 인증 사용자가 add 시 시드 row가 user.id로 stamp되는
 *     오염을 차단한다.
 *   - audit log의 actorId는 영향 받지 않음 (감사 추적은 시드 오염과 별개).
 */

import { DEMO_TRIP_IDS } from "@/lib/seed";

export function resolveActorIdForTrip(
  tripId: string,
  actorId: string | null,
): string | null {
  if (DEMO_TRIP_IDS.includes(tripId)) return null;
  return actorId;
}
