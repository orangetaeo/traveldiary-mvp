/**
 * 사이클 RR — SettlementCard 단위 테스트.
 *
 * 답습: 사이클 NN/QQ.
 *
 * 검증:
 *  - splitWith 없는 entries → null (헤더 미렌더)
 *  - 균등 분담 → "정산 완료" 메시지
 *  - transfers 렌더 (from→to + 금액)
 *  - approxKrwRate/currencySymbol 미전달 → KRW만 (후방 호환)
 *  - approxKrwRate + currencySymbol 전달 → "₩X (≈ ₫Y)" 병기
 *  - 멤버별 net 표시 (양수/음수 색)
 *  - splitWith[0]=결제자 컨벤션 회귀
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SettlementCard } from "@/components/cost/SettlementCard";
import type { CostEntry } from "@/lib/types";

const NOW = "2026-05-03T00:00:00Z";

function entry(
  id: string,
  amountKrw: number,
  splitWith?: CostEntry["splitWith"],
): CostEntry {
  return {
    id,
    tripId: "t1",
    date: "2026-05-03",
    label: id,
    amountKrw,
    status: "paid",
    splitWith,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

describe("사이클 RR — SettlementCard", () => {
  it("splitWith 없는 entries → 카드 미렌더 (빈 string)", () => {
    const html = renderToStaticMarkup(<SettlementCard entries={[]} />);
    expect(html).toBe("");
  });

  it("splitWith 1명만 → splitEntryCount=0 → 카드 미렌더", () => {
    const html = renderToStaticMarkup(
      <SettlementCard entries={[entry("a", 10000, ["철수"])]} />,
    );
    expect(html).toBe("");
  });

  it("균등 분담 → 'transfers 0' + 정산 완료 메시지", () => {
    const html = renderToStaticMarkup(
      <SettlementCard
        entries={[entry("a", 10000, ["철수", "철수"])]}
      />,
    );
    expect(html).toContain("정산 완료");
  });

  it("transfers 렌더 — from→to + 금액", () => {
    const html = renderToStaticMarkup(
      <SettlementCard
        entries={[entry("a", 10000, ["철수", "영희"])]}
      />,
    );
    expect(html).toContain("철수");
    expect(html).toContain("영희");
    expect(html).toContain("→");
    expect(html).toContain("₩5,000");
  });

  it("approxKrwRate 미전달 → KRW만 (후방 호환)", () => {
    const html = renderToStaticMarkup(
      <SettlementCard
        entries={[entry("a", 10000, ["철수", "영희"])]}
      />,
    );
    expect(html).toContain("₩10,000");
    expect(html).not.toContain("≈");
  });

  it("approxKrwRate + currencySymbol 전달 → '₩X (≈ ₫Y)' 병기", () => {
    const html = renderToStaticMarkup(
      <SettlementCard
        entries={[entry("a", 10000, ["철수", "영희"])]}
        approxKrwRate={20}
        currencySymbol="₫"
      />,
    );
    // 총 10,000원 → 200,000 VND (10000 × 20)
    expect(html).toContain("₩10,000");
    expect(html).toContain("≈ ₫200,000");
    // transfers — 5,000 KRW → 100,000 VND
    expect(html).toContain("≈ ₫100,000");
  });

  it("THB 통화도 병기", () => {
    const html = renderToStaticMarkup(
      <SettlementCard
        entries={[entry("a", 10000, ["철수", "영희"])]}
        approxKrwRate={0.025}
        currencySymbol="฿"
      />,
    );
    // 10,000 KRW × 0.025 = 250 THB
    expect(html).toContain("≈ ฿250");
  });

  it("approxKrwRate=0 → 병기 안 함 (안전 가드)", () => {
    const html = renderToStaticMarkup(
      <SettlementCard
        entries={[entry("a", 10000, ["철수", "영희"])]}
        approxKrwRate={0}
        currencySymbol="฿"
      />,
    );
    expect(html).not.toContain("≈");
  });

  it("멤버별 잔액 — 결제자(+)와 부담자(-) 모두 노출", () => {
    const html = renderToStaticMarkup(
      <SettlementCard
        entries={[entry("a", 30000, ["철수", "영희", "민수"])]}
      />,
    );
    // 멤버별 잔액 details 안에 모두 포함
    expect(html).toContain("철수");
    expect(html).toContain("영희");
    expect(html).toContain("민수");
    expect(html).toContain("text-success-deep"); // 결제자 양수
    expect(html).toContain("text-amber-deep"); // 부담자 음수
  });

  it("splitWith[0]=결제자 컨벤션 회귀 — 첫 번째가 받는 사람", () => {
    const html = renderToStaticMarkup(
      <SettlementCard
        entries={[entry("a", 10000, ["철수", "영희"])]}
      />,
    );
    // 철수가 결제 → 영희가 철수에게 송금
    const fromIdx = html.indexOf("영희");
    const arrowIdx = html.indexOf("→");
    const toIdx = html.lastIndexOf("철수");
    expect(fromIdx).toBeGreaterThanOrEqual(0);
    expect(arrowIdx).toBeGreaterThanOrEqual(0);
    expect(toIdx).toBeGreaterThan(arrowIdx);
  });

  it("멤버별 잔액 details 헤더 — 통화 병기 라벨 추가", () => {
    const html = renderToStaticMarkup(
      <SettlementCard
        entries={[entry("a", 10000, ["철수", "영희"])]}
        approxKrwRate={20}
        currencySymbol="₫"
      />,
    );
    expect(html).toContain("현지 통화 병기");
  });
});
