/**
 * 사이클 NN — CostEntriesList 단위 테스트.
 *
 * 답습: 사이클 LL AddCostForm.
 *
 * 검증:
 *  - 빈 entries → 안내 메시지
 *  - entry 카드 렌더 (라벨/금액/날짜)
 *  - 카테고리 라벨 한국어
 *  - status badge 3종 (paid/booked/planned)
 *  - amountLocal 표시 (현지 통화 병기)
 *  - 삭제 버튼 aria-label
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CostEntriesList } from "@/components/cost/CostEntriesList";
import type { CostEntry } from "@/lib/types";

const NOW = "2026-05-03T00:00:00Z";
const NOOP = () => {};

function entry(
  id: string,
  overrides: Partial<CostEntry> = {},
): CostEntry {
  return {
    id,
    tripId: "t1",
    date: "2026-05-03",
    label: `entry-${id}`,
    amountKrw: 10_000,
    status: "paid",
    category: "food",
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe("사이클 NN — CostEntriesList", () => {
  it("빈 entries → 안내 메시지", () => {
    const html = renderToStaticMarkup(
      <CostEntriesList entries={[]} onDelete={NOOP} />,
    );
    expect(html).toContain("아직 입력된 비용이 없어요");
    expect(html).toContain("최근 입력");
  });

  it("entry 카드 렌더 (라벨/금액/날짜)", () => {
    const html = renderToStaticMarkup(
      <CostEntriesList
        entries={[entry("a", { label: "반미 점심", amountKrw: 5_500 })]}
        onDelete={NOOP}
      />,
    );
    expect(html).toContain("반미 점심");
    expect(html).toContain("5,500원");
    expect(html).toContain("2026-05-03");
  });

  it("카테고리 라벨 한국어 6종", () => {
    const html = renderToStaticMarkup(
      <CostEntriesList
        entries={[
          entry("a", { category: "food" }),
          entry("b", { category: "transport" }),
          entry("c", { category: "accommodation" }),
          entry("d", { category: "shopping" }),
          entry("e", { category: "activity" }),
          entry("f", { category: "other" }),
        ]}
        onDelete={NOOP}
      />,
    );
    expect(html).toContain("식비");
    expect(html).toContain("교통");
    expect(html).toContain("숙박");
    expect(html).toContain("쇼핑");
    expect(html).toContain("액티비티");
    expect(html).toContain("기타");
  });

  it("status badge 3종", () => {
    const html = renderToStaticMarkup(
      <CostEntriesList
        entries={[
          entry("a", { status: "paid" }),
          entry("b", { status: "booked" }),
          entry("c", { status: "planned" }),
        ]}
        onDelete={NOOP}
      />,
    );
    expect(html).toContain("결제 완료");
    expect(html).toContain("예약 (선결제)");
    expect(html).toContain("예정");
  });

  it("amountLocal 현지 통화 병기", () => {
    const html = renderToStaticMarkup(
      <CostEntriesList
        entries={[
          entry("a", {
            amountKrw: 10_000,
            amountLocal: { value: 200_000, currency: "VND" },
          }),
        ]}
        onDelete={NOOP}
      />,
    );
    expect(html).toContain("10,000원");
    expect(html).toContain("200,000");
    expect(html).toContain("VND");
  });

  it("삭제 버튼 aria-label", () => {
    const html = renderToStaticMarkup(
      <CostEntriesList entries={[entry("a")]} onDelete={NOOP} />,
    );
    expect(html).toContain('aria-label="삭제"');
  });
});
