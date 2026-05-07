/**
 * place-search 유틸 테스트 — A4 검색 Tier 2.
 *
 * matchPlace: DiscoverPlace 멀티필드 매칭 (이름·존·AI이유·한국후기·카테고리).
 * scorePlace: 관련도 점수 + 퍼지 매칭 + 초성 검색.
 * 최근 검색어: localStorage 기반 CRUD.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  matchPlace,
  scorePlace,
  getRecentSearches,
  addRecentSearch,
  clearRecentSearches,
} from "@/lib/utils/place-search";
import type { DiscoverPlace } from "@/lib/types";

function makePlace(overrides: Partial<DiscoverPlace> = {}): DiscoverPlace {
  return {
    id: "test-1",
    name: "즈엉동 야시장",
    category: "food",
    rating: 4.3,
    reviewCount: 120,
    distance: "즈엉동",
    ...overrides,
  };
}

// ════════════════════════════════════════════
// matchPlace (하위 호환)
// ════════════════════════════════════════════

describe("matchPlace", () => {
  it("빈 쿼리 → 항상 매칭", () => {
    expect(matchPlace(makePlace(), "")).toBe(true);
    expect(matchPlace(makePlace(), "  ")).toBe(true);
  });

  it("이름 매칭 (대소문자 무시)", () => {
    expect(matchPlace(makePlace({ name: "Sao Beach" }), "sao")).toBe(true);
    expect(matchPlace(makePlace({ name: "Sao Beach" }), "SAO")).toBe(true);
  });

  it("이름 한글 매칭", () => {
    expect(matchPlace(makePlace({ name: "즈엉동 야시장" }), "야시장")).toBe(true);
  });

  it("존/지역 라벨 매칭", () => {
    expect(matchPlace(makePlace({ distance: "미케" }), "미케")).toBe(true);
  });

  it("AI 추천 이유 매칭", () => {
    const place = makePlace({ aiReason: "현지인 추천 + 알레르기 안전" });
    expect(matchPlace(place, "알레르기")).toBe(true);
    expect(matchPlace(place, "현지인")).toBe(true);
  });

  it("한국인 후기 인용 매칭", () => {
    const place = makePlace({
      koreanReviewQuote: { text: "분위기가 좋고 맥주가 시원해요", author: "여행자" },
    });
    expect(matchPlace(place, "맥주")).toBe(true);
    expect(matchPlace(place, "분위기")).toBe(true);
  });

  it("카테고리 키워드 매칭 — 음식/맛집", () => {
    expect(matchPlace(makePlace({ category: "food" }), "맛집")).toBe(true);
    expect(matchPlace(makePlace({ category: "food" }), "식당")).toBe(true);
    expect(matchPlace(makePlace({ category: "food" }), "레스토랑")).toBe(true);
  });

  it("카테고리 키워드 매칭 — 카페", () => {
    expect(matchPlace(makePlace({ category: "cafe" }), "커피")).toBe(true);
    expect(matchPlace(makePlace({ category: "cafe" }), "cafe")).toBe(true);
  });

  it("카테고리 키워드 매칭 — 자연/해변", () => {
    expect(matchPlace(makePlace({ category: "nature" }), "해변")).toBe(true);
    expect(matchPlace(makePlace({ category: "nature" }), "비치")).toBe(true);
    expect(matchPlace(makePlace({ category: "nature" }), "beach")).toBe(true);
  });

  it("카테고리 키워드 매칭 — 쇼핑/시장", () => {
    expect(matchPlace(makePlace({ category: "shopping" }), "시장")).toBe(true);
    expect(matchPlace(makePlace({ category: "shopping" }), "마트")).toBe(true);
  });

  it("카테고리 키워드 매칭 — 관광", () => {
    expect(matchPlace(makePlace({ category: "spot" }), "관광")).toBe(true);
    expect(matchPlace(makePlace({ category: "spot" }), "명소")).toBe(true);
  });

  it("매칭 없음 → false", () => {
    expect(matchPlace(makePlace(), "xyz존재하지않는검색어")).toBe(false);
  });

  it("aiReason/koreanReviewQuote 없는 장소도 안전", () => {
    const place = makePlace({
      aiReason: undefined,
      koreanReviewQuote: undefined,
    });
    expect(matchPlace(place, "xyz")).toBe(false);
  });
});

// ════════════════════════════════════════════
// scorePlace (A4 Tier 2)
// ════════════════════════════════════════════

describe("scorePlace — 관련도 점수", () => {
  it("빈 쿼리 → 최소 점수 1", () => {
    expect(scorePlace(makePlace(), "")).toBe(1);
    expect(scorePlace(makePlace(), "  ")).toBe(1);
  });

  it("이름 정확 일치 → 최고 점수", () => {
    const place = makePlace({ name: "바나힐" });
    const exactScore = scorePlace(place, "바나힐");
    expect(exactScore).toBeGreaterThanOrEqual(100);
  });

  it("이름 시작 일치 > 퍼지 일치", () => {
    const place = makePlace({ name: "바나힐 테마파크" });
    const startScore = scorePlace(place, "바나힐");
    const fuzzyScore = scorePlace(place, "테마파크");
    expect(startScore).toBeGreaterThanOrEqual(fuzzyScore);
  });

  it("이름 매칭 > 존 매칭 > AI 이유 > 후기 > 카테고리", () => {
    const nameMatch = scorePlace(makePlace({ name: "쌀국수집" }), "쌀국수");
    const zoneMatch = scorePlace(makePlace({ distance: "쌀국수거리" }), "쌀국수");
    const aiMatch = scorePlace(makePlace({ aiReason: "쌀국수 맛집" }), "쌀국수");
    const reviewMatch = scorePlace(
      makePlace({ koreanReviewQuote: { text: "쌀국수 맛있어요", author: "A" } }),
      "쌀국수",
    );
    const catMatch = scorePlace(makePlace({ category: "food" }), "음식");

    expect(nameMatch).toBeGreaterThan(zoneMatch);
    expect(zoneMatch).toBeGreaterThan(aiMatch);
    expect(aiMatch).toBeGreaterThan(reviewMatch);
    expect(reviewMatch).toBeGreaterThan(catMatch);
    expect(catMatch).toBeGreaterThan(0);
  });

  it("매칭 없음 → 0", () => {
    expect(scorePlace(makePlace(), "zzz없는단어zzz")).toBe(0);
  });
});

// ════════════════════════════════════════════
// 초성 검색
// ════════════════════════════════════════════

describe("scorePlace — 초성 검색", () => {
  it("초성으로 이름 매칭 (ㅂㄴㅎ → 바나힐)", () => {
    const place = makePlace({ name: "바나힐" });
    const score = scorePlace(place, "ㅂㄴㅎ");
    expect(score).toBeGreaterThan(0);
  });

  it("초성으로 이름 매칭 (ㅇㅅㅈ → 야시장)", () => {
    const place = makePlace({ name: "즈엉동 야시장" });
    const score = scorePlace(place, "ㅇㅅㅈ");
    expect(score).toBeGreaterThan(0);
  });

  it("초성이 아닌 한글은 초성 검색으로 취급 안 함", () => {
    const place = makePlace({ name: "바나힐" });
    // "바" is not chosung-only, so it should use regular matching
    const score = scorePlace(place, "바");
    expect(score).toBeGreaterThan(0); // still matches via substring
  });

  it("초성 불일치 → 0", () => {
    const place = makePlace({ name: "바나힐" });
    expect(scorePlace(place, "ㅋㅋㅋ")).toBe(0);
  });
});

// ════════════════════════════════════════════
// 퍼지 매칭 (띄어쓰기/토큰)
// ════════════════════════════════════════════

describe("scorePlace — 퍼지 매칭", () => {
  it("띄어쓰기 차이 매칭 (바나 힐 ↔ 바나힐)", () => {
    const place = makePlace({ name: "바나힐" });
    expect(scorePlace(place, "바나 힐")).toBeGreaterThan(0);
  });

  it("토큰 순서 무관 매칭 (야시장 즈엉동)", () => {
    const place = makePlace({ name: "즈엉동 야시장" });
    expect(scorePlace(place, "야시장 즈엉동")).toBeGreaterThan(0);
  });

  it("부분 띄어쓰기 매칭 (즈엉동야시장 ↔ 즈엉동 야시장)", () => {
    const place = makePlace({ name: "즈엉동 야시장" });
    expect(scorePlace(place, "즈엉동야시장")).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════
// 최근 검색어 (localStorage mock)
// ════════════════════════════════════════════

describe("최근 검색어", () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    const mockLocalStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
    };
    // vitest node 환경에서 window + localStorage 모두 stub 필요
    vi.stubGlobal("window", { localStorage: mockLocalStorage });
    vi.stubGlobal("localStorage", mockLocalStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("초기 상태 → 빈 배열", () => {
    expect(getRecentSearches()).toEqual([]);
  });

  it("검색어 추가 → 조회 가능", () => {
    addRecentSearch("바나힐");
    expect(getRecentSearches()).toEqual(["바나힐"]);
  });

  it("최근 검색어 순서 (최신 우선)", () => {
    addRecentSearch("바나힐");
    addRecentSearch("미케비치");
    expect(getRecentSearches()).toEqual(["미케비치", "바나힐"]);
  });

  it("중복 검색어 → 최상단 이동", () => {
    addRecentSearch("바나힐");
    addRecentSearch("미케비치");
    addRecentSearch("바나힐");
    expect(getRecentSearches()).toEqual(["바나힐", "미케비치"]);
  });

  it("최대 5개 유지", () => {
    for (let i = 0; i < 7; i++) addRecentSearch(`검색어${i}`);
    expect(getRecentSearches()).toHaveLength(5);
    expect(getRecentSearches()[0]).toBe("검색어6");
  });

  it("짧은 검색어 (1글자) → 저장 안 됨", () => {
    addRecentSearch("A");
    expect(getRecentSearches()).toEqual([]);
  });

  it("빈 검색어 → 저장 안 됨", () => {
    addRecentSearch("   ");
    expect(getRecentSearches()).toEqual([]);
  });

  it("전체 삭제", () => {
    addRecentSearch("바나힐");
    addRecentSearch("미케비치");
    clearRecentSearches();
    expect(getRecentSearches()).toEqual([]);
  });
});
