/**
 * E1 정산 요약 — Wrap-up 페이지 인라인 섹션.
 *
 * 기존 computeSettlement + CostEntry 데이터 재활용.
 * 서버 컴포넌트 — 부모가 entries를 넘겨줌.
 */

import Link from "next/link";
import { formatKrw } from "@/lib/utils/format-krw";
import { computeSettlement } from "@/lib/services/settlement";
import type { CostEntry } from "@/lib/types";

interface Props {
  tripId: string;
  entries: CostEntry[];
}

export function SettlementSummary({ tripId, entries }: Props) {
  if (entries.length === 0) return null;

  const totalKrw = entries.reduce((sum, e) => sum + e.amountKrw, 0);
  const result = computeSettlement(entries);

  return (
    <section className="px-td-md py-td-md">
      <div className="bg-surface-card border border-divider rounded-md p-td-md shadow-sm">
        <div className="flex items-center gap-2 mb-td-sm">
          <span className="material-symbols-outlined text-accent" aria-hidden>
            payments
          </span>
          <h2 className="text-td-card-title font-bold text-ink">정산 요약</h2>
        </div>

        {/* 총 지출 */}
        <div className="flex justify-between items-baseline mb-td-xs">
          <span className="text-td-body text-ink-soft">총 지출</span>
          <span className="text-td-card-title font-bold text-ink">
            {formatKrw(totalKrw)}
          </span>
        </div>
        <div className="flex justify-between items-baseline mb-td-sm">
          <span className="text-td-caption text-ink-soft">
            {entries.length}건 기록
          </span>
          {result.settledEntryCount > 0 && (
            <span className="text-td-caption text-emerald-600">
              {result.settledEntryCount}건 정산 완료
            </span>
          )}
        </div>

        {/* 이체 내역 — 미정산 건이 있을 때만 */}
        {result.transfers.length > 0 && (
          <div className="border-t border-divider pt-td-xs mt-td-xs">
            <h3 className="text-td-meta text-ink-soft mb-td-xxs">
              미정산 이체 내역
            </h3>
            <div className="flex flex-col gap-1">
              {result.transfers.map((t, i) => (
                <div
                  key={`${t.from}-${t.to}-${i}`}
                  className="flex items-center gap-2 text-td-body"
                >
                  <span className="text-ink">{t.from}</span>
                  <span className="material-symbols-outlined text-td-icon-sm text-ink-mute" aria-hidden>
                    arrow_forward
                  </span>
                  <span className="text-ink">{t.to}</span>
                  <span className="ml-auto font-semibold text-purple">
                    {formatKrw(t.amountKrw)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 상세 보기 링크 */}
        <Link
          href={`/cost/${tripId}`}
          className="mt-td-sm block text-center text-td-body text-purple font-semibold"
        >
          비용 상세 보기 →
        </Link>
      </div>
    </section>
  );
}
