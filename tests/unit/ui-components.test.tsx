/**
 * UI 컴포넌트 단위 테스트 — Batch 11 추가.
 *
 * 3 컴포넌트:
 *  - CategoryBadge: 카테고리별 라벨+톤 매핑
 *  - FilterChip: active/variant 스타일 조합
 *  - ImpactDisplay: impacts 리스트 렌더링
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CategoryBadge } from "@/components/itinerary/CategoryBadge";
import { FilterChip } from "@/components/ui/FilterChip";
import { ImpactDisplay } from "@/components/itinerary/ImpactDisplay";

/* ────────── CategoryBadge ────────── */

describe("CategoryBadge", () => {
  it("food → '맛집' 텍스트", () => {
    const html = renderToStaticMarkup(<CategoryBadge category="food" />);
    expect(html).toContain("맛집");
  });

  it("spot → '관광' 텍스트", () => {
    const html = renderToStaticMarkup(<CategoryBadge category="spot" />);
    expect(html).toContain("관광");
  });

  it("shopping → '쇼핑' 텍스트", () => {
    const html = renderToStaticMarkup(<CategoryBadge category="shopping" />);
    expect(html).toContain("쇼핑");
  });

  it("rest → '휴식' 텍스트", () => {
    const html = renderToStaticMarkup(<CategoryBadge category="rest" />);
    expect(html).toContain("휴식");
  });
});

/* ────────── FilterChip ────────── */

describe("FilterChip", () => {
  it("기본 (inactive) → border-divider 스타일", () => {
    const html = renderToStaticMarkup(<FilterChip>테스트</FilterChip>);
    expect(html).toContain("테스트");
    expect(html).toContain("border-divider");
  });

  it("active → bg-purple 스타일", () => {
    const html = renderToStaticMarkup(<FilterChip active>선택됨</FilterChip>);
    expect(html).toContain("bg-purple");
    expect(html).toContain("선택됨");
  });

  it("active + danger → bg-danger-soft 스타일", () => {
    const html = renderToStaticMarkup(
      <FilterChip active variant="danger">위험</FilterChip>,
    );
    expect(html).toContain("bg-danger-soft");
  });

  it("inactive + danger → border-danger", () => {
    const html = renderToStaticMarkup(
      <FilterChip variant="danger">알레르기</FilterChip>,
    );
    expect(html).toContain("border-danger");
    expect(html).not.toContain("bg-danger-soft");
  });

  it("button 엘리먼트 렌더링", () => {
    const html = renderToStaticMarkup(<FilterChip>칩</FilterChip>);
    expect(html).toContain("<button");
  });
});

/* ────────── ImpactDisplay ────────── */

describe("ImpactDisplay", () => {
  it("빈 impacts → null (렌더 없음)", () => {
    const html = renderToStaticMarkup(<ImpactDisplay impacts={[]} />);
    expect(html).toBe("");
  });

  it("positive 톤 → success 클래스", () => {
    const html = renderToStaticMarkup(
      <ImpactDisplay impacts={[{ key: "시간", value: "-30분", tone: "positive" }]} />,
    );
    expect(html).toContain("시간");
    expect(html).toContain("-30분");
    expect(html).toContain("bg-success");
    expect(html).toContain("text-success-deep");
  });

  it("negative 톤 → amber 클래스", () => {
    const html = renderToStaticMarkup(
      <ImpactDisplay impacts={[{ key: "비용", value: "+₩5,000", tone: "negative" }]} />,
    );
    expect(html).toContain("bg-amber");
    expect(html).toContain("text-amber-deep");
  });

  it("neutral 톤 → ink-mute 클래스", () => {
    const html = renderToStaticMarkup(
      <ImpactDisplay impacts={[{ key: "거리", value: "동일", tone: "neutral" }]} />,
    );
    expect(html).toContain("bg-ink-mute");
  });

  it("여러 impacts 렌더링", () => {
    const html = renderToStaticMarkup(
      <ImpactDisplay
        impacts={[
          { key: "시간", value: "-15분", tone: "positive" },
          { key: "비용", value: "+₩3,000", tone: "negative" },
          { key: "거리", value: "1.2km", tone: "neutral" },
        ]}
      />,
    );
    expect(html).toContain("시간");
    expect(html).toContain("비용");
    expect(html).toContain("거리");
  });

  it("Stitch 시안 매칭 — 행 사이 border-b + dot w-2 + tabular-nums", () => {
    const html = renderToStaticMarkup(
      <ImpactDisplay
        impacts={[
          { key: "A", value: "1", tone: "positive" },
          { key: "B", value: "2", tone: "negative" },
        ]}
      />,
    );
    expect(html).toContain("border-b");
    expect(html).toContain("last:border-b-0");
    expect(html).toContain("w-2 h-2");
    expect(html).toContain("tabular-nums");
  });
});
