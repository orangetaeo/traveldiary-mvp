"use client";

/**
 * D-Day 자동 모드 전환 환영 모달 — 사이클 1 (G5, 2026-05-06).
 *
 * 발생: setTripMode 성공 + currentMode === "in-travel" + LocalStorage 미열람일 때
 *       TravelHome useEffect에서 1회 표시.
 *
 * 사용자 행동:
 *  - "시작하기" → onClose(permanent) — 모달 dismiss. permanent=true면 글로벌 LS 영구.
 *  - "지금은 안 보기" → onSkipRequest() — skip sheet 트리거 (모달 내려가고 sheet 올라옴).
 *
 * Stitch 시안: b199aee93287416badee4d9086dd29b2 ("Mode Transition Welcome (Pretendard)").
 */

import { useState } from "react";
import type { Trip } from "@/lib/types";

interface ModeTransitionWelcomeProps {
  trip: Trip;
  /** 1-base 여행 일차 (TravelHome에서 calculateTravelDay) */
  travelDay: number;
  /** 사용자 "시작하기" — permanent=true면 영구 dismiss */
  onClose: (permanent: boolean) => void;
  /** 사용자 "지금은 안 보기" — skip sheet 트리거 */
  onSkipRequest: () => void;
}

const VIETNAM_CODES: ReadonlySet<string> = new Set([
  "PQC",
  "SGN",
  "HAN",
  "DAD",
  "NHA",
  "DLI",
]);

export function ModeTransitionWelcome({
  trip,
  travelDay,
  onClose,
  onSkipRequest,
}: ModeTransitionWelcomeProps) {
  const [permanent, setPermanent] = useState(false);
  const totalDays = trip.nights + 1;
  const flag = VIETNAM_CODES.has(trip.destinationCode) ? "🇻🇳" : "✈️";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mode-transition-welcome-title"
      data-travel-mode="in-travel"
      className="fixed inset-0 z-[60] bg-ink/40 flex items-end sm:items-center justify-center"
    >
      <div className="w-full max-w-[390px] h-[844px] max-h-[100dvh] bg-surface-soft flex flex-col overflow-hidden shadow-2xl rounded-t-[24px] sm:rounded-[24px]">
        <header
          className="h-[281px] flex flex-col items-center justify-center px-td-lg pt-td-xl relative shrink-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(249,115,22,0.18) 0%, rgba(249,115,22,0.04) 100%)",
          }}
        >
          <div className="relative w-48 h-32 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[120px] text-mode-primary opacity-20 absolute inset-0 flex items-center justify-center"
              aria-hidden
            >
              flight_takeoff
            </span>
            <div className="relative flex flex-col items-center">
              <div className="w-20 h-20 bg-surface-card rounded-full shadow-lg flex items-center justify-center mb-td-md border-4 border-mode-primary/20">
                <span className="text-4xl" aria-hidden>
                  {flag}
                </span>
              </div>
              <div className="absolute -right-4 top-0 bg-mode-primary text-white p-2 rounded-full shadow-md">
                <span
                  className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden
                >
                  auto_awesome
                </span>
              </div>
            </div>
          </div>
          <div className="text-center mt-td-md">
            <h1
              id="mode-transition-welcome-title"
              className="text-td-title font-bold text-ink leading-tight"
            >
              여행 시작!
            </h1>
            <p className="text-td-body text-ink-soft font-medium mt-td-xs">
              {trip.destination} Day {travelDay} / {totalDays}
            </p>
          </div>
        </header>

        <section className="flex-grow px-td-lg py-td-xl space-y-td-md overflow-y-auto">
          <FeatureCard
            icon="palette"
            title="색이 바뀐 이유"
            description="위치와 날짜를 감지해 자동으로 여행 중 모드로 전환했어요"
          />
          <FeatureCard
            icon="photo_camera"
            title="새 기능: 카메라 번역"
            description="메뉴판을 찍으면 한국어로 바로 번역"
          />
          <FeatureCard
            icon="explore"
            title="새 기능: 주변 검색"
            description="지금 위치 근처 식당·관광지 추천"
          />
        </section>

        <footer className="px-td-lg pb-td-xl pt-td-sm flex flex-col items-center gap-td-md shrink-0">
          <button
            type="button"
            onClick={() => onClose(permanent)}
            className="w-full h-14 bg-mode-primary text-white font-bold text-td-card-title rounded-xl active:scale-95 transition-transform"
          >
            시작하기
          </button>
          <button
            type="button"
            onClick={onSkipRequest}
            className="text-ink-soft text-td-body hover:opacity-70 transition-opacity"
          >
            지금은 안 보기
          </button>
          <label className="flex items-center gap-td-xs cursor-pointer mt-td-xxs">
            <input
              type="checkbox"
              checked={permanent}
              onChange={(e) => setPermanent(e.target.checked)}
              className="w-4 h-4 rounded border-divider accent-mode-primary"
            />
            <span className="text-td-caption text-ink-soft">
              다음 여행에는 이 안내를 보지 않기
            </span>
          </label>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-surface-card p-td-lg rounded-xl border border-divider shadow-sm flex items-start gap-td-md">
      <div className="w-10 h-10 rounded-lg bg-mode-primary/10 flex items-center justify-center shrink-0">
        <span
          className="material-symbols-outlined text-mode-primary"
          style={{ fontVariationSettings: "'FILL' 1" }}
          aria-hidden
        >
          {icon}
        </span>
      </div>
      <div>
        <h3 className="text-td-card-title font-semibold text-ink leading-tight">
          {title}
        </h3>
        <p className="text-td-body text-ink-soft mt-td-xxs leading-snug">
          {description}
        </p>
      </div>
    </div>
  );
}
