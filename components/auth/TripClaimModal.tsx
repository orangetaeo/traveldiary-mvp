"use client";

/**
 * 내 여행 인계 모달 (Post-Signup) — Stitch screen 5d88d7026762
 *
 * 로그인 후, 시스템 소유(system-owner) 익명 여행이 존재하면
 * "내 계정으로 가져오기"를 제안하는 모달.
 *
 * Props:
 *   trips — 인계 가능한 Trip[] (서버에서 조회 후 전달)
 *   onClose — 모달 닫기
 */

import { useState, useTransition } from "react";

export interface ClaimableTrip {
  id: string;
  destination: string;
  nights: number;
  startDate: string;
  /** 종료 날짜 (날짜 범위 표시). 없으면 startDate만 표시. */
  endDate?: string;
  itemCount: number;
  companions: number;
  /** 여행지 대표 이미지. 없으면 placeholder. */
  imageUrl?: string;
}

interface TripClaimModalProps {
  trips: ClaimableTrip[];
  userName: string;
  onClose: () => void;
  onClaim: (tripIds: string[]) => Promise<void>;
}

/** 날짜 표시: "2026.05.20~24" 형식 */
function formatDateRange(start: string, end?: string): string {
  const s = start.replace(/-/g, ".");
  if (!end) return s;
  const e = end.replace(/-/g, ".");
  // 같은 연/월이면 일자만 표시
  if (s.slice(0, 8) === e.slice(0, 8)) return `${s}~${e.slice(8)}`;
  if (s.slice(0, 5) === e.slice(0, 5)) return `${s}~${e.slice(5)}`;
  return `${s}~${e}`;
}

/** 동행 표시: 1 → "혼자", 2+ → "N명" */
function companionLabel(n: number): string {
  return n <= 1 ? "혼자" : `${n}명`;
}

export function TripClaimModal({
  trips,
  userName,
  onClose,
  onClaim,
}: TripClaimModalProps) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(trips.map((t) => t.id)),
  );
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleClaim() {
    if (selected.size === 0) return;
    startTransition(async () => {
      await onClaim(Array.from(selected));
      onClose();
    });
  }

  if (trips.length === 0) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="내 여행 인계" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* sheet */}
      <div className="relative w-full max-w-md bg-surface-card rounded-t-xl sm:rounded-xl shadow-xl max-h-[85vh] flex flex-col animate-slide-up">
        {/* header */}
        <div className="px-td-md pt-td-lg pb-td-sm">
          <div className="flex items-start justify-between mb-td-sm">
            <div className="w-10 h-10 rounded-full bg-purple-soft flex items-center justify-center">
              <span className="material-symbols-outlined text-purple text-td-icon-lg">
                check_circle
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-soft transition-colors"
            >
              <span className="material-symbols-outlined text-ink-mute text-[20px]">close</span>
            </button>
          </div>
          <h2 className="text-td-title text-ink font-bold mb-td-xxs">
            환영합니다, {userName}님!
          </h2>
          <p className="text-td-body text-ink-soft">
            지금까지 이 기기에서 만든 여행 {trips.length}개를 계정으로 가져올까요?
          </p>
        </div>

        {/* info banner */}
        <div className="mx-td-md mb-td-sm rounded-md bg-surface-soft border border-divider px-td-sm py-td-xs">
          <div className="flex items-start gap-td-xs">
            <span className="material-symbols-outlined text-purple text-[18px] shrink-0 mt-0.5">info</span>
            <p className="text-td-caption text-ink-soft leading-relaxed">
              익명 모드 여행은 이 기기에서만 보였어요. 계정으로 가져오면 다른 기기에서도 동기화돼요.
            </p>
          </div>
        </div>

        {/* trip list */}
        <div className="flex-grow overflow-y-auto px-td-md py-td-xs space-y-td-sm">
          {trips.map((trip) => {
            const checked = selected.has(trip.id);
            return (
              <button
                key={trip.id}
                type="button"
                onClick={() => toggle(trip.id)}
                className={`w-full flex items-start gap-td-sm p-td-sm rounded-md border text-left transition-all ${
                  checked
                    ? "border-purple bg-purple-soft/30"
                    : "border-divider bg-surface-card hover:border-ink-mute"
                }`}
              >
                {/* checkbox */}
                <div
                  className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                    checked ? "bg-purple text-white" : "border-2 border-divider"
                  }`}
                >
                  {checked && (
                    <span className="material-symbols-outlined text-[14px]">
                      check
                    </span>
                  )}
                </div>

                {/* thumbnail */}
                <div className="w-16 h-16 rounded-md overflow-hidden bg-surface-soft shrink-0">
                  {trip.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={trip.imageUrl}
                      alt={trip.destination}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-ink-mute text-[24px]" aria-hidden>
                        flight_takeoff
                      </span>
                    </div>
                  )}
                </div>

                {/* trip info */}
                <div className="min-w-0 flex-grow">
                  <div className="flex items-center justify-between gap-td-xs">
                    <p className="text-td-body font-bold text-ink truncate">
                      {trip.destination} {trip.nights}박 {trip.nights + 1}일
                    </p>
                    <span className="shrink-0 text-td-badge font-bold text-purple-deep bg-purple-soft/60 px-2 py-0.5 rounded-full">
                      {trip.itemCount} spots
                    </span>
                  </div>
                  <div className="flex items-center gap-td-xxs mt-1 text-td-caption text-ink-soft">
                    <span className="material-symbols-outlined text-[14px]" aria-hidden>calendar_today</span>
                    <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-td-xxs mt-0.5 text-td-caption text-ink-soft">
                    <span className="material-symbols-outlined text-[14px]" aria-hidden>group</span>
                    <span>{companionLabel(trip.companions)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* actions */}
        <div className="px-td-md pt-td-sm pb-td-md space-y-td-xs">
          <button
            type="button"
            onClick={handleClaim}
            disabled={isPending || selected.size === 0}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-purple text-white font-semibold text-td-body hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "가져오는 중..." : `선택한 ${selected.size}개 가져오기`}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-td-body text-ink-soft hover:text-ink transition-colors"
          >
            지금은 안 할래요
          </button>
          <p className="text-td-caption text-ink-mute text-center">
            나중에 설정에서 언제든 가져올 수 있어요
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
