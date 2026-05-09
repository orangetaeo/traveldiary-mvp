"use client";

/**
 * ReceiptResultStep — 영수증 OCR 파싱 결과 확인 + 편집 + 비용 등록.
 *
 * ReceiptScanView에서 추출 (사이클 JJ).
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCost } from "@/actions/cost";
import type { ParsedReceipt } from "@/lib/services/receipt-ocr";
import { toKrw, CURRENCY_SYMBOL } from "@/lib/utils/currency";
import {
  COST_CATEGORY_OPTIONS,
  COST_CATEGORY_LABEL,
} from "@/lib/utils/cost-constants";

interface Props {
  tripId: string;
  receipt: ParsedReceipt;
  previewUrl: string | null;
  onRetake: () => void;
}

export function ReceiptResultStep({ tripId, receipt, previewUrl, onRetake }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [vendor, setVendor] = useState(receipt.vendor);
  const [total, setTotal] = useState(receipt.total);
  const [currency, setCurrency] = useState(receipt.currency);
  const [category, setCategory] = useState<string>(receipt.category);
  const [date, setDate] = useState(
    receipt.date || new Date().toISOString().slice(0, 10),
  );

  const krwAmount = toKrw(total, currency);
  const sym = CURRENCY_SYMBOL[currency] ?? currency;

  function handleSave() {
    startTransition(async () => {
      const result = await addCost({
        tripId,
        date,
        label: vendor,
        amountKrw: krwAmount,
        amountLocal:
          currency !== "KRW"
            ? { value: total, currency }
            : undefined,
        status: "paid",
        category,
      });

      if (result.ok) {
        router.push(`/cost/${tripId}`);
      }
    });
  }

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      {/* TopAppBar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-td-md h-14 bg-surface-card/90 backdrop-blur-md border-b border-divider">
        <button
          type="button"
          onClick={onRetake}
          aria-label="다시 촬영"
          className="p-2 rounded-full hover:bg-surface-soft transition-colors"
        >
          <span className="material-symbols-outlined text-ink">arrow_back</span>
        </button>
        <h1 className="text-td-card-title font-semibold tracking-tight text-ink">
          인식 결과
        </h1>
        <div className="w-10" />
      </header>

      <main className="max-w-md mx-auto px-td-md py-td-lg">
        {/* 성공 배지 */}
        <div className="flex items-center gap-td-xs bg-success-soft border border-success/30 rounded-md p-td-sm mb-td-md">
          <span className="material-symbols-outlined text-success-deep text-lg" aria-hidden>check_circle</span>
          <p className="text-td-body text-success-deep font-medium">영수증 인식 완료</p>
        </div>

        {/* 미리보기 이미지 */}
        {previewUrl && (
          <div className="mb-td-md rounded-md overflow-hidden border border-divider">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="영수증 미리보기"
              className="w-full max-h-48 object-contain bg-surface-card"
              loading="lazy"
            />
          </div>
        )}

        {/* 금액 요약 카드 */}
        <div className="bg-surface-card rounded-md border border-divider p-td-md mb-td-md text-center">
          <p className="text-td-caption text-ink-soft mb-1">인식된 총액</p>
          <p className="text-3xl font-bold text-purple-deep">
            {sym} {total.toLocaleString()}
          </p>
          {currency !== "KRW" && (
            <p className="text-td-body text-ink-soft mt-1">
              ≈ ₩{krwAmount.toLocaleString()} KRW
            </p>
          )}
        </div>

        {/* 상세 항목 */}
        {receipt.items.length > 0 && (
          <div className="bg-surface-card rounded-md border border-divider p-td-md mb-td-md">
            <h3 className="text-td-meta text-ink-soft font-bold uppercase tracking-wider mb-td-xs">
              인식된 항목
            </h3>
            <ul className="space-y-td-xs">
              {receipt.items.map((item, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center border-b border-divider last:border-b-0 pb-td-xxs last:pb-0"
                >
                  <span className="text-td-body text-ink">
                    {item.name}
                    {item.quantity > 1 && (
                      <span className="text-ink-mute"> x{item.quantity}</span>
                    )}
                  </span>
                  <span className="text-td-body font-medium text-ink tabular-nums">
                    {sym} {item.price.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 편집 폼 */}
        <div className="bg-surface-card rounded-md border border-divider p-td-md mb-td-md space-y-td-sm">
          <h3 className="text-td-meta text-ink-soft font-bold uppercase tracking-wider">
            정보 확인 · 수정
          </h3>

          <label className="block">
            <span className="text-td-caption text-ink-soft">가게명</span>
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              maxLength={50}
              className="mt-1 w-full rounded-md border border-divider bg-surface-soft px-td-sm py-2 text-td-body text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
            />
          </label>

          <div className="flex gap-td-xs">
            <label className="flex-1 block">
              <span className="text-td-caption text-ink-soft">총액</span>
              <input
                type="number"
                value={total}
                onChange={(e) => setTotal(Number(e.target.value) || 0)}
                min={0}
                className="mt-1 w-full rounded-md border border-divider bg-surface-soft px-td-sm py-2 text-td-body text-ink focus:outline-none focus:ring-2 focus:ring-purple/40 tabular-nums"
              />
            </label>
            <label className="w-24 block">
              <span className="text-td-caption text-ink-soft">통화</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 w-full rounded-md border border-divider bg-surface-soft px-td-sm py-2 text-td-body text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
              >
                <option value="VND">VND</option>
                <option value="THB">THB</option>
                <option value="JPY">JPY</option>
                <option value="USD">USD</option>
                <option value="KRW">KRW</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-td-caption text-ink-soft">날짜</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-divider bg-surface-soft px-td-sm py-2 text-td-body text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
            />
          </label>

          <label className="block">
            <span className="text-td-caption text-ink-soft">카테고리</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-md border border-divider bg-surface-soft px-td-sm py-2 text-td-body text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
            >
              {COST_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {currency !== "KRW" && (
            <p className="text-td-caption text-ink-mute">
              ≈ ₩{toKrw(total, currency).toLocaleString()} KRW ({COST_CATEGORY_LABEL[category] ?? category})
            </p>
          )}
        </div>

        {/* CTA 버튼 */}
        <button
          type="button"
          disabled={isPending || !vendor || total <= 0}
          onClick={handleSave}
          className="w-full rounded-md bg-purple text-white font-bold py-td-sm text-center hover:bg-purple-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-td-sm"
        >
          {isPending ? "저장 중..." : "비용 등록하기"}
        </button>

        <button
          type="button"
          onClick={onRetake}
          className="w-full rounded-md bg-surface-card border border-divider text-ink-soft font-medium py-td-sm text-center hover:bg-surface-soft transition-colors"
        >
          다시 촬영하기
        </button>
      </main>
    </div>
  );
}
