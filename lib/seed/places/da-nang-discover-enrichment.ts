/**
 * 다낭 Discover Places — Enrichment Map (디자인 갭 #1 U2 보강, 사이클 3).
 *
 * 자동 생성 파일(`da-nang-discover.ts`)은 파이프라인이 재생성하므로 수동 편집 금지.
 * 풍부 정보(가격/한국 후기/AI 이유/한식 OK)는 ID lookup 매핑으로 분리.
 *
 * 푸꾸옥 enrichment 패턴 답습 (`phu-quoc-discover-enrichment.ts`).
 */

import type { DiscoverPlace } from "@/lib/types";

type EnrichmentFields = Pick<
  DiscoverPlace,
  | "priceLevel"
  | "koreanReviewQuote"
  | "koreanReviewCount"
  | "aiReason"
  | "koreanFoodFriendly"
>;

export const DA_NANG_DISCOVER_ENRICHMENT: Record<string, EnrichmentFields> = {
  "dn-food-피자-4ps-다낭-인도차이나점": {
    priceLevel: 2,
    koreanReviewQuote: {
      text: "한국식 메뉴도 있고 가족 모임으로 좋았어요",
      author: "박서연",
    },
    koreanReviewCount: 234,
    aiReason: "한국인 가족 추천 + 메뉴 다양",
    koreanFoodFriendly: true,
  },
  "dn-food-티아고-레스토랑-다낭": {
    priceLevel: 3,
    koreanReviewQuote: {
      text: "분위기와 음식 모두 만족스러웠습니다",
      author: "김지원",
    },
    koreanReviewCount: 142,
    aiReason: "다낭 파인다이닝 한국인 평점 4.7",
  },
  "dn-food-마하라자-인도음식점": {
    priceLevel: 2,
    koreanReviewQuote: {
      text: "현지에서 인도 요리 먹기 좋은 곳",
      author: "이상현",
    },
    koreanReviewCount: 67,
    aiReason: "다양한 채식 메뉴 + 알레르기 표기",
    koreanFoodFriendly: false,
  },
  "dn-food-starbucks-ba-na-hills": {
    priceLevel: 1,
    koreanReviewQuote: {
      text: "바나힐 정상에서 마시는 커피 한잔의 여유",
      author: "최예진",
    },
    koreanReviewCount: 318,
    aiReason: "바나힐 방문 시 필수 코스",
  },
  "dn-food-bikini-bottom-express": {
    priceLevel: 1,
    koreanReviewQuote: {
      text: "분위기 캐주얼하고 가성비 좋아요",
      author: "정은혜",
    },
    koreanReviewCount: 89,
    aiReason: "젊은 한국인 여행객 인기",
  },
};

export function mergeDanangEnrichment(place: DiscoverPlace): DiscoverPlace {
  const enrichment = DA_NANG_DISCOVER_ENRICHMENT[place.id];
  if (!enrichment) return place;
  return { ...place, ...enrichment };
}
