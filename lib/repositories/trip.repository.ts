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
import { getDemoTrip } from "../seed";

export const SYSTEM_OWNER_ID = "system-owner-pqc";

// ═══════════════════════════════════════════════════════════════════
// ensureDemoTripInDb — 사이클 XX (ADR-044)
//   시드 trip이 DB에 없으면 upsert. checklist/cost 영속화 진입점에서 호출.
//   itinerary 시드 복제는 미수행(체크리스트/비용은 trip FK만 필요).
//   idempotent — 동시 호출 시 P2002 unique 충돌은 try/catch로 흡수.
// ═══════════════════════════════════════════════════════════════════

export async function ensureDemoTripInDb(tripId: string): Promise<void> {
  if (!prisma) return;
  try {
    const existing = await prisma.trip.findFirst({
      where: { id: tripId, deletedAt: null },
      select: { id: true },
    });
    if (existing) return;

    const seed = getDemoTrip(tripId);
    if (!seed) return; // 시드 trip이 아님 — 사용자 trip 삭제 등은 호출처가 처리

    await prisma.$transaction(async (tx) => {
      await tx.user.upsert({
        where: { id: SYSTEM_OWNER_ID },
        create: { id: SYSTEM_OWNER_ID, name: "System Demo User" },
        update: {},
      });
      await tx.trip.create({
        data: {
          id: seed.trip.id,
          ownerId: SYSTEM_OWNER_ID,
          destination: seed.trip.destination,
          destinationCode: seed.trip.destinationCode,
          startDate: new Date(`${seed.trip.startDate}T00:00:00Z`),
          nights: seed.trip.nights,
          companion: seed.trip.companion,
          preferences: seed.trip.preferences as never,
          status: seed.trip.status,
          currentMode: seed.trip.currentMode,
        },
      });
    });
  } catch (err) {
    // unique constraint = 다른 호출이 먼저 upsert — 정상
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return;
    }
    console.error("[trip.repository] ensureDemoTripInDb failed", err);
  }
}

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
 * DB → 시드 fallback 통합 조회.
 * 페이지에서 반복되던 `(await fetchTripFromDb(id)) ?? getDemoTrip(id)` 패턴 추출.
 */
