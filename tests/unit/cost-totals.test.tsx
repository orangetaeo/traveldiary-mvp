/**
 * 사이클 NN — CostTotals 단위 테스트.
 *
 * 답습: 사이클 LL AddCostForm.
 *
 * 검증:
 *  - paid/booked/planned 합계 정확
 *  - 빈 entries → 0원 합계
 *  - destination + currency + approxKrwRate 라벨 노출
 *  - 카테고리 라벨 ("결제"/"예약"/"예정")
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CostTotals } from "@/components/cost/CostTotals";
import type { CostEntry } from "@/lib/types";

const NOW = "2026-05-03T00:00:00Z";

function entry(
  id: string,
  status: CostEntry["status"],
  amountKrw: number,
): CostEntry {
  return {
    id,
    tripId: "t1",
    date: "2026-05-03",
    label: id,
    amountKrw,
    status,
    category: "food",
    createdAt: NOW,
    updatedAt: NOW,
  };
}

describe("사이클 NN — CostTotals", () => {
  it("paid/booked/planned 합계 + total 계산", () => {
    const entries: CostEntry[] = [
      entry("a", "paid", 10_000),
      entry("b", "paid", 5_000),
      entry("c", "booked", 30_000),
      entry("d", "planned", 7_500),
    ];
    const html = renderToStaticMarkup(
      <CostTotals
        entries={entries}
        destination="다낭"
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={20}
      />,
    );
    expect(html).toContain("15,000원"); // paid 합
    expect(html).toContain("30,000원"); // booked 합
    expect(html).toContain("7,500원"); // planned 합
    expect(html).toContain("합계 52,500원");
  });

  it("빈 entries → 0원 합계", () => {
    const html = renderToStaticMarkup(
      <CostTotals
        entries={[]}
        destination="치앙마이"
        currency="THB"
        currencySymbol="฿"
        approxKrwRate={28}
      />,
    );
    expect(html).toContain("합계 0원");
  });

  it("destination + currency + approxKrwRate 라벨 노출", () => {
    const html = renderToStaticMarkup(
      <CostTotals
        entries={[]}
        destination="다낭"
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={20}
      />,
    );
    expect(html).toContain("다낭");
    expect(html).toContain("VND");
    expect(html).toContain("₫");
    expect(html).toContain("≈ 20");
  });

  it("3종 카테고리 라벨 (결제/예약/예정)", () => {
    const html = renderToStaticMarkup(
      <CostTotals
        entries={[]}
        destination="다낭"
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={20}
      />,
    );
    expect(html).toContain("결제");
    expect(html).toContain("예약");
    expect(html).toContain("예정");
  });
});
