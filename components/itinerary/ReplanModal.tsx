"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ImpactDisplay } from "./ImpactDisplay";
import type { ItineraryItem, ReplanOption } from "@/lib/types";
import type { ReplanTrigger } from "@/lib/replan";

interface ReplanModalProps {
  open: boolean;
  trigger: ReplanTrigger | null;
  triggerItem: ItineraryItem | null;
  results: { option: ReplanOption; itemsAfter: ItineraryItem[] }[];
  onApply: (itemsAfter: ItineraryItem[], option: ReplanOption) => void;
  onClose: () => void;
}

const LABEL_STYLE: Record<string, string> = {
  추천: "bg-purple-soft text-purple-deep",
  안전: "bg-success-soft text-success-deep",
  강행: "bg-amber-soft text-amber-deep",
};

const HOVER_BORDER: Record<string, string> = {
  추천: "hover:border-purple",
  안전: "hover:border-success",
  강행: "hover:border-amber",
};

const RADIO_HOVER: Record<string, string> = {
  추천: "group-hover:text-purple",
  안전: "group-hover:text-success",
  강행: "group-hover:text-amber",
};

/**
 * Live Replan 바텀 시트 모달 — Stitch #8 매핑.
 *
 * Stitch screen: 66a10354826a42cbb537d440e4c2e39f (Live Replan Modal - Pretendard)
 * 사이클 5b 옵션 C (2026-04-30): Stitch HTML → React 변환.
 *
 * 디자인 룰 (T17 / S-12 / S-06):
 *   - 바텀 시트, max-height calc(100dvh-2rem), drag handle + swipe dismiss
 *   - 백드롭 클릭 / ESC → 닫힘
 *   - 3옵션 카드 — 추천(보라) / 안전(초록) / 강행(앰버)
 *   - "AI는 결정하지 않는다" 원칙 — 카드 hover 시에만 강조
 */
export function ReplanModal({
  open,
  trigger,
  triggerItem,
  results,
  onApply,
  onClose,
}: ReplanModalProps) {
  // 드래그 dismiss
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 0) setDragY(delta);
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    if (dragY > 120) {
      onClose();
    }
    setDragY(0);
  }, [dragY, onClose]);

  if (!open || !trigger || !triggerItem) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="replan-title"
    >
      <div
        className="relative w-full max-w-[420px] bg-surface-card rounded-t-[24px] shadow-2xl flex flex-col max-h-[calc(100dvh-2rem)] transition-transform"
        style={{ transform: dragY > 0 ? `translateY(${dragY}px)` : undefined }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-2 shrink-0 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 rounded-full bg-divider" aria-hidden />
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-3 right-3 text-ink-soft hover:text-ink p-1 rounded-full hover:bg-surface-soft z-10"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Header */}
        <header className="px-td-lg pt-td-xs pb-td-md space-y-td-xxs shrink-0">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber text-white text-td-caption font-bold">
            {triggerLabel(trigger, triggerItem.name)}
          </div>
          <h2
            id="replan-title"
            className="text-td-card-title text-ink font-semibold"
          >
            일정을 어떻게 조정할까요?
          </h2>
          <p className="text-td-caption text-ink-soft">
            AI는 결정하지 않습니다. 옵션만 제시합니다.
          </p>
        </header>

        {/* Option cards */}
        <div className="flex-1 overflow-y-auto px-td-md pb-td-md space-y-td-sm">
          {results.map(({ option, itemsAfter }) => {
            const labelStyle =
              LABEL_STYLE[option.label] ?? LABEL_STYLE["추천"];
            const hoverBorder =
              HOVER_BORDER[option.label] ?? HOVER_BORDER["추천"];
            const radioHover =
              RADIO_HOVER[option.label] ?? RADIO_HOVER["추천"];

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onApply(itemsAfter, option)}
                className={`group block w-full text-left p-td-md bg-surface-card border border-divider rounded-md shadow-sm ${hoverBorder} transition-colors`}
              >
                <div className="flex justify-between items-start mb-td-xs">
                  <span
                    className={`px-2 py-0.5 rounded-lg text-td-caption font-bold ${labelStyle}`}
                  >
                    {option.label}
                  </span>
                  <span
                    className={`material-symbols-outlined text-ink-mute ${radioHover}`}
                    aria-hidden
                  >
                    radio_button_unchecked
                  </span>
                </div>
                <h3 className="text-td-body font-bold text-ink mb-td-xxs">
                  {option.title}
                </h3>
                <p className="text-td-meta text-ink-soft mb-td-sm">
                  {option.description}
                </p>
                <div className="pt-td-sm border-t border-divider">
                  <ImpactDisplay impacts={option.impacts} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer note */}
        <footer className="border-t border-divider px-td-md py-td-sm shrink-0">
          <p className="text-td-caption text-ink-mute text-center">
            카드를 탭하면 즉시 적용됩니다 (데모 시뮬레이션)
          </p>
        </footer>
      </div>
    </div>
  );
}

function triggerLabel(trigger: ReplanTrigger, itemName: string): string {
  switch (trigger.type) {
    case "delay":     return `${itemName} ${trigger.minutes}분 지연 감지`;
    case "weather":   return `${itemName} 악천후 (${trigger.condition})`;
    case "wait_time": return `${itemName} 웨이팅 ${trigger.minutes}분`;
    case "manual":    return `${itemName} ${trigger.minutes}분 조정 요청`;
  }
}
