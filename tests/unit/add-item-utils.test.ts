/**
 * AddItemModal 순수 유틸리티 테스트 — 카테고리 매핑, 추천 정렬, 소요시간 추정.
 */

import { describe, it, expect } from "vitest";
import {
  PLACE_TO_ITEM_CATEGORY,
  CATEGORY_OPTIONS,
  FLEXIBILITY_OPTIONS,
  topSuggestions,
  suggestDuration,
} from "@/components/itinerary/add-item-utils";
import type { DiscoverPlace } from "@/lib/types";

/* ════════════════════════════════════════════
 * Fixture
 * ════════════════════════════════════════════ */

function makePlace(overrides: Partial<DiscoverPlace> = {}): DiscoverPlace {
  return {
    id: "p1",
    name: "테스트 장소",
    category: "spot",
    rating: 4.5,
    reviewCount: 100,
    distance: "도보 10분",
    ...overrides,
  };
}

/* ════════════════════════════════════════════
 * PLACE_TO_ITEM_CATEGORY
 * ════════════════════════════════════════════ */

describe("PLACE_TO_ITEM_CATEGORY", () => {
  it("food → food", () => {
    expect(PLACE_TO_ITEM_CATEGORY.food).toBe("food");
  });

  it("spot → spot", () => {
    expect(PLACE_TO_ITEM_CATEGORY.spot).toBe("spot");
  });

  it("shopping → shopping", () => {
    expect(PLACE_TO_ITEM_CATEGORY.shopping).toBe("shopping");
  });

  it("nature → spot (축소 매핑)", () => {
    expect(PLACE_TO_ITEM_CATEGORY.nature).toBe("spot");
  });

  it("cafe → food (축소 매핑)", () => {
    expect(PLACE_TO_ITEM_CATEGORY.cafe).toBe("food");
  });

  it("activity → spot (축소 매핑)", () => {
    expect(PLACE_TO_ITEM_CATEGORY.activity).toBe("spot");
  });

  it("nightlife → food (축소 매핑)", () => {
    expect(PLACE_TO_ITEM_CATEGORY.nightlife).toBe("food");
  });

  it("7개 PlaceCategory 전체 커버", () => {
    expect(Object.keys(PLACE_TO_ITEM_CATEGORY)).toHaveLength(7);
  });
});

/* ════════════════════════════════════════════
 * CATEGORY_OPTIONS / FLEXIBILITY_OPTIONS
 * ════════════════════════════════════════════ */

describe("CATEGORY_OPTIONS", () => {
  it("6개 ItemCategory 옵션 — stay/wellness 추가 (ADR-050)", () => {
    expect(CATEGORY_OPTIONS).toHaveLength(6);
    expect(CATEGORY_OPTIONS.map((o) => o.id)).toEqual([
      "food", "spot", "shopping", "stay", "wellness", "rest",
    ]);
  });

  it("모든 옵션에 label + icon 존재", () => {
    for (const opt of CATEGORY_OPTIONS) {
      expect(opt.label).toBeTruthy();
      expect(opt.icon).toBeTruthy();
    }
  });

  it("stay/wellness 아이콘 매핑 (ADR-050)", () => {
    const stay = CATEGORY_OPTIONS.find((o) => o.id === "stay");
    const wellness = CATEGORY_OPTIONS.find((o) => o.id === "wellness");
    expect(stay).toEqual({ id: "stay", label: "숙소", icon: "hotel" });
    expect(wellness).toEqual({ id: "wellness", label: "마사지", icon: "spa" });
  });

  it("rest 라벨 '기타 휴식'으로 변경 (ADR-050)", () => {
    const rest = CATEGORY_OPTIONS.find((o) => o.id === "rest");
    expect(rest?.label).toBe("기타 휴식");
  });
});

describe("FLEXIBILITY_OPTIONS", () => {
  it("3개 유연성 옵션", () => {
    expect(FLEXIBILITY_OPTIONS).toHaveLength(3);
    expect(FLEXIBILITY_OPTIONS.map((o) => o.id)).toEqual([
      "flexible", "booked", "fixed",
    ]);
  });
});

/* ════════════════════════════════════════════
 * topSuggestions
 * ════════════════════════════════════════════ */

describe("topSuggestions", () => {
  it("빈 배열 → 빈 결과", () => {
    expect(topSuggestions([])).toEqual([]);
  });

  it("5개 이하 → 전체 반환", () => {
    const places = [makePlace({ id: "a" }), makePlace({ id: "b" })];
    expect(topSuggestions(places)).toHaveLength(2);
  });

  it("6개 이상 → 5개로 제한", () => {
    const places = Array.from({ length: 8 }, (_, i) =>
      makePlace({ id: `p${i}` }),
    );
    expect(topSuggestions(places)).toHaveLength(5);
  });

  it("ai 배지가 앞에 정렬", () => {
    const places = [
      makePlace({ id: "normal1" }),
      makePlace({ id: "ai1", badge: "ai" }),
      makePlace({ id: "popular1", badge: "popular" }),
      makePlace({ id: "ai2", badge: "ai" }),
      makePlace({ id: "normal2" }),
    ];
    const result = topSuggestions(places);
    // ai 배지 항목이 앞쪽에 위치
    expect(result[0].badge).toBe("ai");
    expect(result[1].badge).toBe("ai");
  });

  it("custom limit 파라미터 동작", () => {
    const places = Array.from({ length: 10 }, (_, i) =>
      makePlace({ id: `p${i}` }),
    );
    expect(topSuggestions(places, 3)).toHaveLength(3);
  });

  it("원본 배열 변경 안 함 (immutable)", () => {
    const places = [
      makePlace({ id: "b" }),
      makePlace({ id: "a", badge: "ai" }),
    ];
    const original = [...places];
    topSuggestions(places);
    expect(places.map((p) => p.id)).toEqual(original.map((p) => p.id));
  });
});

/* ════════════════════════════════════════════
 * suggestDuration
 * ════════════════════════════════════════════ */

describe("suggestDuration", () => {
  it("food → 90분", () => {
    expect(suggestDuration("food")).toBe(90);
  });

  it("cafe → 90분", () => {
    expect(suggestDuration("cafe")).toBe(90);
  });

  it("spot → 120분", () => {
    expect(suggestDuration("spot")).toBe(120);
  });

  it("shopping → 120분", () => {
    expect(suggestDuration("shopping")).toBe(120);
  });

  it("nature → 120분", () => {
    expect(suggestDuration("nature")).toBe(120);
  });

  it("activity → 120분", () => {
    expect(suggestDuration("activity")).toBe(120);
  });

  it("nightlife → 150분", () => {
    expect(suggestDuration("nightlife")).toBe(150);
  });
});
