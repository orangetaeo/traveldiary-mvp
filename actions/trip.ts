"use server";

/**
 * Trip Server Actions — 사이클 5b-1 첫 mutation (ADR-013) + 5b-2 setTripMode.
 *
 * 정책:
 *   - DB 미연결 시 데모 trip ID 반환 (ADR-009 fallback).
 *   - DB 연결 시 mutation + writeAuditLog 동시 실호출 (S-13 절대 규칙).
 *   - 인증 미도입 — ownerId = SYSTEM_OWNER_ID (사이클 11에서 카카오 OAuth로 swap).
 *   - 5b-2: setTripMode에 낙관적 동시성 도입 (expectedTripUpdatedAt).
 */

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";
import {
  createTripWithSeedItinerary,
  updateTripMode,
  type CreateTripInput,
} from "@/lib/repositories/trip.repository";
import { DEMO_TRIP_ID } from "@/lib/seed";
import { isDbConnected } from "@/lib/prisma";
import type { TravelMode } from "@/lib/types";

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

// ═══════════════════════════════════════════════════════════════════
// setTripMode — 사이클 5b-2 (회의록 안건 3)
// ═══════════════════════════════════════════════════════════════════

export interface SetTripModeInput {
  tripId: string;
  mode: TravelMode;
  expectedTripUpdatedAt?: string;
  /** 5b-4 추가 — audit log metadata에 반영. "geolocation"은 좌표 미포함 (ADR-017 §C). */
  trigger?: "manual" | "geolocation";
}

export type SetTripModeResult =
  | { ok: true; demo: true }
  | { ok: true; demo: false; tripUpdatedAt: string }
  | { ok: false; code: "conflict" }
  | { ok: false; code: "not_found" }
  | { ok: false; code: "internal" };

export async function setTripMode(
  input: SetTripModeInput,
): Promise<SetTripModeResult> {
  if (!isDbConnected || input.tripId === DEMO_TRIP_ID) {
    return { ok: true, demo: true };
  }

  const result = await updateTripMode({
    tripId: input.tripId,
    mode: input.mode,
    expectedTripUpdatedAt: input.expectedTripUpdatedAt,
  });

  if (result === null) return { ok: false, code: "internal" };
  if (result === "conflict") return { ok: false, code: "conflict" };

  await writeAuditLog({
    actorId: null,
    action: "trip.mode_transition",
    resource: "Trip",
    resourceId: input.tripId,
    before: { mode: result.before.currentMode },
    after: { mode: result.after.currentMode },
    metadata: {
      trigger: input.trigger ?? "manual",
      source: "web",
    },
  });

  revalidatePath(`/itinerary/${input.tripId}`);
  revalidatePath(`/travel/${input.tripId}`);

  return {
    ok: true,
    demo: false,
    tripUpdatedAt: result.after.tripUpdatedAt,
  };
}
