/**
 * 계정 삭제 2단계 — 텍스트 확인 모달 — 사이클 8 (G3, ADR-049).
 *
 * 사용자가 정확히 "계정 삭제"를 입력해야 최종 버튼 활성화.
 * 서버 측에서도 confirm 재검증 (T16 권고 — replay 방어).
 *
 * Overlay (presentational only). state는 AccountDeleteOrchestrator가 보유.
 */

"use client";

import { useState } from "react";
import { ACCOUNT_DELETE_CONFIRM_PHRASE } from "@/lib/auth/account-delete-shared";

interface AccountDeleteConfirmModalProps {
  open: boolean;
  pending: boolean;
  errorMessage?: string | null;
  onConfirm: (phrase: string) => void;
  onCancel: () => void;
}

export function AccountDeleteConfirmModal({
  open,
  pending,
  errorMessage,
  onConfirm,
  onCancel,
}: AccountDeleteConfirmModalProps) {
  const [phrase, setPhrase] = useState("");

  if (!open) return null;

  const matches = phrase.trim() === ACCOUNT_DELETE_CONFIRM_PHRASE;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-td-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-delete-confirm-title"
    >
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-md"
        onClick={pending ? undefined : onCancel}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm bg-surface-card rounded-md p-td-lg shadow-xl">
        <h2
          id="account-delete-confirm-title"
          className="text-td-card-title font-bold text-danger mb-td-sm"
        >
          최종 확인
        </h2>

        <p className="text-td-body text-ink-soft mb-td-sm">
          확인을 위해 아래 칸에{" "}
          <span className="font-bold text-ink">{ACCOUNT_DELETE_CONFIRM_PHRASE}</span>{" "}
          이라고 입력해주세요.
        </p>

        <input
          type="text"
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          disabled={pending}
          placeholder={ACCOUNT_DELETE_CONFIRM_PHRASE}
          aria-label="확인 문구"
          className="w-full px-td-sm py-td-xs rounded-md border border-divider focus:border-danger focus:outline-none text-td-body text-ink bg-surface-soft mb-td-sm disabled:opacity-60"
        />

        {errorMessage && (
          <div
            role="alert"
            className="mb-td-sm rounded-md border border-danger/40 bg-danger/10 px-td-sm py-td-xs text-td-meta text-danger"
          >
            {errorMessage}
          </div>
        )}

        <div className="flex gap-td-xs">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="flex-1 py-td-xs rounded-md border border-divider text-td-body font-semibold text-ink hover:bg-surface-soft transition-colors disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onConfirm(phrase)}
            disabled={!matches || pending}
            className="flex-1 py-td-xs rounded-md bg-danger text-white text-td-body font-bold transition-opacity disabled:opacity-40 hover:opacity-90"
          >
            {pending ? "삭제 중…" : "영구 삭제"}
          </button>
        </div>
      </div>
    </div>
  );
}
