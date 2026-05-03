/**
 * 사이클 DD — TripSecondaryActions 단위 테스트.
 *
 * BottomNav(O) / ReplanTriggerCard(CC) 답습.
 *
 * 검증:
 *  - isOnTrip=true → M2 카드 미노출
 *  - M6 링크 href 정확 (/checklist/[id], /cost/[id])
 *  - M7 공유 버튼 + Vote 링크 노출
 *  - isPending=true → "전환 중…" + disabled
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TripSecondaryActions } from "@/components/itinerary/TripSecondaryActions";

const NOOP = () => {};

describe("사이클 DD — TripSecondaryActions", () => {
  it("isOnTrip=false → M2 카드 노출", () => {
    const html = renderToStaticMarkup(
      <TripSecondaryActions
        tripId="t1"
        isOnTrip={false}
        isPending={false}
        onEnterTravelMode={NOOP}
        onShareClick={NOOP}
      />,
    );
    expect(html).toContain("여행 중 모드 (M2)");
    expect(html).toContain("여행 중 모드로 전환 (데모) →");
  });

  it("isOnTrip=true → M2 카드 미노출", () => {
    const html = renderToStaticMarkup(
      <TripSecondaryActions
        tripId="t1"
        isOnTrip={true}
        isPending={false}
        onEnterTravelMode={NOOP}
        onShareClick={NOOP}
      />,
    );
    expect(html).not.toContain("여행 중 모드 (M2)");
    expect(html).toContain("여행 도구 (M6)");
    expect(html).toContain("함께 보기");
  });

  it("isPending=true → '전환 중…' + disabled", () => {
    const html = renderToStaticMarkup(
      <TripSecondaryActions
        tripId="t1"
        isOnTrip={false}
        isPending={true}
        onEnterTravelMode={NOOP}
        onShareClick={NOOP}
      />,
    );
    expect(html).toContain("전환 중…");
    expect(html).toContain("disabled");
  });

  it("M6 링크 — /checklist/[id], /cost/[id] 정확", () => {
    const html = renderToStaticMarkup(
      <TripSecondaryActions
        tripId="abc-trip"
        isOnTrip={false}
        isPending={false}
        onEnterTravelMode={NOOP}
        onShareClick={NOOP}
      />,
    );
    expect(html).toContain('href="/checklist/abc-trip"');
    expect(html).toContain('href="/cost/abc-trip"');
  });

  it("M7 — 공유 버튼 + /vote/[id] 링크", () => {
    const html = renderToStaticMarkup(
      <TripSecondaryActions
        tripId="vote-trip"
        isOnTrip={true}
        isPending={false}
        onEnterTravelMode={NOOP}
        onShareClick={NOOP}
      />,
    );
    expect(html).toContain("공유 링크");
    expect(html).toContain("일행 투표");
    expect(html).toContain('href="/vote/vote-trip"');
  });
});
