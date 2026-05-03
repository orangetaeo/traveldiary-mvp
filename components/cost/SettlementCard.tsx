/**
 * Settlement Card (E1 v1) — 사이클 E1.
 *
 * /cost 페이지에서 정산 흐름을 시각화. 순수 presentation.
 * splitWith[0] = 결제자 컨벤션 (ADR-039).
 *
 * 사이클 RR: 현지 통화 병기 (KRW + ≈ 현지). props approxKrwRate/currencySymbol optional —
 * 미전달 시 KRW만 표기 (후방 호환).
 *
 * 사이클 UU (ADR-042): 정산 완료 토글. onSettle 미전달 시 토글 미노출 (후방 호환).
 *  - settledAt 있는 entry는 흐름에서 제외 (computeSettlement)
 *  - "정산 완료된 N건" details에서 되돌리기 가능
 */

"use client";

import {
  computeSettlement,
  formatKrw,
  normalizeSplitWith,
  type SettlementResult,
} from "@/lib/services/settlement";
import type { CostEntry } from "@/lib/types";

interface Props {
  entries: CostEntry[];
  /** 1 KRW = ?? local. 미전달 시 현지 통화 병기 안 함 */
  approxKrwRate?: number;
  /** 현지 통화 심볼 (예: ₫, ฿). 미전달 시 현지 통화 병기 안 함 */
  currencySymbol?: string;
  /**
   * 사이클 UU — 정산 완료 토글. 미전달 시 토글 버튼 미노출 (후방 호환 + 데모 시뮬용).
   * settled=true → 정산 완료 / false → 되돌리기.
   */
  onSettle?: (entry: CostEntry, settled: boolean) => void;
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
  onSettle,
}: Props) {
  const result: SettlementResult = computeSettlement(entries);

  // 사이클 UU — 미정산 + 정산완료 둘 다 0이면 카드 미렌더
  if (result.splitEntryCount === 0 && result.settledEntryCount === 0) {
    return null;
  }

  // 사이클 UU — 정산 완료된 split entries만 따로 모음 (UI details용)
  const settledEntries = entries.filter(
    (e) => e.settledAt && normalizeSplitWith(e.splitWith).members.length >= 2,
  );
  // 사이클 UU — 미정산 split entries (토글 버튼 노출용)
  const unsettledEntries = entries.filter(
    (e) =>
      !e.settledAt && normalizeSplitWith(e.splitWith).members.length >= 2,
  );

  const showLocal =
    approxKrwRate !== undefined && approxKrwRate > 0 && !!currencySymbol;

  const allSettled =
    result.splitEntryCount === 0 && result.settledEntryCount > 0;

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
          {allSettled ? (
            <>전체 정산 완료 · {result.settledEntryCount}건</>
          ) : (
            <>
              미정산 {result.splitEntryCount}건 · 총{" "}
              {formatWithLocal(
                result.totalSplitKrw,
                approxKrwRate,
                currencySymbol,
              )}{" "}
              · 첫 번째 입력자가 결제자
            </>
          )}
        </p>
      </header>

      {result.splitEntryCount > 0 && (
        <>
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

          {/* 사이클 UU — 미정산 entry별 정산 완료 토글 */}
          {onSettle && unsettledEntries.length > 0 && (
            <details className="text-td-caption text-ink-mute mt-td-sm">
              <summary className="cursor-pointer hover:text-ink">
                항목별 정산 완료 처리
              </summary>
              <ul className="mt-td-xs space-y-1" aria-label="미정산 항목 토글">
                {unsettledEntries.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex justify-between items-center gap-td-sm"
                  >
                    <span className="text-ink truncate">
                      {entry.label} ·{" "}
                      <span className="tabular-nums">
                        {formatWithLocal(
                          entry.amountKrw,
                          approxKrwRate,
                          currencySymbol,
                        )}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onSettle(entry, true)}
                      className="text-td-caption text-purple-deep font-semibold hover:underline whitespace-nowrap"
                      aria-label={`${entry.label} 정산 완료 처리`}
                    >
                      완료 처리
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}

      {/* 사이클 UU — 정산 완료된 항목 details + 되돌리기 */}
      {settledEntries.length > 0 && (
        <details
          className={`text-td-caption text-ink-mute ${
            result.splitEntryCount > 0 ? "mt-td-sm" : ""
          }`}
        >
          <summary className="cursor-pointer hover:text-ink">
            정산 완료된 {settledEntries.length}건 · 총{" "}
            {formatWithLocal(
              result.settledTotalKrw,
              approxKrwRate,
              currencySymbol,
            )}
          </summary>
          <ul className="mt-td-xs space-y-1" aria-label="정산 완료 항목">
            {settledEntries.map((entry) => (
              <li
                key={entry.id}
                className="flex justify-between items-center gap-td-sm"
              >
                <span className="text-ink-soft truncate">
                  <span className="line-through">{entry.label}</span> ·{" "}
                  <span className="tabular-nums">
                    {formatWithLocal(
                      entry.amountKrw,
                      approxKrwRate,
                      currencySymbol,
                    )}
                  </span>
                </span>
                {onSettle && (
                  <button
                    type="button"
                    onClick={() => onSettle(entry, false)}
                    className="text-td-caption text-ink-mute hover:text-ink hover:underline whitespace-nowrap"
                    aria-label={`${entry.label} 정산 되돌리기`}
                  >
                    되돌리기
                  </button>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
