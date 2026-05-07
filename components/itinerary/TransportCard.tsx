"use client";

/**
 * TransportCard — 일정 카드 사이의 이동 수단 비교 카드 (U5, 사이클 디자인 갭 #1).
 *
 * 사용자 진단 (project_design_gaps_2026_05_07): 일정 카드만 나열되어
 * "이동 어떻게 해요?" 질문에 답이 없음. 일정 사이에 이 카드가 들어감.
 *
 * Stitch 시안 ID `6589c6c95b2045709459ec559a07190d` (2026-05-07 generate_screen_from_text 1회 즉시 성공).
 * 토큰 매핑: surface tokens → ink/divider/purple/surface-card. material-symbols → 인라인 SVG/이모지.
 *
 * 데이터: TransportOption[] 3 모드 (도보/그랩/버스). recommendedMode가 기본 선택.
 * 액션 버튼은 mode별 다른 라벨/콜백 (도보=동선보기 / 그랩=앱호출 / 버스=노선보기).
 */

import { useState } from "react";

export type TransportMode = "walk" | "grab" | "bus";

export interface TransportOption {
  mode: TransportMode;
  durationMin: number;
  /** ₩0(도보)도 0으로 표기. undefined면 "—" */
  priceKrw?: number;
  /** "노선 03" 같은 보조 텍스트. 옵션. */
  note?: string;
}

interface Props {
  from: string;
  to: string;
  /** 직선거리 km (예: 1.2). undefined면 거리 뱃지 숨김. */
  distanceKm?: number;
  options: TransportOption[];
  /** 추천 모드 — 기본 선택됨. options에 포함되어야 함. */
  recommendedMode: TransportMode;
  /** "도보 추천 — 강변 산책로 좋고 야경 명소 통과" 같은 한 줄 이유. */
  recommendedReason: string;
  /** mode별 액션 콜백. 미지정 시 alert. */
  onAction?: (mode: TransportMode) => void;
}

const MODE_META: Record<TransportMode, { icon: string; label: string }> = {
  walk: { icon: "🚶", label: "도보" },
  grab: { icon: "🚕", label: "그랩" },
  bus: { icon: "🚌", label: "버스" },
};

const ACTION_LABEL: Record<TransportMode, string> = {
  walk: "지도에서 동선 보기",
  grab: "그랩 앱으로 호출하기",
  bus: "버스 노선 보기",
};

function formatPrice(priceKrw?: number): string {
  if (priceKrw === undefined) return "—";
  if (priceKrw === 0) return "₩0";
  return `₩${priceKrw.toLocaleString("ko-KR")}`;
}

export function TransportCard({
  from,
  to,
  distanceKm,
  options,
  recommendedMode,
  recommendedReason,
  onAction,
}: Props) {
  const [selected, setSelected] = useState<TransportMode>(recommendedMode);

  const handleAction = () => {
    if (onAction) onAction(selected);
  };

  return (
    <div
      data-testid="transport-card"
      className="relative w-full bg-surface-card border border-divider rounded-md p-td-md shadow-sm"
    >
      <div className="flex items-center justify-between mb-td-sm gap-td-xs">
        <h4 className="text-td-body font-medium text-ink flex items-center gap-1 min-w-0">
          <span className="truncate">{from}</span>
          <span aria-hidden className="text-ink-mute shrink-0">
            →
          </span>
          <span className="truncate">{to}</span>
        </h4>
        {distanceKm !== undefined && (
          <span
            data-testid="transport-distance-badge"
            className="bg-surface-soft text-ink-soft text-td-meta px-2 py-0.5 rounded-full shrink-0"
          >
            📍 {distanceKm.toFixed(1)}km
          </span>
        )}
      </div>

      <div
        role="radiogroup"
        aria-label="이동 수단 선택"
        className="grid grid-cols-3 gap-td-xs mb-td-sm"
      >
        {options.map((opt) => {
          const meta = MODE_META[opt.mode];
          const isSelected = selected === opt.mode;
          const isRecommended = opt.mode === recommendedMode;
          return (
            <button
              key={opt.mode}
              type="button"
              role="radio"
              aria-checked={isSelected}
              data-testid={`transport-option-${opt.mode}`}
              onClick={() => setSelected(opt.mode)}
              className={`rounded-md p-td-xs flex flex-col items-center text-center transition-colors ${
                isSelected
                  ? "bg-purple-soft/40 border-2 border-purple"
                  : "bg-surface-card border border-divider hover:border-purple/40"
              }`}
            >
              <span aria-hidden className="text-[20px] leading-none mb-1">
                {meta.icon}
              </span>
              <p
                className={`text-td-caption font-bold ${
                  isSelected ? "text-purple" : "text-ink"
                }`}
              >
                {opt.durationMin}분
              </p>
              <p
                className={`text-td-caption ${
                  isSelected ? "text-purple/80" : "text-ink-soft"
                }`}
              >
                {formatPrice(opt.priceKrw)}
              </p>
              {opt.note && (
                <p className="text-td-caption text-ink-mute mt-0.5">{opt.note}</p>
              )}
              {isRecommended && (
                <span className="sr-only">AI 추천</span>
              )}
            </button>
          );
        })}
      </div>

      <div
        data-testid="transport-recommendation"
        className="bg-purple-soft/30 border border-purple/20 rounded-md p-td-xs flex items-start gap-2 mb-td-sm"
      >
        <span className="bg-purple text-white text-td-badge font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0">
          AI 추천
        </span>
        <p className="text-td-meta text-purple-deep leading-tight">
          🌟 {recommendedReason}
        </p>
      </div>

      <button
        type="button"
        data-testid="transport-action-button"
        onClick={handleAction}
        className="w-full bg-purple text-white text-td-body font-semibold py-3 rounded-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
      >
        {ACTION_LABEL[selected]}
      </button>

      <p className="text-td-caption text-ink-mute mt-td-xs text-center">
        * 가격은 기준 시간/거리 기반 예상치
      </p>
    </div>
  );
}
