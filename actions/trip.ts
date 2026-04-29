"use server";

/**
 * Trip Server Actions — 사이클 5b-1 첫 mutation (ADR-013).
 *
 * 정책:
 *   - DB 미연결 시 데모 trip ID 반환 (ADR-009 fallback).
 *   - DB 연결 시 새 Trip 생성 + writeAuditLog 실호출 (S-13 절대 규칙).
 *   - 인증 미도입 — ownerId = SYSTEM_OWNER_ID (사이클 11에서 카카오 OAuth로 swap).
 */

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";
import {
  createTripWithSeedItinerary,
  type CreateTripInput,
} from "@/lib/repositories/trip.repository";
import { DEMO_TRIP_ID } from "@/lib/seed";
import { isDbConnected } from "@/lib/prisma";

export interface CreateTripResult {
  id: string;
  demo: boolean;
}

export async function createTripFromOnboarding(
  input: CreateTripInput,
): Promise<CreateTripResult> {
  // 데모 모드 — 빈 DATABASE_URL 환경 (사이클 5a 라이브 또는 로컬 dev)
  if (!isDbConnected) {
    return { id: DEMO_TRIP_ID, demo: true };
  }

  const bundle = await createTripWithSeedItinerary(input);
  if (!bundle) {
    // DB 연결 실패 — 데모로 fallback (사용자에겐 동일 화면 노출)
    return { id: DEMO_TRIP_ID, demo: true };
  }

  await writeAuditLog({
    actorId: null,
    action: "trip.create",
    resource: "Trip",
    resourceId: bundle.trip.id,
    after: {
      destination: bundle.trip.destination,
      nights: bundle.trip.nights,
      companion: bundle.trip.companion,
    },
    metadata: {
      source: "onboarding",
      itemCount: bundle.items.length,
      demoSeed: "phu-quoc",
    },
  });

  revalidatePath(`/itinerary/${bundle.trip.id}`);

  return { id: bundle.trip.id, demo: false };
}
