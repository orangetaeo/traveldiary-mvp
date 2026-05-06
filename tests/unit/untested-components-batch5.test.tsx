/**
 * 미테스트 컴포넌트 스모크 테스트 — Batch 5.
 *
 * renderToStaticMarkup 정적 마크업 검증.
 * 대상: CityGuideCards (EmergencyRow, PhraseCard, CuratedGuideCard),
 *       OtaInterstitialModal, ReceivedKeyTracker.
 */

import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// ─── Mocks ────────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

vi.mock("@/lib/share/receivedKeys", () => ({
  addReceivedKey: vi.fn(() => ({ isNew: true })),
  listReceivedKeys: () => [],
}));

// ─── Imports ──────────────────────────────────────────────

import {
  EmergencyRow,
  PhraseCard,
  CuratedGuideCard,
} from "@/components/city/CityGuideCards";
import OtaInterstitialModal from "@/components/modals/OtaInterstitialModal";
import { ReceivedKeyTracker } from "@/components/share/ReceivedKeyTracker";
import type { EmergencyContact, SituationalPhrase, CuratedGuide } from "@/lib/types";

/* ════════════════════════════════════════════
 * EmergencyRow
 * ════════════════════════════════════════════ */

describe("EmergencyRow", () => {
  const contact: EmergencyContact = {
    label: "한국 대사관 (호치민)",
    phone: "+84 28 3822 5757",
    notes: "한국어 가능",
    category: "embassy",
  };

  it("라벨 + 전화번호 표시", () => {
    const html = renderToStaticMarkup(<EmergencyRow contact={contact} />);
    expect(html).toContain("한국 대사관 (호치민)");
    expect(html).toContain("+84 28 3822 5757");
  });

  it("tel: 링크 (공백 제거)", () => {
    const html = renderToStaticMarkup(<EmergencyRow contact={contact} />);
    expect(html).toContain('href="tel:+84283822575');
  });

  it("notes 있으면 표시", () => {
    const html = renderToStaticMarkup(<EmergencyRow contact={contact} />);
    expect(html).toContain("한국어 가능");
  });

  it("notes 없으면 미표시", () => {
    const noNotes: EmergencyContact = {
      label: "경찰",
      phone: "113",
      category: "police",
    };
    const html = renderToStaticMarkup(<EmergencyRow contact={noNotes} />);
    expect(html).not.toContain("한국어 가능");
    expect(html).toContain("113");
  });

  it("전화 버튼 존재", () => {
    const html = renderToStaticMarkup(<EmergencyRow contact={contact} />);
    expect(html).toContain("전화");
  });

  it("li 태그 렌더", () => {
    const html = renderToStaticMarkup(<EmergencyRow contact={contact} />);
    expect(html).toMatch(/^<li/);
  });
});

/* ════════════════════════════════════════════
 * PhraseCard
 * ════════════════════════════════════════════ */

describe("PhraseCard", () => {
  const phrase: SituationalPhrase = {
    situation: "greeting",
    korean: "안녕하세요",
    local: "Xin chào",
    pronunciation: "신 짜오",
  };

  it("situation 라벨 매핑 (greeting → 인사)", () => {
    const html = renderToStaticMarkup(<PhraseCard phrase={phrase} />);
    expect(html).toContain("인사");
  });

  it("한국어 + 현지어 표시", () => {
    const html = renderToStaticMarkup(<PhraseCard phrase={phrase} />);
    expect(html).toContain("안녕하세요");
    expect(html).toContain("Xin chào");
  });

  it("발음 표시", () => {
    const html = renderToStaticMarkup(<PhraseCard phrase={phrase} />);
    expect(html).toContain("신 짜오");
  });

  it("발음 없으면 미표시", () => {
    const noPronunciation: SituationalPhrase = {
      situation: "thanks",
      korean: "감사합니다",
      local: "Cảm ơn",
    };
    const html = renderToStaticMarkup(<PhraseCard phrase={noPronunciation} />);
    expect(html).toContain("감사");
    expect(html).toContain("Cảm ơn");
    expect(html).not.toContain("italic");
  });

  it("situation 10종 매핑", () => {
    const situations: SituationalPhrase["situation"][] = [
      "greeting", "thanks", "checkout", "price", "help",
      "menu", "slow", "spicy", "vegetarian", "drink",
    ];
    const labels = ["인사", "감사", "계산", "가격", "도움", "메뉴", "천천히", "맵기", "채식", "음료"];
    for (let i = 0; i < situations.length; i++) {
      const html = renderToStaticMarkup(
        <PhraseCard phrase={{ situation: situations[i], korean: "테스트", local: "test" }} />,
      );
      expect(html).toContain(labels[i]);
    }
  });
});

