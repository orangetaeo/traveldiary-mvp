/**
 * getWrapUpHighlights — wrap-up "이 순간이 좋았어요" 자동 선별.
 *
 * 기존 DEMO_HIGHLIGHTS 정적 배열 대체. 사용자 보고 가능 갭:
 * "AI 추천이라더니 매번 똑같음".
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  getWrapUpHighlights,
  highlightSubtitle,
} from "@/lib/wrap-up/highlight-suggestions";
import type { ItineraryItem, ItemCategory } from "@/lib/types";

function makeItem(overrides: Partial<ItineraryItem>): ItineraryItem {
  return {
    id: overrides.id ?? "x",
    tripId: "t1",
    dayIndex: overrides.dayIndex ?? 0,
    scheduledAt: overrides.scheduledAt ?? "2026-05-01T09:00:00Z",
    durationMinutes: overrides.durationMinutes ?? 60,
    flexibility: "flexible",
    priority: overrides.priority ?? 3,
    flexMinutes: 30,
    name: overrides.name ?? "기본 일정",
    category: overrides.category ?? "spot",
    location: { lat: 0, lng: 0, address: "" },
    evidence: overrides.evidence ?? {
      reasons: [],
      sources: [],
      verifiedAt: "2026-05-01T00:00:00Z",
    },
    photos: overrides.photos,
    dependencies: [],
  };
}

/* ════════════════════════════════════════════
 * 빈 / 단일 day
 * ════════════════════════════════════════════ */

describe("getWrapUpHighlights — 빈 입력", () => {
  it("items가 빈 배열이면 빈 배열 반환", () => {
    expect(getWrapUpHighlights([])).toEqual([]);
  });
});

describe("getWrapUpHighlights — day별 1개씩 선정", () => {
  it("day가 3개면 3개 반환 (각 day 1개)", () => {
    const items = [
      makeItem({ id: "d1a", dayIndex: 0, name: "Day 1 식사" }),
      makeItem({ id: "d2a", dayIndex: 1, name: "Day 2 명소" }),
      makeItem({ id: "d3a", dayIndex: 2, name: "Day 3 카페" }),
    ];
    const highlights = getWrapUpHighlights(items);
    expect(highlights).toHaveLength(3);
    expect(highlights.map((h) => h.day)).toEqual([1, 2, 3]);
  });

  it("day는 1-based로 변환됨 (dayIndex 0 → day 1)", () => {
    const items = [makeItem({ id: "a", dayIndex: 0, name: "첫째 날" })];
    const [h] = getWrapUpHighlights(items);
    expect(h?.day).toBe(1);
  });

  it("itemId / title / category가 정확히 매핑됨", () => {
    const items = [
      makeItem({
        id: "item-x",
        dayIndex: 0,
        name: "현지 쌀국수",
        category: "food",
      }),
    ];
    const [h] = getWrapUpHighlights(items);
    expect(h?.itemId).toBe("item-x");
    expect(h?.title).toBe("현지 쌀국수");
    expect(h?.category).toBe("food");
  });
});

/* ════════════════════════════════════════════
 * 선정 우선순위
 * ════════════════════════════════════════════ */

describe("getWrapUpHighlights — 선정 우선순위", () => {
  it("photos 있는 item이 우선 (priority 무관)", () => {
    const items = [
      makeItem({ id: "p1", dayIndex: 0, name: "사진 없음 high pri", priority: 5 }),
      makeItem({
        id: "p2",
        dayIndex: 0,
        name: "사진 있음 low pri",
        priority: 2,
        photos: ["https://x/photo.jpg"],
      }),
    ];
    const [h] = getWrapUpHighlights(items);
    expect(h?.itemId).toBe("p2");
  });

  it("photos 둘 다 없으면 priority 높은 item 우선", () => {
    const items = [
      makeItem({ id: "low", dayIndex: 0, priority: 2, name: "낮음" }),
      makeItem({ id: "high", dayIndex: 0, priority: 5, name: "높음" }),
    ];
    const [h] = getWrapUpHighlights(items);
    expect(h?.itemId).toBe("high");
  });

  it("photos·priority 동률이면 evidence.reasons 많은 item 우선", () => {
    const items = [
      makeItem({
        id: "few",
        dayIndex: 0,
        priority: 3,
        evidence: { reasons: ["a"], sources: [], verifiedAt: "2026-05-01T00:00:00Z" },
      }),
      makeItem({
        id: "many",
        dayIndex: 0,
        priority: 3,
        evidence: {
          reasons: ["a", "b", "c"],
          sources: [],
          verifiedAt: "2026-05-01T00:00:00Z",
        },
      }),
    ];
    const [h] = getWrapUpHighlights(items);
    expect(h?.itemId).toBe("many");
  });

  it("모두 동률이면 scheduledAt 빠른 item (안정 정렬)", () => {
    const items = [
      makeItem({ id: "later", dayIndex: 0, scheduledAt: "2026-05-01T15:00:00Z" }),
      makeItem({ id: "earlier", dayIndex: 0, scheduledAt: "2026-05-01T09:00:00Z" }),
    ];
    const [h] = getWrapUpHighlights(items);
    expect(h?.itemId).toBe("earlier");
  });
});

/* ════════════════════════════════════════════
 * photoUrl 노출
 * ════════════════════════════════════════════ */

