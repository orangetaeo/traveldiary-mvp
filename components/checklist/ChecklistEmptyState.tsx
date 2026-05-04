"use client";

/**
 * 사이클 QQ — ChecklistEmptyState (ChecklistView에서 추출).
 *
 * 답습: 사이클 LL/NN (presentation 컴포넌트 추출).
 * 책임: 비어있는 체크리스트의 템플릿 추가 CTA.
 */

interface Props {
  templateSize: number;
  isPending: boolean;
  onAddTemplate: () => void;
  /** C2 — "직접 추가" 콜백. 빈 상태에서 수동 입력 유도. */
  onAddManual?: () => void;
}

export function ChecklistEmptyState({
  templateSize,
  isPending,
  onAddTemplate,
  onAddManual,
}: Props) {
  return (
    <section className="bg-surface-card border border-divider rounded-xl p-td-md text-center">
      <span className="material-symbols-outlined text-ink-mute text-[32px] mb-td-xs block" aria-hidden>
        checklist
      </span>
      <p className="text-td-body text-ink mb-td-xs">
        아직 체크리스트가 비어있어요.
      </p>
      <p className="text-td-meta text-ink-soft mb-td-md">
        {templateSize}건의 기본 템플릿(서류·짐·반입금지·신고)을 한 번에 추가하거나,
        직접 항목을 추가해 보세요.
      </p>
      <div className="flex items-center justify-center gap-td-sm">
        <button
          type="button"
          onClick={onAddTemplate}
          disabled={isPending}
          className="bg-purple text-white py-2 px-td-md rounded-lg text-td-body font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {isPending ? "추가 중…" : "기본 템플릿 추가"}
        </button>
        {onAddManual && (
          <button
            type="button"
            onClick={onAddManual}
            className="text-purple-deep border border-purple/40 py-2 px-td-md rounded-lg text-td-body font-semibold hover:bg-purple-soft transition-colors"
          >
            직접 추가하기
          </button>
        )}
      </div>
    </section>
  );
}