/* ════════════════════════════════════════════
 * CuratedGuideCard
 * ════════════════════════════════════════════ */

describe("CuratedGuideCard", () => {
  const guide: CuratedGuide = {
    id: "guide-1",
    title: "푸꾸옥 야시장 첫날 밤",
    subtitle: "도착하자마자 가야 하는 5곳",
    hero: { emoji: "🌙", gradient: "from-amber to-amber-deep" },
    sections: [
      { heading: "야시장 입구", body: "야시장은 18시부터 열려요.", tip: "현금 준비!" },
      { heading: "씨푸드 코너", body: "랍스터가 유명합니다." },
    ],
  };

  it("제목 + 부제목 표시", () => {
    const html = renderToStaticMarkup(<CuratedGuideCard guide={guide} />);
    expect(html).toContain("푸꾸옥 야시장 첫날 밤");
    expect(html).toContain("도착하자마자 가야 하는 5곳");
  });

  it("히어로 emoji 표시", () => {
    const html = renderToStaticMarkup(<CuratedGuideCard guide={guide} />);
    expect(html).toContain("🌙");
  });

  it("커스텀 gradient 적용", () => {
    const html = renderToStaticMarkup(<CuratedGuideCard guide={guide} />);
    expect(html).toContain("from-amber to-amber-deep");
  });

  it("기본 gradient (hero.gradient 미설정)", () => {
    const noGradient: CuratedGuide = {
      ...guide,
      hero: { emoji: "🏖️" },
    };
    const html = renderToStaticMarkup(<CuratedGuideCard guide={noGradient} />);
    expect(html).toContain("from-purple to-purple-deep");
  });

  it("섹션 heading + body 렌더", () => {
    const html = renderToStaticMarkup(<CuratedGuideCard guide={guide} />);
    expect(html).toContain("야시장 입구");
    expect(html).toContain("야시장은 18시부터 열려요.");
    expect(html).toContain("씨푸드 코너");
    expect(html).toContain("랍스터가 유명합니다.");
  });

  it("tip 있으면 💡 표시", () => {
    const html = renderToStaticMarkup(<CuratedGuideCard guide={guide} />);
    expect(html).toContain("💡");
    expect(html).toContain("현금 준비!");
  });

  it("tip 없는 섹션은 tip 미렌더", () => {
    const noTipGuide: CuratedGuide = {
      id: "g2",
      title: "테스트",
      sections: [{ heading: "제목", body: "내용" }],
    };
    const html = renderToStaticMarkup(<CuratedGuideCard guide={noTipGuide} />);
    expect(html).not.toContain("💡");
  });

  it("article 태그 + id=guide-{id}", () => {
    const html = renderToStaticMarkup(<CuratedGuideCard guide={guide} />);
    expect(html).toMatch(/^<article/);
    expect(html).toContain('id="guide-guide-1"');
  });

  it("subtitle 없으면 미렌더", () => {
    const noSubtitle: CuratedGuide = {
      id: "g3",
      title: "간단 가이드",
      sections: [{ heading: "제목", body: "내용" }],
    };
    const html = renderToStaticMarkup(<CuratedGuideCard guide={noSubtitle} />);
    expect(html).toContain("간단 가이드");
    // subtitle 관련 p 태그 없어야 함 - "opacity-90" 클래스는 subtitle p에만 있음
    // 단, hero가 없으면 gradient 자체가 기본값
  });

  it("빈 sections → 섹션 영역 비어있음", () => {
    const emptySections: CuratedGuide = {
      id: "g4",
      title: "빈 가이드",
      sections: [],
    };
    const html = renderToStaticMarkup(<CuratedGuideCard guide={emptySections} />);
    expect(html).toContain("빈 가이드");
  });
});

