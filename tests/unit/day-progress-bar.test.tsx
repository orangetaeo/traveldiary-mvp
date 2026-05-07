/**
 * DayProgressBar 단위 테스트.
 * A2 (Session X cap 2, 2026-05-07) — 디자인 갭 #7 진행률 바.
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DayProgressBar } from "@/components/itinerary/DayProgressBar";

describe("DayProgressBar", () => {
  const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("dayItems 0건 → null (마크업 미생성)", () => {
    const html = renderToStaticMarkup(
      <DayProgressBar dayItems={[]} checkins={{}} isOnTrip={true} />,
    );
    expect(html).toBe("");
  });

  it("0/3 → 진행 0% + '오늘 진행' (in-travel)", () => {
    const html = renderToStaticMarkup(
      <DayProgressBar dayItems={items} checkins={{}} isOnTrip={true} />,
    );
    expect(html).toContain("오늘 진행");
    expect(html).toContain("0/3");
    expect(html).toContain('aria-label="오늘 진행 0/3 (0%)"');
    expect(html).toContain("width:0%");
  });

  it("2/3 → 67% + mode-primary 색", () => {
    const html = renderToStaticMarkup(
      <DayProgressBar
        dayItems={items}
        checkins={{ a: "2026-05-10T10:00:00Z", c: "2026-05-10T15:00:00Z" }}
        isOnTrip={true}
      />,
    );
    expect(html).toContain("2/3");
    expect(html).toContain("67%");
    expect(html).toContain("bg-mode-primary");
  });

  it("3/3 → ✨ + success 색 (모두 완료)", () => {
    const html = renderToStaticMarkup(
      <DayProgressBar
        dayItems={items}
        checkins={{ a: "x", b: "y", c: "z" }}
        isOnTrip={true}
      />,
    );
    expect(html).toContain("3/3");
    expect(html).toContain("100%");
    expect(html).toContain("✨");
    expect(html).toContain("bg-success");
  });

  it("isOnTrip=false → '체크인 진행 (데모)' 라벨", () => {
    const html = renderToStaticMarkup(
      <DayProgressBar dayItems={items} checkins={{}} isOnTrip={false} />,
    );
    expect(html).toContain("체크인 진행 (데모)");
    expect(html).not.toContain("오늘 진행");
  });

  it("ARIA — role=status + aria-live=polite", () => {
    const html = renderToStaticMarkup(
      <DayProgressBar dayItems={items} checkins={{}} isOnTrip={true} />,
    );
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });
});
