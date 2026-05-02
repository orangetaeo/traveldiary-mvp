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

const TODAY_ISO = new Date().toISOString().slice(0, 10);

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

  const [draftLabel, setDraftLabel] = useState("");
  const [draftAmountKrw, setDraftAmountKrw] = useState("");
  const [draftAmountLocal, setDraftAmountLocal] = useState("");
  const [draftCategory, setDraftCategory] = useState("food");
  const [draftStatus, setDraftStatus] = useState<CostStatus>("paid");
  const [draftDate, setDraftDate] = useState(TODAY_ISO);

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

  // 사이클 H — 일행 정산 (splitWith 기반 1/N)
  const splitSummary = useMemo(() => {
    const memberSet = new Set<string>();
    for (const e of entries) {
      if (e.splitWith && e.splitWith.length > 0) {
        for (const m of e.splitWith) memberSet.add(m);
      }
    }
    const members = Array.from(memberSet);
    if (members.length === 0) return null;

    // 각 멤버별 부담액 = sum(amountKrw / splitWith.length)  (해당 멤버가 splitWith에 있을 때)
    const perMember = new Map<string, number>(members.map((m) => [m, 0]));
    let totalSplit = 0;
    for (const e of entries) {
      if (!e.splitWith || e.splitWith.length === 0) continue;
      const share = Math.round(e.amountKrw / e.splitWith.length);
      for (const m of e.splitWith) {
        perMember.set(m, (perMember.get(m) ?? 0) + share);
      }
      totalSplit += e.amountKrw;
    }

    return {
      members: Array.from(perMember.entries()).map(([id, share]) => ({
        id,
        share,
      })),
      totalSplit,
    };
  }, [entries]);

  function showToast(msg: string, ms = 3500) {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  }

  /** KRW 또는 local 둘 중 하나만 입력해도 자동 산출. 둘 다 입력 시 우선: local */
  function deriveAmounts(
    krwInput: string,
    localInput: string,
  ): { amountKrw: number; amountLocal?: { value: number; currency: string } } | null {
    const krw = parseFloat(krwInput);
    const local = parseFloat(localInput);

    if (!isNaN(local) && local > 0) {
      // local 우선 — KRW로 변환
      return {
        amountKrw: Math.round(local / approxKrwRate),
        amountLocal: { value: local, currency },
      };
    }
    if (!isNaN(krw) && krw > 0) {
      return {
        amountKrw: Math.round(krw),
        amountLocal: {
          value: Math.round(krw * approxKrwRate),
          currency,
        },
      };
    }
    return null;
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!draftLabel.trim()) {
      showToast("항목 이름을 입력해주세요.");
      return;
    }
    const amounts = deriveAmounts(draftAmountKrw, draftAmountLocal);
    if (!amounts) {
      showToast("KRW 또는 현지통화 중 하나는 입력해주세요.");
      return;
    }

    const label = draftLabel.trim();
    const date = draftDate;
    const status = draftStatus;
    const category = draftCategory;

    startTransition(async () => {
      const result = await addCost({
        tripId: trip.id,
        date,
        label,
        amountKrw: amounts.amountKrw,
        amountLocal: amounts.amountLocal,
        status,
        category,
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
            date,
            label,
            amountKrw: amounts.amountKrw,
            amountLocal: amounts.amountLocal,
            status,
            category,
            createdAt: now,
            updatedAt: now,
          },
          ...prev,
        ]);
        showToast("비용 추가 (데모 시뮬)");
      } else {
        showToast(`비용 추가됨 — ${amounts.amountKrw.toLocaleString()}원`);
        router.refresh();
      }
      setDraftLabel("");
      setDraftAmountKrw("");
      setDraftAmountLocal("");
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

        {/* 일행 정산 (E1, 사이클 H) — splitWith가 있는 entry가 있을 때만 */}
        {splitSummary && (
          <section className="bg-purple-soft/50 border border-purple/30 rounded-xl p-td-md mb-td-lg">
            <h3 className="text-td-card-title text-purple-deep mb-td-xs">
              일행 정산 (E1)
            </h3>
            <p className="text-td-meta text-ink-soft mb-td-sm">
              {splitSummary.members.length}명 · 총{" "}
              {splitSummary.totalSplit.toLocaleString()}원 분배
            </p>
            <ul className="space-y-td-xs">
              {splitSummary.members.map((m) => (
                <li
                  key={m.id}
                  className="flex justify-between items-center bg-surface-card border border-divider rounded-lg p-td-sm"
                >
                  <span className="text-td-body text-ink truncate flex-1">
                    {m.id.slice(0, 8)}…
                  </span>
                  <span className="text-td-card-title text-purple-deep tabular-nums">
                    {m.share.toLocaleString()}원
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-td-caption text-ink-mute mt-td-xs">
              💡 1/N 균등 분배. 실 결제는 외부에서 송금하고 status를 paid로
              업데이트.
            </p>
          </section>
        )}

        {/* Add form */}
        <section className="bg-surface-card border border-divider rounded-xl p-td-md mb-td-lg">
          <h3 className="text-td-card-title text-ink mb-td-sm">비용 추가</h3>
          <form onSubmit={handleAdd} className="space-y-td-sm">
            <input
              type="text"
              placeholder="항목명 (예: 즈엉동 야시장 저녁)"
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              className="w-full px-td-sm py-2 border border-divider rounded-lg text-td-body bg-surface-soft focus:outline focus:outline-purple"
              maxLength={50}
            />
            <div className="grid grid-cols-2 gap-td-sm">
              <label className="flex flex-col">
                <span className="text-td-caption text-ink-soft mb-1">KRW</span>
                <input
                  type="number"
                  placeholder="원"
                  value={draftAmountKrw}
                  onChange={(e) => setDraftAmountKrw(e.target.value)}
                  className="px-td-sm py-2 border border-divider rounded-lg text-td-body bg-surface-soft tabular-nums"
                  min="0"
                  step="100"
                />
              </label>
              <label className="flex flex-col">
                <span className="text-td-caption text-ink-soft mb-1">
                  {currency} ({currencySymbol})
                </span>
                <input
                  type="number"
                  placeholder={currencySymbol}
                  value={draftAmountLocal}
                  onChange={(e) => setDraftAmountLocal(e.target.value)}
                  className="px-td-sm py-2 border border-divider rounded-lg text-td-body bg-surface-soft tabular-nums"
                  min="0"
                />
              </label>
            </div>
            <p className="text-td-caption text-ink-mute">
              💡 둘 중 하나만 입력하면 자동 변환됩니다.
            </p>
            <div className="grid grid-cols-3 gap-td-sm">
              <select
                value={draftCategory}
                onChange={(e) => setDraftCategory(e.target.value)}
                className="px-td-sm py-2 border border-divider rounded-lg text-td-meta bg-surface-soft"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <select
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value as CostStatus)}
                className="px-td-sm py-2 border border-divider rounded-lg text-td-meta bg-surface-soft"
              >
                <option value="paid">결제 완료</option>
                <option value="booked">예약 (선결제)</option>
                <option value="planned">예정</option>
              </select>
              <input
                type="date"
                value={draftDate}
                onChange={(e) => setDraftDate(e.target.value)}
                className="px-td-sm py-2 border border-divider rounded-lg text-td-meta bg-surface-soft"
                aria-label="결제 일자"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2 bg-purple text-white rounded-lg text-td-body font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {isPending ? "추가 중…" : "비용 추가"}
            </button>
          </form>
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
