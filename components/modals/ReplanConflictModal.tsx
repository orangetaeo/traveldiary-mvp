/**
 * Live Replan 충돌 모달 (Phase 7 신규).
 *
 * Stitch 시안: #36 Live Replan Conflict (196f55b628d142989234edb8fb0ce602)
 * 용도: 재계획 시 시간대 충돌/겹침 감지됐을 때 사용자에게 옵션 제시.
 * 디자인: 중앙 모달 — 충돌 아이템 비교 + 3가지 해결 옵션.
 */

"use client";

interface ConflictItem {
  id: string;
  name: string;
  time: string;
  category: string;
  icon: string;
}

interface ReplanConflictModalProps {
  open: boolean;
  onClose: () => void;
  conflictA: ConflictItem;
  conflictB: ConflictItem;
  onKeepA: () => void;
  onKeepB: () => void;
  onKeepBoth: () => void;
}

export default function ReplanConflictModal({
  open,
  onClose,
  conflictA,
  conflictB,
  onKeepA,
  onKeepB,
  onKeepBoth,
}: ReplanConflictModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-td-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="replan-conflict-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-surface-card rounded-md p-td-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-td-xs mb-td-md">
          <span className="material-symbols-outlined text-amber text-2xl">warning</span>
          <h2 id="replan-conflict-title" className="text-td-card-title font-bold text-ink">
            시간대 충돌
          </h2>
        </div>

        <p className="text-td-body text-ink-soft mb-td-md">
          두 일정이 같은 시간대에 겹칩니다. 어떻게 할까요?
        </p>

        {/* Conflict Comparison */}
        <div className="space-y-td-xs mb-td-md">
          {/* Item A */}
          <div className="flex items-center gap-td-sm p-td-sm bg-surface-soft rounded-md border border-divider">
            <span className="material-symbols-outlined text-purple text-xl">
              {conflictA.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-td-body font-medium text-ink truncate">{conflictA.name}</p>
              <p className="text-td-caption text-ink-soft">{conflictA.time}</p>
            </div>
            <span className="text-td-caption text-purple bg-purple-soft px-1.5 py-0.5 rounded-full">
              {conflictA.category}
            </span>
          </div>

          {/* VS divider */}
          <div className="flex items-center gap-td-xs">
            <div className="flex-1 h-px bg-divider" />
            <span className="text-td-meta font-bold text-ink-mute">VS</span>
            <div className="flex-1 h-px bg-divider" />
          </div>

          {/* Item B */}
          <div className="flex items-center gap-td-sm p-td-sm bg-surface-soft rounded-md border border-divider">
            <span className="material-symbols-outlined text-purple text-xl">
              {conflictB.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-td-body font-medium text-ink truncate">{conflictB.name}</p>
              <p className="text-td-caption text-ink-soft">{conflictB.time}</p>
            </div>
            <span className="text-td-caption text-purple bg-purple-soft px-1.5 py-0.5 rounded-full">
              {conflictB.category}
            </span>
          </div>
        </div>

        {/* Resolution Options */}
        <div className="space-y-td-xs">
          <button
            onClick={onKeepA}
            className="w-full py-td-xs rounded-md bg-purple text-white text-td-body font-semibold transition-opacity hover:opacity-90 flex items-center justify-center gap-td-xxs"
          >
            <span className="material-symbols-outlined text-lg">check</span>
            &ldquo;{conflictA.name}&rdquo; 유지
          </button>
          <button
            onClick={onKeepB}
            className="w-full py-td-xs rounded-md border-2 border-purple text-purple text-td-body font-semibold transition-colors hover:bg-purple-soft flex items-center justify-center gap-td-xxs"
          >
            <span className="material-symbols-outlined text-lg">check</span>
            &ldquo;{conflictB.name}&rdquo; 유지
          </button>
          <button
            onClick={onKeepBoth}
            className="w-full py-td-xs rounded-md border border-divider text-td-body font-semibold text-ink hover:bg-surface-soft transition-colors flex items-center justify-center gap-td-xxs"
          >
            <span className="material-symbols-outlined text-lg">schedule</span>
            둘 다 유지 (시간 조정)
          </button>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-td-sm right-td-sm p-1 rounded-full hover:bg-surface-soft transition-colors"
          aria-label="닫기"
        >
          <span className="material-symbols-outlined text-ink-mute text-xl">close</span>
        </button>
      </div>
    </div>
  );
}
