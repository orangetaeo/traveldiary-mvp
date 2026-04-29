"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
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

/**
 * Live Replan 바텀 시트 모달 (T17 / S-12).
 *
 * - 바텀 시트, max-height 80vh
 * - 백드롭 클릭 / ESC / X 버튼 → 닫힘
 * - 3옵션 카드 — 라벨/제목/설명/ImpactDisplay/적용 버튼
 * - "AI는 결정하지 않는다" 원칙 — 강조 옵션 없음, 모두 동등.
 */
export function ReplanModal({
  open,
  trigger,
  triggerItem,
  results,
  onApply,
  onClose,
}: ReplanModalProps) {
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

  if (!open || !trigger || !triggerItem) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="replan-title"
    >
      <div
        className="w-full max-w-[420px] bg-surface-card rounded-t-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-divider">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-accent tracking-widest mb-0.5">
              LIVE REPLAN · 데모 시뮬레이션
            </p>
            <h2 id="replan-title" className="text-[17px] font-medium leading-tight">
              {triggerLabel(trigger, triggerItem.name)}
            </h2>
          </div>
          <button
            className="text-ink-mute hover:text-ink shrink-0 text-lg leading-none px-1"
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </header>

        <div className="px-4 py-4 space-y-3 overflow-y-auto">
          {results.map(({ option, itemsAfter }) => (
            <article
              key={option.id}
              className="border border-divider rounded-lg p-4 bg-surface-card"
            >
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="text-[15px] font-medium">{option.title}</h3>
                <span className="text-[11px] text-ink-soft">{option.label}</span>
              </div>
              <p className="text-[12px] text-ink-soft mb-3">
                {option.description}
              </p>

              <div className="bg-surface-soft rounded-md p-3 mb-3">
                <ImpactDisplay impacts={option.impacts} />
              </div>

              <Button
                variant={option.id === "option-recommend" ? "primary" : "secondary"}
                size="sm"
                fullWidth
                onClick={() => onApply(itemsAfter, option)}
              >
                이 옵션 적용
              </Button>
            </article>
          ))}
        </div>

        <footer className="px-5 py-3 border-t border-divider">
          <p className="text-[11px] text-ink-mute text-center">
            AI는 결정하지 않습니다. 옵션을 보고 직접 선택하세요.
          </p>
        </footer>
      </div>
    </div>
  );
}

function triggerLabel(trigger: ReplanTrigger, itemName: string): string {
  switch (trigger.type) {
    case "delay":     return `${itemName} ${trigger.minutes}분 지연`;
    case "weather":   return `${itemName} 악천후 (${trigger.condition})`;
    case "wait_time": return `${itemName} 웨이팅 ${trigger.minutes}분`;
    case "manual":    return `${itemName} ${trigger.minutes}분 조정 요청`;
  }
}
