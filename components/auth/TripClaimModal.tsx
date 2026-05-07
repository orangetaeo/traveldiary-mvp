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
  itemCount: number;
  companions: number;
}

interface TripClaimModalProps {
  trips: ClaimableTrip[];
  userName: string;
  onClose: () => void;
  onClaim: (tripIds: string[]) => Promise<void>;
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* sheet */}
      <div className="relative w-full max-w-md bg-surface-card rounded-t-xl sm:rounded-xl shadow-xl max-h-[85vh] flex flex-col animate-slide-up">
        {/* header */}
        <div className="px-td-md pt-td-lg pb-td-sm border-b border-divider">
          <div className="flex items-center gap-td-sm mb-td-xs">
            <div className="w-10 h-10 rounded-full bg-purple-soft flex items-center justify-center">
              <span className="material-symbols-outlined text-purple text-td-icon-lg">
                sync_alt
              </span>
            </div>
            <div>
              <h2 className="text-td-card-title text-ink font-bold">
                환영합니다, {userName}님!
              </h2>
              <p className="text-td-caption text-ink-soft">
                기존 여행을 내 계정으로 가져올 수 있어요
              </p>
            </div>
          </div>
        </div>

        {/* trip list */}
        <div className="flex-grow overflow-y-auto px-td-md py-td-sm space-y-td-sm">
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

                {/* trip info */}
                <div className="min-w-0 flex-grow">
                  <p className="text-td-body font-medium text-ink">
                    {trip.destination} {trip.nights}박 {trip.nights + 1}일
                  </p>
                  <div className="flex items-center gap-td-xs mt-td-xxs text-td-caption text-ink-soft">
                    <span>{trip.itemCount}개 일정</span>
                    <span aria-hidden>·</span>
                    <span>{trip.startDate}</span>
                    {trip.companions > 1 && (
                      <>
                        <span aria-hidden>·</span>
                        <span>{trip.companions}명</span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* actions */}
        <div className="px-td-md py-td-md border-t border-divider space-y-td-sm">
          <button
            type="button"
            onClick={handleClaim}
            disabled={isPending || selected.size === 0}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-purple text-white font-semibold text-td-body hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              "가져오는 중..."
            ) : (
              <>
                <span className="material-symbols-outlined text-td-icon">
                  cloud_download
                </span>
                {selected.size}개 여행 가져오기
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-lg text-td-meta text-ink-soft hover:bg-surface-soft transition-colors"
          >
            나중에 할게요 (설정에서 가능)
          </button>
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
