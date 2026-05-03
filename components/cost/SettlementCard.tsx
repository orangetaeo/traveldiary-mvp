/**
 * Settlement Card (E1 v1) — 사이클 E1.
 *
 * /cost 페이지에서 정산 흐름을 시각화. 순수 presentation.
 * splitWith[0] = 결제자 컨벤션 (ADR-039).
 *
 * 사이클 RR: 현지 통화 병기 (KRW + ≈ 현지). props approxKrwRate/currencySymbol optional —
 * 미전달 시 KRW만 표기 (후방 호환).
 */

"use client";

import {
  computeSettlement,
  formatKrw,
  type SettlementResult,
} from "@/lib/services/settlement";
import type { CostEntry } from "@/lib/types";

interface Props {
  entries: CostEntry[];
  /** 1 KRW = ?? local. 미전달 시 현지 통화 병기 안 함 */
  approxKrwRate?: number;
  /** 현지 통화 심볼 (예: ₫, ฿). 미전달 시 현지 통화 병기 안 함 */
  currencySymbol?: string;
}

/** KRW + 현지 통화 병기 — approxKrwRate 미정 시 KRW만 */
function formatWithLocal(
  krw: number,
  approxKrwRate?: number,
  currencySymbol?: string,
): string {
  const krwStr = formatKrw(krw);
  if (
    approxKrwRate === undefined ||
    approxKrwRate <= 0 ||
    !currencySymbol
  ) {
    return krwStr;
  }
  const local = Math.round(Math.abs(krw) * approxKrwRate);
  return `${krwStr} (≈ ${currencySymbol}${local.toLocaleString("ko-KR")})`;
}

export function SettlementCard({
  entries,
  approxKrwRate,
  currencySymbol,
}: Props) {
  const result: SettlementResult = computeSettlement(entries);

  if (result.splitEntryCount === 0) {
    return null;
  }

  const showLocal =
    approxKrwRate !== undefined && approxKrwRate > 0 && !!currencySymbol;

  return (
    <section
      aria-label="일행 정산 흐름"
      className="bg-surface-card border border-divider rounded-xl p-td-md"
    >
      <header className="mb-td-sm">
        <h3 className="text-td-body font-semibold text-ink">
          일행 정산 (E1)
        </h3>
        <p className="text-td-caption text-ink-mute mt-0.5">
          {result.splitEntryCount}건 · 총{" "}
          {formatWithLocal(
            result.totalSplitKrw,
            approxKrwRate,
            currencySymbol,
          )}{" "}
          · 첫 번째 입력자가 결제자
        </p>
      </header>

      {result.transfers.length === 0 ? (
        <p className="text-td-meta text-ink-soft">
          정산 완료 — 모두 균등 부담입니다.
        </p>
      ) : (
        <ul className="space-y-td-xs mb-td-sm" aria-label="송금 흐름">
          {result.transfers.map((t, i) => (
            <li
              key={`${t.from}-${t.to}-${i}`}
              className="flex items-center justify-between gap-td-sm bg-surface-soft rounded-md px-3 py-2"
            >
              <span className="text-td-meta text-ink">
                <strong className="font-semibold">{t.from}</strong>
                <span className="mx-2 text-ink-mute" aria-hidden>
                  →
                </span>
                <strong className="font-semibold">{t.to}</strong>
              </span>
              <span className="text-td-meta font-bold text-purple-deep tabular-nums">
                {formatWithLocal(
                  t.amountKrw,
                  approxKrwRate,
                  currencySymbol,
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <details className="text-td-caption text-ink-mute">
        <summary className="cursor-pointer hover:text-ink">
          멤버별 잔액 보기 (양수=받을 돈, 음수=낼 돈)
          {showLocal && " · 현지 통화 병기"}
        </summary>
        <ul className="mt-td-xs space-y-1">
          {result.netByMember.map((m) => (
            <li key={m.name} className="flex justify-between tabular-nums">
              <span>{m.name}</span>
              <span
                className={
                  m.netKrw > 0
                    ? "text-success-deep"
                    : m.netKrw < 0
                      ? "text-amber-deep"
                      : "text-ink-mute"
                }
              >
                {m.netKrw >= 0 ? "+" : "-"}
                {formatWithLocal(m.netKrw, approxKrwRate, currencySymbol)}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
