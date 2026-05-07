/**
 * QuickActions — Stitch #2 Trip Dashboard 빠른 작업 3 버튼 (사이클 (Session F+1)).
 *
 * 시안 매핑:
 *   - 일정 보기 (primary, calendar_month) → /itinerary/[tripId]
 *   - 체크리스트 (outline, fact_check) → /checklist/[tripId]
 *   - 비용 관리 (outline, account_balance_wallet) → /cost/[tripId]
 */

import Link from "next/link";

interface QuickActionsProps {
  tripId: string;
}

export function QuickActions({ tripId }: QuickActionsProps) {
  return (
    <section aria-label="빠른 작업" className="mt-td-lg pb-td-md">
      <h3 className="text-td-card-title text-ink mb-td-sm px-td-xs">
        빠른 작업
      </h3>
      <div className="flex gap-td-sm">
        <ActionButton
          href={`/itinerary/${tripId}`}
          icon="calendar_month"
          label="일정 보기"
          primary
        />
        <ActionButton
          href={`/checklist/${tripId}`}
          icon="fact_check"
          label="체크리스트"
        />
        <ActionButton
          href={`/cost/${tripId}`}
          icon="account_balance_wallet"
          label="비용 관리"
        />
      </div>
    </section>
  );
}

function ActionButton({
  href,
  icon,
  label,
  primary = false,
}: {
  href: string;
  icon: string;
  label: string;
  primary?: boolean;
}) {
  const className = primary
    ? "flex-1 bg-purple text-white py-td-sm px-td-xs rounded-md flex items-center justify-center gap-td-xs text-td-body font-medium shadow-sm hover:opacity-90 transition-opacity"
    : "flex-1 bg-surface-card border border-divider text-ink py-td-sm px-td-xs rounded-md flex items-center justify-center gap-td-xs text-td-body font-medium hover:bg-surface-soft transition-colors";
  return (
    <Link href={href} className={className}>
      <span
        className="material-symbols-outlined text-td-icon"
        aria-hidden
      >
        {icon}
      </span>
      {label}
    </Link>
  );
}
