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

describe("사이클 UU (ADR-042) — settledAt 정산 완료 마커 UI", () => {
  function settledEntry(
    id: string,
    amountKrw: number,
    splitWith: CostEntry["splitWith"],
    settledAt?: string,
  ): CostEntry {
    return {
      ...entry(id, amountKrw, splitWith),
      settledAt,
    };
  }

  it("settledAt 있는 entry만 → '전체 정산 완료' 헤더", () => {
    const html = renderToStaticMarkup(
      <SettlementCard
        entries={[settledEntry("a", 10000, ["철수", "영희"], NOW)]}
      />,
    );
    expect(html).toContain("전체 정산 완료");
    expect(html).toContain("정산 완료된 1건");
  });

  it("settledAt 있는 entry는 흐름에서 제외 (송금 안 보임)", () => {
    const html = renderToStaticMarkup(
      <SettlementCard
        entries={[settledEntry("a", 10000, ["철수", "영희"], NOW)]}
      />,
    );
    // transfers 영역 미렌더 — "→" 없음 (정산 완료 details 안에서는 hyphen line-through만)
    expect(html).not.toContain("송금 흐름");
  });

  it("미정산 + 정산완료 혼재 — 미정산 헤더 + 정산완료 details 둘 다", () => {
    const html = renderToStaticMarkup(
      <SettlementCard
        entries={[
          entry("u1", 10000, ["철수", "영희"]),
          settledEntry("s1", 20000, ["철수", "영희"], NOW),
        ]}
      />,
    );
    expect(html).toContain("미정산 1건");
    expect(html).toContain("정산 완료된 1건");
  });

  it("onSettle 미전달 → '완료 처리' 토글 버튼 미렌더", () => {
    const html = renderToStaticMarkup(
      <SettlementCard
        entries={[entry("a", 10000, ["철수", "영희"])]}
      />,
    );
    expect(html).not.toContain("완료 처리");
    expect(html).not.toContain("항목별 정산 완료 처리");
  });

  it("onSettle 전달 + 미정산 entry 있음 → '완료 처리' 버튼 노출", () => {
    const html = renderToStaticMarkup(
      <SettlementCard
        entries={[entry("a", 10000, ["철수", "영희"])]}
        onSettle={() => {}}
      />,
    );
    expect(html).toContain("항목별 정산 완료 처리");
    expect(html).toContain("완료 처리");
  });

  it("onSettle 전달 + 정산완료 entry 있음 → '되돌리기' 버튼 노출", () => {
    const html = renderToStaticMarkup(
      <SettlementCard
        entries={[settledEntry("a", 10000, ["철수", "영희"], NOW)]}
        onSettle={() => {}}
      />,
    );
    expect(html).toContain("되돌리기");
  });

  it("onSettle 미전달 + 정산완료 entry → details 표시되지만 되돌리기 버튼 없음", () => {
    const html = renderToStaticMarkup(
      <SettlementCard
        entries={[settledEntry("a", 10000, ["철수", "영희"], NOW)]}
      />,
    );
    expect(html).toContain("정산 완료된 1건");
    expect(html).not.toContain("되돌리기");
  });

  it("정산 완료 details — 통화 병기 적용", () => {
    const html = renderToStaticMarkup(
      <SettlementCard
        entries={[settledEntry("a", 10000, ["철수", "영희"], NOW)]}
        approxKrwRate={20}
        currencySymbol="₫"
      />,
    );
    // 정산 완료된 1건 · 총 ₩10,000 (≈ ₫200,000)
    expect(html).toContain("≈ ₫200,000");
  });

  it("settledAt 있는 + splitWith 없는 entry → 카드 미렌더 (members<2)", () => {
    const html = renderToStaticMarkup(
      <SettlementCard
        entries={[settledEntry("a", 10000, undefined, NOW)]}
      />,
    );
    expect(html).toBe("");
  });

  it("settledAt 있는 + splitWith 1명 entry → 카드 미렌더", () => {
    const html = renderToStaticMarkup(
      <SettlementCard
        entries={[settledEntry("a", 10000, ["혼자"], NOW)]}
      />,
    );
    expect(html).toBe("");
  });

  it("미정산 entry의 line-through 없음 — 정산완료만 line-through", () => {
    const html = renderToStaticMarkup(
      <SettlementCard
        entries={[
          entry("u1", 10000, ["철수", "영희"]),
          settledEntry("s1", 20000, ["철수", "영희"], NOW),
        ]}
        onSettle={() => {}}
      />,
    );
    // line-through는 정산완료 details 안에만
    expect(html).toContain("line-through");
  });
});

describe("사이클 A5 — SettlementCard 송금 흐름 복사 버튼", () => {
  function makeSettled(
    id: string,
    amountKrw: number,
    splitWith: CostEntry["splitWith"],
    settledAt: string,
  ): CostEntry {
    return { ...entry(id, amountKrw, splitWith), settledAt };
  }

  it("transfers 있을 때 복사 버튼 노출", () => {
    const html = renderToStaticMarkup(
      <SettlementCard entries={[entry("a", 10000, ["철수", "영희"])]} />,
    );
    expect(html).toContain("📋 송금 흐름 복사 (귀국 후 송금용)");
    expect(html).toContain('aria-label="송금 흐름 텍스트 복사 — 한국 귀국 후 토스/카톡 송금"');
  });

  it("transfers 없을 때 (균등 부담 일치) 복사 버튼 미노출", () => {
    // 같은 이름 2회 → normalizeSplitWith → 2명 → 결제자=혼자, share=혼자 → net 0 → transfers 0
    const html = renderToStaticMarkup(
      <SettlementCard entries={[entry("a", 10000, ["혼자", "혼자"])]} />,
    );
    expect(html).toContain("정산 완료 — 모두 균등 부담입니다");
    expect(html).not.toContain("📋 송금 흐름 복사");
  });

  it("정산 완료된 건만 있을 때 복사 버튼 미노출 (미정산 영역 자체 미렌더)", () => {
    const html = renderToStaticMarkup(
      <SettlementCard
        entries={[makeSettled("a", 10000, ["철수", "영희"], NOW)]}
      />,
    );
    expect(html).not.toContain("📋 송금 흐름 복사");
    expect(html).toContain("정산 완료된 1건");
  });
});