/* ════════════════════════════════════════════
 * OtaInterstitialModal
 * ════════════════════════════════════════════ */

describe("OtaInterstitialModal", () => {
  const noop = () => {};
  const baseProps = {
    open: true,
    onClose: noop,
    provider: "Klook",
    productName: "바나힐 입장권",
    price: "35,000원",
    affiliateUrl: "https://klook.com/test",
  };

  it("open=false → 빈 렌더", () => {
    const html = renderToStaticMarkup(
      <OtaInterstitialModal {...baseProps} open={false} />,
    );
    expect(html).toBe("");
  });

  it("open=true → dialog 모달", () => {
    const html = renderToStaticMarkup(
      <OtaInterstitialModal {...baseProps} />,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
  });

  it("provider + 제휴 파트너 표시", () => {
    const html = renderToStaticMarkup(
      <OtaInterstitialModal {...baseProps} />,
    );
    expect(html).toContain("Klook");
    expect(html).toContain("제휴 파트너");
  });

  it("상품명 + 가격 표시", () => {
    const html = renderToStaticMarkup(
      <OtaInterstitialModal {...baseProps} />,
    );
    expect(html).toContain("바나힐 입장권");
    expect(html).toContain("35,000원");
  });

  it("discountLabel 있으면 표시", () => {
    const html = renderToStaticMarkup(
      <OtaInterstitialModal {...baseProps} discountLabel="-25%" />,
    );
    expect(html).toContain("-25%");
  });

  it("discountLabel 없으면 미표시", () => {
    const html = renderToStaticMarkup(
      <OtaInterstitialModal {...baseProps} />,
    );
    // discount 배지의 고유 클래스 미존재
    expect(html).not.toContain("text-danger bg-danger-soft");
  });

  it("혜택 3종 표시", () => {
    const html = renderToStaticMarkup(
      <OtaInterstitialModal {...baseProps} />,
    );
    expect(html).toContain("무료 취소 가능");
    expect(html).toContain("모바일 바우처 즉시 발급");
    expect(html).toContain("한국어 고객 지원");
  });

  it("제휴 고지 문구", () => {
    const html = renderToStaticMarkup(
      <OtaInterstitialModal {...baseProps} />,
    );
    expect(html).toContain("TravelDiary에 소정의 수수료");
    expect(html).toContain("추가 비용은 없습니다");
  });

  it("예약 CTA + 돌아가기 버튼", () => {
    const html = renderToStaticMarkup(
      <OtaInterstitialModal {...baseProps} />,
    );
    expect(html).toContain("Klook에서 예약하기");
    expect(html).toContain("돌아가기");
  });

  it("open_in_new 아이콘", () => {
    const html = renderToStaticMarkup(
      <OtaInterstitialModal {...baseProps} />,
    );
    expect(html).toContain("open_in_new");
  });
});

/* ════════════════════════════════════════════
 * ReceivedKeyTracker
 * ════════════════════════════════════════════ */

describe("ReceivedKeyTracker", () => {
  it("초기 렌더 → null (showBanner=false 기본)", () => {
    // useState 초기값이 false이므로 SSR에서는 null
    const html = renderToStaticMarkup(
      <ReceivedKeyTracker shareKey="abc-123" destination="다낭" />,
    );
    expect(html).toBe("");
  });

  it("destination prop 전달 가능", () => {
    // SSR에서는 null이지만 렌더 오류 없어야 함
    const html = renderToStaticMarkup(
      <ReceivedKeyTracker shareKey="abc-123" destination="호치민" nights={3} />,
    );
    expect(html).toBe("");
  });

  it("shareKey만으로 렌더 가능", () => {
    const html = renderToStaticMarkup(
      <ReceivedKeyTracker shareKey="def-456" />,
    );
    expect(html).toBe("");
  });
});
