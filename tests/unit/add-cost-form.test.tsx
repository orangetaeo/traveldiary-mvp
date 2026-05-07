/**
 * 사이클 LL — AddCostForm 단위 테스트.
 *
 * 답습: 사이클 DD/HH/JJ (presentation 컴포넌트 추출 + props 검증).
 *
 * 검증:
 *  - 카테고리 6종 노출
 *  - 결제 상태 3종 노출
 *  - 통화 라벨에 currency + currencySymbol 표시
 *  - isPending=true → "추가 중…" + disabled
 *  - 정산 details summary "일행과 정산 (선택)"
 *  - aria-label 폼 필드 다수
 *  - placeholder 메시지 한국어
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AddCostForm } from "@/components/cost/AddCostForm";
import type { CostEntry } from "@/lib/types";

const NOOP = () => {};

function makeEntry(splitWith: CostEntry["splitWith"]): CostEntry {
  return {
    id: `e-${Math.random()}`,
    tripId: "t1",
    date: "2026-05-07",
    label: "lab",
    amountKrw: 10000,
    status: "paid",
    category: "food",
    createdAt: "2026-05-07T00:00:00Z",
    updatedAt: "2026-05-07T00:00:00Z",
    splitWith,
  };
}

describe("사이클 LL — AddCostForm", () => {
  it("카테고리 6종 + 상태 3종 노출", () => {
    const html = renderToStaticMarkup(
      <AddCostForm
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={20}
        isPending={false}
        onSubmit={NOOP}
        onError={NOOP}
      />,
    );
    // 카테고리
    expect(html).toContain("식비");
    expect(html).toContain("교통");
    expect(html).toContain("숙박");
    expect(html).toContain("쇼핑");
    expect(html).toContain("액티비티");
    expect(html).toContain("기타");
    // 상태
    expect(html).toContain("결제 완료");
    expect(html).toContain("예약 (선결제)");
    expect(html).toContain("예정");
  });

  it("currency/currencySymbol 라벨 노출", () => {
    const html = renderToStaticMarkup(
      <AddCostForm
        currency="THB"
        currencySymbol="฿"
        approxKrwRate={28}
        isPending={false}
        onSubmit={NOOP}
        onError={NOOP}
      />,
    );
    expect(html).toContain("THB");
    expect(html).toContain("฿");
  });

  it("isPending=true → '추가 중…' + disabled", () => {
    const html = renderToStaticMarkup(
      <AddCostForm
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={20}
        isPending={true}
        onSubmit={NOOP}
        onError={NOOP}
      />,
    );
    expect(html).toContain("추가 중…");
    expect(html).toContain("disabled");
  });

  it("isPending=false → '비용 추가' 버튼", () => {
    const html = renderToStaticMarkup(
      <AddCostForm
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={20}
        isPending={false}
        onSubmit={NOOP}
        onError={NOOP}
      />,
    );
    expect(html).toContain("비용 추가");
    expect(html).not.toContain("추가 중…");
  });

  it("정산 details summary 노출", () => {
    const html = renderToStaticMarkup(
      <AddCostForm
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={20}
        isPending={false}
        onSubmit={NOOP}
        onError={NOOP}
      />,
    );
    expect(html).toContain("일행과 정산 (선택)");
    expect(html).toContain("결제자 포함 자동 분담");
    expect(html).toContain("이름:가중치");
  });

  it("aria-label 폼 필드 (카테고리·상태·일자·결제자·함께 부담·항목명)", () => {
    const html = renderToStaticMarkup(
      <AddCostForm
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={20}
        isPending={false}
        onSubmit={NOOP}
        onError={NOOP}
      />,
    );
    expect(html).toContain('aria-label="항목명"');
    expect(html).toContain('aria-label="카테고리"');
    expect(html).toContain('aria-label="결제 상태"');
    expect(html).toContain('aria-label="결제 일자"');
    expect(html).toContain('aria-label="결제자"');
    expect(html).toContain('aria-label="함께 부담한 사람"');
  });

  it("KRW + 현지통화 자동 변환 안내 메시지", () => {
    const html = renderToStaticMarkup(
      <AddCostForm
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={20}
        isPending={false}
        onSubmit={NOOP}
        onError={NOOP}
      />,
    );
    expect(html).toContain("둘 중 하나만 입력하면 자동 변환됩니다");
  });

  it("항목명 placeholder 한국어 예시", () => {
    const html = renderToStaticMarkup(
      <AddCostForm
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={20}
        isPending={false}
        onSubmit={NOOP}
        onError={NOOP}
      />,
    );
    expect(html).toContain("즈엉동 야시장 저녁");
  });
});

describe("사이클 A5 — AddCostForm 동행자 빈도 칩", () => {
  it("entries 미전달 시 자주 함께한 동행자 영역 미노출", () => {
    const html = renderToStaticMarkup(
      <AddCostForm
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={20}
        isPending={false}
        onSubmit={NOOP}
        onError={NOOP}
      />,
    );
    expect(html).not.toContain("자주 함께한 동행자");
    expect(html).not.toContain("1/N 자동 채우기");
  });

  it("entries 빈 배열 시에도 미노출", () => {
    const html = renderToStaticMarkup(
      <AddCostForm
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={20}
        isPending={false}
        onSubmit={NOOP}
        onError={NOOP}
        entries={[]}
      />,
    );
    expect(html).not.toContain("자주 함께한 동행자");
  });

  it("멤버 1회 등장 시 칩 노출 + 1/N 버튼 미노출 (≥ 2회 조건)", () => {
    const html = renderToStaticMarkup(
      <AddCostForm
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={20}
        isPending={false}
        onSubmit={NOOP}
        onError={NOOP}
        entries={[makeEntry(["나", "영희"])]}
      />,
    );
    expect(html).toContain("자주 함께한 동행자");
    expect(html).toContain("나");
    expect(html).toContain("영희");
    // 1회만 등장 → 1/N 버튼 노출 안 됨
    expect(html).not.toContain("1/N 자동 채우기");
  });

  it("멤버 ≥ 2회 등장 시 ×N 배지 + 1/N 자동 채우기 버튼 노출", () => {
    const html = renderToStaticMarkup(
      <AddCostForm
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={20}
        isPending={false}
        onSubmit={NOOP}
        onError={NOOP}
        entries={[
          makeEntry(["나", "영희"]),
          makeEntry(["나", "영희", "철수"]),
          makeEntry(["나"]),
        ]}
      />,
    );
    expect(html).toContain("×3"); // 나
    expect(html).toContain("×2"); // 영희
    expect(html).toContain("1/N 자동 채우기");
    expect(html).toContain('aria-label="자주 함께한 동행자 모두로 1/N 자동 채우기"');
  });

  it("aria-label 칩 동행자 추가 (회수 표기)", () => {
    const html = renderToStaticMarkup(
      <AddCostForm
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={20}
        isPending={false}
        onSubmit={NOOP}
        onError={NOOP}
        entries={[makeEntry(["나", "영희"])]}
      />,
    );
    expect(html).toContain('aria-label="나 추가 — 1회 함께함"');
    expect(html).toContain('aria-label="영희 추가 — 1회 함께함"');
  });
});
