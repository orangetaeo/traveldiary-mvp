"use client";

/**
 * Cost 클라이언트 뷰 — M6 사이클 9.
 *
 * 이중통화 입력: KRW 또는 현지통화 둘 중 하나만 입력하면 자동 변환 (city.payment.approxKrwRate 사용).
 * 데모 trip: demo:true → 클라이언트 시뮬.
 *
 * 사이클 NN: Totals → CostTotals, EntriesList → CostEntriesList 추출.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/lib/hooks/useToast";
import { Toast } from "@/components/ui/Toast";
import { addCost, deleteCost, settleCost } from "@/actions/cost";
import type { CostEntry, CostStatus, Trip } from "@/lib/types";
import { SettlementCard } from "./SettlementCard";
import { AddCostForm } from "./AddCostForm";
import { CostTotals } from "./CostTotals";
import { CostEntriesList } from "./CostEntriesList";

interface Props {
  trip: Trip;
  initialEntries: CostEntry[];
  currency: string;
  currencySymbol: string;
  approxKrwRate: number; // 1 KRW = ?? local
  /** C4 — URL ?day= 파라미터에서 파싱된 dayIndex. 뒤로가기 링크에 전달. */
  initialDay?: number;
}

export function CostView({
  trip,
  initialEntries,
  currency,
  currencySymbol,
  approxKrwRate,
  initialDay,
}: Props) {
  const dayParam = initialDay != null ? `?day=${initialDay}` : "";
  const router = useRouter();
  const [entries, setEntries] = useState<CostEntry[]>(initialEntries);
  const [isPending, startTransition] = useTransition();
  const { toast, show: showToast } = useToast();

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
        showToast(`추가 실패: ${result.code}`, { variant: "danger" });
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
        showToast("비용 추가 (데모 시뮬)", { variant: "info" });
      } else {
        showToast(`비용 추가됨 — ${input.amountKrw.toLocaleString()}원`, { variant: "success" });
        router.refresh();
      }
    });
  }

  /**
   * 사이클 UU (ADR-042) — 정산 완료 토글.
   * 옵티미스틱 — 즉시 settledAt 업데이트 후 server action.
   * 실패 시 롤백.
   */
  function handleSettle(entry: CostEntry, settled: boolean) {
    const prevSettledAt = entry.settledAt;
    const nextSettledAt = settled ? new Date().toISOString() : undefined;

    setEntries((prev) =>
      prev.map((e) =>
        e.id === entry.id ? { ...e, settledAt: nextSettledAt } : e,
      ),
    );

    startTransition(async () => {
      const result = await settleCost({
        id: entry.id,
        tripId: trip.id,
        settled,
      });
      if (!result.ok) {
        // 롤백
        setEntries((prev) =>
          prev.map((e) =>
            e.id === entry.id ? { ...e, settledAt: prevSettledAt } : e,
          ),
        );
        showToast(`정산 처리 실패: ${result.code}`, { variant: "danger" });
        return;
      }
      if (result.demo) {
        showToast(
          settled ? "정산 완료 (데모 시뮬)" : "정산 되돌림 (데모 시뮬)",
          { variant: "info" },
        );
      } else {
        showToast(settled ? "정산 완료" : "정산 되돌림", { variant: "success" });
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
        showToast(`삭제 실패: ${result.code}`, { variant: "danger" });
        return;
      }
      if (!result.demo) {
        showToast("삭제됨 (DB 영속화)", { variant: "success" });
        router.refresh();
      } else {
        showToast("삭제 (데모 시뮬)", { variant: "info" });
      }
    });
  }

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-32">
      {/* TopAppBar */}
      <header className="bg-surface-card/90 backdrop-blur-md border-b border-divider sticky top-0 z-40 flex justify-between items-center w-full px-td-md h-14">
        <div className="flex items-center gap-td-sm">
          <Link
            href={`/itinerary/${trip.id}${dayParam}`}
            aria-label="뒤로"
            className="p-2 rounded-full hover:bg-surface-soft transition-colors"
          >
            <span className="material-symbols-outlined text-ink">arrow_back</span>
          </Link>
          <h1 className="text-lg font-bold text-ink tracking-tight">비용 관리</h1>
        </div>
        {/* 옵션 M (Session AA cap 2) — trip dashboard 진입 (?focus=cost) */}
        <Link
          href={`/trips/${trip.id}?focus=cost`}
          aria-label="여행 대시보드로"
          className="p-2 rounded-full text-amber-deep hover:bg-amber-soft transition-colors"
        >
          <span className="material-symbols-outlined">dashboard</span>
        </Link>
      </header>

      <main className="max-w-xl mx-auto px-td-md">
        <CostTotals
          entries={entries}
          destination={trip.destination}
          currency={currency}
          currencySymbol={currencySymbol}
          approxKrwRate={approxKrwRate}
        />

        {/* 사이클 LL — AddCostForm 추출 + A5 entries (빈도 칩) */}
        <AddCostForm
          currency={currency}
          currencySymbol={currencySymbol}
          approxKrwRate={approxKrwRate}
          isPending={isPending}
          onSubmit={handleAdd}
          onError={(msg) => showToast(msg, { variant: "warning" })}
          entries={entries}
        />

        {/* 사이클 E1 + RR — 정산 흐름 카드 + 현지 통화 병기 */}
        <section className="mb-td-lg">
          <SettlementCard
            entries={entries}
            approxKrwRate={approxKrwRate}
            currencySymbol={currencySymbol}
            onSettle={handleSettle}
          />
        </section>

        <CostEntriesList entries={entries} onDelete={handleDelete} />
      </main>

      <Toast toast={toast} />
    </div>
  );
}
