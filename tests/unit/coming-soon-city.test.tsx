/**
 * ComingSoonCity 컴포넌트 단위 테스트.
 * 사이클 F (V3) — 비-베트남 도시 "준비 중" 안내.
 *
 * 추출 사이클: refactor/city-page-component-extraction
 * 위치: components/city/ComingSoonCity.tsx
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ComingSoonCity } from "@/components/city/ComingSoonCity";
import type { City } from "@/lib/types";

function makeCity(over: Partial<City> = {}): City {
  return {
    code: "BKK",
    slug: "bangkok",
    name: "방콕",
    country: "태국",
    countryCode: "TH",
    emergencyContacts: [],
    payment: {} as never,
    transport: {} as never,
    curatedGuides: [],
    ...over,
  } as City;
}

describe("ComingSoonCity", () => {
  it("도시 이름과 국가/코드 표시", () => {
    const html = renderToStaticMarkup(<ComingSoonCity city={makeCity()} />);
    expect(html).toContain("방콕 가이드는 곧 만나요");
    expect(html).toContain("태국(BKK)");
  });

  it("베트남 우선 정책 메시지 노출", () => {
    const html = renderToStaticMarkup(<ComingSoonCity city={makeCity()} />);
    expect(html).toContain("베트남 우선");
    expect(html).toContain("🇻🇳");
    expect(html).toContain("준비 중");
  });

  it("푸꾸옥 / 다낭 진입 링크 제공", () => {
    const html = renderToStaticMarkup(<ComingSoonCity city={makeCity()} />);
    expect(html).toContain('href="/city/phu-quoc"');
    expect(html).toContain('href="/city/da-nang"');
    expect(html).toContain("푸꾸옥");
    expect(html).toContain("다낭");
  });

  it("'홈으로 가기' 링크 노출", () => {
    const html = renderToStaticMarkup(<ComingSoonCity city={makeCity()} />);
    expect(html).toContain('href="/"');
    expect(html).toContain("홈으로 가기");
  });

  it("BottomNav active='trips' 포함 (하단 내비게이션 노출)", () => {
    const html = renderToStaticMarkup(<ComingSoonCity city={makeCity()} />);
    // BottomNav 자체 렌더 텍스트(예: '여행' 라벨)
    expect(html).toContain("aria-current");
  });

  it("도쿄 등 다른 도시명도 동일 패턴", () => {
    const tokyo = makeCity({
      code: "TYO",
      slug: "tokyo",
      name: "도쿄",
      country: "일본",
      countryCode: "JP",
    });
    const html = renderToStaticMarkup(<ComingSoonCity city={tokyo} />);
    expect(html).toContain("도쿄 가이드는 곧 만나요");
    expect(html).toContain("일본(TYO)");
  });
});
