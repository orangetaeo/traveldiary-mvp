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

const NOOP = () => {};

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
