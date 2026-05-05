"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/**
 * EmptyState — 4 페이지 빈 상태 공통 시각 (Stitch 시안 9ea27f2d0ef84ec8852527b8933f57ed).
 *
 * 시안 4 artboard:
 *   A. Empty Trips     — explore       — 도시 chips + 데모 링크
 *   B. Empty Checklist — checklist     — 추천 항목 미리보기 + 템플릿/직접 버튼
 *   C. Empty Cost      — payments      — 빈 차트 + 환율 링크
 *   D. Empty Vote      — how_to_vote   — 예시 카드 + 공유 링크
 *
 * 공통 구조:
 *   원형 아이콘 (bg-purple-soft p-lg rounded-full) + 48px material symbol
 *   title (text-td-title)
 *   description (text-td-body, max-w-[240px])
 *   children (visual placeholder — chips/preview/chart)
 *   primaryButton / secondaryButton / link
 *
 * 호스트가 카드 wrapper(border/padding/bg) 결정. 본 컴포넌트는 컨텐츠만.
 */

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}

export interface EmptyStateLink {
  label: string;
  href: string;
}

interface EmptyStateProps {
  /** Material Symbols Outlined 아이콘 이름 (explore, checklist, payments, how_to_vote) */
  icon: string;
  title: string;
  description?: string;
  /** 시안 visual 슬롯 (chips/preview/chart 등) */
  children?: ReactNode;
  /** primary 버튼 — bg-purple + text-white */
  primaryButton?: EmptyStateAction;
  /** secondary 버튼 — outline */
  secondaryButton?: EmptyStateAction;
  /** 보조 텍스트 링크 ("환율 보기 →" 같은) */
  link?: EmptyStateLink;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  children,
  primaryButton,
  secondaryButton,
  link,
  className,
}: EmptyStateProps) {
  return (
    <section
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center text-center px-td-md py-td-lg ${
        className ?? ""
      }`.trim()}
    >
      <div className="bg-purple-soft p-td-md rounded-full mb-td-md">
        <span
          className="material-symbols-outlined text-purple-deep text-[48px] block"
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>

      <h2 className="text-td-card-title text-ink mb-td-xs">{title}</h2>

      {description && (
        <p className="text-td-body text-ink-soft max-w-[280px] mb-td-md">
          {description}
        </p>
      )}

      {children && <div className="w-full mb-td-md">{children}</div>}

      {(primaryButton || secondaryButton) && (
        <div className="flex flex-col w-full max-w-[280px] gap-td-xs">
          {primaryButton && <PrimaryAction action={primaryButton} />}
          {secondaryButton && <SecondaryAction action={secondaryButton} />}
        </div>
      )}

      {link && (
        <Link
          href={link.href}
          className="mt-td-sm text-td-meta text-purple-deep font-medium hover:underline"
        >
          {link.label} →
        </Link>
      )}
    </section>
  );
}

function PrimaryAction({ action }: { action: EmptyStateAction }) {
  const className =
    "w-full py-td-sm px-td-md bg-purple text-white font-semibold rounded-md hover:opacity-90 disabled:opacity-60 transition-opacity";
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
      disabled={action.disabled}
      className={className}
    >
      {action.label}
    </button>
  );
}

function SecondaryAction({ action }: { action: EmptyStateAction }) {
  const className =
    "w-full py-td-sm px-td-md border border-purple/40 text-purple-deep font-semibold rounded-md hover:bg-purple-soft transition-colors disabled:opacity-60";
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
      disabled={action.disabled}
      className={className}
    >
      {action.label}
    </button>
  );
}
