/**
 * KRW 통화 포맷 유틸리티.
 *
 * 사용처:
 *   - components/dashboard/BentoSummary.tsx
 *   - components/recap/PostTripRecapView.tsx
 *   - lib/services/price-verification.ts
 *   - lib/services/settlement.ts (re-export)
 */

/**
 * 숫자를 ₩N,NNN 형태로 포맷.
 * @param amount 금액 (음수 시 절대값 사용 — 정산 문맥에서 부호는 UI가 결정)
 */
export function formatKrw(amount: number): string {
  return `₩${Math.abs(amount).toLocaleString("ko-KR")}`;
}
