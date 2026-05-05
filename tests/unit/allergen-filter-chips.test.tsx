/**
 * AllergenFilterChips 단위 테스트 — Stitch 시안 (3d3e1a364719434f8a0e8d0459a689ae).
 *
 * renderToStaticMarkup 기반 — DOM 이벤트 검증 X, 시각/순서/aria 단언만.
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AllergenFilterChips,
  type AllergenChipItem,
} from "@/components/allergen/AllergenFilterChips";

const noop = () => {};

const ITEMS: AllergenChipItem[] = [
  { raw: "맛집", label: "맛집 위주" },
  { raw: "쇼핑", label: "쇼핑" },
  { raw: "새우 알레르기", label: "새우 알레르기", severity: "danger", icon: "block" },
  { raw: "비건", label: "비건", severity: "danger", icon: "eco" },
];

describe("AllergenFilterChips", () => {
  it("danger 칩이 neutral 보다 앞에 렌더 (시안 룰)", () => {
    const html = renderToStaticMarkup(
      <AllergenFilterChips items={ITEMS} selected={[]} onToggle={noop} />,
    );
    const dangerIdx = html.indexOf("새우 알레르기");
    const neutralIdx = html.indexOf("맛집 위주");
    expect(dangerIdx).toBeGreaterThan(-1);
    expect(neutralIdx).toBeGreaterThan(-1);
    expect(dangerIdx).toBeLessThan(neutralIdx);
  });

  it("danger 비활성 — border-danger-deep + text-danger-deep", () => {
    const html = renderToStaticMarkup(
      <AllergenFilterChips items={ITEMS} selected={[]} onToggle={noop} />,
    );
    expect(html).toContain("border-danger-deep");
    expect(html).toContain("text-danger-deep");
  });

  it("danger 활성 — bg-danger-soft 채움", () => {
    const html = renderToStaticMarkup(
      <AllergenFilterChips
        items={ITEMS}
        selected={["새우 알레르기"]}
        onToggle={noop}
      />,
    );
    expect(html).toContain("bg-danger-soft");
  });

  it("neutral 활성 — bg-purple + text-white", () => {
    const html = renderToStaticMarkup(
      <AllergenFilterChips items={ITEMS} selected={["맛집"]} onToggle={noop} />,
    );
    expect(html).toContain("bg-purple");
    expect(html).toContain("text-white");
  });

  it("danger + neutral 둘 다 있으면 vertical divider 노출", () => {
    const html = renderToStaticMarkup(
      <AllergenFilterChips items={ITEMS} selected={[]} onToggle={noop} />,
    );
    expect(html).toContain("w-px");
    expect(html).toContain("h-4");
  });

  it("danger만 있으면 divider 없음", () => {
    const dangerOnly = ITEMS.filter((i) => i.severity === "danger");
    const html = renderToStaticMarkup(
      <AllergenFilterChips items={dangerOnly} selected={[]} onToggle={noop} />,
    );
    expect(html).not.toContain("w-px");
  });

  it("aria-pressed 토글 — 활성 true / 비활성 false", () => {
    const html = renderToStaticMarkup(
      <AllergenFilterChips
        items={ITEMS}
        selected={["맛집"]}
        onToggle={noop}
      />,
    );
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-pressed="false"');
  });

  it("icon 지정 시 Material Symbol 노출", () => {
    const html = renderToStaticMarkup(
      <AllergenFilterChips items={ITEMS} selected={[]} onToggle={noop} />,
    );
    expect(html).toContain("block");
    expect(html).toContain("eco");
    expect(html).toContain("material-symbols-outlined");
  });

  it("active danger의 아이콘에 filled 클래스", () => {
    const html = renderToStaticMarkup(
      <AllergenFilterChips
        items={ITEMS}
        selected={["새우 알레르기"]}
        onToggle={noop}
      />,
    );
    expect(html).toContain("filled");
  });

  it("onAdd 제공 시 + 버튼 노출", () => {
    const html = renderToStaticMarkup(
      <AllergenFilterChips
        items={ITEMS}
        selected={[]}
        onToggle={noop}
        onAdd={noop}
      />,
    );
    expect(html).toContain('aria-label="필터 추가"');
    expect(html).toContain(">add<");
  });

  it("onAdd 미제공 시 + 버튼 없음", () => {
    const html = renderToStaticMarkup(
      <AllergenFilterChips items={ITEMS} selected={[]} onToggle={noop} />,
    );
    expect(html).not.toContain('aria-label="필터 추가"');
  });

  it("role=group + aria-label 기본값", () => {
    const html = renderToStaticMarkup(
      <AllergenFilterChips items={ITEMS} selected={[]} onToggle={noop} />,
    );
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="알레르기·관심사 필터"');
  });

  it("커스텀 ariaLabel 전달", () => {
    const html = renderToStaticMarkup(
      <AllergenFilterChips
        items={ITEMS}
        selected={[]}
        onToggle={noop}
        ariaLabel="음식 선호도"
      />,
    );
    expect(html).toContain('aria-label="음식 선호도"');
  });

  it("hide-scrollbar 클래스 (가로 스크롤)", () => {
    const html = renderToStaticMarkup(
      <AllergenFilterChips items={ITEMS} selected={[]} onToggle={noop} />,
    );
    expect(html).toContain("hide-scrollbar");
    expect(html).toContain("overflow-x-auto");
  });
});
