/**
 * place-search 유틸 테스트 — A4 검색.
 *
 * matchPlace: DiscoverPlace 멀티필드 매칭 (이름·존·AI이유·한국후기·카테고리).
 */

import { describe, it, expect } from "vitest";
import { matchPlace } from "@/lib/utils/place-search";
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
