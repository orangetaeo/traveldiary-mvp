/**
 * 사이클 OO — applyChecklistFilters + ChecklistSearchInput 단위 테스트.
 *
 * 검증:
 *  - applyChecklistFilters: category × search 조합
 *  - 검색은 trim + lowercase, text·cityNote 모두 매칭
 *  - 빈 검색어 = pass-through
 *  - SearchInput rendering: placeholder, clear 버튼 토글, aria-label
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { applyChecklistFilters } from "@/components/checklist/ChecklistCategoryFilter";
import { ChecklistSearchInput } from "@/components/checklist/ChecklistSearchInput";
import type { ChecklistItem } from "@/lib/types";

const NOOP = () => {};

function makeItem(
  id: string,
  category: ChecklistItem["category"],
  text: string,
  cityNote?: string,
): ChecklistItem {
  return {
    id,
    tripId: "trip-1",
    category,
    text,
    dDayBucket: "D-7",
    done: false,
    sortOrder: 0,
    cityNote,
    createdAt: "2026-05-03T00:00:00Z",
    updatedAt: "2026-05-03T00:00:00Z",
  };
}

const SAMPLE: ChecklistItem[] = [
  makeItem("a", "documents", "여권"),
  makeItem("b", "documents", "비자 사본"),
  makeItem("c", "clothing", "수영복", "푸꾸옥 해변"),
  makeItem("d", "electronics", "충전기"),
  makeItem("e", "custom", "자유 메모", "현지 기타"),
];

describe("사이클 OO — applyChecklistFilters", () => {
  it("category=all + search='' → 전체", () => {
    const out = applyChecklistFilters(SAMPLE, {
      category: "all",
      search: "",
    });
    expect(out).toHaveLength(5);
  });

  it("category=documents + search='' → 2건", () => {
    const out = applyChecklistFilters(SAMPLE, {
      category: "documents",
      search: "",
    });
    expect(out).toHaveLength(2);
  });

  it("category=all + search='여권' → 1건 (text 매칭)", () => {
    const out = applyChecklistFilters(SAMPLE, {
      category: "all",
      search: "여권",
    });
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("a");
  });

  it("category=all + search='푸꾸옥' → 1건 (cityNote 매칭)", () => {
    const out = applyChecklistFilters(SAMPLE, {
      category: "all",
      search: "푸꾸옥",
    });
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("c");
  });

  it("category=clothing + search='수영' → 1건 (조합 AND)", () => {
    const out = applyChecklistFilters(SAMPLE, {
      category: "clothing",
      search: "수영",
    });
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("c");
  });

  it("category=documents + search='수영' → 0건 (조합 AND 미매칭)", () => {
    const out = applyChecklistFilters(SAMPLE, {
      category: "documents",
      search: "수영",
    });
    expect(out).toHaveLength(0);
  });

  it("검색어 trim — '  여권  ' → '여권'과 동일", () => {
    const out = applyChecklistFilters(SAMPLE, {
      category: "all",
      search: "  여권  ",
    });
    expect(out).toHaveLength(1);
  });

  it("영문 case-insensitive — 'CHARGER' → '충전기' 미매칭(영문만 검색)", () => {
    // 'CHARGER'는 SAMPLE에 없음 (모두 한국어 text). 매칭 0.
    const out = applyChecklistFilters(SAMPLE, {
      category: "all",
      search: "CHARGER",
    });
    expect(out).toHaveLength(0);
  });

  it("영문 case-insensitive — 영문 text 추가 시 매칭 (lowercase)", () => {
    const items = [...SAMPLE, makeItem("f", "electronics", "Travel Adapter")];
    const out = applyChecklistFilters(items, {
      category: "all",
      search: "ADAPTER",
    });
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("f");
  });

  it("빈 입력 + 검색어 → 빈 출력", () => {
    expect(
      applyChecklistFilters([], { category: "all", search: "여권" }),
    ).toHaveLength(0);
  });
});

describe("사이클 OO — ChecklistSearchInput rendering", () => {
  it("placeholder + aria-label 표시", () => {
    const html = renderToStaticMarkup(
      <ChecklistSearchInput value="" onChange={NOOP} />,
    );
    expect(html).toContain('placeholder="항목·도시 메모 검색"');
    expect(html).toContain('aria-label="체크리스트 검색"');
  });

  it("value='' → clear 버튼 미노출", () => {
    const html = renderToStaticMarkup(
      <ChecklistSearchInput value="" onChange={NOOP} />,
    );
    expect(html).not.toContain('aria-label="검색어 지우기"');
  });

  it("value=non-empty → clear 버튼 노출", () => {
    const html = renderToStaticMarkup(
      <ChecklistSearchInput value="여권" onChange={NOOP} />,
    );
    expect(html).toContain('aria-label="검색어 지우기"');
  });

  it("type=search 사용", () => {
    const html = renderToStaticMarkup(
      <ChecklistSearchInput value="" onChange={NOOP} />,
    );
    expect(html).toContain('type="search"');
  });
});
