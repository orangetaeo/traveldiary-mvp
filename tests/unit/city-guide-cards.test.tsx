/**
 * CityGuideCards 컴포넌트 단위 테스트.
 * EmergencyRow / PhraseCard / CuratedGuideCard 3종 smoke 검증.
 *
 * 추출 사이클: refactor/city-page-component-extraction
 * 위치: components/city/CityGuideCards.tsx
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  EmergencyRow,
  PhraseCard,
  CuratedGuideCard,
} from "@/components/city/CityGuideCards";
import type {
  EmergencyContact,
  SituationalPhrase,
  CuratedGuide,
} from "@/lib/types";

describe("EmergencyRow", () => {
  const contact: EmergencyContact = {
    label: "긴급 (경찰)",
    phone: "113",
    notes: "베트남 경찰",
  };

  it("label / phone / notes 모두 표시", () => {
    const html = renderToStaticMarkup(
      <ul>
        <EmergencyRow contact={contact} />
      </ul>,
    );
    expect(html).toContain("긴급 (경찰)");
    expect(html).toContain("113");
    expect(html).toContain("베트남 경찰");
  });

  it("tel: 링크는 공백 제거된 phone 사용", () => {
    const withSpace: EmergencyContact = { ...contact, phone: "1900 1234" };
    const html = renderToStaticMarkup(
      <ul>
        <EmergencyRow contact={withSpace} />
      </ul>,
    );
    expect(html).toContain('href="tel:19001234"');
  });

  it("notes 없으면 해당 영역 미렌더", () => {
    const noNotes: EmergencyContact = { label: "응급", phone: "115" };
    const html = renderToStaticMarkup(
      <ul>
        <EmergencyRow contact={noNotes} />
      </ul>,
    );
    expect(html).toContain("115");
    expect(html).not.toContain("베트남 경찰");
  });
});

describe("PhraseCard", () => {
  const phrase: SituationalPhrase = {
    situation: "thanks",
    korean: "감사합니다",
    local: "Cảm ơn",
    pronunciation: "깜언",
  };

  it("한국어 / 현지어 / 발음 모두 표시", () => {
    const html = renderToStaticMarkup(<PhraseCard phrase={phrase} />);
    expect(html).toContain("감사합니다");
    expect(html).toContain("Cảm ơn");
    expect(html).toContain("깜언");
  });

  it("situation 매핑 한글 라벨 사용 (thanks → 감사)", () => {
    const html = renderToStaticMarkup(<PhraseCard phrase={phrase} />);
    expect(html).toContain("감사");
  });

  it("pronunciation 없으면 해당 영역 미렌더", () => {
    const noPron: SituationalPhrase = { ...phrase, pronunciation: undefined };
    const html = renderToStaticMarkup(<PhraseCard phrase={noPron} />);
    expect(html).toContain("Cảm ơn");
    expect(html).not.toContain("깜언");
  });
});

describe("CuratedGuideCard", () => {
  const guide: CuratedGuide = {
    id: "g1",
    title: "푸꾸옥 노을 코스",
    subtitle: "현지인 추천",
    hero: { emoji: "🌅", gradient: "from-amber to-amber-deep" },
    sections: [
      { heading: "1. 사오비치", body: "오후 5시 도착 권장", tip: "주차장 협소" },
    ],
  };

  it("title / subtitle / section heading / body 모두 표시", () => {
    const html = renderToStaticMarkup(<CuratedGuideCard guide={guide} />);
    expect(html).toContain("푸꾸옥 노을 코스");
    expect(html).toContain("현지인 추천");
    expect(html).toContain("1. 사오비치");
    expect(html).toContain("오후 5시 도착 권장");
  });

  it("section.tip 있으면 💡 prefix와 함께 노출", () => {
    const html = renderToStaticMarkup(<CuratedGuideCard guide={guide} />);
    expect(html).toContain("주차장 협소");
    expect(html).toContain("💡");
  });

  it("hero.gradient 미지정 → 기본 purple gradient 사용", () => {
    const noGrad: CuratedGuide = { ...guide, hero: { emoji: "🌅" } };
    const html = renderToStaticMarkup(<CuratedGuideCard guide={noGrad} />);
    expect(html).toContain("from-purple to-purple-deep");
  });

  it("anchor id는 guide.id 기반 (#guide-{id})", () => {
    const html = renderToStaticMarkup(<CuratedGuideCard guide={guide} />);
    expect(html).toContain('id="guide-g1"');
  });
});
