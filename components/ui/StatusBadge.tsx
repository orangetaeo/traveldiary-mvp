/**
 * StatusBadge — 사이클 E (ADR-031, T17 + T13 합의).
 *
 * 검증 뱃지 공통 컴포넌트.
 *   - tone: success / warn / danger / meta
 *   - icon: material-symbols
 *   - title (primary) + subtitle (secondary)
 *   - emphasized: mismatch 시각 강화 (ring-2)
 *
 * Booking·Distance·Price 뱃지가 모두 같은 구조 → 추출.
 * 디자인 토큰만 사용 (하드코딩 hex 금지).
 */

import type { ReactNode } from "react";

export type BadgeTone = "success" | "warn" | "danger" | "meta";

export interface StatusBadgeProps {
  tone: BadgeTone;
  icon: string;
  title: string;
  subtitle?: ReactNode;
  /** 우선순위 강조 — danger·중요 경고 시 true */
  emphasized?: boolean;
  /** A11y label */
  ariaLabel: string;
}

const TONE_MAP: Record<
  BadgeTone,
  {
    container: string;
    iconClass: string;
    titleClass: string;
    subtitleClass: string;
    iconFilled: boolean;
  }
> = {
  success: {
    container: "bg-success-soft border border-success-soft",
    iconClass: "text-success-deep",
    titleClass: "text-success-deep",
    subtitleClass: "text-success-deep/80",
    iconFilled: true,
  },
  warn: {
    container: "bg-amber-soft border border-amber-soft",
    iconClass: "text-amber-deep",
    titleClass: "text-amber-deep",
    subtitleClass: "text-amber-deep/80",
    iconFilled: true,
  },
  danger: {
    container: "bg-danger-soft border border-danger-soft",
    iconClass: "text-danger",
    titleClass: "text-danger-deep",
    subtitleClass: "text-danger-deep/80",
    iconFilled: true,
  },
  meta: {
    container: "bg-surface-soft border border-divider",
    iconClass: "text-ink-mute",
    titleClass: "text-ink-soft",
    subtitleClass: "text-ink-mute",
    iconFilled: false,
  },
};

export function StatusBadge({
  tone,
  icon,
  title,
  subtitle,
  emphasized = false,
  ariaLabel,
}: StatusBadgeProps) {
  const toneCss = TONE_MAP[tone];
  const iconCss = `${toneCss.iconFilled ? "filled " : ""}material-symbols-outlined ${toneCss.iconClass}`;

  // 사이클 E (T17): mismatch/danger 강조 — border-l-4 + ring-2
  const emphasis = emphasized
    ? "border-l-4 ring-2 ring-danger/30"
    : "";

  // meta 톤은 위계 낮춰 title을 작게 (text-td-meta), 다른 톤은 강조 (text-td-body)
  const titleSize = tone === "meta" ? "text-td-meta font-medium" : "text-td-body font-semibold";

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={`flex items-start gap-td-xs p-td-sm rounded-md ${toneCss.container} ${emphasis}`}
    >
      <span className={iconCss} aria-hidden>
        {icon}
      </span>
      <div className="flex flex-col">
        <span className={`${titleSize} ${toneCss.titleClass}`}>{title}</span>
        {subtitle && (
          <span className={`text-td-caption ${toneCss.subtitleClass}`}>{subtitle}</span>
        )}
      </div>
    </div>
  );
}
