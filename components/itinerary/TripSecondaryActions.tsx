/**
 * Trip Secondary Actions — 사이클 DD (사이클 CC 답습 추출).
 *
 * ItineraryView 하단의 M2/M6/M7 진입점 3 카드 묶음을 분리.
 * 순수 presentation — useState 0개, props drilling 허용 (BottomNav/ReplanTriggerCard 답습).
 *
 * 카드:
 *   - M2 (여행 중 모드): isOnTrip이 false일 때만 노출
 *   - M6 (체크리스트 + 비용 관리): /checklist/[tripId], /cost/[tripId]
 *   - M7 (공유 + 일행 투표): 공유는 콜백, 투표는 /vote/[tripId]
 */

"use client";

import Link from "next/link";

interface TripSecondaryActionsProps {
  tripId: string;
  isOnTrip: boolean;
  isPending: boolean;
  onEnterTravelMode: () => void;
  onShareClick: () => void;
  /** C4 — 현재 활성 day (0-based). 체크리스트/비용 링크에 ?day= 전달. */
  activeDay?: number;
}

export function TripSecondaryActions({
  tripId,
  isOnTrip,
  isPending,
  onEnterTravelMode,
  onShareClick,
  activeDay,
}: TripSecondaryActionsProps) {
  const dayParam = activeDay != null && activeDay > 0 ? `?day=${activeDay}` : "";
  return (
    <>
      {!isOnTrip && (
        <div className="bg-surface-card border border-divider rounded-md p-td-md">
          <p className="text-td-body font-semibold text-ink mb-td-xs">
            여행 중 모드 (M2)
          </p>
          <p className="text-td-meta text-ink-soft mb-td-sm">
            헤더가 보라 → 코랄로 바뀌고 FAB가 등장합니다 (ADR-014).
          </p>
          <button
            type="button"
            onClick={onEnterTravelMode}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 text-td-meta font-semibold text-accent-deep border border-accent/40 rounded-md px-3 py-2 transition-colors hover:bg-accent-soft disabled:opacity-60 disabled:cursor-wait"
          >
            {isPending ? "전환 중…" : "여행 중 모드로 전환 (데모) →"}
          </button>
        </div>
      )}

      {/* M6 진입점 (사이클 9, ADR-022) */}
      <div className="bg-surface-card border border-divider rounded-md p-td-md">
        <p className="text-td-body font-semibold text-ink mb-td-xs">
          여행 도구 (M6)
        </p>
        <p className="text-td-meta text-ink-soft mb-td-sm">
          D-Day 체크리스트와 비용 관리를 한 곳에서. 자동 환율 변환 포함.
        </p>
        <div className="grid grid-cols-2 gap-td-sm">
          <Link
            href={`/checklist/${tripId}${dayParam}`}
            className="flex items-center gap-1.5 text-td-meta font-semibold text-purple-deep border border-purple/40 rounded-md px-3 py-2 transition-colors hover:bg-purple-soft"
          >
            <span className="material-symbols-outlined text-td-icon" aria-hidden>
              checklist
            </span>
            체크리스트
          </Link>
          <Link
            href={`/cost/${tripId}${dayParam}`}
            className="flex items-center gap-1.5 text-td-meta font-semibold text-amber-deep border border-amber/40 rounded-md px-3 py-2 transition-colors hover:bg-amber-soft"
          >
            <span className="material-symbols-outlined text-td-icon" aria-hidden>
              account_balance_wallet
            </span>
            비용 관리
          </Link>
        </div>
      </div>

      {/* 여행 후 정리 (Wrap-up) 진입점 */}
      <div className="bg-surface-card border border-divider rounded-md p-td-md">
        <p className="text-td-body font-semibold text-ink mb-td-xs">
          여행 후 정리
        </p>
        <p className="text-td-meta text-ink-soft mb-td-sm">
          사진 앨범 · 추억 리캡 · 비용 통계를 한눈에.
        </p>
        <div className="grid grid-cols-3 gap-td-sm">
          <Link
            href={`/wrap-up/${tripId}`}
            className="flex items-center gap-1.5 text-td-meta font-semibold text-success-deep border border-success/40 rounded-md px-3 py-2 transition-colors hover:bg-success-soft"
          >
            <span className="material-symbols-outlined text-td-icon" aria-hidden>
              auto_awesome
            </span>
            요약
          </Link>
          <Link
            href={`/wrap-up/${tripId}/album`}
            className="flex items-center gap-1.5 text-td-meta font-semibold text-purple-deep border border-purple/40 rounded-md px-3 py-2 transition-colors hover:bg-purple-soft"
          >
            <span className="material-symbols-outlined text-td-icon" aria-hidden>
              photo_library
            </span>
            앨범
          </Link>
          <Link
            href={`/wrap-up/${tripId}/recap`}
            className="flex items-center gap-1.5 text-td-meta font-semibold text-amber-deep border border-amber/40 rounded-md px-3 py-2 transition-colors hover:bg-amber-soft"
          >
            <span className="material-symbols-outlined text-td-icon" aria-hidden>
              movie
            </span>
            리캡
          </Link>
        </div>
      </div>

      {/* M7 공유 + 일행 투표 진입점 (사이클 11a + E) */}
      <div className="bg-surface-card border border-divider rounded-md p-td-md">
        <p className="text-td-body font-semibold text-ink mb-td-xs">
          함께 보기 + 의사 결정 (M7 + C4)
        </p>
        <p className="text-td-meta text-ink-soft mb-td-sm">
          친구·가족에게 링크로 공유 · 일행과 옵션 투표.
        </p>
        <div className="grid grid-cols-2 gap-td-sm">
          <button
            type="button"
            onClick={onShareClick}
            className="flex items-center gap-1.5 text-td-meta font-semibold text-success-deep border border-success/40 rounded-md px-3 py-2 transition-colors hover:bg-success-soft"
          >
            <span className="material-symbols-outlined text-td-icon" aria-hidden>
              share
            </span>
            공유 링크
          </button>
          <Link
            href={`/vote/${tripId}`}
            className="flex items-center gap-1.5 text-td-meta font-semibold text-purple-deep border border-purple/40 rounded-md px-3 py-2 transition-colors hover:bg-purple-soft"
          >
            <span className="material-symbols-outlined text-td-icon" aria-hidden>
              how_to_vote
            </span>
            일행 투표
          </Link>
        </div>
      </div>
    </>
  );
}
