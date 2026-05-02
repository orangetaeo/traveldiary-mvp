/**
 * 권한 검증 헬퍼 — 사이클 11d.
 *
 * mutation Server Action에서 첫 줄에 호출:
 *   if (!(await canWriteTrip(input.tripId))) return { ok: false, code: "forbidden" };
 *
 * 정책:
 *   - DEMO_TRIP_ID → 항상 통과 (시드 시연 보호)
 *   - 미인증 (actorId null, 단일 사용자 모드) → 통과 (legacy 호환)
 *   - 인증됨 + Trip.ownerId === actorId → 통과
 *   - 그 외 → 차단
 *
 * ShareLink edit 권한 검증은 11e+에서 추가.
 */

import "server-only";

import { prisma } from "../prisma";
import { DEMO_TRIP_ID } from "../seed";
import { getActorId } from "./session";

export async function canWriteTrip(tripId: string): Promise<boolean> {
  if (tripId === DEMO_TRIP_ID) return true;

  const actorId = await getActorId();
  if (!actorId) return true; // 단일 사용자 모드

  if (!prisma) return true; // DB 미연결 — 데모 fallback

  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { ownerId: true },
    });
    if (!trip) return false;
    return trip.ownerId === actorId;
  } catch (err) {
    console.error("[authorize] canWriteTrip failed", err);
    return false;
  }
}

/** ChecklistItem / CostEntry 등 trip 종속 자원에서 사용 */
export async function canWriteTripResource(
  tripId: string,
): Promise<boolean> {
  return canWriteTrip(tripId);
}
