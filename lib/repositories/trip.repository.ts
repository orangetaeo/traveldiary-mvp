/**
 * Trip Repository — DB 조회·저장 헬퍼 (사이클 5b-1).
 *
 * 정책 (ADR-013):
 *   - prisma 인스턴스가 null이면 모든 함수가 null 반환 → 호출처는 시드 fallback.
 *   - 페이지/Server Action 모두에서 호출 가능.
 *   - 사이클 5b-1엔 인증 미도입 → ownerId는 SYSTEM_OWNER_ID 고정.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import type { ItineraryItem, Trip, UserPreferences } from "../types";
import { phuQuocItinerary } from "../seed/phu-quoc";

export const SYSTEM_OWNER_ID = "system-owner-pqc";

export interface TripBundle {
  trip: Trip;
  items: ItineraryItem[];
}

/**
 * DB에서 trip + items를 조회. 없으면 null.
 */
export async function fetchTripFromDb(tripId: string): Promise<TripBundle | null> {
  if (!prisma) return null;

  try {
    const row = await prisma.trip.findFirst({
      where: { id: tripId, deletedAt: null },
      include: {
        items: {
          include: {
            dependencies: { select: { dependencyId: true } },
          },
          orderBy: { scheduledAt: "asc" },
        },
      },
    });
    if (!row) return null;

    return {
      trip: rowToTrip(row),
      items: row.items.map(rowToItineraryItem),
    };
  } catch (err) {
    console.error("[trip.repository] fetchTripFromDb failed", err);
    return null;
  }
}

/**
 * 새 Trip + 12개 ItineraryItem + 의존성 엣지를 시드에서 복제.
 * 트랜잭션으로 일괄 처리.
 *
 * 사이클 5b-1엔 사용자가 입력한 destination/nights/companion/preferences를 받지만,
 * 실제 itinerary는 푸꾸옥 시드를 그대로 사용 (LLM 일정 생성은 사이클 5b-3에서).
 */
export interface CreateTripInput {
  destination: string;
  destinationCode: string;
  nights: number;
  companion: string;
  preferences: { vibes: string[]; pace: string; excludes: string[] };
  startDate: string; // ISO date
}

export async function createTripWithSeedItinerary(
  input: CreateTripInput,
): Promise<TripBundle | null> {
  if (!prisma) return null;

  const result = await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.create({
      data: {
        ownerId: SYSTEM_OWNER_ID,
        destination: input.destination,
        destinationCode: input.destinationCode,
        startDate: new Date(`${input.startDate}T00:00:00Z`),
        nights: input.nights,
        companion: input.companion,
        preferences: input.preferences as never,
        status: "draft",
        currentMode: "pre-travel",
      },
    });

    // 시드 일정을 새 trip 아래에 복제. 같은 시드 ID는 새 cuid()로 재할당.
    const idMap = new Map<string, string>();
    for (const seed of phuQuocItinerary) {
      const dayOffsetMs = seed.dayIndex * 24 * 60 * 60 * 1000;
      const seedAt = new Date(seed.scheduledAt);
      const tripStart = new Date(trip.startDate);
      const newAt = new Date(
        tripStart.getTime() +
          dayOffsetMs +
          (seedAt.getUTCHours() * 60 + seedAt.getUTCMinutes()) * 60_000,
      );

      const created = await tx.itineraryItem.create({
        data: {
          tripId: trip.id,
          dayIndex: seed.dayIndex,
          scheduledAt: newAt,
          durationMinutes: seed.durationMinutes,
          flexibility: seed.flexibility,
          priority: seed.priority,
          flexMinutes: seed.flexMinutes,
          name: seed.name,
          category: seed.category,
          locationLat: seed.location.lat,
          locationLng: seed.location.lng,
          locationAddress: seed.location.address,
          estimatedPrice: (seed.estimatedPrice ?? null) as never,
          evidence: seed.evidence as never,
        },
      });
      idMap.set(seed.id, created.id);
    }

    // 의존성 엣지 복제
    for (const seed of phuQuocItinerary) {
      const dependentId = idMap.get(seed.id)!;
      for (const dep of seed.dependencies) {
        const dependencyId = idMap.get(dep);
        if (!dependencyId) continue;
        await tx.itineraryDependency.create({
          data: { dependentId, dependencyId },
        });
      }
    }

    const fullItems = await tx.itineraryItem.findMany({
      where: { tripId: trip.id },
      include: { dependencies: { select: { dependencyId: true } } },
      orderBy: { scheduledAt: "asc" },
    });

    return { trip, items: fullItems };
  });

  return {
    trip: rowToTrip(result.trip),
    items: result.items.map(rowToItineraryItem),
  };
}

// ═══════════════════════════════════════════════════════════════════
// 행 → 도메인 객체 변환
// ═══════════════════════════════════════════════════════════════════

type DbTripRow = Prisma.TripGetPayload<{ /* base columns only */ }>;
type DbItemRow = Prisma.ItineraryItemGetPayload<{
  include: { dependencies: { select: { dependencyId: true } } };
}>;

function rowToTrip(row: DbTripRow): Trip {
  const prefs = (row.preferences ?? null) as unknown as UserPreferences | null;
  return {
    id: row.id,
    destination: row.destination,
    destinationCode: row.destinationCode,
    startDate: row.startDate.toISOString().slice(0, 10),
    nights: row.nights,
    companion: row.companion as Trip["companion"],
    preferences: prefs ?? { vibes: [], pace: "balanced", excludes: [] },
    createdAt: row.createdAt.toISOString(),
    status: row.status as Trip["status"],
    currentMode: row.currentMode as Trip["currentMode"],
  };
}

function rowToItineraryItem(row: DbItemRow): ItineraryItem {
  return {
    id: row.id,
    tripId: row.tripId,
    dayIndex: row.dayIndex,
    scheduledAt: row.scheduledAt.toISOString(),
    durationMinutes: row.durationMinutes,
    flexibility: row.flexibility as ItineraryItem["flexibility"],
    priority: row.priority as ItineraryItem["priority"],
    flexMinutes: row.flexMinutes,
    name: row.name,
    category: row.category as ItineraryItem["category"],
    location: {
      lat: row.locationLat,
      lng: row.locationLng,
      address: row.locationAddress,
    },
    estimatedPrice: (row.estimatedPrice ?? undefined) as ItineraryItem["estimatedPrice"],
    evidence: row.evidence as unknown as ItineraryItem["evidence"],
    dependencies: row.dependencies.map((d) => d.dependencyId),
  };
}
