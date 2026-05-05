"use client";

import type { ToastData, ToastVariant } from "@/lib/hooks/useToast";

/**
 * 토스트 메시지 표시 컴포넌트 (Stitch 시안 a66c84466c91426d8833d271e5fa6459).
 *
 * 호출 모드:
 *   1) BC — <Toast message={message} className?={...} />
 *      단순 ink pill (기존 호출처). className은 wrapper 전체 override.
 *   2) variant — <Toast toast={toast} className?={...} />
 *      variant + subtitle + action. className은 wrapper "위치"만 override
 *      (variant 색·구조는 보존). 호출처가 BottomNav 회피 등 위치 customization 시 사용.
 *
 * variant:
 *   neutral — 기본 ink-dark
 *   success — green border-l + check_circle
 *   info    — purple border-l + psychology
 *   warning — amber border-l + schedule
 *   danger  — red border-l + emergency
 *   undo    — ink-dark + 보라 액션 버튼 (action 필수)
 */
const DEFAULT_CLASS =
  "fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-ink text-white text-td-meta px-4 py-2.5 rounded-full shadow-lg max-w-[90vw] text-center";

export interface ToastProps {
  /** BC: 단순 메시지 (variant 없음) */
  message?: string | null;
  /** 신규: variant + subtitle + action */
  toast?: ToastData | null;
  /**
   * className 의미:
   *   - BC mode (message): wrapper 전체 override (위치+스타일 모두)
   *   - variant mode (toast): wrapper "위치"만 override. variant 색·구조 보존.
   */
  className?: string;
}

const DEFAULT_VARIANT_POSITION =
  "fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[min(420px,90vw)]";

export function Toast({ message, toast, className }: ToastProps) {
  if (toast) {
    return <ToastVariantRender toast={toast} positionClass={className} />;
  }
  if (!message) return null;
  return (
    <div className={className ?? DEFAULT_CLASS} role="status">
      {message}
    </div>
  );
}

interface VariantStyle {
  bg: string;
  border: string;
  icon: string;
  iconColor: string;
  titleColor: string;
  subtitleColor: string;
}

const VARIANT_STYLES: Record<ToastVariant, VariantStyle> = {
  neutral: {
    bg: "bg-ink",
    border: "",
    icon: "info",
    iconColor: "text-white",
    titleColor: "text-white",
    subtitleColor: "text-white/80",
  },
  success: {
    bg: "bg-success-soft",
    border: "border-l-4 border-success",
    icon: "check_circle",
    iconColor: "text-success-deep",
    titleColor: "text-ink",
    subtitleColor: "text-ink-soft",
  },
  info: {
    bg: "bg-purple-soft",
    border: "border-l-4 border-purple",
    icon: "psychology",
    iconColor: "text-purple-deep",
    titleColor: "text-ink",
    subtitleColor: "text-purple-deep",
  },
  warning: {
    bg: "bg-amber-soft",
    border: "border-l-4 border-amber",
    icon: "schedule",
    iconColor: "text-amber-deep",
    titleColor: "text-ink",
    subtitleColor: "text-ink-soft",
  },
  danger: {
    bg: "bg-danger-soft",
    border: "border-l-4 border-danger",
    icon: "emergency",
    iconColor: "text-danger-deep",
    titleColor: "text-danger-deep",
    subtitleColor: "text-danger-deep",
  },
  undo: {
    bg: "bg-ink",
    border: "",
    icon: "",
    iconColor: "",
    titleColor: "text-white",
    subtitleColor: "text-white/80",
  },
};

function ToastVariantRender({
  toast,
  positionClass,
}: {
  toast: ToastData;
  positionClass?: string;
}) {
  const style = VARIANT_STYLES[toast.variant];
  const wrapperPosition = positionClass ?? DEFAULT_VARIANT_POSITION;

  return (
    <div
      role="status"
      className={`${wrapperPosition} flex items-center gap-td-md min-h-[52px] ${style.bg} ${style.border} rounded-md shadow-lg px-td-md py-td-sm`}
    >
      {style.icon && (
        <span
          className={`material-symbols-outlined ${style.iconColor} shrink-0`}
          aria-hidden="true"
        >
          {style.icon}
        </span>
      )}
      <div className="flex-1 min-w-0 flex flex-col">
        <span className={`text-td-body font-medium ${style.titleColor}`}>
          {toast.message}
        </span>
        {toast.subtitle && (
          <span className={`text-td-caption ${style.subtitleColor} opacity-90`}>
            {toast.subtitle}
          </span>
        )}
      </div>
      {toast.action && (
        <button
          type="button"
          onClick={toast.action.onClick}
          className="bg-purple-soft text-purple-deep px-td-sm py-1 rounded text-td-caption font-medium shrink-0 active:scale-95 transition-transform"
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
}
