"use client";

/**
 * TripClaimBanner — 홈 페이지에서 익명 여행 인계 모달을 트리거.
 *
 * 서버에서 claimableTrips를 받아, 존재하면 배너 표시 → 클릭 시 모달 오픈.
 * 인계 완료 또는 닫기 후 dismissed 상태로 전환 (세션 내).
 */

import { useState } from "react";
import {
  TripClaimModal,
  type ClaimableTrip,
} from "./TripClaimModal";
import { claimAnonymousTrips } from "@/actions/trip";

interface TripClaimBannerProps {
  trips: ClaimableTrip[];
  userName: string;
}

export function TripClaimBanner({ trips, userName }: TripClaimBannerProps) {
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || trips.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="w-full flex items-center gap-td-sm p-td-sm bg-purple-soft/40 border border-purple/20 rounded-md hover:bg-purple-soft/60 transition-colors text-left"
      >
        <span className="material-symbols-outlined text-purple text-td-icon-lg shrink-0">
          sync_alt
        </span>
        <div className="min-w-0 flex-grow">
          <p className="text-td-meta font-medium text-ink">
            이전에 만든 여행 {trips.length}개를 발견했어요
          </p>
          <p className="text-td-caption text-ink-soft">
            내 계정으로 가져오면 어디서든 접근할 수 있어요
          </p>
        </div>
        <span className="material-symbols-outlined text-ink-mute text-td-icon-sm shrink-0">
          chevron_right
        </span>
      </button>

      {showModal && (
        <TripClaimModal
          trips={trips}
          userName={userName}
          onClose={() => {
            setShowModal(false);
            setDismissed(true);
          }}
          onClaim={async (tripIds) => {
            await claimAnonymousTrips(tripIds);
          }}
        />
      )}
    </>
  );
}
