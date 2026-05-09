"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ImpactDisplay } from "./ImpactDisplay";
import ReplanConflictModal from "@/components/modals/ReplanConflictModal";
import type { ItineraryItem, ReplanOption } from "@/lib/types";
import type { ReplanTrigger, ReplanResult } from "@/lib/replan";

interface ReplanModalProps {
  open: boolean;
  trigger: ReplanTrigger | null;
  triggerItem: ItineraryItem | null;
  results: ReplanResult[];
  onApply: (itemsAfter: ItineraryItem[], option: ReplanOption) => void;
  onClose: () => void;
}

// ADR-045 — category → 아이콘/한글 라벨 매핑.
const CATEGORY_ICON: Record<string, string> = {
  food: "restaurant",
  spot: "place",
  shopping: "shopping_bag",
  rest: "bedtime",
};

const CATEGORY_LABEL: Record<string, string> = {
  food: "식사",
  spot: "관광",
  shopping: "쇼핑",
  rest: "휴식",
};

function formatItemTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
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

  // ADR-045 — 강행 옵션 + booked/fixed 충돌 시 사용자 경고 모달.
  const [pendingForceResult, setPendingForceResult] = useState<ReplanResult | null>(null);

  const handleOptionClick = useCallback(
    (result: ReplanResult) => {
      const isForce = result.option.id === "option-force";
      if (isForce && result.conflicts.length > 0) {
        // 강행은 충돌 모달을 띄움 — 사용자가 경고를 본 뒤 명시 선택.
        setPendingForceResult(result);
        return;
      }
      onApply(result.itemsAfter, result.option);
    },
    [onApply],
  );

  const handleConflictClose = useCallback(() => {
    setPendingForceResult(null);
  }, []);

  const handleKeepTrigger = useCallback(() => {
    if (!pendingForceResult) return;
    // "트리거 항목 유지" — 강행 그대로 적용 (사용자가 충돌을 인지하고 강행).
    onApply(pendingForceResult.itemsAfter, pendingForceResult.option);
    setPendingForceResult(null);
  }, [pendingForceResult, onApply]);

  const handleKeepBooked = useCallback(() => {
    if (!pendingForceResult) return;
    // "예약 항목 유지" — 추천 옵션으로 전환 (예약·고정 보호).
    const recommend = results.find((r) => r.option.id === "option-recommend");
    if (recommend) {
      onApply(recommend.itemsAfter, recommend.option);
    }
    setPendingForceResult(null);
  }, [pendingForceResult, results, onApply]);

  const handleKeepBoth = useCallback(() => {
    if (!pendingForceResult) return;
    // "둘 다 유지 (시간 조정)" — 안전 옵션으로 전환 (+30분 buffer).
    const safe = results.find((r) => r.option.id === "option-safe");
    if (safe) {
      onApply(safe.itemsAfter, safe.option);
    }
    setPendingForceResult(null);
  }, [pendingForceResult, results, onApply]);

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

  // ADR-045 — 강행 충돌 모달은 ReplanModal 위에 z-[70]으로 마운트.
  const conflictItemA = pendingForceResult && triggerItem
    ? {
        id: triggerItem.id,
        name: triggerItem.name,
        time: formatItemTime(triggerItem.scheduledAt),
        category: CATEGORY_LABEL[triggerItem.category] ?? triggerItem.category,
        icon: CATEGORY_ICON[triggerItem.category] ?? "place",
      }
    : null;

  const conflictItemB = pendingForceResult && pendingForceResult.conflicts[0]
    ? {
        id: pendingForceResult.conflicts[0].id,
        name: pendingForceResult.conflicts[0].name,
        time: formatItemTime(pendingForceResult.conflicts[0].scheduledAt),
        category:
          CATEGORY_LABEL[pendingForceResult.conflicts[0].category] ??
          pendingForceResult.conflicts[0].category,
        icon: CATEGORY_ICON[pendingForceResult.conflicts[0].category] ?? "place",
      }
    : null;

  return (
    <>
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40"
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
          {results.map((result) => {
            const { option } = result;
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
                onClick={() => handleOptionClick(result)}
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

    {/* ADR-045 #36 — 강행 옵션 + 충돌 시 사용자 경고 + 대안 제시 */}
    {conflictItemA && conflictItemB && (
      <ReplanConflictModal
        open
        onClose={handleConflictClose}
        conflictA={conflictItemA}
        conflictB={conflictItemB}
        onKeepA={handleKeepTrigger}
        onKeepB={handleKeepBooked}
        onKeepBoth={handleKeepBoth}
      />
    )}
    </>
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
