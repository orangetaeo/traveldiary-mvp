import { ReactNode, ButtonHTMLAttributes } from "react";

type ButtonVariant = "secondary" | "primary" | "decisive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
}

/**
 * 버튼 — 3단계 위계
 *
 * - secondary (흰색): 대안·취소·보기
 * - primary   (보라): 예약·교체 등 진행
 * - decisive  (검정): 적용·완료 등 최종 결정. 한 화면에 1개만.
 */
export function Button({
  variant = "secondary",
  size = "md",
  fullWidth = false,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  const sizes: Record<ButtonSize, string> = {
    sm: "text-xs px-3 py-2",
    md: "text-sm px-4 py-2.5",
    lg: "text-sm px-4 py-3 font-medium",
  };

  const variants: Record<ButtonVariant, string> = {
    secondary:
      "bg-transparent border border-divider text-ink hover:bg-surface-soft active:scale-[0.98]",
    primary:
      "bg-purple-soft text-purple-deep border border-purple hover:bg-purple hover:text-white active:scale-[0.98]",
    decisive:
      "bg-ink text-white border border-ink hover:opacity-90 active:scale-[0.98] disabled:bg-surface-soft disabled:text-ink-mute disabled:border-divider disabled:cursor-not-allowed",
  };

  const width = fullWidth ? "w-full" : "";

  return (
    <button
      className={`rounded-md transition-all ${sizes[size]} ${variants[variant]} ${width} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
