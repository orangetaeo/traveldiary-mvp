"use client";

/**
 * Cost 클라이언트 뷰 — M6 사이클 9.
 *
 * 이중통화 입력: KRW 또는 현지통화 둘 중 하나만 입력하면 자동 변환 (city.payment.approxKrwRate 사용).
 * 데모 trip: demo:true → 클라이언트 시뮬.
 */

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addCost, deleteCost } from "@/actions/cost";
import type { CostEntry, CostStatus, Trip } from "@/lib/types";
import { SettlementCard } from "./SettlementCard";
import { AddCostForm } from "./AddCostForm";

interface Props {
  trip: Trip;
  initialEntries: CostEntry[];
  currency: string;
  currencySymbol: string;
  approxKrwRate: number; // 1 KRW = ?? local
}

const STATUS_LABEL: Record<CostStatus, string> = {
  paid: "결제 완료",
  booked: "예약 (선결제)",
  planned: "예정",
};

const STATUS_TONE: Record<CostStatus, string> = {
  paid: "bg-success-soft text-success-deep",
  booked: "bg-purple-soft text-purple-deep",
  planned: "bg-amber-soft text-amber-deep",
};

const CATEGORY_OPTIONS = [
  { id: "food", label: "식비" },
  { id: "transport", label: "교통" },
  { id: "accommodation", label: "숙박" },
  { id: "shopping", label: "쇼핑" },
  { id: "activity", label: "액티비티" },
  { id: "other", label: "기타" },
];

