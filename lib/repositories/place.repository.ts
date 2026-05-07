/**
 * Place Repository — 시드 장소 풀 조회.
 *
 * 정책:
 *   - prisma 미연결 시 빈 배열 반환 → 호출처는 로컬 JSON fallback.
 *   - DB 시드 완료 후 장소 탐색·추천에서 사용.
 */

import "server-only";

import { prisma } from "../prisma";
import type { DiscoverPlace, PlaceCategory } from "../types";
import { getCityByCode } from "../seed/cities";

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

// ── DB Place → DiscoverPlace 변환 ──────────────────────────────

const ZONE_LABEL: Record<string, string> = {
  "pq-duong-dong": "즈엉동",
  "pq-ong-lang": "옹랑",
  "pq-an-thoi": "안터이",
  "pq-cua-can": "꺼이쩐",
  "pq-bai-dai": "바이다이",
  "pq-ham-ninh": "함닌",
  "dn-my-khe": "미케",
  "dn-han-river": "한강",
  "dn-son-tra": "선짜",
  "dn-ba-na": "바나힐",
  "dn-hoi-an": "호이안",
  "dn-ngu-hanh-son": "오행산",
  "hcm-district1": "1군",
  "hcm-district3": "3군",
  "hcm-thao-dien": "타오디엔",
  "hcm-district5": "5군",
  "hcm-binh-thanh": "빈탄",
  "hcm-district7": "7군",
  "han-old-quarter": "구시가지",
  "han-ba-dinh": "바딘",
  "han-tay-ho": "타이호",
  "han-dong-da": "동다",
  "han-hai-ba-trung": "하이바쯩",
  "nha-tran-phu": "트란푸",
  "nha-north": "북부",
  "nha-vinpearl": "빈펄",
  "nha-west": "서부",
  "nha-south": "남부",
  "dl-center": "시내",
  "dl-langbiang": "랑비앙",
  "dl-datanla": "다탄라",
  "dl-tuyen-lam": "뚜옌럼",
  "dl-north": "북부",
};

function toDiscoverCategory(
  category: string,
  subCategory?: string | null,
): PlaceCategory {
  if (subCategory === "카페") return "cafe";
  if (
    subCategory === "공원/정원" ||
    subCategory === "해변" ||
    subCategory === "폭포" ||
    subCategory === "섬"
  )
    return "nature";
  if (category === "rest") return "spot";
  return category as PlaceCategory;
}

/**
 * DB Place → DiscoverPlace[] 변환 조회.
 * cityCode 지정 시 해당 도시만, 미지정 시 전체.
 * DB 미연결 또는 에러 시 빈 배열 → 호출처에서 시드 fallback.
 */
export async function getDiscoverPlaces(
  cityCode?: string,
): Promise<DiscoverPlace[]> {
  if (!prisma) return [];

  try {
    const places = await prisma.place.findMany({
      where: {
        isActive: true,
        ...(cityCode ? { cityCode } : {}),
        rating: { gt: 0 },
        userRatingsTotal: { gt: 0 },
      },
      orderBy: { qualityScore: "desc" },
    });

    return places
      .filter((p) => {
        // 숙소 제외 (스파/마사지/뷰티는 유지)
        if (
          p.category === "rest" &&
          !["스파/마사지", "뷰티"].includes(p.subCategory ?? "")
        )
          return false;
        return true;
      })
      .map((p) => {
        const city = getCityByCode(p.cityCode);
        return {
          id: p.id,
          name: p.name,
          category: toDiscoverCategory(p.category, p.subCategory),
          rating: p.rating!,
          reviewCount: p.userRatingsTotal!,
          distance: ZONE_LABEL[p.zone ?? ""] ?? "시내",
          badge:
            p.qualityScore >= 60
              ? ("popular" as const)
              : p.qualityScore >= 50
                ? ("ai" as const)
                : undefined,
          destination: city?.name ?? p.cityCode,
        };
      });
  } catch (err) {
    console.error("[place] getDiscoverPlaces failed", err);
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
