/**
 * trip-dashboard.ts buildTripDashboardData 단위 테스트.
 *
 * 검증:
 *   - 시드 + DB null → itinerary 카운트 + verified 분류, 다른 영역 0
 *   - cost: 합계 + 1인 분담 round
 *   - checklist: 진행률 0/100 경계 + Math.round
 *   - vote: active 미응답 카운트, 종료된 vote 미포함
 *   - currentUserId 있으면 voted item 제외
 */

import { describe, it, expect } from "vitest";
import { buildTripDashboardData } from "@/lib/services/trip-dashboard";
import type { Vote } from "@/lib/types";

const VERIFIED_ITEM = {
  evidence: { sources: [{ lastVerified: "2026-04-29T00:00:00.000Z" }] },
};
const UNVERIFIED_ITEM = { evidence: { sources: [{}] } };
const NO_EVIDENCE_ITEM = {};

function makeVote(overrides: Partial<Vote>): Vote {
  return {
    id: overrides.id ?? "v1",
    tripId: "trip-test",
    question: overrides.question ?? "Q?",
    options: overrides.options ?? [
      { label: "A", voters: [] },
      { label: "B", voters: [] },
    ],
    status: overrides.status ?? "open",
    createdAt: "2026-05-01T00:00:00.000Z",
    ...overrides,
  } as Vote;
}

describe("buildTripDashboardData", () => {
  it("시드 + DB null → itinerary 분류, 다른 영역 0", () => {
    const data = buildTripDashboardData(
      { seedItems: [VERIFIED_ITEM, VERIFIED_ITEM, UNVERIFIED_ITEM] },
      null,
      null,
      null,
    );
    expect(data.itinerary.count).toBe(3);
    expect(data.itinerary.verifiedCount).toBe(2);
    expect(data.itinerary.allVerified).toBe(false);
    expect(data.cost.totalKrw).toBe(0);
    expect(data.cost.perPersonKrw).toBe(0);
    expect(data.checklist.totalCount).toBe(0);
    expect(data.checklist.percent).toBe(0);
    expect(data.vote.totalCount).toBe(0);
    expect(data.party.size).toBe(3);
  });

  it("모든 시드 verified → allVerified=true", () => {
    const data = buildTripDashboardData(
      { seedItems: [VERIFIED_ITEM, VERIFIED_ITEM] },
      null,
      null,
      null,
    );
    expect(data.itinerary.allVerified).toBe(true);
  });

  it("itinerary 0개 → allVerified=false (count 0 가드)", () => {
    const data = buildTripDashboardData({ seedItems: [] }, null, null, null);
    expect(data.itinerary.count).toBe(0);
    expect(data.itinerary.allVerified).toBe(false);
  });

  it("evidence 없는 시드 → unverified 처리", () => {
    const data = buildTripDashboardData(
      { seedItems: [NO_EVIDENCE_ITEM, NO_EVIDENCE_ITEM] },
      null,
      null,
      null,
    );
    expect(data.itinerary.verifiedCount).toBe(0);
  });

  it("cost: 합계 + 1인 분담 round (party=3 default)", () => {
    const data = buildTripDashboardData(
      { seedItems: [] },
      [{ amountKrw: 1_240_000 }, { amountKrw: 0 }],
      null,
      null,
    );
    expect(data.cost.totalKrw).toBe(1_240_000);
    expect(data.cost.perPersonKrw).toBe(413_333); // round(1240000/3)
  });

  it("checklist: 53% (8/15) round 정확", () => {
    const items = [
      ...Array(8).fill({ done: true }),
      ...Array(7).fill({ done: false }),
    ];
    const data = buildTripDashboardData(
      { seedItems: [] },
      null,
      items,
      null,
    );
    expect(data.checklist.doneCount).toBe(8);
    expect(data.checklist.totalCount).toBe(15);
    expect(data.checklist.percent).toBe(53);
  });

  it("checklist: 빈 배열 → percent 0 (분모 0 가드)", () => {
    const data = buildTripDashboardData({ seedItems: [] }, null, [], null);
    expect(data.checklist.percent).toBe(0);
  });

  it("vote: active 2건 + closed 1건 → totalCount 3, currentUserId 미지정 시 미응답 = 활성 전부", () => {
    const votes = [
      makeVote({ id: "v1", status: "open" }),
      makeVote({ id: "v2", status: "open" }),
      makeVote({ id: "v3", status: "closed" }),
    ];
    const data = buildTripDashboardData(
      { seedItems: [] },
      null,
      null,
      votes,
    );
    expect(data.vote.totalCount).toBe(3);
    expect(data.vote.pendingCount).toBe(2); // closed 미포함, currentUserId 없음 → 활성 모두 미응답
  });

  it("vote: currentUserId voted 항목 제외", () => {
    const votes = [
      makeVote({
        id: "v1",
        status: "open",
        options: [
          { label: "A", voters: ["user-1"] },
          { label: "B", voters: [] },
        ],
      }),
      makeVote({ id: "v2", status: "open" }),
    ];
    const data = buildTripDashboardData(
      { seedItems: [], currentUserId: "user-1" },
      null,
      null,
      votes,
    );
    expect(data.vote.totalCount).toBe(2);
    expect(data.vote.pendingCount).toBe(1); // v1 voted, v2 미응답
  });
});