export function CostView({
  trip,
  initialEntries,
  currency,
  currencySymbol,
  approxKrwRate,
}: Props) {
  const router = useRouter();
  const [entries, setEntries] = useState<CostEntry[]>(initialEntries);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

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

  // 사이클 II — splitSummary는 SettlementCard로 이전 (settlement.computeSettlement)

  function showToast(msg: string, ms = 3500) {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  }

  function handleAdd(input: {
    label: string;
    amountKrw: number;
    amountLocal?: { value: number; currency: string };
    status: CostStatus;
    category: string;
    date: string;
    splitWith?: Array<string | { name: string; weight?: number }>;
  }) {
    startTransition(async () => {
      const result = await addCost({
        tripId: trip.id,
        date: input.date,
        label: input.label,
        amountKrw: input.amountKrw,
        amountLocal: input.amountLocal,
        status: input.status,
        category: input.category,
        splitWith: input.splitWith,
      });
      if (!result.ok) {
        showToast(`추가 실패: ${result.code}`);
        return;
      }
      if (result.demo) {
        const now = new Date().toISOString();
        setEntries((prev) => [
          {
            id: `demo-${Date.now()}`,
            tripId: trip.id,
            date: input.date,
            label: input.label,
            amountKrw: input.amountKrw,
            amountLocal: input.amountLocal,
            status: input.status,
            category: input.category,
            splitWith: input.splitWith,
            createdAt: now,
            updatedAt: now,
          },
          ...prev,
        ]);
        showToast("비용 추가 (데모 시뮬)");
      } else {
        showToast(`비용 추가됨 — ${input.amountKrw.toLocaleString()}원`);
        router.refresh();
      }
    });
  }

  function handleDelete(entry: CostEntry) {
    if (!confirm(`"${entry.label}" 비용을 삭제할까요?`)) return;

    setEntries((prev) => prev.filter((e) => e.id !== entry.id));

    startTransition(async () => {
      const result = await deleteCost({ id: entry.id, tripId: trip.id });
      if (!result.ok) {
        // 롤백
        setEntries((prev) => [entry, ...prev]);
        showToast(`삭제 실패: ${result.code}`);
        return;
      }
      if (!result.demo) {
        showToast("삭제됨 (DB 영속화)");
        router.refresh();
      } else {
        showToast("삭제 (데모 시뮬)");
      }
    });
  }

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-32">
      {/* TopAppBar */}
      <header className="bg-surface-card border-b border-divider sticky top-0 z-40 flex justify-between items-center w-full px-td-md h-16">
        <div className="flex items-center gap-td-sm">
          <Link
            href={`/itinerary/${trip.id}`}
            aria-label="뒤로"
            className="p-2 rounded-full hover:bg-surface-soft transition-colors"
          >
            <span className="material-symbols-outlined text-ink">arrow_back</span>
          </Link>
          <h1 className="text-lg font-bold text-ink tracking-tight">비용 관리</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-td-md">
        {/* Totals */}
        <section className="py-td-lg">
          <p className="text-td-meta text-ink-soft mb-td-xxs">
            {trip.destination} · {currency} (1 KRW ≈ {approxKrwRate}
            {currencySymbol})
          </p>
          <h2 className="text-td-title text-ink tabular-nums">
            합계 {totals.total.toLocaleString()}원
          </h2>
          <div className="grid grid-cols-3 gap-td-xs mt-td-md">
            <div className="bg-success-soft p-td-sm rounded-lg">
              <p className="text-td-caption text-success-deep uppercase">결제</p>
              <p className="text-td-card-title text-success-deep tabular-nums">
                {totals.paid.toLocaleString()}원
              </p>
            </div>
            <div className="bg-purple-soft p-td-sm rounded-lg">
              <p className="text-td-caption text-purple-deep uppercase">예약</p>
              <p className="text-td-card-title text-purple-deep tabular-nums">
                {totals.booked.toLocaleString()}원
              </p>
            </div>
            <div className="bg-amber-soft p-td-sm rounded-lg">
              <p className="text-td-caption text-amber-deep uppercase">예정</p>
              <p className="text-td-card-title text-amber-deep tabular-nums">
                {totals.planned.toLocaleString()}원
              </p>
            </div>
          </div>
        </section>

        {/* 사이클 LL — AddCostForm 추출 */}
        <AddCostForm
          currency={currency}
          currencySymbol={currencySymbol}
          approxKrwRate={approxKrwRate}
          isPending={isPending}
          onSubmit={handleAdd}
          onError={showToast}
        />

        {/* 사이클 E1 — 정산 흐름 카드 (splitWith 가진 entry 있을 때만 노출) */}
        <section className="mb-td-lg">
          <SettlementCard entries={entries} />
        </section>

        {/* Entries list */}
        <section>
          <h3 className="text-td-card-title text-ink mb-td-sm">최근 입력</h3>
          {entries.length === 0 ? (
            <p className="text-td-body text-ink-soft text-center py-td-lg bg-surface-card border border-divider rounded-xl">
              아직 입력된 비용이 없어요. 위에서 추가하세요.
            </p>
          ) : (
            <ul className="space-y-td-xs">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="bg-surface-card border border-divider rounded-xl p-td-sm flex items-start justify-between group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-td-xs flex-wrap mb-td-xxs">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-td-caption font-bold ${
                          STATUS_TONE[entry.status]
                        }`}
                      >
                        {STATUS_LABEL[entry.status]}
                      </span>
                      <span className="text-td-caption text-ink-mute tabular-nums">
                        {entry.date}
                      </span>
                      {entry.category && (
                        <span className="text-td-caption text-ink-soft">
                          ·{" "}
                          {CATEGORY_OPTIONS.find((c) => c.id === entry.category)
                            ?.label ?? entry.category}
                        </span>
                      )}
                    </div>
                    <p className="text-td-body text-ink truncate">{entry.label}</p>
                    <p className="text-td-card-title text-ink tabular-nums mt-td-xxs">
                      {entry.amountKrw.toLocaleString()}원
                      {entry.amountLocal && (
                        <span className="text-td-meta text-ink-soft ml-td-xs">
                          (
                          {entry.amountLocal.value.toLocaleString()}{" "}
                          {entry.amountLocal.currency})
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry)}
                    aria-label="삭제"
                    className="opacity-0 group-hover:opacity-100 text-ink-mute hover:text-danger transition-opacity ml-td-sm flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-ink text-white text-td-meta px-4 py-2.5 rounded-full shadow-lg max-w-[90vw] text-center"
          role="status"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
