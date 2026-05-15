import { ReactNode } from "react";

type BadgeTone = "info" | "amber" | "danger" | "success" | "neutral" | "accent";

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

/**
 * 배지 — 상태 표시
 *
 * 룰:
 * - 2~8자 짧은 라벨
 * - 항상 카드 우상단 또는 항목 옆에
 * - 본문 안에 박지 않음
 * - 색은 컬러 시스템 따라 (의미 매핑)
 */
export function Badge({ tone = "neutral", children, className = "" }: BadgeProps) {
  const styles: Record<BadgeTone, string> = {
    info: "bg-purple-soft text-purple-deep",
    amber: "bg-amber-soft text-amber-deep",
    danger: "bg-danger-soft text-danger-deep",
    success: "bg-success-soft text-success-deep",
    neutral: "bg-surface-soft text-ink-soft",
    accent: "bg-accent-soft text-accent-deep",
  };

  return (
    <span
      className={`inline-block text-td-caption px-2 py-0.5 rounded-full ${styles[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
