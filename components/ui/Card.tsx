import { ReactNode } from "react";

type CardVariant = "plain" | "raised" | "featured";

interface CardProps {
  variant?: CardVariant;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * 카드 — 정보 단위
 *
 * - plain    : 회색 배경, 보조 정보 (통계·요약)
 * - raised   : 흰색 배경 + 회색 테두리, 주요 단위 (일정 항목)
 * - featured : 흰색 배경 + 2px 보라 테두리, 한 화면 1개만 (AI 1순위)
 */
export function Card({ variant = "raised", children, className = "", onClick }: CardProps) {
  const base = "rounded-lg p-4 transition-colors";

  const styles: Record<CardVariant, string> = {
    plain: "bg-surface-soft",
    raised: "bg-surface-card border border-divider",
    featured: "bg-surface-card border-2 border-purple",
  };

  const interactive = onClick ? "cursor-pointer hover:border-ink-mute" : "";

  return (
    <div
      className={`${base} ${styles[variant]} ${interactive} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
