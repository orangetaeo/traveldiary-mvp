/**
 * ValidationResult Repository — 사이클 L+N (ADR-029).
 *
 * 정책:
 *   - prisma 미연결 시 모든 함수가 null 반환 → 호출처는 그래도 결과 반환 (DB save만 스킵).
 *   - 24h 내 동일 itemId의 가장 최근 row가 있으면 캐시 hit (재호출 비용 0).
 *   - 새 검증은 항상 create() — history 누적. 덮어쓰기 ❌ (T14 권장).
 *   - 트랜잭션 미사용 — 외부 API 호출과 분리, 단발 INSERT.
 */

import "server-only";

import { prisma } from "../prisma";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export interface ValidationResultRow {
  id: string;
  itemId: string;
  placeExists: boolean;
  operatingStatus: string;
  bookingRequired: boolean;
  distanceVerified: boolean;
  priceVerified: boolean;
  /** 사이클 E (ADR-031) — 기존 row는 NULL */
  priceStatus: string | null;
  distanceStatus: string | null;
  validatedAt: Date;
}

/**
 * 24h 내 가장 최근 ValidationResult 조회. 없으면 null.
 * @@index([itemId, validatedAt]) 활용.
 */
export async function getRecentValidation(
  itemId: string,
  ttlMs: number = CACHE_TTL_MS,
): Promise<ValidationResultRow | null> {
  if (!prisma) return null;

  try {
    const row = await prisma.validationResult.findFirst({
      where: {
        itemId,
        validatedAt: { gt: new Date(Date.now() - ttlMs) },
      },
      orderBy: { validatedAt: "desc" },
    });
    return row;
  } catch (err) {
    console.error("[validation.repository] getRecentValidation failed", err);
    return null;
  }
}

export interface CreateValidationInput {
  itemId: string;
  placeExists: boolean;
  operatingStatus: string;
  bookingRequired: boolean;
  distanceVerified: boolean;
  priceVerified: boolean;
  /** 사이클 E (ADR-031) — enum status 평탄화 해소 */
  priceStatus?: string;
  distanceStatus?: string;
}

/**
 * 새 ValidationResult 행 생성. 항상 create (history 누적).
 * 실패 시 null 반환, 비즈니스 막지 않음 (S-13 audit log 패턴 답습).
 */
export async function createValidation(
  input: CreateValidationInput,
): Promise<ValidationResultRow | null> {
  if (!prisma) return null;

  try {
    const row = await prisma.validationResult.create({
      data: {
        itemId: input.itemId,
        placeExists: input.placeExists,
        operatingStatus: input.operatingStatus,
        bookingRequired: input.bookingRequired,
        distanceVerified: input.distanceVerified,
        priceVerified: input.priceVerified,
        priceStatus: input.priceStatus,
        distanceStatus: input.distanceStatus,
      },
    });
    return row;
  } catch (err) {
    console.error("[validation.repository] createValidation failed", err);
    return null;
  }
}

/**
 * 권한 검증 헬퍼 — itemId로 tripId를 찾고, 사용자가 해당 trip을 읽을 수 있는지.
 * ValidationResult는 부속 데이터이므로 canReadTrip만 (T14 권장).
 *
 * 반환:
 *   - tripId: 권한 통과 시 trip ID
 *   - null: prisma 미연결 / item 없음 / 권한 없음
 */
export async function canValidateItem(
  itemId: string,
  actorId: string | null,
): Promise<string | null> {
  if (!prisma) return null;

  try {
    const item = await prisma.itineraryItem.findUnique({
      where: { id: itemId },
      select: {
        tripId: true,
        trip: {
          select: { ownerId: true, members: { select: { userId: true } } },
        },
      },
    });
    if (!item) return null;

    // 단일 사용자 모드 (actorId null) — 모든 trip 접근 가능 (5b-1 패턴)
    if (actorId === null) return item.tripId;

    // owner 또는 member
    if (item.trip.ownerId === actorId) return item.tripId;
    if (item.trip.members.some((m) => m.userId === actorId)) return item.tripId;

    return null;
  } catch (err) {
    console.error("[validation.repository] canValidateItem failed", err);
    return null;
  }
}
