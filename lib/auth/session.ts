/**
 * 세션 헬퍼 — 사이클 11b (ADR-026).
 *
 * Server Component / Server Action에서 import.
 * 쿠키에서 access_token 추출 → JWT verify → user.id 반환.
 * 미인증 시 null — 단일 사용자 모드(SYSTEM_OWNER_ID)로 자동 fallback.
 */

import "server-only";

import { cookies } from "next/headers";
import { verifyToken } from "./jwt";

export const SYSTEM_OWNER_ID = "system-owner-pqc";

/**
 * 현재 세션의 user.id. 미인증 시 null.
 * Server Action·Server Component에서만.
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const token = cookies().get("access_token")?.value;
    if (!token) return null;
    const payload = await verifyToken(token);
    if (!payload || payload.type !== "access") return null;
    return payload.sub;
  } catch {
    return null;
  }
}

/**
 * audit log actorId — 인증 시 user.id, 미인증 시 null.
 * 모든 mutation Server Action에서 await getActorId() 사용.
 */
export async function getActorId(): Promise<string | null> {
  return getCurrentUserId();
}

/**
 * Trip.ownerId — 인증 시 user.id, 미인증 시 SYSTEM_OWNER_ID.
 * createTripFromOnboarding에서 사용.
 */
export async function getOwnerId(): Promise<string> {
  const id = await getCurrentUserId();
  return id ?? SYSTEM_OWNER_ID;
}
