/**
 * Trip Dashboard ?focus=<key> 회귀 — 옵션 J (PR #288 후속).
 *
 * 외부 진입(예: /city/[slug]/payment) → /trips/[tripId]?focus=cost로 들어왔을 때
 * 해당 BentoSummary 카드만 ring 강조 + DOM id 부여 (FocusScroller가 scroll).
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BentoSummary } from "@/components/dashboard/BentoSummary";
import type { TripDashboardData } from "@/lib/services/trip-dashboard";

const DATA: TripDashboardData = {
  itinerary: { count: 12, verifiedCount: 12, allVerified: true },
  cost: { totalKrw: 1_240_000, perPersonKrw: 413_333 },
  checklist: { doneCount: 8, totalCount: 15, percent: 53 },
  vote: { totalCount: 2, pendingCount: 1 },
  party: { size: 3 },
};

describe("BentoSummary focusKey", () => {
  it("focusKey 없을 때 ring/data-focused 부재 (BC)", () => {
    const html = renderToStaticMarkup(<BentoSummary data={DATA} />);
    expect(html).not.toContain('data-focused="true"');
    expect(html).not.toContain("ring-purple");
    expect(html).not.toContain('id="focus-');
  });

  it("focusKey='cost' → BudgetCard에만 ring + id='focus-cost'", () => {
    const html = renderToStaticMarkup(
      <BentoSummary data={DATA} focusKey="cost" />,
    );
    // cost 카드에 ring + data-focused + id 모두 존재
    expect(html).toContain('id="focus-cost"');
    expect(html).toContain('data-focused="true"');
    expect(html).toContain("ring-purple");
    // 다른 카드는 id 없음
    expect(html).not.toContain('id="focus-itinerary"');
    expect(html).not.toContain('id="focus-checklist"');
    expect(html).not.toContain('id="focus-vote"');
  });

  it("focusKey='itinerary' → ItineraryCard에만 id", () => {
    const html = renderToStaticMarkup(
      <BentoSummary data={DATA} focusKey="itinerary" />,
    );
    expect(html).toContain('id="focus-itinerary"');
    expect(html).not.toContain('id="focus-cost"');
  });

  it("focusKey='checklist' → ChecklistCard에만 id", () => {
    const html = renderToStaticMarkup(
      <BentoSummary data={DATA} focusKey="checklist" />,
    );
    expect(html).toContain('id="focus-checklist"');
    expect(html).not.toContain('id="focus-vote"');
  });

  it("focusKey='vote' → VoteCard에만 id", () => {
    const html = renderToStaticMarkup(
      <BentoSummary data={DATA} focusKey="vote" />,
    );
    expect(html).toContain('id="focus-vote"');
    expect(html).not.toContain('id="focus-itinerary"');
  });
});