export async function resolveTripBundle(tripId: string): Promise<TripBundle | null> {
  return (await fetchTripFromDb(tripId)) ?? getDemoTrip(tripId);
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
  ownerId: string = SYSTEM_OWNER_ID,
): Promise<TripBundle | null> {
  if (!prisma) return null;

  const result = await prisma.$transaction(async (tx) => {
    // 11b: ownerId의 User row 보장 (SYSTEM_OWNER_ID 또는 OAuth user.id 모두 idempotent)
    await tx.user.upsert({
      where: { id: ownerId },
      create: {
        id: ownerId,
        name: ownerId === SYSTEM_OWNER_ID ? "System Demo User" : null,
      },
      update: {},
    });

    const trip = await tx.trip.create({
      data: {
        ownerId,
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
// BLOCKER1: AI 생성 일정으로 Trip 생성
// ═══════════════════════════════════════════════════════════════════

/**
 * AI가 생성한 ItineraryItem[]을 받아 새 Trip + items를 DB에 영속화.
 * createTripWithSeedItinerary와 동일한 패턴이지만 시드 대신 AI 결과 사용.
 */
export async function createTripWithAiItems(
  input: CreateTripInput,
  aiItems: ItineraryItem[],
  ownerId: string = SYSTEM_OWNER_ID,
): Promise<TripBundle | null> {
  if (!prisma) return null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.user.upsert({
        where: { id: ownerId },
        create: {
          id: ownerId,
          name: ownerId === SYSTEM_OWNER_ID ? "System Demo User" : null,
        },
        update: {},
      });

      const trip = await tx.trip.create({
        data: {
          ownerId,
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

      for (const item of aiItems) {
        await tx.itineraryItem.create({
          data: {
            tripId: trip.id,
            dayIndex: item.dayIndex,
            scheduledAt: new Date(item.scheduledAt),
            durationMinutes: item.durationMinutes,
            flexibility: item.flexibility,
            priority: item.priority,
            flexMinutes: item.flexMinutes,
            name: item.name,
            category: item.category,
            locationLat: item.location.lat,
            locationLng: item.location.lng,
            locationAddress: item.location.address,
            estimatedPrice: (item.estimatedPrice ?? null) as never,
            evidence: item.evidence as never,
          },
        });
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
  } catch (err) {
    console.error("[trip.repository] createTripWithAiItems failed", err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 행 → 도메인 객체 변환
// ═══════════════════════════════════════════════════════════════════

// 사이클 YYY — `Prisma.XxxGetPayload<Record<string, never>>` 답습 패턴
// (checklist.repository와 통일, no-empty-object-type 룰 호환).
type DbTripRow = Prisma.TripGetPayload<Record<string, never>>;
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
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════
// MUTATIONS — 사이클 5b-2
// ═══════════════════════════════════════════════════════════════════

/**
 * Replan 옵션 적용 — 변경된 ItineraryItem.scheduledAt만 batch update.
 * 낙관적 동시성: expectedTripUpdatedAt 불일치 시 "conflict" 반환.
 * Trip.updatedAt도 같은 트랜잭션에서 갱신 (변경 신호).
 */
export interface CommitReplanInTransactionInput {
  tripId: string;
  changedItems: Array<{ id: string; scheduledAt: string }>;
  expectedTripUpdatedAt?: string;
}

export type CommitReplanInTransactionResult =
  | "conflict"
  | { tripUpdatedAt: string }
  | null;

export async function commitReplanInTransaction(
  input: CommitReplanInTransactionInput,
): Promise<CommitReplanInTransactionResult> {
  if (!prisma) return null;

  try {
    return await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findFirst({
        where: { id: input.tripId, deletedAt: null },
      });
      if (!trip) return null;

      if (
        input.expectedTripUpdatedAt &&
        trip.updatedAt.toISOString() !== input.expectedTripUpdatedAt
      ) {
        return "conflict" as const;
      }

      for (const changed of input.changedItems) {
        await tx.itineraryItem.update({
          where: { id: changed.id },
          data: { scheduledAt: new Date(changed.scheduledAt) },
        });
      }

      const updated = await tx.trip.update({
        where: { id: input.tripId },
        data: { status: trip.status }, // updatedAt 자동 갱신용 no-op write
      });

      return { tripUpdatedAt: updated.updatedAt.toISOString() };
    });
  } catch (err) {
    console.error("[trip.repository] commitReplanInTransaction failed", err);
    return null;
  }
}

/**
 * Trip.currentMode 갱신 — 단일 컬럼.
 * 낙관적 동시성. before/after 함께 반환 (audit log 원천 데이터).
 */
export interface UpdateTripModeInput {
  tripId: string;
  mode: string;
  expectedTripUpdatedAt?: string;
}

export type UpdateTripModeResult =
  | "conflict"
  | {
      before: { currentMode: string };
      after: { currentMode: string; tripUpdatedAt: string };
    }
  | null;

export async function updateTripMode(
  input: UpdateTripModeInput,
): Promise<UpdateTripModeResult> {
  if (!prisma) return null;

  try {
    return await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findFirst({
        where: { id: input.tripId, deletedAt: null },
      });
      if (!trip) return null;

      if (
        input.expectedTripUpdatedAt &&
        trip.updatedAt.toISOString() !== input.expectedTripUpdatedAt
      ) {
        return "conflict" as const;
      }

      const after = await tx.trip.update({
        where: { id: input.tripId },
        data: { currentMode: input.mode },
      });

      return {
        before: { currentMode: trip.currentMode },
        after: {
          currentMode: after.currentMode,
          tripUpdatedAt: after.updatedAt.toISOString(),
        },
      };
    });
  } catch (err) {
    console.error("[trip.repository] updateTripMode failed", err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// softDeleteTrip — trip soft-delete (deletedAt = now)
// ═══════════════════════════════════════════════════════════════════

/**
 * Trip soft-delete. deletedAt = now() 설정.
 * 기존 모든 쿼리가 deletedAt: null 필터 → cascade 불필요.
 * ShareLink도 함께 revoke (isActive = false).
 */
export async function softDeleteTrip(
  tripId: string,
): Promise<{ destination: string; nights: number } | null> {
  if (!prisma) return null;

  try {
    return await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findFirst({
        where: { id: tripId, deletedAt: null },
        select: { id: true, destination: true, nights: true },
      });
      if (!trip) return null;

      await tx.trip.update({
        where: { id: tripId },
        data: { deletedAt: new Date() },
      });

      // ShareLink revoke — 삭제된 trip의 공유 링크 비활성화
      await tx.shareLink.updateMany({
        where: { tripId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      return { destination: trip.destination, nights: trip.nights };
    });
  } catch (err) {
    console.error("[trip.repository] softDeleteTrip failed", err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// MUTATIONS — 사이클 10 (A2 reorder + A5 add)
// ═══════════════════════════════════════════════════════════════════

export interface AddItineraryItemInput {
  tripId: string;
  dayIndex: number;
  scheduledAt: string;          // ISO datetime
  durationMinutes: number;
  flexibility: ItineraryItem["flexibility"];
  priority: ItineraryItem["priority"];
  flexMinutes: number;
  name: string;
  category: ItineraryItem["category"];
  location: { lat: number; lng: number; address: string };
  estimatedPrice?: { amount: number; currency: string };
  /** BLOCKER6 (마이그 0014) — 작성자 user.id. NULL = legacy/DEMO/미인증. */
  actorId?: string | null;
}

export async function addItineraryItem(
  input: AddItineraryItemInput,
): Promise<ItineraryItem | null> {
  if (!prisma) return null;
  try {
    const evidence = {
      reasons: ["사용자가 직접 추가한 일정입니다"],
      sources: [],
      verifiedAt: new Date().toISOString(),
    };
    const row = await prisma.itineraryItem.create({
      data: {
        tripId: input.tripId,
        dayIndex: input.dayIndex,
        scheduledAt: new Date(input.scheduledAt),
        durationMinutes: input.durationMinutes,
        flexibility: input.flexibility,
        priority: input.priority,
        flexMinutes: input.flexMinutes,
        name: input.name,
        category: input.category,
        locationLat: input.location.lat,
        locationLng: input.location.lng,
        locationAddress: input.location.address,
        estimatedPrice: (input.estimatedPrice ?? null) as never,
        evidence: evidence as never,
        actorId: input.actorId ?? undefined,
      },
      include: { dependencies: { select: { dependencyId: true } } },
    });
    // Trip.updatedAt no-op write (5b-2 패턴 — 낙관적 동시성 신호)
    await prisma.trip.update({
      where: { id: input.tripId },
      data: { status: undefined },
    }).catch(() => undefined);
    return rowToItineraryItem(row);
  } catch (err) {
    console.error("[trip.repository] addItineraryItem failed", err);
    return null;
  }
}

export interface ReorderItineraryItemsInput {
  tripId: string;
  changes: Array<{ id: string; scheduledAt: string }>;
}

export async function reorderItineraryItems(
  input: ReorderItineraryItemsInput,
): Promise<{ tripUpdatedAt: string } | null> {
  if (!prisma) return null;
  try {
    return await prisma.$transaction(async (tx) => {
      for (const change of input.changes) {
        await tx.itineraryItem.update({
          where: { id: change.id },
          data: { scheduledAt: new Date(change.scheduledAt) },
        });
      }
      const trip = await tx.trip.findUnique({ where: { id: input.tripId } });
      if (!trip) return null;
      const updated = await tx.trip.update({
        where: { id: input.tripId },
        data: { status: trip.status },  // updatedAt 자동 갱신용 no-op
      });
      return { tripUpdatedAt: updated.updatedAt.toISOString() };
    });
  } catch (err) {
    console.error("[trip.repository] reorderItineraryItems failed", err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 행 → 도메인 객체 변환
// ═══════════════════════════════════════════════════════════════════

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
    photos: row.photos.length > 0 ? row.photos : undefined,
    dependencies: row.dependencies.map((d) => d.dependencyId),
  };
}
