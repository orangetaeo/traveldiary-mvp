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
}

export function ChecklistEmptyState({
  templateSize,
  isPending,
  onAddTemplate,
}: Props) {
  return (
    <section className="bg-surface-card border border-divider rounded-xl p-td-md text-center">
      <p className="text-td-body text-ink mb-td-xs">
        아직 체크리스트가 비어있어요.
      </p>
      <p className="text-td-meta text-ink-soft mb-td-md">
        {templateSize}건의 기본 템플릿(서류·짐·반입금지·신고)을 한 번에 추가할 수
        있습니다.
      </p>
      <button
        type="button"
        onClick={onAddTemplate}
        disabled={isPending}
        className="bg-purple text-white py-2 px-td-md rounded-lg text-td-body font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
      >
        {isPending ? "추가 중…" : "기본 템플릿 추가"}
      </button>
    </section>
  );
}
