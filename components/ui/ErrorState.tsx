"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/**
 * ErrorState — 3 오류 상태 공통 시각 (Stitch 시안 e5c5453a01f44dea9f30d2e2a3b3e24d).
 *
 * 시안 3 artboard:
 *   not_found  — explore_off + "404" 라벨 (slate)
 *   forbidden  — lock_person + "권한 없음" 라벨 (amber tracking-wider)
 *   demo_mode  — cloud_off   + "데모 모드" 배지 (amber 강조)
 *
 * 공통 구조:
 *   원형 아이콘 컨테이너 (variant마다 색 다름)
 *   상태 라벨 (caption uppercase tracking)
 *   title (text-td-card-title bold)
 *   description (text-td-body)
 *   children (info card / feature list 슬롯)
 *   primaryAction — bg-ink + 흰 텍스트
 *   secondaryAction — 보라 텍스트 + arrow_forward
 *
 * EmptyState와 분리 사유:
 *   "데이터 없음(생성 유도)" vs "오류/차단(회복·상태 안내)" — 의미가 다름.
 *   primary 색도 다름 (purple vs ink).
 */

export type ErrorVariant = "not_found" | "forbidden" | "demo_mode";

export interface ErrorStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

interface ErrorStateProps {
  variant: ErrorVariant;
  title: string;
  description?: string;
  /** info card / feature list 추가 콘텐츠 */
  children?: ReactNode;
  /** primary 버튼 — bg-ink (어둠) */
  primaryAction?: ErrorStateAction;
  /** secondary — 보라 텍스트 + arrow_forward 아이콘 */
  secondaryAction?: ErrorStateAction;
  /** variant 라벨 override (default는 variant 기반) */
  label?: string;
  className?: string;
}

interface VariantStyle {
  icon: string;
  iconBg: string;
  iconColor: string;
  defaultLabel: string;
  labelClasses: string;
}

const VARIANT_STYLES: Record<ErrorVariant, VariantStyle> = {
  not_found: {
    icon: "explore_off",
    iconBg: "bg-divider/40",
    iconColor: "text-ink-soft",
    defaultLabel: "404",
    labelClasses:
      "text-td-caption text-ink-soft tracking-[0.2em] uppercase font-medium",
  },
  forbidden: {
    icon: "lock_person",
    iconBg: "bg-divider/40",
    iconColor: "text-ink-soft",
    defaultLabel: "권한 없음",
    labelClasses:
      "text-td-caption text-amber-deep tracking-wider uppercase font-medium",
  },
  demo_mode: {
    icon: "cloud_off",
    iconBg: "bg-amber-soft",
    iconColor: "text-amber",
    defaultLabel: "데모 모드",
    labelClasses:
      "text-td-caption text-amber-deep px-2 py-0.5 bg-amber-soft border border-amber/30 rounded-full font-medium",
  },
};

export function ErrorState({
  variant,
  title,
  description,
  children,
  primaryAction,
  secondaryAction,
  label,
  className,
}: ErrorStateProps) {
  const style = VARIANT_STYLES[variant];
  const labelText = label ?? style.defaultLabel;

  return (
    <section
      role="alert"
      className={`flex flex-col items-center justify-center text-center px-td-md py-td-lg gap-td-md ${
        className ?? ""
      }`.trim()}
    >
      <div className={`p-td-md rounded-full ${style.iconBg}`}>
        <span
          className={`material-symbols-outlined ${style.iconColor} text-[48px] block`}
          aria-hidden="true"
        >
          {style.icon}
        </span>
      </div>

      <div className="flex flex-col items-center gap-td-xs">
        <span className={style.labelClasses}>{labelText}</span>
        <h2 className="text-td-card-title font-bold text-ink">{title}</h2>
        {description && (
          <p className="text-td-body text-ink-soft max-w-[280px] whitespace-pre-line">
            {description}
          </p>
        )}
      </div>

      {children && <div className="w-full max-w-[320px]">{children}</div>}

      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col w-full max-w-[280px] gap-td-sm">
          {primaryAction && <PrimaryAction action={primaryAction} />}
          {secondaryAction && <SecondaryAction action={secondaryAction} />}
        </div>
      )}
    </section>
  );
}

function PrimaryAction({ action }: { action: ErrorStateAction }) {
  const className =
    "w-full py-td-sm px-td-md bg-ink text-white font-medium rounded-md active:scale-[0.98] transition-transform";
  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {action.label}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={action.onClick}
      className={className}
    >
      {action.label}
    </button>
  );
}

function SecondaryAction({ action }: { action: ErrorStateAction }) {
  const inner = (
    <>
      <span>{action.label}</span>
      <span
        className="material-symbols-outlined text-td-icon"
        aria-hidden="true"
      >
        arrow_forward
      </span>
    </>
  );
  const className =
    "w-full py-1 text-purple-deep font-medium flex items-center justify-center gap-1 active:scale-95 transition-transform";
  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={action.onClick} className={className}>
      {inner}
    </button>
  );
}
