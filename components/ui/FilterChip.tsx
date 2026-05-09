"use client";

import { ReactNode } from "react";

type ChipVariant = "default" | "danger";

interface FilterChipProps {
  active?: boolean;
  variant?: ChipVariant;
  /** Material Symbols Outlined 아이콘 이름 */
  icon?: string;
  children: ReactNode;
  onClick?: () => void;
}

/**
 * 필터 칩 — 선택 가능한 토글
 *
 * Stitch 시안 (3d3e1a364719434f8a0e8d0459a689ae) 매칭.
 *
 * 룰:
 * - 한 줄 가로 스크롤 (부모에서 처리)
 * - 알레르기 같은 위험 칩은 가장 왼쪽 + variant="danger"
 * - 꺼진 상태: 투명 + 회색 테두리
 * - 켜진 상태: 색상 채움 (default=보라, danger=danger-soft+danger-deep 텍스트)
 * - icon 지원: Material Symbols 18px 아이콘 칩 앞에 표시
 */
export function FilterChip({
  active = false,
  variant = "default",
  icon,
  children,
  onClick,
}: FilterChipProps) {
  const base = "text-td-caption px-3 py-1.5 rounded-full whitespace-nowrap transition-colors flex items-center gap-1";

  let style = "";
  if (active && variant === "danger") {
    style = "bg-danger-soft text-danger-deep border border-transparent font-medium";
  } else if (active) {
    style = "bg-purple text-white border border-purple";
  } else if (variant === "danger") {
    style = "bg-transparent text-danger-deep border border-danger-deep";
  } else {
    style = "bg-transparent text-ink-soft border border-divider";
  }

  return (
    <button className={`${base} ${style}`} onClick={onClick}>
      {icon && (
        <span
          className={`material-symbols-outlined text-td-icon-xs ${active && variant === "danger" ? "filled" : ""}`}
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}
