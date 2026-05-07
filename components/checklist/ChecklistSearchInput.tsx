"use client";

/**
 * 사이클 OO — 체크리스트 텍스트 검색 입력.
 *
 * controlled input. value/onChange + clear 버튼. 한국어 IME 호환 위해
 * 별다른 normalize는 하지 않고 부모에서 trim+lowercase로 비교.
 */

interface Props {
  value: string;
  onChange: (next: string) => void;
}

export function ChecklistSearchInput({ value, onChange }: Props) {
  const hasValue = value.length > 0;
  return (
    <div className="relative">
      <span
        className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute pointer-events-none text-td-icon"
        aria-hidden
      >
        search
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="항목·도시 메모 검색"
        aria-label="체크리스트 검색"
        className="w-full pl-10 pr-10 py-2 rounded-md border border-divider bg-surface-card text-td-meta text-ink placeholder-ink-mute focus:outline-none focus:border-purple"
      />
      {hasValue && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="검색어 지우기"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-mute hover:text-ink"
        >
          <span className="material-symbols-outlined text-td-icon" aria-hidden="true">close</span>
        </button>
      )}
    </div>
  );
}
