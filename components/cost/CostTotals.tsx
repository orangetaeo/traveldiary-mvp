"use client";

/**
 * 사이클 NN — CostTotals (CostView에서 추출).
 *
 * 답습: 사이클 LL AddCostForm (presentation 컴포넌트 추출).
 * 책임: paid/booked/planned 합계 표시. entries로부터 useMemo 계산.
 */

import { useMemo } from "react";
import type { CostEntry } from "@/lib/types";

interface Props {
  entries: CostEntry[];
  destination: string;
  currency: string;
  currencySymbol: string;
  approxKrwRate: number;
}

export function CostTotals({
  entries,
  destination,
  currency,
  currencySymbol,
  approxKrwRate,
}: Props) {
  const totals = useMemo(() => {
    const paid = entries
      .filter((e) => e.status === "paid")
      .reduce((sum, e) => sum + e.amountKrw, 0);
    const booked = entries
      .filter((e) => e.status === "booked")
      .reduce((sum, e) => sum + e.amountKrw, 0);
    const planned = entries
      .filter((e) => e.status === "planned")
      .reduce((sum, e) => sum + e.amountKrw, 0);
    return { paid, booked, planned, total: paid + booked + planned };
  }, [entries]);

  return (
    <section className="py-td-lg">
      <p className="text-td-meta text-ink-soft mb-td-xxs">
        {destination} · {currency} (1 KRW ≈ {approxKrwRate}
        {currencySymbol})
      </p>
      <h2 className="text-td-title text-ink tabular-nums">
        합계 {totals.total.toLocaleString()}원
      </h2>
      <div className="grid grid-cols-3 gap-td-xs mt-td-md">
        <div className="bg-success-soft p-td-sm rounded-md">
          <p className="text-td-caption text-success-deep uppercase">결제</p>
          <p className="text-td-card-title text-success-deep tabular-nums">
            {totals.paid.toLocaleString()}원
          </p>
        </div>
        <div className="bg-purple-soft p-td-sm rounded-md">
          <p className="text-td-caption text-purple-deep uppercase">예약</p>
          <p className="text-td-card-title text-purple-deep tabular-nums">
            {totals.booked.toLocaleString()}원
          </p>
        </div>
        <div className="bg-amber-soft p-td-sm rounded-md">
          <p className="text-td-caption text-amber-deep uppercase">예정</p>
          <p className="text-td-card-title text-amber-deep tabular-nums">
            {totals.planned.toLocaleString()}원
          </p>
        </div>
      </div>
    </section>
  );
}
