"use client";

/**
 * Itinerary coach mark — 사이클 3 (G4, 2026-05-06).
 *
 * /itinerary/[id] 첫 진입 시 M1 차별화 축(추천 근거 패널)을 한 번 안내.
 * LocalStorage `td-itinerary-coach-seen`로 1회 표시 박제.
 *
 * 갭 해소: 기존엔 EvidencePanel이 단 1 카드에만 노출 + 기본 접힘이라
 *         사용자가 "왜 골랐는지" 정보의 존재 자체를 모름.
 *
 * 분할: 프레젠테이션(`ItineraryCoachMarkOverlay`)과 오케스트레이터(`ItineraryCoachMark`)
 *      분리 — overlay는 vitest node 환경에서도 renderToStaticMarkup 테스트 가능.
 */

import { useEffect, useState } from "react";
import {
  isItineraryCoachSeen,
  markItineraryCoachSeen,
} from "@/lib/itinerary/coachMark";

interface OverlayProps {
  onDismiss: () => void;
}

export function ItineraryCoachMarkOverlay({ onDismiss }: OverlayProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-td-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="itinerary-coach-title"
    >
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-md"
        onClick={onDismiss}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm bg-surface-card rounded-xl p-td-lg shadow-2xl">
        <div className="flex justify-center mb-td-sm">
          <div className="w-12 h-12 rounded-full bg-purple-soft flex items-center justify-center">
            <span
              className="material-symbols-outlined filled text-purple-deep text-[28px]"
              aria-hidden
            >
              lightbulb
            </span>
          </div>
        </div>

        <h2
          id="itinerary-coach-title"
          className="text-td-card-title font-bold text-ink text-center mb-td-xs"
        >
          왜 이 장소를 골랐는지 알려드려요
        </h2>

        <p className="text-td-body text-ink-soft text-center mb-td-sm">
          각 일정의 <span className="font-semibold text-purple-deep">&ldquo;왜 이걸 골랐나&rdquo;</span> 패널을 펼치면
          네이버 후기 통계, 다음 일정과의 거리, 당신의 취향 일치도가
          출처와 함께 보여요.
        </p>

        <p className="text-td-caption text-ink-mute text-center italic mb-td-md">
          다른 AI 여행 앱과 다르게, 우리는 추천 근거를 숨기지 않아요.
        </p>

        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-td-sm rounded-md bg-purple text-white text-td-body font-bold transition-opacity hover:opacity-90"
        >
          확인했어요
        </button>
      </div>
    </div>
  );
}

export function ItineraryCoachMark() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isItineraryCoachSeen()) return;
    // hydration 후에 표시 — 약간의 지연으로 페이지 첫 화면이 먼저 보이게 함.
    const id = window.setTimeout(() => setOpen(true), 400);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // handleDismiss는 ref 없이 안정적이지 않지만 setOpen만 호출하므로 안전
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleDismiss() {
    markItineraryCoachSeen();
    setOpen(false);
  }

  if (!open) return null;
  return <ItineraryCoachMarkOverlay onDismiss={handleDismiss} />;
}
