/**
 * 환율 변환 유틸 — 시드 기반 대략치.
 *
 * ReceiptScanView + CostView 등에서 공용.
 */

export const CURRENCY_TO_KRW: Record<string, number> = {
  VND: 1 / 18,    // 1 VND ≈ 0.056 KRW
  THB: 40,        // 1 THB ≈ 40 KRW
  JPY: 9,         // 1 JPY ≈ 9 KRW
  USD: 1350,      // 1 USD ≈ 1350 KRW
  KRW: 1,
};

export function toKrw(amount: number, currency: string): number {
  const rate = CURRENCY_TO_KRW[currency] ?? 1;
  return Math.round(amount * rate);
}

export const CURRENCY_SYMBOL: Record<string, string> = {
  VND: "₫",
  THB: "฿",
  JPY: "¥",
  USD: "$",
  KRW: "₩",
};
