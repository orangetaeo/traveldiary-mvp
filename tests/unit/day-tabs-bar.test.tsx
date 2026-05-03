/**
 * 사이클 JJ — DayTabsBar 단위 테스트.
 *
 * 답습: 사이클 O/CC/DD/HH (component 추출 + props 검증).
 *
 * 검증:
 *  - Day 1~N 버튼 렌더 (dayCount=4 → Day 1·2·3·4)
 *  - active 버튼은 aria-current="page"
 *  - 비활성 버튼은 aria-current 없음
 *  - 추가 버튼 aria-label="일정 추가"
 *  - dayCount=1 (당일치기) edge case
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DayTabsBar } from "@/components/itinerary/DayTabsBar";

const NOOP = () => {};

describe("사이클 JJ — DayTabsBar", () => {
  it("dayCount=4 → Day 1·2·3·4 노출", () => {
    const html = renderToStaticMarkup(
      <DayTabsBar
        dayCount={4}
        activeDay={0}
        onActiveDayChange={NOOP}
        onAddOpen={NOOP}
      />,
    );
    expect(html).toContain("Day 1");
    expect(html).toContain("Day 2");
    expect(html).toContain("Day 3");
    expect(html).toContain("Day 4");
    expect(html).not.toContain("Day 5");
  });

  it("activeDay=2 → 해당 버튼만 aria-current=page", () => {
    const html = renderToStaticMarkup(
      <DayTabsBar
        dayCount={4}
        activeDay={2}
        onActiveDayChange={NOOP}
        onAddOpen={NOOP}
      />,
    );
    // aria-current는 active 버튼에만 1회 등장
    const occurrences = html.match(/aria-current="page"/g)?.length ?? 0;
    expect(occurrences).toBe(1);
  });

  it("active 버튼은 mode-primary 스타일 + 비활성은 surface-card", () => {
    const html = renderToStaticMarkup(
      <DayTabsBar
        dayCount={2}
        activeDay={0}
        onActiveDayChange={NOOP}
        onAddOpen={NOOP}
      />,
    );
    expect(html).toContain("bg-mode-primary text-white");
    expect(html).toContain("bg-surface-card");
  });

  it("자유 추가 버튼 aria-label='일정 추가'", () => {
    const html = renderToStaticMarkup(
      <DayTabsBar
        dayCount={1}
        activeDay={0}
        onActiveDayChange={NOOP}
        onAddOpen={NOOP}
      />,
    );
    expect(html).toContain('aria-label="일정 추가"');
    expect(html).toContain("material-symbols-outlined");
  });

  it("dayCount=1 (당일치기) → Day 1만", () => {
    const html = renderToStaticMarkup(
      <DayTabsBar
        dayCount={1}
        activeDay={0}
        onActiveDayChange={NOOP}
        onAddOpen={NOOP}
      />,
    );
    expect(html).toContain("Day 1");
    expect(html).not.toContain("Day 2");
  });

  it("nav 라벨 + flex 컨테이너 구조", () => {
    const html = renderToStaticMarkup(
      <DayTabsBar
        dayCount={3}
        activeDay={1}
        onActiveDayChange={NOOP}
        onAddOpen={NOOP}
      />,
    );
    expect(html).toContain('aria-label="여행 일자"');
    expect(html).toContain("hide-scrollbar");
  });
});
