/**
 * CityContextStrip 컴포넌트 단위 테스트.
 * 사이클 8 M5 — /travel/[id] 푸터 가로 스크롤 카드 5건.
 *
 * 위치: components/city/CityContextStrip.tsx
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CityContextStrip } from "@/components/city/CityContextStrip";
import type { ResolvedCity } from "@/lib/types";

function makeCity(over: Partial<ResolvedCity> = {}): ResolvedCity {
  return {
    code: "PQC",
    slug: "phu-quoc",
    name: "푸꾸옥",
    country: "베트남",
    countryCode: "VN",
    emergencyContacts: [
      { label: "구급차", phone: "115", category: "ambulance" },
      { label: "주 호치민 한국 영사관", phone: "+84 28 3822 5757", category: "embassy" },
    ],
    payment: {
      currency: "VND",
      currencySymbol: "₫",
      approxKrwRate: 18,
      cardAcceptance: "medium",
      atmAvailable: true,
      tipExpected: false,
    },
    transport: {
      primary: "grab",
      primaryNotes: "택시 호출 앱",
    },
    phrases: [],
    curatedGuides: [
      {
        id: "sao-beach",
        title: "사오비치 노을",
        sections: [],
        hero: { emoji: "🌅" },
      },
    ],
    ...over,
  } as ResolvedCity;
}

describe("CityContextStrip", () => {
  it("5 카드 모두 렌더 (curatedGuides[0] 있을 때)", () => {
    const html = renderToStaticMarkup(<CityContextStrip city={makeCity()} />);
    expect(html).toContain("응급");
    expect(html).toContain("VND");
    expect(html).toContain("grab"); // CSS uppercase 클래스로 시각만 대문자, HTML은 소문자
    expect(html).toContain("시그니처");
    expect(html).toContain("푸꾸옥 가이드");
  });

  it("응급 카드 — ambulance phone + 정규식 ^주\\s*[^\\s]+\\s+ 제거 후 영사관 라벨", () => {
    const html = renderToStaticMarkup(<CityContextStrip city={makeCity()} />);
    expect(html).toContain("115");
    // "주 호치민 한국 영사관" → 정규식이 "주 호치민 " 통째 제거 → "한국 영사관"
    expect(html).toContain("한국 영사관");
    expect(html).not.toContain("주 호치민");
  });

  it("응급 카드 — ambulance phone은 tel: 링크 (D3)", () => {
    const html = renderToStaticMarkup(<CityContextStrip city={makeCity()} />);
    expect(html).toContain('href="tel:115"');
  });

  it("응급 카드 — 국제번호 공백 제거 tel: 링크", () => {
    const html = renderToStaticMarkup(
      <CityContextStrip
        city={makeCity({
          emergencyContacts: [
            { label: "구급차", phone: "+84 28 1234 5678", category: "ambulance" },
            { label: "영사관", phone: "+82 2 3210 0404", category: "embassy" },
          ],
        })}
      />,
    );
    expect(html).toContain('href="tel:+842812345678"');
  });

  it("환율 카드 — 1{symbol} = X원 (1/approxKrwRate)", () => {
    const html = renderToStaticMarkup(<CityContextStrip city={makeCity()} />);
    expect(html).toContain("1₫ =");
    expect(html).toContain("0.056"); // 1/18
  });

  it("교통 카드 — transport.primary uppercase 클래스 + 텍스트", () => {
    const html = renderToStaticMarkup(<CityContextStrip city={makeCity()} />);
    expect(html).toContain("uppercase");
    expect(html).toContain("grab");
  });

  it("시그니처 카드 — curatedGuides[0] title + emoji", () => {
    const html = renderToStaticMarkup(<CityContextStrip city={makeCity()} />);
    expect(html).toContain("사오비치 노을");
    expect(html).toContain("🌅");
  });

  it("curatedGuides=[] → 시그니처 카드 미렌더, 나머지 4 카드 정상", () => {
    const html = renderToStaticMarkup(
      <CityContextStrip city={makeCity({ curatedGuides: [] })} />,
    );
    expect(html).not.toContain("시그니처");
    expect(html).toContain("응급");
    expect(html).toContain("VND");
    expect(html).toContain("푸꾸옥 가이드");
  });

  it("도시 가이드 CTA — /city/{slug} 메인 링크", () => {
    const html = renderToStaticMarkup(<CityContextStrip city={makeCity()} />);
    expect(html).toContain('href="/city/phu-quoc"');
    expect(html).toContain("푸꾸옥 가이드 →");
  });

  it("ambulance/embassy 미존재 — '—' fallback + 기본 영사관 라벨", () => {
    const html = renderToStaticMarkup(
      <CityContextStrip
        city={makeCity({
          emergencyContacts: [
            { label: "경찰", phone: "113", category: "police" },
          ],
        })}
      />,
    );
    expect(html).toContain("—");
    expect(html).toContain("한국 영사관");
  });

  // 2026-05-08 — 가로 스와이프 시 페이지가 위로 밀리는 현상 fix.
  // touch-action: pan-x로 수직 제스처 부모 위임, overscroll-behavior-x: contain으로
  // scroll chaining 차단.
  it("가로 스크롤 컨테이너 — touch-pan-x + overscroll-x-contain 적용", () => {
    const html = renderToStaticMarkup(<CityContextStrip city={makeCity()} />);
    // overflow-x-auto와 함께 touch-pan-x가 같은 컨테이너에 함께 적용됐는지
    expect(html).toMatch(/overflow-x-auto[^"]*touch-pan-x/);
    // overscroll-x-contain (scroll chaining 차단)
    expect(html).toContain("overscroll-x-contain");
  });
});
