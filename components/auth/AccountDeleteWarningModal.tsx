/**
 * 계정 삭제 1단계 — 영향 안내 모달 — 사이클 8 (G3, ADR-049).
 *
 * Overlay (presentational only). state는 AccountDeleteOrchestrator가 보유.
 */

"use client";

interface AccountDeleteWarningModalProps {
  open: boolean;
  onNext: () => void;
  onCancel: () => void;
}

export function AccountDeleteWarningModal({
  open,
  onNext,
  onCancel,
}: AccountDeleteWarningModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-td-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-delete-warning-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm bg-surface-card rounded-md p-td-lg shadow-xl">
        <div className="flex items-center gap-td-xs mb-td-md">
          <span className="material-symbols-outlined text-danger text-2xl">warning</span>
          <h2
            id="account-delete-warning-title"
            className="text-td-card-title font-bold text-danger"
          >
            정말 삭제하시겠어요?
          </h2>
        </div>

        <ul className="space-y-td-xs mb-td-md">
          <li className="flex items-start gap-td-xs text-td-body text-ink">
            <span className="material-symbols-outlined text-ink-soft text-lg mt-0.5">
              groups
            </span>
            <span>
              내가 만든 trip은 익명화되어 동행자에게 그대로 보입니다.
            </span>
          </li>
          <li className="flex items-start gap-td-xs text-td-body text-ink">
            <span className="material-symbols-outlined text-ink-soft text-lg mt-0.5">
              person_off
            </span>
            <span>
              이름 · 이메일 · 카카오 연결이 즉시 익명 처리됩니다.
            </span>
          </li>
          <li className="flex items-start gap-td-xs text-td-body text-ink">
            <span className="material-symbols-outlined text-danger text-lg mt-0.5">
              delete_forever
            </span>
            <span>
              이 작업은 되돌릴 수 없습니다. 필요한 경우 운영팀 문의가 가능합니다.
            </span>
          </li>
        </ul>

        <div className="flex gap-td-xs">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-td-xs rounded-md border border-divider text-td-body font-semibold text-ink hover:bg-surface-soft transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex-1 py-td-xs rounded-md border border-danger text-td-body font-bold text-danger hover:bg-danger/10 transition-colors"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
