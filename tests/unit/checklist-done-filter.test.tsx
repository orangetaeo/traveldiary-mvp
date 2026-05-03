/**
 * 사이클 QQ — applyChecklistFilters done 키 + ChecklistDoneFilter 단위 테스트.
 *
 * 검증:
 *  - applyChecklistFilters: done="all"|"todo"|"done" 분기 + 미지정 시 pass-through
 *  - category × done 조합 AND
 *  - search × done 조합 AND
 *  - ChecklistDoneFilter rendering: 3 chip + count 배지 + aria-checked string
 *  - count=0 chip은 "all" 제외하고 disabled
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { applyChecklistFilters } from "@/components/checklist/ChecklistCategoryFilter";
import { ChecklistDoneFilter } from "@/components/checklist/ChecklistDoneFilter";
import type { ChecklistItem } from "@/lib/types";

const NOOP = () => {};

function makeItem(
  id: string,
  category: ChecklistItem["category"],
  text: string,
  done = false,
  cityNote?: string,
): ChecklistItem {
  return {
    id,
    tripId: "trip-1",
    category,
    text,
    dDayBucket: "D-7",
    done,
    sortOrder: 0,
    cityNote,
    createdAt: "2026-05-03T00:00:00Z",
    updatedAt: "2026-05-03T00:00:00Z",
  };
}

const SAMPLE: ChecklistItem[] = [
  makeItem("a", "documents", "여권", true),
  makeItem("b", "documents", "비자 사본", false),
  makeItem("c", "clothing", "수영복", true, "푸꾸옥 해변"),
  makeItem("d", "electronics", "충전기", false),
  makeItem("e", "custom", "자유 메모", false),
];

describe("사이클 QQ — applyChecklistFilters done 키", () => {
  it("done 미지정 → 전체 (옵션 미지정 = pass-through)", () => {
    const out = applyChecklistFilters(SAMPLE, {
      category: "all",
      search: "",
    });
    expect(out).toHaveLength(5);
  });

  it("done='all' → 전체", () => {
    const out = applyChecklistFilters(SAMPLE, {
      category: "all",
      search: "",
      done: "all",
    });
    expect(out).toHaveLength(5);
  });

  it("done='todo' → 미완료 3건", () => {
    const out = applyChecklistFilters(SAMPLE, {
      category: "all",
      search: "",
      done: "todo",
    });
    expect(out).toHaveLength(3);
    expect(out.every((it) => !it.done)).toBe(true);
    expect(out.map((it) => it.id).sort()).toEqual(["b", "d", "e"]);
  });

  it("done='done' → 완료 2건", () => {
    const out = applyChecklistFilters(SAMPLE, {
      category: "all",
      search: "",
      done: "done",
    });
    expect(out).toHaveLength(2);
    expect(out.every((it) => it.done)).toBe(true);
    expect(out.map((it) => it.id).sort()).toEqual(["a", "c"]);
  });

  it("category=documents + done='todo' → 1건 (조합 AND)", () => {
    const out = applyChecklistFilters(SAMPLE, {
      category: "documents",
      search: "",
      done: "todo",
    });
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("b");
  });

  it("category=documents + done='done' → 1건 (조합 AND)", () => {
    const out = applyChecklistFilters(SAMPLE, {
      category: "documents",
      search: "",
      done: "done",
    });
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("a");
  });

  it("done='done' + search='수영' → 1건 (3중 조합)", () => {
    const out = applyChecklistFilters(SAMPLE, {
      category: "all",
      search: "수영",
      done: "done",
    });
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("c");
  });

  it("done='todo' + search='여권' → 0건 (여권은 완료라 매칭 X)", () => {
    const out = applyChecklistFilters(SAMPLE, {
      category: "all",
      search: "여권",
      done: "todo",
    });
    expect(out).toHaveLength(0);
  });

  it("빈 입력 → 빈 출력 (done 어떻든)", () => {
    expect(
      applyChecklistFilters([], { category: "all", search: "", done: "todo" }),
    ).toHaveLength(0);
    expect(
      applyChecklistFilters([], { category: "all", search: "", done: "done" }),
    ).toHaveLength(0);
  });
});

describe("사이클 QQ — ChecklistDoneFilter rendering", () => {
  it("3 chip 렌더링 (전체 / 미완료 / 완료)", () => {
    const html = renderToStaticMarkup(
      <ChecklistDoneFilter items={SAMPLE} value="all" onChange={NOOP} />,
    );
    expect(html).toContain("전체");
    expect(html).toContain("미완료");
    expect(html).toContain("완료");
  });

  it("count 배지 표시 — 전체 5, 미완료 3, 완료 2", () => {
    const html = renderToStaticMarkup(
      <ChecklistDoneFilter items={SAMPLE} value="all" onChange={NOOP} />,
    );
    expect(html).toMatch(/전체[^<]*<[^>]+>5<\/span>/);
    expect(html).toMatch(/미완료[^<]*<[^>]+>3<\/span>/);
    expect(html).toMatch(/완료[^<]*<[^>]+>2<\/span>/);
  });

  it("활성 chip은 aria-checked='true' (전체 선택 시)", () => {
    const html = renderToStaticMarkup(
      <ChecklistDoneFilter items={SAMPLE} value="all" onChange={NOOP} />,
    );
    expect(html).toMatch(/aria-checked="true"[^>]*>\s*전체/);
  });

  it("활성 chip은 aria-checked='true' (todo 선택 시)", () => {
    const html = renderToStaticMarkup(
      <ChecklistDoneFilter items={SAMPLE} value="todo" onChange={NOOP} />,
    );
    expect(html).toMatch(/aria-checked="true"[^>]*>\s*미완료/);
  });

  it("활성 chip은 aria-checked='true' (done 선택 시)", () => {
    const html = renderToStaticMarkup(
      <ChecklistDoneFilter items={SAMPLE} value="done" onChange={NOOP} />,
    );
    expect(html).toMatch(/aria-checked="true"[^>]*>\s*완료/);
  });

  it("radiogroup role + aria-label 보장", () => {
    const html = renderToStaticMarkup(
      <ChecklistDoneFilter items={SAMPLE} value="all" onChange={NOOP} />,
    );
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-label="완료 상태 필터"');
  });

  it("전체 done(완료 0) 일 때 done chip disabled", () => {
    const allTodo = SAMPLE.map((it) => ({ ...it, done: false }));
    const html = renderToStaticMarkup(
      <ChecklistDoneFilter items={allTodo} value="all" onChange={NOOP} />,
    );
    // "완료" chip 정확 매칭 (lastIndexOf — "미완료"의 substring 회피)
    const labelIdx = html.lastIndexOf("완료");
    expect(labelIdx).toBeGreaterThan(-1);
    const buttonOpen = html.lastIndexOf("<button", labelIdx);
    const buttonClose = html.indexOf("</button>", labelIdx);
    const chipHtml = html.slice(buttonOpen, buttonClose);
    // disabled HTML 속성: React 18 renderToStaticMarkup가 boolean attr를 disabled=""로 직렬화
    expect(chipHtml).toMatch(/\sdisabled(\s|=|>)/);
  });

  it("전체(items=0) → 전체 chip은 disabled 아님(전체는 항상 클릭 가능)", () => {
    const html = renderToStaticMarkup(
      <ChecklistDoneFilter items={[]} value="all" onChange={NOOP} />,
    );
    // "전체" chip은 isAll=true라 disabled X — Tailwind disabled: 유틸리티 className은 무시
    const labelIdx = html.indexOf("전체");
    const buttonOpen = html.lastIndexOf("<button", labelIdx);
    const buttonClose = html.indexOf("</button>", labelIdx);
    const chipHtml = html.slice(buttonOpen, buttonClose);
    expect(chipHtml).not.toMatch(/\sdisabled(\s|=|>)/);
  });
});
