/**
 * Wrap-up "다음 여행은?" 추천 헬퍼.
 *
 * 베트남 단일 국가 정책 (memory: feedback_vietnam_only_focus).
 * 활성 8 도시 중 현재 trip의 destinationCode를 제외한 추천 목록 생성.
 * dormant 도시(TYO/BKK/CNX)는 라이브 데이터 부재라 제외.
 *
 * 순수 함수 — SSR/server component에서 직접 호출 가능.
 */

import { CITY_LABEL_KO } from "@/lib/constants/city-labels";

/** 베트남 활성 도시 (시드 존재 + 라이브 데이터 발생 가능). 인기 desc 정렬. */
export const VIETNAM_ACTIVE_CITY_CODES = [
  "DAD", // 다낭
  "HAN", // 하노이
  "SGN", // 호치민
  "NHA", // 나트랑
  "HOI", // 호이안
  "DLI", // 달랏
  "PQC", // 푸꾸옥
  "CTH", // 껀터
] as const;

export type NextCityBadge = "BEST";

export interface NextCitySuggestion {
  code: string;
  name: string;
  /** /city/[slug] 라우트용 — 소문자 */
  slug: string;
  badge?: NextCityBadge;
}

interface NextCitySuggestionsOptions {
  /** 최대 추천 수 (default 5 — 모바일 가로 스크롤 한도) */
  limit?: number;
}

/**
 * 다음 도시 추천 목록.
 *
 * - destinationCode (현재 trip)는 제외
 * - 활성 도시 인기 desc 순서 유지
 * - 첫 번째 항목에 BEST 배지
 * - limit ≤ 0 또는 활성 도시 0개면 빈 배열
 */
export function getNextCitySuggestions(
  destinationCode: string | null | undefined,
  options: NextCitySuggestionsOptions = {},
): NextCitySuggestion[] {
  const limitRaw = options.limit ?? 5;
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : 0;
  if (limit === 0) return [];

  const exclude = (destinationCode ?? "").toUpperCase();

  const filtered = VIETNAM_ACTIVE_CITY_CODES.filter((c) => c !== exclude);
  const sliced = filtered.slice(0, limit);

  return sliced.map((code, i) => ({
    code,
    name: CITY_LABEL_KO[code] ?? code,
    slug: code.toLowerCase(),
    badge: i === 0 ? "BEST" : undefined,
  }));
}
