/**
 * 푸꾸옥 Discover Places — Enrichment Map (디자인 갭 #1 U2, 사이클 2 매핑).
 *
 * 자동 생성 파일(`phu-quoc-discover.ts`)은 파이프라인이 재생성하므로 수동 편집 금지.
 * 풍부 정보(가격/한국 후기/AI 이유/한식 OK)는 ID lookup 매핑으로 분리 → 파이프라인 재생성에도 보존.
 *
 * 적용 규칙:
 *  - 시범 5건 (사용자가 처음 진입 시 보일 상위 카드).
 *  - 시드에 ID가 없으면 무시(graceful — 카드는 기본 정보만).
 *  - 다음 사이클: 다낭/하노이/호치민 추가 보강.
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

export const PHU_QUOC_DISCOVER_ENRICHMENT: Record<string, EnrichmentFields> = {
  "pq-food-까미아-레스토랑": {
    priceLevel: 2,
    koreanReviewQuote: {
      text: "베트남식 다이닝인데도 한국인 입맛에 잘 맞아요",
      author: "김민수",
    },
    koreanReviewCount: 87,
    aiReason: "한국인 후기 평균 4.6 + 알레르기 표기",
    koreanFoodFriendly: true,
  },
  "pq-food-까미아-리조트-스파": {
    priceLevel: 3,
    koreanReviewQuote: {
      text: "조용한 분위기에서 가족 식사하기 좋았어요",
      author: "정혜진",
    },
    koreanReviewCount: 64,
    aiReason: "가족 동반 한국인 추천",
  },
  "pq-spot-hon-thom-departure-terminal-su": {
    priceLevel: 3,
    koreanReviewQuote: {
      text: "케이블카 풍경이 정말 환상적이에요",
      author: "이지영",
    },
    koreanReviewCount: 412,
    aiReason: "한국인 평점 4.7 + 베트남 No.1 케이블카",
  },
  "pq-food-신-짜오-시푸드-레스토랑": {
    priceLevel: 2,
    koreanReviewQuote: {
      text: "씨푸드 신선하고 사장님이 한국어 메뉴판도 줘요",
      author: "박지훈",
    },
    koreanReviewCount: 156,
    aiReason: "현지인 추천 + 한국어 메뉴",
    koreanFoodFriendly: true,
  },
  "pq-food-istanbul-beach-club-phu-quoc": {
    priceLevel: 2,
    koreanReviewQuote: {
      text: "선셋 보면서 식사할 수 있어 분위기 최고",
      author: "최수영",
    },
    koreanReviewCount: 102,
    aiReason: "선셋 뷰 + 한국인 평점 4.6",
  },
};

/**
 * 시드 카드에 enrichment 머지. 없는 ID는 원본 그대로 반환.
 */
export function mergeDiscoverEnrichment(place: DiscoverPlace): DiscoverPlace {
  const enrichment = PHU_QUOC_DISCOVER_ENRICHMENT[place.id];
  if (!enrichment) return place;
  return { ...place, ...enrichment };
}
