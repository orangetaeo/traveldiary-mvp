/**
 * 장소 검색 매칭 유틸 — A4 검색.
 *
 * DiscoverPlace의 여러 필드를 대상으로 한국어/영어 대소문자 무시 검색.
 * PlaceDiscoveryView에서 클라이언트 사이드 필터로 사용.
 */

import type { DiscoverPlace, PlaceCategory } from "@/lib/types";

const CATEGORY_KEYWORDS: Record<PlaceCategory, string[]> = {
  food: ["음식", "맛집", "식당", "레스토랑", "food", "restaurant"],
  spot: ["관광", "관광지", "명소", "spot", "sightseeing"],
  shopping: ["쇼핑", "마트", "시장", "shopping", "market"],
  nature: ["자연", "해변", "비치", "산", "공원", "nature", "beach", "park"],
  cafe: ["카페", "커피", "cafe", "coffee"],
};

/**
 * 장소가 검색어에 매칭되는지 판별.
 *
 * 검색 대상 필드 (우선순위):
 * 1. name — 장소 이름
 * 2. distance — 존/지역 라벨 (예: "즈엉동", "미케")
 * 3. aiReason — AI 추천 이유
 * 4. koreanReviewQuote.text — 한국인 후기 인용
 * 5. category — 카테고리 라벨 + 키워드 (예: "음식", "맛집")
 */
export function matchPlace(place: DiscoverPlace, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  // 1. name
  if (place.name.toLowerCase().includes(q)) return true;

  // 2. zone/distance label
  if (place.distance?.toLowerCase().includes(q)) return true;

  // 3. AI reason
  if (place.aiReason?.toLowerCase().includes(q)) return true;

  // 4. Korean review quote
  if (place.koreanReviewQuote?.text.toLowerCase().includes(q)) return true;

  // 5. Category keywords
  const keywords = CATEGORY_KEYWORDS[place.category] ?? [];
  if (keywords.some((kw) => kw.includes(q) || q.includes(kw))) return true;

  return false;
}
