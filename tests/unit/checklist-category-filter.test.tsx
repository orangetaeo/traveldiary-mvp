/**
 * 사이클 NN — ChecklistCategoryFilter + applyCategoryFilter 단위 테스트.
 *
 * 검증:
 *  - applyCategoryFilter: all/단일 카테고리 분기
 *  - 진척률 unfiltered 기준 (필터 helper 자체에는 영향 없음 — items 그대로 전달)
 *  - chips: 전체 + 6 카테고리 + count 배지
 *  - count=0인 카테고리 chip은 disabled
 *  - 활성 chip aria-checked=true (radiogroup)
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ChecklistCategoryFilter,
  applyCategoryFilter,
} from "@/components/checklist/ChecklistCategoryFilter";
import type { ChecklistItem } from "@/lib/types";

const NOOP = () => {};

function makeItem(
  id: string,
  category: ChecklistItem["category"],
): ChecklistItem {
  return {
    id,
    tripId: "trip-1",
    category,
    text: `item-${id}`,
    dDayBucket: "D-7",
    done: false,
    sortOrder: 0,
    createdAt: "2026-05-03T00:00:00Z",
    updatedAt: "2026-05-03T00:00:00Z",
  };
}

const SAMPLE: ChecklistItem[] = [
  makeItem("a", "documents"),
  makeItem("b", "documents"),
  makeItem("c", "clothing"),
  makeItem("d", "electronics"),
];

describe("사이클 NN — applyCategoryFilter", () => {
  it("all → 전체 그대로", () => {
    expect(applyCategoryFilter(SAMPLE, "all")).toHaveLength(4);
  });

  it("documents → 2건", () => {
    const out = applyCategoryFilter(SAMPLE, "documents");
    expect(out).toHaveLength(2);
    expect(out.every((it) => it.category === "documents")).toBe(true);
  });

  it("forbidden → 0건 (해당 항목 없음)", () => {
    expect(applyCategoryFilter(SAMPLE, "forbidden")).toHaveLength(0);
  });

  it("빈 입력 → 빈 출력", () => {
    expect(applyCategoryFilter([], "all")).toHaveLength(0);
    expect(applyCategoryFilter([], "documents")).toHaveLength(0);
  });
});

describe("사이클 NN — ChecklistCategoryFilter rendering", () => {
  it("전체 chip + 6 카테고리 chip 렌더링", () => {
    const html = renderToStaticMarkup(
      <ChecklistCategoryFilter items={SAMPLE} value="all" onChange={NOOP} />,
    );
    expect(html).toContain("전체");
    expect(html).toContain("서류");
    expect(html).toContain("의류");
    expect(html).toContain("전자");
    expect(html).toContain("반입 금지");
    expect(html).toContain("신고 대상");
    expect(html).toContain("기타");
  });

  it("count 배지 표시 — 전체 4, documents 2, clothing 1", () => {
    const html = renderToStaticMarkup(
      <ChecklistCategoryFilter items={SAMPLE} value="all" onChange={NOOP} />,
    );
    // 전체 4 — "전체"와 "4"가 같은 button 내 (정확한 매칭은 문자열 단위)
    expect(html).toMatch(/전체[^<]*<[^>]+>4<\/span>/);
    expect(html).toMatch(/서류[^<]*<[^>]+>2<\/span>/);
    expect(html).toMatch(/의류[^<]*<[^>]+>1<\/span>/);
  });

  it("count=0 카테고리 chip disabled (forbidden)", () => {
    const html = renderToStaticMarkup(
      <ChecklistCategoryFilter items={SAMPLE} value="all" onChange={NOOP} />,
    );
    // forbidden chip을 텍스트 위치 기반으로 잘라낸 뒤 disabled 속성 확인
    const labelIdx = html.indexOf("반입 금지");
    expect(labelIdx).toBeGreaterThan(-1);
    const buttonOpen = html.lastIndexOf("<button", labelIdx);
    const buttonClose = html.indexOf("</button>", labelIdx);
    const chipHtml = html.slice(buttonOpen, buttonClose);
    expect(chipHtml).toContain("disabled");
  });

  it("활성 chip은 aria-checked=true (전체 선택 시)", () => {
    const html = renderToStaticMarkup(
      <ChecklistCategoryFilter items={SAMPLE} value="all" onChange={NOOP} />,
    );
    expect(html).toMatch(/aria-checked="true"[^>]*>\s*전체/);
  });

  it("활성 chip은 aria-checked=true (documents 선택 시)", () => {
    const html = renderToStaticMarkup(
      <ChecklistCategoryFilter
        items={SAMPLE}
        value="documents"
        onChange={NOOP}
      />,
    );
    expect(html).toMatch(/aria-checked="true"[^>]*>.*서류/);
  });

  it("radiogroup role + aria-label 보장", () => {
    const html = renderToStaticMarkup(
      <ChecklistCategoryFilter items={SAMPLE} value="all" onChange={NOOP} />,
    );
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-label="카테고리 필터"');
  });

  it("빈 items → 모든 카테고리 chip count=0 + disabled", () => {
    const html = renderToStaticMarkup(
      <ChecklistCategoryFilter items={[]} value="all" onChange={NOOP} />,
    );
    // 6 카테고리 chip 모두 disabled
    const disabledMatches = html.match(/disabled/g) ?? [];
    expect(disabledMatches.length).toBeGreaterThanOrEqual(6);
  });
});
