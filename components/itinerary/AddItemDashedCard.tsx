"use client";

/**
 * AddItemDashedCard — Day 카드 섹션 마지막의 "+ 일정 추가" dashed 빈 카드 (U1, 사이클 디자인 갭 #1).
 *
 * 사용자 진단: DayTabsBar 헤더 옆 + FAB가 "Day 추가"로 오해됨.
 * 해결: + FAB 제거 + Day 카드 섹션 마지막에 dashed 카드(이 위치가 "여기에 추가"임을 시각적으로 전달).
 *
 * emphasized=true: 빈 Day(item 0건)일 때 메인 진입점으로 강조 (보라 톤 + 안내 문구).
 */

interface Props {
  onClick: () => void;
  emphasized?: boolean;
}

export function AddItemDashedCard({ onClick, emphasized = false }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="이 날에 일정 추가"
      data-testid="add-item-dashed-card"
      className={`relative w-full py-td-md rounded-md border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-1 ${
        emphasized
          ? "border-purple/40 bg-purple-soft/30 hover:border-purple hover:bg-purple-soft/50"
          : "border-divider bg-transparent hover:border-purple hover:bg-purple-soft/20"
      }`}
    >
      <span
        className={`material-symbols-outlined text-td-icon-xl ${
          emphasized ? "text-purple" : "text-ink-mute"
        }`}
        aria-hidden
      >
        add
      </span>
      <span className="text-td-meta text-ink-soft font-medium">
        {emphasized ? "이 날에 첫 일정 추가하기" : "+ 일정 추가"}
      </span>
    </button>
  );
}
