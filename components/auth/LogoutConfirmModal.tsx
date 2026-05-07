/**
 * 로그아웃 확인 모달 — 사이클 8 (G3, ADR-049).
 *
 * Overlay (presentational only). state는 LogoutOrchestrator가 보유.
 * settings 페이지의 "로그아웃" 메뉴에서 트리거.
 */

"use client";

interface LogoutConfirmModalProps {
  open: boolean;
  pending: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LogoutConfirmModal({
  open,
  pending,
  errorMessage,
  onConfirm,
  onCancel,
}: LogoutConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-td-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
    >
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-md"
        onClick={pending ? undefined : onCancel}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm bg-surface-card rounded-md p-td-lg shadow-xl">
        <div className="flex items-center gap-td-xs mb-td-md">
          <span className="material-symbols-outlined text-ink-soft text-2xl">logout</span>
          <h2
            id="logout-confirm-title"
            className="text-td-card-title font-bold text-ink"
          >
            로그아웃하시겠어요?
          </h2>
        </div>

        <p className="text-td-body text-ink-soft mb-td-md">
          이 기기에서 자동 동기화가 멈춥니다. 받은 trip과 동기화 키는 그대로 유지됩니다.
        </p>

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
            onClick={onConfirm}
            disabled={pending}
            className="flex-1 py-td-xs rounded-md bg-ink text-white text-td-body font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {pending ? "처리 중…" : "로그아웃"}
          </button>
        </div>
      </div>
    </div>
  );
}
