/**
 * DayTabsBar 단위 테스트.
 *
 * 디자인 갭 #1 (사이클 X): 헤더 옆 + FAB 제거 (Day 추가 오해 방지). 추가 진입점은
 * `AddItemDashedCard`로 분리. 이 테스트는 + 버튼이 더 이상 노출되지 않음을 보장.
 *
 * 검증:
 *  - Day 1~N 버튼 렌더 (dayCount=4 → Day 1·2·3·4)
 *  - active 버튼은 aria-current="page"
 *  - 비활성 버튼은 aria-current 없음
 *  - + FAB 미존재 (회귀 가드)
 *  - dayCount=1 (당일치기) edge case
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DayTabsBar } from "@/components/itinerary/DayTabsBar";

const NOOP = () => {};

describe("DayTabsBar", () => {
  it("dayCount=4 → Day 1·2·3·4 노출", () => {
    const html = renderToStaticMarkup(
      <DayTabsBar
        dayCount={4}
        activeDay={0}
        onActiveDayChange={NOOP}
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
      />,
    );
    const occurrences = html.match(/aria-current="page"/g)?.length ?? 0;
    expect(occurrences).toBe(1);
  });

  it("active 버튼은 mode-primary 스타일 + 비활성은 surface-card", () => {
    const html = renderToStaticMarkup(
      <DayTabsBar
        dayCount={2}
        activeDay={0}
        onActiveDayChange={NOOP}
      />,
    );
    expect(html).toContain("bg-mode-primary text-white");
    expect(html).toContain("bg-surface-card");
  });

  it("디자인 갭 #1 회귀 가드: + FAB(aria-label='일정 추가') 미존재", () => {
    const html = renderToStaticMarkup(
      <DayTabsBar
        dayCount={1}
        activeDay={0}
        onActiveDayChange={NOOP}
      />,
    );
    // + FAB는 AddItemDashedCard로 이전됨. DayTabsBar에는 없어야 함.
    expect(html).not.toContain('aria-label="일정 추가"');
    // material-symbols-outlined도 없어야 함 (Day 탭은 텍스트만)
    expect(html).not.toContain("material-symbols-outlined");
  });

  it("dayCount=1 (당일치기) → Day 1만", () => {
    const html = renderToStaticMarkup(
      <DayTabsBar
        dayCount={1}
        activeDay={0}
        onActiveDayChange={NOOP}
      />,
    );
    expect(html).toContain("Day 1");
    expect(html).not.toContain("Day 2");
  });

  it("nav 라벨 + 스크롤 컨테이너 구조", () => {
    const html = renderToStaticMarkup(
      <DayTabsBar
        dayCount={3}
        activeDay={1}
        onActiveDayChange={NOOP}
      />,
    );
    expect(html).toContain('aria-label="여행 일자"');
    expect(html).toContain("hide-scrollbar");
  });
});
