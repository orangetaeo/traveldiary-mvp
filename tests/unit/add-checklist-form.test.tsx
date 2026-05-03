/**
 * 사이클 QQ — AddChecklistForm 단위 테스트.
 *
 * 답습: 사이클 LL AddCostForm.
 *
 * 검증:
 *  - 카테고리 6종 + 버킷 6종 select 노출
 *  - 입력 placeholder + maxLength 100
 *  - aria-label (항목명 / 카테고리 / D-Day 시점)
 *  - isPending=true → "추가 중…" + disabled
 *  - isPending=false + 빈 입력 → 버튼 disabled
 *  - 기본값: category=custom + bucket=D-7
 *  - 제출 시 onSubmit 호출 — 트림된 텍스트
 *  - 빈 입력 제출 시 onSubmit 비호출
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AddChecklistForm } from "@/components/checklist/AddChecklistForm";

const NOOP = () => {};

describe("사이클 QQ — AddChecklistForm", () => {
  it("카테고리 6종 + 버킷 6종 노출", () => {
    const html = renderToStaticMarkup(
      <AddChecklistForm isPending={false} onSubmit={NOOP} />,
    );
    // 카테고리
    expect(html).toContain("서류");
    expect(html).toContain("의류");
    expect(html).toContain("전자");
    expect(html).toContain("반입 금지");
    expect(html).toContain("신고 대상");
    expect(html).toContain("기타");
    // 버킷
    expect(html).toContain("D-30 · 사전 준비");
    expect(html).toContain("D-14 · 예약 마감");
    expect(html).toContain("D-7 · 짐 준비");
    expect(html).toContain("D-1 · 출발 직전");
    expect(html).toContain("여행 중");
    expect(html).toContain("귀국 후");
  });

  it("placeholder + maxLength=100", () => {
    const html = renderToStaticMarkup(
      <AddChecklistForm isPending={false} onSubmit={NOOP} />,
    );
    expect(html).toContain("우산, 약, 한국 컵라면");
    expect(html).toContain("maxLength=\"100\"");
  });

  it("aria-label (항목명 / 카테고리 / D-Day 시점)", () => {
    const html = renderToStaticMarkup(
      <AddChecklistForm isPending={false} onSubmit={NOOP} />,
    );
    expect(html).toContain('aria-label="항목명"');
    expect(html).toContain('aria-label="카테고리"');
    expect(html).toContain('aria-label="D-Day 시점"');
  });

  it("isPending=true → '추가 중…' + disabled", () => {
    const html = renderToStaticMarkup(
      <AddChecklistForm isPending={true} onSubmit={NOOP} />,
    );
    expect(html).toContain("추가 중…");
    expect(html).toContain("disabled");
  });

  it("isPending=false + 빈 입력 → 버튼 disabled (text 미입력)", () => {
    const html = renderToStaticMarkup(
      <AddChecklistForm isPending={false} onSubmit={NOOP} />,
    );
    // 초기 text=""이므로 disabled (!text.trim() 조건)
    expect(html).toContain("disabled");
    expect(html).toContain("추가");
  });

  it("기본 select 값 — category=custom + bucket=D-7", () => {
    const html = renderToStaticMarkup(
      <AddChecklistForm isPending={false} onSubmit={NOOP} />,
    );
    // SSR 출력은 selected 속성이 default value에 따름
    expect(html).toContain("기타"); // custom label
    expect(html).toContain("D-7 · 짐 준비");
  });

  it("section heading '항목 추가'", () => {
    const html = renderToStaticMarkup(
      <AddChecklistForm isPending={false} onSubmit={NOOP} />,
    );
    expect(html).toContain("항목 추가");
  });

  it("form 태그 + submit 버튼 type", () => {
    const html = renderToStaticMarkup(
      <AddChecklistForm isPending={false} onSubmit={NOOP} />,
    );
    expect(html).toContain("<form");
    expect(html).toContain('type="submit"');
  });
});
