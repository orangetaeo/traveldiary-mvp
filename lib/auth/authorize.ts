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
 * 11d: canWriteViaShareLink — shareKey 기반 edit 권한 검증 추가.
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

/**
 * 11d — ShareLink edit 권한 검증.
 *
 * syncKey로 ShareLink를 조회하여:
 *   1. 존재하지 않거나 revoked/expired → null (차단)
 *   2. permission !== "edit" → null (차단)
 *   3. permission === "edit" → tripId 반환 (통과)
 *
 * 반환값이 tripId이면 해당 trip에 대한 mutation 허용.
 */
export async function canWriteViaShareLink(
  syncKey: string,
): Promise<{ tripId: string } | null> {
  if (!prisma) return null;
  try {
    const link = await prisma.shareLink.findUnique({
      where: { syncKey },
      select: {
        tripId: true,
        permission: true,
        revokedAt: true,
        expiresAt: true,
      },
    });
    if (!link) return null;
    if (link.revokedAt) return null;
    if (link.expiresAt && link.expiresAt.getTime() < Date.now()) return null;
    if (link.permission !== "edit") return null;
    return { tripId: link.tripId };
  } catch (err) {
    console.error("[authorize] canWriteViaShareLink failed", err);
    return null;
  }
}

/**
 * 11d — owner OR shareLink edit 둘 중 하나로 write 허용.
 *
 * shareKey가 제공되면 shareLink 검증 우선. 없으면 기존 canWriteTrip.
 * tripId가 일치하는지도 검증 (shareKey로 다른 trip에 접근 방지).
 */
export async function canWriteTripOrViaShareLink(
  tripId: string,
  shareKey?: string | null,
): Promise<boolean> {
  // owner 권한 먼저 시도
  if (await canWriteTrip(tripId)) return true;
  // shareKey fallback
  if (!shareKey) return false;
  const result = await canWriteViaShareLink(shareKey);
  if (!result) return false;
  return result.tripId === tripId;
}
