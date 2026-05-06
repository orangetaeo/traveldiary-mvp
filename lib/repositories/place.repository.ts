/**
 * Place Repository — 시드 장소 풀 조회.
 *
 * 정책:
 *   - prisma 미연결 시 빈 배열 반환 → 호출처는 로컬 JSON fallback.
 *   - DB 시드 완료 후 장소 탐색·추천에서 사용.
 */

import "server-only";

import { prisma } from "../prisma";

export interface PlaceFilter {
  cityCode: string;
  category?: string;
  minQualityScore?: number;
  limit?: number;
}

/**
 * 도시별 장소 목록 조회. qualityScore 내림차순.
 */
export async function getPlaces(filter: PlaceFilter) {
  if (!prisma) return [];

  try {
    return await prisma.place.findMany({
      where: {
        cityCode: filter.cityCode,
        isActive: true,
        ...(filter.category ? { category: filter.category } : {}),
        ...(filter.minQualityScore
          ? { qualityScore: { gte: filter.minQualityScore } }
          : {}),
      },
      orderBy: { qualityScore: "desc" },
      take: filter.limit ?? 100,
    });
  } catch (err) {
    console.error("[place] getPlaces failed", err);
    return [];
  }
}

/**
 * googlePlaceId로 단일 장소 조회.
 */
export async function getPlaceByGoogleId(googlePlaceId: string) {
  if (!prisma) return null;

  try {
    return await prisma.place.findUnique({
      where: { googlePlaceId },
    });
  } catch (err) {
    console.error("[place] getPlaceByGoogleId failed", err);
    return null;
  }
}