describe("getWrapUpHighlights — photoUrl", () => {
  it("photos 첫 번째 사진이 photoUrl로 노출", () => {
    const items = [
      makeItem({
        id: "p",
        dayIndex: 0,
        photos: ["https://x/first.jpg", "https://x/second.jpg"],
      }),
    ];
    const [h] = getWrapUpHighlights(items);
    expect(h?.photoUrl).toBe("https://x/first.jpg");
  });

  it("photos 빈 배열이면 photoUrl undefined", () => {
    const items = [makeItem({ id: "p", dayIndex: 0, photos: [] })];
    const [h] = getWrapUpHighlights(items);
    expect(h?.photoUrl).toBeUndefined();
  });

  it("photos 미정의이면 photoUrl undefined", () => {
    const items = [makeItem({ id: "p", dayIndex: 0 })];
    const [h] = getWrapUpHighlights(items);
    expect(h?.photoUrl).toBeUndefined();
  });
});

/* ════════════════════════════════════════════
 * maxCount + 정렬
 * ════════════════════════════════════════════ */

describe("getWrapUpHighlights — maxCount + 정렬", () => {
  it("maxCount default = 5 (day가 7개면 5개만)", () => {
    const items = Array.from({ length: 7 }, (_, i) =>
      makeItem({ id: `d${i}`, dayIndex: i }),
    );
    expect(getWrapUpHighlights(items)).toHaveLength(5);
  });

  it("maxCount 옵션 적용", () => {
    const items = Array.from({ length: 4 }, (_, i) =>
      makeItem({ id: `d${i}`, dayIndex: i }),
    );
    expect(getWrapUpHighlights(items, { maxCount: 2 })).toHaveLength(2);
  });

  it("day asc 정렬 (3 → 1 → 5 입력해도 1, 3, 5 순)", () => {
    const items = [
      makeItem({ id: "d3", dayIndex: 2 }),
      makeItem({ id: "d1", dayIndex: 0 }),
      makeItem({ id: "d5", dayIndex: 4 }),
    ];
    expect(getWrapUpHighlights(items).map((h) => h.day)).toEqual([1, 3, 5]);
  });
});

/* ════════════════════════════════════════════
 * highlightSubtitle 카테고리 라벨
 * ════════════════════════════════════════════ */

describe("highlightSubtitle", () => {
  it("food → \"기억에 남은 식사\"", () => {
    expect(highlightSubtitle("food")).toBe("기억에 남은 식사");
  });

  it("spot → \"다녀온 명소\"", () => {
    expect(highlightSubtitle("spot")).toBe("다녀온 명소");
  });

  it("shopping → \"기념이 된 쇼핑\"", () => {
    expect(highlightSubtitle("shopping")).toBe("기념이 된 쇼핑");
  });

  it("rest → \"쉼이 있던 순간\"", () => {
    expect(highlightSubtitle("rest")).toBe("쉼이 있던 순간");
  });
});

/* ════════════════════════════════════════════
 * /wrap-up/[tripId]/page.tsx 소스 회귀 가드
 * ════════════════════════════════════════════ */

describe("/wrap-up/[tripId]/page.tsx 소스 — 동적 highlights wiring", () => {
  const SRC = fs.readFileSync(
    path.resolve(__dirname, "../../app/wrap-up/[tripId]/page.tsx"),
    "utf-8",
  );

  it("DEMO_HIGHLIGHTS 정적 배열 제거", () => {
    expect(SRC).not.toContain("DEMO_HIGHLIGHTS");
    expect(SRC).not.toContain("로컬 맛집 탐방");
    expect(SRC).not.toContain("야경 포인트");
    expect(SRC).not.toContain("일출 감상");
  });

  it("getWrapUpHighlights import + 호출", () => {
    expect(SRC).toMatch(
      /import\s*\{[\s\S]*?getWrapUpHighlights[\s\S]*?\}\s*from\s*"@\/lib\/wrap-up\/highlight-suggestions"/,
    );
    expect(SRC).toMatch(/getWrapUpHighlights\(items,\s*\{\s*maxCount:\s*5\s*\}\)/);
  });

  it("highlightSubtitle import (카테고리 라벨)", () => {
    expect(SRC).toContain("highlightSubtitle");
  });

  it("highlights 카드는 Link wrap (item detail 페이지 진입)", () => {
    expect(SRC).toMatch(
      /<Link[\s\S]*?href=\{`\/itinerary\/\$\{trip\.id\}\/item\/\$\{h\.itemId\}`\}/,
    );
  });

  it("aria-label 노출 (Day N TITLE 자세히 보기)", () => {
    expect(SRC).toMatch(/aria-label=\{`Day \$\{h\.day\} \$\{h\.title\} 자세히 보기`\}/);
  });

  it("photoUrl 있으면 img 노출, 없으면 placeholder 분기", () => {
    expect(SRC).toContain("h.photoUrl ?");
    expect(SRC).toMatch(/src=\{h\.photoUrl\}/);
    expect(SRC).toContain("photo_camera");
  });

  it("img loading=\"lazy\" (성능)", () => {
    expect(SRC).toMatch(/h\.photoUrl[\s\S]{0,400}?loading="lazy"/);
  });

  it("highlights.length === 0일 때 섹션 미렌더링 (빈 항목 회피)", () => {
    expect(SRC).toMatch(/highlights\.length\s*>\s*0\s*&&/);
  });
});
