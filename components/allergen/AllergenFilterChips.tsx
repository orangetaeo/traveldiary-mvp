"use client";

import type { AllergenChipItem } from "@/lib/allergens";

/**
 * AllergenFilterChips — 알레르기/식이/관심사 가로 스크롤 필터 바.
 *
 * Stitch 시안 (3d3e1a364719434f8a0e8d0459a689ae) 매칭.
 *
 * 룰 (시안 spec sheet):
 *   - danger 칩(알레르기·식이 제한)은 항상 왼쪽 가장 앞
 *   - danger 칩은 빨강 테두리/텍스트로 시각 분리
 *   - active danger = bg-danger-soft 채움
 *   - neutral 칩과 사이에 vertical divider 1px
 *   - active neutral = bg-purple 채움 (white 텍스트)
 *
 * 데이터:
 *   - lib/allergens.ts ALLERGEN_CHIPS와 호환 (AllergenChipItem 도메인 타입)
 *   - severity 명시 안 하면 neutral 처리
 */

// AllergenChipItem 타입은 lib/allergens.ts가 정본. 외부 호출처 편의를 위해 re-export.
export type { AllergenChipItem };

interface AllergenFilterChipsProps {
  items: AllergenChipItem[];
  /** 활성된 raw 값들 */
  selected: string[];
  onToggle: (raw: string) => void;
  /** + 버튼 클릭 (생략 시 + 비표시) */
  onAdd?: () => void;
  ariaLabel?: string;
}

export function AllergenFilterChips({
  items,
  selected,
  onToggle,
  onAdd,
  ariaLabel = "알레르기·관심사 필터",
}: AllergenFilterChipsProps) {
  const dangerItems = items.filter((i) => i.severity === "danger");
  const neutralItems = items.filter((i) => i.severity !== "danger");

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="relative h-11 flex items-center bg-surface-soft border-b border-divider overflow-hidden"
    >
      <div className="flex items-center gap-1.5 overflow-x-auto touch-pan-x overscroll-x-contain px-td-md w-full hide-scrollbar pr-12">
        {dangerItems.map((item) => (
          <Chip
            key={item.raw}
            item={item}
            active={selected.includes(item.raw)}
            onToggle={() => onToggle(item.raw)}
          />
        ))}

        {dangerItems.length > 0 && neutralItems.length > 0 && (
          <span
            className="w-px h-4 bg-divider shrink-0 mx-1"
            aria-hidden="true"
          />
        )}

        {neutralItems.map((item) => (
          <Chip
            key={item.raw}
            item={item}
            active={selected.includes(item.raw)}
            onToggle={() => onToggle(item.raw)}
          />
        ))}
      </div>

      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          aria-label="필터 추가"
          className="absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-surface-soft via-surface-soft to-transparent flex items-center justify-end pr-3"
        >
          <span
            className="material-symbols-outlined text-ink-soft text-td-icon-lg"
            aria-hidden="true"
          >
            add
          </span>
        </button>
      )}
    </div>
  );
}

function Chip({
  item,
  active,
  onToggle,
}: {
  item: AllergenChipItem;
  active: boolean;
  onToggle: () => void;
}) {
  const isDanger = item.severity === "danger";

  const stateClasses = (() => {
    if (isDanger && active) {
      return "bg-danger-soft text-danger-deep border border-transparent font-medium focus-visible:outline-danger";
    }
    if (isDanger) {
      return "border border-danger-deep text-danger-deep focus-visible:outline-danger";
    }
    if (active) {
      return "bg-purple text-white border border-transparent font-medium focus-visible:outline-purple";
    }
    return "border border-divider text-ink-soft focus-visible:outline-purple";
  })();

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`shrink-0 px-2 py-1 rounded-full text-td-caption flex items-center gap-1 transition-colors focus-visible:outline focus-visible:outline-2 ${stateClasses}`}
    >
      {item.icon && (
        <span
          className={`material-symbols-outlined text-td-icon-xs ${
            active && isDanger ? "filled" : ""
          }`}
          aria-hidden="true"
        >
          {item.icon}
        </span>
      )}
      <span>{item.label}</span>
    </button>
  );
}
