"use client";

/**
 * ConfirmDialog — 재사용 가능한 확인/취소 모달.
 *
 * window.confirm() 대체. TripDeleteButton 패턴 추출.
 * Escape 키 + 배경 클릭으로 닫기 지원.
 */

import { useEffect, useCallback, useRef } from "react";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  /** 확인 버튼 텍스트 (기본: "삭제") */
  confirmLabel?: string;
  /** 확인 중 텍스트 (기본: "처리 중…") */
  pendingLabel?: string;
  /** 취소 버튼 텍스트 (기본: "취소") */
  cancelLabel?: string;
  /** Material Symbols icon name (기본: "delete_forever") */
  icon?: string;
  /** 위험 동작 여부 — true면 빨간 버튼 (기본: true) */
  danger?: boolean;
  /** 처리 중 상태 */
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "삭제",
  pendingLabel = "처리 중…",
  cancelLabel = "취소",
  icon = "delete_forever",
  danger = true,
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Escape 키로 닫기
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) onCancel();
    },
    [isPending, onCancel],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    // 열리면 취소 버튼에 포커스
    cancelRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) return null;

  const confirmBtnClass = danger
    ? "flex-1 py-td-sm rounded-md bg-danger text-white text-td-body font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
    : "flex-1 py-td-sm rounded-md bg-purple text-white text-td-body font-bold hover:opacity-90 transition-opacity disabled:opacity-50";

  const iconColor = danger ? "text-danger" : "text-purple";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-td-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onCancel();
      }}
    >
      <div className="bg-surface-card rounded-lg w-full max-w-sm p-td-lg shadow-xl">
        <div className="flex items-center gap-td-xs mb-td-sm">
          <span
            className={`material-symbols-outlined ${iconColor} text-2xl`}
            aria-hidden
          >
            {icon}
          </span>
          <h2
            id="confirm-dialog-title"
            className="text-td-card-title font-bold text-ink"
          >
            {title}
          </h2>
        </div>

        <p className="text-td-body text-ink-soft mb-td-md">{description}</p>

        <div className="flex gap-td-sm">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 py-td-sm rounded-md border border-divider text-td-body font-medium text-ink hover:bg-surface-soft transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={confirmBtnClass}
          >
            {isPending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
