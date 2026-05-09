"use client";

/**
 * ExchangeCalculator — KRW ↔ 현지통화 양방향 즉시 환전 계산기.
 *
 * `/city/[slug]/payment` EXCHANGE_KRW_SAMPLES 정적 카드 갭 해소.
 * 사용자 본인 금액 직접 입력 → 즉시 변환. 천 단위 콤마 + 소수점 cap.
 *
 * 정책:
 *   - 한 쪽 input 변경 시 반대편 자동 계산 (마지막 편집 인풋이 source of truth)
 *   - 음수·NaN·콤마 입력 정규화 (parseAmount)
 *   - 환율 미반영 마진 안내문 보존
 */

import { useState } from "react";

interface Props {
  /** 1 KRW = N (현지통화) — city.payment.approxKrwRate */
  rate: number;
  /** 통화 코드 (예: "VND") */
  currency: string;
  /** 통화 기호 (예: "₫") */
  symbol: string;
}

const KRW_DEFAULT = "10000";

export function ExchangeCalculator({ rate, currency, symbol }: Props) {
  const [krw, setKrw] = useState(KRW_DEFAULT);
  const [local, setLocal] = useState(() => formatNumber(Math.round(parseAmount(KRW_DEFAULT) * rate)));
  // lastEdited state는 외부 디버깅용으로 유지하지 않음 — handlers가 양방향 갱신 처리

  const handleKrwChange = (raw: string) => {
    const krwAmount = parseAmount(raw);
    setKrw(raw);
    if (Number.isFinite(krwAmount) && krwAmount >= 0) {
      setLocal(formatNumber(Math.round(krwAmount * rate)));
    } else {
      setLocal("");
    }
  };

  const handleLocalChange = (raw: string) => {
    const localAmount = parseAmount(raw);
    setLocal(raw);
    if (Number.isFinite(localAmount) && localAmount >= 0 && rate > 0) {
      setKrw(formatNumber(Math.round(localAmount / rate)));
    } else {
      setKrw("");
    }
  };

  const handleReset = () => {
    setKrw(KRW_DEFAULT);
    setLocal(formatNumber(Math.round(parseAmount(KRW_DEFAULT) * rate)));
  };

  return (
    <section
      aria-labelledby="exchange-calc-input-heading"
      className="bg-surface-card border border-divider rounded-lg p-4 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <h3
          id="exchange-calc-input-heading"
          className="text-td-body font-semibold text-ink"
        >
          <span
            className="material-symbols-outlined text-td-icon mr-1 align-middle text-purple"
            aria-hidden
          >
            calculate
          </span>
          직접 입력 환전 계산기
        </h3>
        <button
          type="button"
          onClick={handleReset}
          className="text-td-caption text-ink-mute hover:text-ink-soft"
          aria-label="환전 계산기 1만원 기본값으로 초기화"
        >
          초기화
        </button>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="block text-td-meta text-ink-soft mb-1">한국 원화 (KRW)</span>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={krw}
              onChange={(e) => handleKrwChange(e.target.value)}
              aria-label="한국 원화 금액 입력"
              placeholder="0"
              className="w-full bg-surface-soft border border-divider rounded-md px-3 py-2.5 pr-10 text-td-body text-ink tabular-nums focus:ring-2 focus:ring-purple focus:border-transparent outline-none"
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-td-meta text-ink-mute font-semibold"
              aria-hidden
            >
              원
            </span>
          </div>
        </label>

        <div className="flex justify-center" aria-hidden>
          <span className="material-symbols-outlined text-purple-deep text-[20px]">
            sync_alt
          </span>
        </div>

        <label className="block">
          <span className="block text-td-meta text-ink-soft mb-1">
            {currency} ({symbol})
          </span>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={local}
              onChange={(e) => handleLocalChange(e.target.value)}
              aria-label={`${currency} 금액 입력`}
              placeholder="0"
              className="w-full bg-surface-soft border border-divider rounded-md px-3 py-2.5 pr-10 text-td-body text-ink tabular-nums focus:ring-2 focus:ring-purple focus:border-transparent outline-none"
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-td-meta text-ink-mute font-semibold"
              aria-hidden
            >
              {symbol}
            </span>
          </div>
        </label>
      </div>

      <p className="text-td-caption text-ink-mute mt-3">
        * 환율 변동·환전 마진 미반영 — 출국 직전 시중은행 환율 확인 권장
      </p>
    </section>
  );
}

/**
 * 입력 정규화 — 콤마/공백 제거 + parseFloat.
 * 빈 문자열 또는 정상 숫자가 아니면 NaN 반환.
 */
export function parseAmount(raw: string): number {
  if (typeof raw !== "string") return NaN;
  const cleaned = raw.replace(/[,\s]/g, "");
  if (cleaned === "" || cleaned === "-") return NaN;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * 천 단위 콤마 포맷팅 (NaN/음수는 빈 문자열).
 */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "";
  return Math.round(n).toLocaleString("ko-KR");
}
