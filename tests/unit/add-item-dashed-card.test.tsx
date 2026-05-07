/**
 * AddItemDashedCard 단위 테스트 (디자인 갭 #1 U1, 사이클 X).
 *
 * 검증:
 *  - 기본 모드: "+ 일정 추가" + ink-mute 톤
 *  - emphasized=true: "이 날에 첫 일정 추가하기" + 보라 톤 (빈 Day 메인 진입점)
 *  - aria-label "이 날에 일정 추가" 고정
 *  - role/type=button + dashed border
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AddItemDashedCard } from "@/components/itinerary/AddItemDashedCard";

const NOOP = () => {};

describe("AddItemDashedCard", () => {
  it("기본 모드: '+ 일정 추가' 텍스트 + ink-mute 톤", () => {
    const html = renderToStaticMarkup(
      <AddItemDashedCard onClick={NOOP} />,
    );
    expect(html).toContain("+ 일정 추가");
    expect(html).toContain("text-ink-mute");
    expect(html).not.toContain("이 날에 첫 일정");
  });

  it("emphasized=true: '이 날에 첫 일정 추가하기' + 보라 톤", () => {
    const html = renderToStaticMarkup(
      <AddItemDashedCard onClick={NOOP} emphasized />,
    );
    expect(html).toContain("이 날에 첫 일정 추가하기");
    expect(html).toContain("text-purple");
    expect(html).toContain("border-purple/40");
  });

  it("aria-label='이 날에 일정 추가' (양 모드 동일)", () => {
    const a = renderToStaticMarkup(<AddItemDashedCard onClick={NOOP} />);
    const b = renderToStaticMarkup(
      <AddItemDashedCard onClick={NOOP} emphasized />,
    );
    expect(a).toContain('aria-label="이 날에 일정 추가"');
    expect(b).toContain('aria-label="이 날에 일정 추가"');
  });

  it("type=button + dashed border (visual contract)", () => {
    const html = renderToStaticMarkup(<AddItemDashedCard onClick={NOOP} />);
    expect(html).toContain('type="button"');
    expect(html).toContain("border-dashed");
  });
});
