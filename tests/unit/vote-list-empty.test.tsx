/**
 * 사이클 (Session E) — VoteListView 빈 상태 EmptyState 마이그레이션 회귀.
 *
 * 답습: ChecklistEmptyState 단위 테스트 + EmptyState D variant.
 *
 * 검증:
 *  - votes=[] → EmptyState (icon=how_to_vote + 신규 카피)
 *  - 위 폼은 항상 렌더 (마이그 후에도 유지)
 *  - role=status + aria-live=polite (스크린리더 안내 보존)
 *  - 액션 버튼 미렌더 (위 폼이 1차 CTA — primary/secondary 모두 생략)
 *  - votes 1건 이상 → EmptyState 미렌더 + 투표 리스트 li 렌더 (회귀 보호)
 */

import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {}, push: () => {} }),
}));

import { VoteListView } from "@/components/vote/VoteListView";
import type { Trip, Vote } from "@/lib/types";

const TRIP: Trip = {
  id: "trip-test",
  destinationCode: "PQC",
  nights: 3,
  startDate: "2026-05-10",
  updatedAt: "2026-05-01T00:00:00.000Z",
} as unknown as Trip;

function makeVote(id: string, question: string): Vote {
  return {
    id,
    tripId: TRIP.id,
    question,
    options: [
      { label: "A", voters: [] },
      { label: "B", voters: [] },
    ],
    createdAt: "2026-05-01T00:00:00.000Z",
  } as unknown as Vote;
}

describe("Session E — VoteListView 빈 상태 EmptyState", () => {
  it("votes=[] → how_to_vote 아이콘 + 신규 카피", () => {
    const html = renderToStaticMarkup(
      <VoteListView trip={TRIP} initialVotes={[]} currentUserId={null} />,
    );
    expect(html).toContain("how_to_vote");
    expect(html).toContain("아직 진행 중인 투표가 없어요");
    expect(html).toContain("위 폼에서 첫 투표를 만들어");
  });

  it("votes=[] → role=status + aria-live=polite (EmptyState 보존)", () => {
    const html = renderToStaticMarkup(
      <VoteListView trip={TRIP} initialVotes={[]} currentUserId={null} />,
    );
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });

  it("votes=[] → 액션 버튼 미렌더 (위 폼이 1차 CTA)", () => {
    const html = renderToStaticMarkup(
      <VoteListView trip={TRIP} initialVotes={[]} currentUserId={null} />,
    );
    // EmptyState 영역에 primary/secondary 버튼이 없어야 함
    expect(html).not.toContain("py-td-sm px-td-md bg-purple text-white");
    expect(html).not.toContain("border-purple/40");
  });

  it("votes=[] → 위 '새 투표' 폼은 여전히 렌더 (CTA 보존)", () => {
    const html = renderToStaticMarkup(
      <VoteListView trip={TRIP} initialVotes={[]} currentUserId={null} />,
    );
    expect(html).toContain("새 투표");
    expect(html).toContain("질문 (예:");
    expect(html).toContain("투표 생성");
  });

  it("votes=[] → 기존 평면 카피 '아직 투표가 없어요.'는 사라져야 함", () => {
    const html = renderToStaticMarkup(
      <VoteListView trip={TRIP} initialVotes={[]} currentUserId={null} />,
    );
    // 마이그 회귀: 정확히 옛 카피만 매칭 (신규 카피와 구분)
    expect(html).not.toContain(">아직 투표가 없어요.<");
  });

  it("votes 1건 이상 → EmptyState 미렌더 + 투표 li 렌더", () => {
    const html = renderToStaticMarkup(
      <VoteListView
        trip={TRIP}
        initialVotes={[makeVote("v1", "둘째날 저녁은?")]}
        currentUserId={null}
      />,
    );
    expect(html).not.toContain("how_to_vote");
    expect(html).not.toContain("아직 진행 중인 투표가 없어요");
    expect(html).toContain("둘째날 저녁은?");
  });
});
