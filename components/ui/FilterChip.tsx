"use client";

import { ReactNode } from "react";

type ChipVariant = "default" | "danger";

interface FilterChipProps {
  active?: boolean;
  variant?: ChipVariant;
  children: ReactNode;
  onClick?: () => void;
}

/**
 * 필터 칩 — 선택 가능한 토글
 *
 * 룰:
 * - 한 줄 가로 스크롤 (부모에서 처리)
 * - 알레르기 같은 위험 칩은 가장 왼쪽 + variant="danger"
 * - 꺼진 상태: 투명 + 회색 테두리
 * - 켜진 상태: 색상 채움 (default=보라, danger=빨강)
 */
export function FilterChip({
  active = false,
  variant = "default",
  children,
  onClick,
}: FilterChipProps) {
  const base = "text-[11px] px-3 py-1.5 rounded-full whitespace-nowrap transition-colors";

  let style = "";
  if (active && variant === "danger") {
    style = "bg-danger-soft text-danger-deep border border-danger";
  } else if (active) {
    style = "bg-purple text-white border border-purple";
  } else if (variant === "danger") {
    style = "bg-transparent text-ink-soft border border-danger/40";
  } else {
    style = "bg-transparent text-ink-soft border border-divider";
  }

  return (
    <button className={`${base} ${style}`} onClick={onClick}>
      {children}
    </button>
  );
}
