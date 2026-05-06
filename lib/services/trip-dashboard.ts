/**
 * Trip Dashboard 서비스 — Stitch #2 (사이클 (Session F+1)).
 *
 * 책임:
 *   - 단일 trip 단위 4 영역 데이터 aggregate (itinerary count + verified, cost sum,
 *     checklist progress, vote count + 미응답).
 *   - prisma null fallback: 모든 값 0/시드 default. 호출처는 빈 상태를 자연 처리.
 *   - 일행 수는 시드 default 3명 (M7 ShareLink 라이브 데이터 wiring은 후속).
 *
 * SSR 페이지에서 Promise.all로 병렬 호출.
 */

import "server-only";

import { listChecklistByTrip } from "@/lib/repositories/checklist.repository";
import { listCostByTrip } from "@/lib/repositories/cost.repository";
import { listVotesByTrip } from "@/lib/repositories/vote.repository";
import type { Vote } from "@/lib/types";

export interface TripDashboardData {
  itinerary: {
    count: number;
    /** 검증 통과 곳 수 (시드 + DB 전부 카운트) */
    verifiedCount: number;
    /** 모든 곳이 verified면 true */
    allVerified: boolean;
  };
  cost: {
    /** KRW 합계. 데이터 없으면 0. */
    totalKrw: number;
    /** 1인 분담액 (totalKrw / partySize). partySize 0이면 0. */
    perPersonKrw: number;
  };
  checklist: {
    /** done 항목 수 */
    doneCount: number;
    /** 전체 항목 수 */
    totalCount: number;
    /** 진행률 0~100 (정수). totalCount 0이면 0. */
    percent: number;
  };
  vote: {
    /** 활성/종료 모두 합한 총 투표 수 */
    totalCount: number;
    /** 활성 + 미응답 (currentUserId 미지정 시 활성 전부) */
    pendingCount: number;
  };
  party: {
    /** 본인 + 일행. 시드 default 3. */
    size: number;
  };
}

const DEFAULT_PARTY_SIZE = 3;

export interface BuildTripDashboardInput {
  /** 시드 ItineraryItem (시안 매핑 필수). 외부에서 listDemoItemsByDay 등으로 조달. */
  seedItems: { evidence?: { sources?: { lastVerified?: string }[] } }[];
  /** 본인 식별자 (없으면 미응답 카운트는 활성 투표 전부). */
  currentUserId?: string;
}

/**
 * SSR aggregator — 호출처는 Promise.all([listCost..., listChecklist..., listVotes...])
 * 결과를 buildTripDashboardData로 합성.
 *
 * 순수 함수 — DB query는 호출처가 미리 수행. 시드는 input으로 받음.
 */
export function buildTripDashboardData(
  input: BuildTripDashboardInput,
  costEntries: { amountKrw: number }[] | null,
  checklistItems: { done: boolean }[] | null,
  votes: Vote[] | null,
): TripDashboardData {
  const partySize = DEFAULT_PARTY_SIZE;

  // ── itinerary 검증 카운트 (시드 evidence.sources.lastVerified 존재 = verified) ──
  const itemCount = input.seedItems.length;
  const verifiedCount = input.seedItems.filter((it) =>
    (it.evidence?.sources ?? []).some((s) => !!s.lastVerified),
  ).length;

  // ── cost ──
  const totalKrw = (costEntries ?? []).reduce((sum, c) => sum + c.amountKrw, 0);
  const perPersonKrw = partySize > 0 ? Math.round(totalKrw / partySize) : 0;

  // ── checklist ──
  const totalCount = (checklistItems ?? []).length;
  const doneCount = (checklistItems ?? []).filter((c) => c.done).length;
  const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // ── vote ──
  const voteList = votes ?? [];
  const voteTotal = voteList.length;
  const pending = voteList.filter((v) => {
    if (v.status !== "open") return false;
    if (!input.currentUserId) return true;
    const voted = v.options.some((opt) =>
      (opt.voters ?? []).includes(input.currentUserId!),
    );
    return !voted;
  }).length;

  return {
    itinerary: {
      count: itemCount,
      verifiedCount,
      allVerified: itemCount > 0 && verifiedCount === itemCount,
    },
    cost: { totalKrw, perPersonKrw },
    checklist: { doneCount, totalCount, percent },
    vote: { totalCount: voteTotal, pendingCount: pending },
    party: { size: partySize },
  };
}

/**
 * 페이지에서 직접 호출하는 편의 함수 — DB query 4개 병렬 + 합성.
 */
export async function loadTripDashboardData(
  tripId: string,
  input: BuildTripDashboardInput,
): Promise<TripDashboardData> {
  const [costEntries, checklistItems, votes] = await Promise.all([
    listCostByTrip(tripId),
    listChecklistByTrip(tripId),
    listVotesByTrip(tripId),
  ]);
  return buildTripDashboardData(input, costEntries, checklistItems, votes);
}
