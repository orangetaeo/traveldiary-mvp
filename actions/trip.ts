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
  createTripWithAiItems,
  updateTripMode,
  type CreateTripInput,
} from "@/lib/repositories/trip.repository";
import { DEMO_TRIP_ID } from "@/lib/seed";
import { isDbConnected } from "@/lib/prisma";
import { getActorId, getOwnerId } from "@/lib/auth/session";
import { canWriteTrip, canWriteTripOrViaShareLink } from "@/lib/auth/authorize";
import {
  generateItinerary,
  aiGenerationAvailable,
} from "@/lib/services/itinerary-generator";
import {
  buildModeTransitionMetadata,
  type ModeTransitionContext,
  type ModeTransitionSkipReason,
} from "@/lib/mode-transition";
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

  // 사이클 11b: 인증 시 user.id, 미인증 시 SYSTEM_OWNER_ID
  const ownerId = await getOwnerId();

  // BLOCKER1: AI 일정 생성 시도 → 실패 시 시드 fallback
  if (aiGenerationAvailable()) {
    const aiResult = await generateItinerary({
      destination: input.destination,
      destinationCode: input.destinationCode,
      startDate: input.startDate,
      nights: input.nights,
      companion: input.companion,
      preferences: input.preferences,
    });

    if (aiResult.mode === "ok") {
      const bundle = await createTripWithAiItems(input, aiResult.items, ownerId);
      if (bundle) {
        await writeAuditLog({
          actorId: ownerId,
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
            generatedBy: "ai",
            model: aiResult.model,
          },
        });
        revalidatePath(`/itinerary/${bundle.trip.id}`);
        return { id: bundle.trip.id, demo: false };
      }
    }
    // AI 실패 → 시드 fallback (아래로 진행)
  }

  // 시드 fallback (API 키 없거나 AI 생성 실패)
  const bundle = await createTripWithSeedItinerary(input, ownerId);
  if (!bundle) {
    return { id: DEMO_TRIP_ID, demo: true };
  }

  await writeAuditLog({
    actorId: ownerId,
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
      generatedBy: "seed",
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
  /**
   * AAA(2026-05-03) 추가 — audit metadata 풍부화 컨텍스트.
   * 좌표(lat/lng)는 절대 포함 금지. buildModeTransitionMetadata가 화이트리스트 필터링.
   */
  context?: ModeTransitionContext;
  /** 11d — ShareLink edit 권한으로 mutation 허용. */
  shareKey?: string;
}

export type SetTripModeResult =
  | { ok: true; demo: true }
  | { ok: true; demo: false; tripUpdatedAt: string }
  | { ok: false; code: "conflict" }
  | { ok: false; code: "not_found" }
  | { ok: false; code: "forbidden" }
  | { ok: false; code: "internal" };

export async function setTripMode(
  input: SetTripModeInput,
): Promise<SetTripModeResult> {
  if (!isDbConnected || input.tripId === DEMO_TRIP_ID) {
    return { ok: true, demo: true };
  }
  if (!(await canWriteTripOrViaShareLink(input.tripId, input.shareKey))) {
    return { ok: false, code: "forbidden" };
  }

  const result = await updateTripMode({
    tripId: input.tripId,
    mode: input.mode,
    expectedTripUpdatedAt: input.expectedTripUpdatedAt,
  });

  if (result === null) return { ok: false, code: "internal" };
  if (result === "conflict") return { ok: false, code: "conflict" };

  await writeAuditLog({
    actorId: await getActorId(),
    action: "trip.mode_transition",
    resource: "Trip",
    resourceId: input.tripId,
    before: { mode: result.before.currentMode },
    after: { mode: result.after.currentMode },
    metadata: buildModeTransitionMetadata({
      trigger: input.trigger ?? "manual",
      previousMode: result.before.currentMode as TravelMode,
      // KK — outcome="applied" 명시. M2 성공률 산출 위해 applied/skipped 둘 다 기록.
      context: { ...input.context, outcome: "applied" },
    }),
  });

  revalidatePath(`/itinerary/${input.tripId}`);
  revalidatePath(`/travel/${input.tripId}`);

  return {
    ok: true,
    demo: false,
    tripUpdatedAt: result.after.tripUpdatedAt,
  };
}

// ═══════════════════════════════════════════════════════════════════
// recordModeTransitionSkip — 사이클 KK (M2 negative path)
//
// 사용자가 자동 전환을 시도했지만 실패한 경우 audit log 1건 기록.
// mode 변경 X — audit log만. trip.mode_transition 단일 action 유지하고
// metadata.outcome="skipped" + skipReason으로 구분 (R1 옵션 C 결정).
//
// 좌표는 절대 받지 않음 — boundaryHit boolean만 (ADR-017 §C, AAA 답습).
// ═══════════════════════════════════════════════════════════════════

export interface RecordModeTransitionSkipInput {
  tripId: string;
  skipReason: ModeTransitionSkipReason;
  /** 현재 mode (이미 in-travel인 경우 already_in_mode 식별). */
  currentMode: TravelMode;
  /** geolocation trigger인지 manual인지. denied/unsupported 등은 geolocation. */
  trigger?: "manual" | "geolocation";
  /** dDay/boundaryHit/destinationCode만. 좌표 X. */
  context?: ModeTransitionContext;
  /** 11d — ShareLink edit 권한으로 mutation 허용. */
  shareKey?: string;
}

export type RecordModeTransitionSkipResult =
  | { ok: true; demo: true }
  | { ok: true; demo: false }
  | { ok: false; code: "forbidden" | "internal" };

export async function recordModeTransitionSkip(
  input: RecordModeTransitionSkipInput,
): Promise<RecordModeTransitionSkipResult> {
  if (!isDbConnected || input.tripId === DEMO_TRIP_ID) {
    return { ok: true, demo: true };
  }
  if (!(await canWriteTripOrViaShareLink(input.tripId, input.shareKey))) {
    return { ok: false, code: "forbidden" };
  }

  await writeAuditLog({
    actorId: await getActorId(),
    action: "trip.mode_transition",
    resource: "Trip",
    resourceId: input.tripId,
    metadata: buildModeTransitionMetadata({
      trigger: input.trigger ?? "geolocation",
      previousMode: input.currentMode,
      context: {
        ...input.context,
        outcome: "skipped",
        skipReason: input.skipReason,
      },
    }),
  });

  return { ok: true, demo: false };
}
