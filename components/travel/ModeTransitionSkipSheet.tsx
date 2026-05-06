"use client";

/**
 * D-Day 모드 전환 거부 사유 sheet — 사이클 1 (G6, 2026-05-06).
 *
 * 발생: ModeTransitionWelcome의 "지금은 안 보기" 클릭 시.
 *
 * 5 옵션 ↔ enum 매핑:
 *   1. "아직 출발하지 않았어요"   → not_yet_started (기존 — 시스템 detection과 동일)
 *   2. "다른 도시에 있어요"       → not_in_destination (기존)
 *   3. "앱을 잠깐만 켰어요"       → user_postponed_for_now (사이클 1 신규)
 *   4. "UI가 헷갈려요"           → user_confused_ui (사이클 1 신규)
 *   5. "기타" + textarea         → user_other (사이클 1 신규) + userNote (200자)
 *
 * 동작:
 *   - "미루기" → recordModeTransitionSkip(reason, userNote?) — audit log 1 row
 *   - "취소"  → onDismiss() — sheet 닫기, 모드 변경 X
 *
 * Stitch 시안: 66261b1482b94e7ca850f697c9c57b3c ("Mode Transition Skip Reason (Pretendard)").
 */

import { useState, useTransition } from "react";
import { recordModeTransitionSkip } from "@/actions/trip";
import type { ModeTransitionSkipReason } from "@/lib/mode-transition";
import type { Trip, TravelMode } from "@/lib/types";

interface SkipOption {
  reason: ModeTransitionSkipReason;
  label: string;
}

const OPTIONS: SkipOption[] = [
  { reason: "not_yet_started", label: "아직 출발하지 않았어요" },
  {
    reason: "not_in_destination",
    label: "다른 도시에 있어요 (예: 한국에서 환승 중)",
  },
  {
    reason: "user_postponed_for_now",
    label: "앱을 잠깐만 켰어요 (지금 사용 안 함)",
  },
  { reason: "user_confused_ui", label: "UI가 헷갈려요" },
  { reason: "user_other", label: "기타" },
];

const NOTE_LIMIT = 200;

interface ModeTransitionSkipSheetProps {
  trip: Trip;
  currentMode: TravelMode;
  /** "취소" 또는 backdrop 클릭 — sheet 닫기, 모드 변경 X */
  onDismiss: () => void;
  /** "미루기" 후 호출 — 호출자가 추가 처리 (예: 환영 모달 영구 dismiss) */
  onSubmitted: (reason: ModeTransitionSkipReason) => void;
}

export function ModeTransitionSkipSheet({
  trip,
  currentMode,
  onDismiss,
  onSubmitted,
}: ModeTransitionSkipSheetProps) {
  const [selected, setSelected] = useState<ModeTransitionSkipReason | null>(
    null,
  );
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!selected || isPending) return;
    startTransition(async () => {
      const userNote =
        selected === "user_other" && note.trim().length > 0
          ? note.trim().slice(0, NOTE_LIMIT)
          : undefined;
      await recordModeTransitionSkip({
        tripId: trip.id,
        skipReason: selected,
        currentMode,
        trigger: "manual",
        context: {
          destinationCode: trip.destinationCode,
          ...(userNote ? { userNote } : {}),
        },
      });
      onSubmitted(selected);
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mode-transition-skip-title"
      className="fixed inset-0 z-[70] bg-ink/40 flex items-end justify-center"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-[390px] h-[600px] max-h-[90dvh] bg-surface-soft flex flex-col rounded-t-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex justify-center pt-td-md shrink-0">
          <div className="w-9 h-1 bg-divider rounded-full" aria-hidden />
        </div>

        <header className="px-td-xl pt-td-xl pb-td-md shrink-0">
          <h1
            id="mode-transition-skip-title"
            className="text-td-title font-medium text-ink"
          >
            왜 모드 전환을 미루시나요?
          </h1>
          <p className="text-td-meta text-ink-soft mt-td-xs">
            선택은 익명으로 수집되어 앱 개선에 사용됩니다
          </p>
        </header>

        <div className="flex-1 overflow-y-auto px-td-xl">
          <fieldset className="flex flex-col">
            <legend className="sr-only">거부 사유 선택</legend>
            {OPTIONS.map((opt, idx) => (
              <label
                key={opt.reason}
                className={`flex items-center justify-between min-h-[60px] cursor-pointer hover:bg-surface-card transition-colors rounded-lg px-td-sm ${
                  idx > 0 ? "border-t border-divider/50" : ""
                }`}
              >
                <span className="text-td-body text-ink">{opt.label}</span>
                <input
                  type="radio"
                  name="td-mode-transition-skip-reason"
                  value={opt.reason}
                  checked={selected === opt.reason}
                  onChange={() => setSelected(opt.reason)}
                  className="w-5 h-5 accent-mode-primary cursor-pointer"
                />
              </label>
            ))}
          </fieldset>

          {selected === "user_other" && (
            <div className="mt-td-md pb-td-md">
              <div className="relative">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, NOTE_LIMIT))}
                  maxLength={NOTE_LIMIT}
                  placeholder="선택사항: 자세히 알려주세요"
                  className="w-full h-24 p-td-md bg-surface-card border border-divider rounded-xl text-td-body resize-none placeholder:text-ink-soft focus:outline-none focus:border-mode-primary"
                  aria-label="기타 사유 자세히"
                />
                <div className="absolute bottom-td-md right-td-md text-td-caption text-ink-soft tabular-nums">
                  {note.length}/{NOTE_LIMIT}
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="px-td-xl pt-td-md pb-td-xl space-y-td-md bg-surface-soft border-t border-divider/40 shrink-0">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selected || isPending}
            className="w-full h-14 bg-[#64748B] text-white font-medium rounded-xl active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? "기록 중…" : "미루기"}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="w-full text-center py-td-sm text-mode-primary font-medium active:opacity-70 transition-opacity"
          >
            취소 — 모드 전환 그대로 진행
          </button>
        </footer>
      </div>
    </div>
  );
}
