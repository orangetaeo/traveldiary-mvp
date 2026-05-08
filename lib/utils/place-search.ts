/**
 * 장소 검색 매칭 유틸 — A4 검색 Tier 2.
 *
 * Tier 1: 단순 substring 매칭 (사이클 A4)
 * Tier 2: 퍼지 매칭 + 초성 검색 + 관련도 점수 (이번 구현)
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
  activity: ["액티비티", "체험", "투어", "activity", "tour", "adventure"],
  nightlife: ["야간", "바", "클럽", "나이트", "nightlife", "bar", "pub"],
};

// ── 초성 매핑 (한국어) ──────────────────────────────────────────────────
const CHOSUNG = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

function getChosung(str: string): string {
  return [...str]
    .map((ch) => {
      const code = ch.charCodeAt(0) - 0xac00;
      if (code < 0 || code > 11171) return ch;
      return CHOSUNG[Math.floor(code / 588)];
    })
    .join("");
}

function isChosungOnly(str: string): boolean {
  return [...str].every((ch) => CHOSUNG.includes(ch));
}

// ── 퍼지 매칭 (토큰 포함 + 순서 무관) ──────────────────────────────────
function fuzzyContains(text: string, query: string): boolean {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  // 직접 포함
  if (t.includes(q)) return true;
  // 공백 제거 후 포함 (띄어쓰기 차이)
  if (t.replace(/\s/g, "").includes(q.replace(/\s/g, ""))) return true;
  // 토큰 기반: 쿼리 단어가 모두 텍스트에 포함
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every((tok) => t.includes(tok))) return true;
  return false;
}

// ── 관련도 점수 ─────────────────────────────────────────────────────────
// 높을수록 관련도 높음. 0 = 매칭 안 됨.
const SCORE_NAME_EXACT = 100;
const SCORE_NAME_FUZZY = 80;
const SCORE_NAME_CHOSUNG = 70;
const SCORE_ZONE = 50;
const SCORE_AI_REASON = 30;
const SCORE_REVIEW = 20;
const SCORE_CATEGORY = 10;

/**
 * 장소의 검색 관련도 점수 반환.
 * 0 = 매칭 안 됨, 높을수록 관련도 높음.
 */
export function scorePlace(place: DiscoverPlace, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 1; // 빈 쿼리 → 모든 항목 매칭 (최소 점수)

  let best = 0;

  // 1. name (최고 가중치)
  const name = place.name.toLowerCase();
  if (name === q) {
    best = Math.max(best, SCORE_NAME_EXACT + 10); // 정확 일치 보너스
  } else if (name.startsWith(q)) {
    best = Math.max(best, SCORE_NAME_EXACT);
  } else if (fuzzyContains(name, q)) {
    best = Math.max(best, SCORE_NAME_FUZZY);
  }

  // 초성 매칭 (한국어 쿼리가 초성으로만 구성된 경우)
  if (isChosungOnly(q)) {
    const nameChosung = getChosung(place.name);
    if (nameChosung.includes(q)) {
      best = Math.max(best, SCORE_NAME_CHOSUNG);
    }
  }

  // 2. zone/distance label
  if (place.distance && fuzzyContains(place.distance, q)) {
    best = Math.max(best, SCORE_ZONE);
  }

  // 3. AI reason
  if (place.aiReason && fuzzyContains(place.aiReason, q)) {
    best = Math.max(best, SCORE_AI_REASON);
  }

  // 4. Korean review quote
  if (place.koreanReviewQuote?.text && fuzzyContains(place.koreanReviewQuote.text, q)) {
    best = Math.max(best, SCORE_REVIEW);
  }

  // 5. Category keywords
  const keywords = CATEGORY_KEYWORDS[place.category] ?? [];
  if (keywords.some((kw) => kw.includes(q) || q.includes(kw))) {
    best = Math.max(best, SCORE_CATEGORY);
  }

  return best;
}

/**
 * 장소가 검색어에 매칭되는지 판별 (하위 호환).
 */
export function matchPlace(place: DiscoverPlace, query: string): boolean {
  return scorePlace(place, query) > 0;
}

// ── 최근 검색어 (localStorage) ──────────────────────────────────────────
const RECENT_KEY = "td-place-search-recent";
const RECENT_MAX = 5;

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string): void {
  if (typeof window === "undefined") return;
  const q = query.trim();
  if (!q || q.length < 2) return;
  try {
    const prev = getRecentSearches().filter((s) => s !== q);
    const next = [q, ...prev].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // localStorage quota exceeded — ignore
  }
}

export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    // ignore
  }
}
