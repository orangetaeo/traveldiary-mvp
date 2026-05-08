/**
 * 미테스트 컴포넌트 배치 12 — smoke 테스트.
 *
 * MenuItemCard, ReceivedTripBanner, BentoSummary,
 * EmergencyCards (ContactCard, LossGuideCard),
 * CityGuideCards (EmergencyRow, PhraseCard, CuratedGuideCard).
 */

import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    [k: string]: unknown;
  }) => React.createElement("a", { href, className, ...rest }, children),
}));

// ─── MenuItemCard ──────────────────────────────────────

import { MenuItemCard } from "@/components/translate/MenuItemCard";

vi.mock("@/components/ui/Card", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement("div", { className: `card ${className ?? ""}` }, children),
}));

vi.mock("@/components/ui/Badge", () => ({
  Badge: ({ children, tone }: { children: React.ReactNode; tone: string }) =>
    React.createElement("span", { "data-tone": tone }, children),
}));

const MENU_ITEM = {
  original: "Phở Bò",
  phonetic: "퍼 보",
  translated: "소고기 쌀국수",
  price: { krw: 15000, local: { value: 60000, currency: "VND" as const } },
  ingredients: ["쌀국수", "소고기", "고수", "숙주"],
  culturalNote: "베트남 국민 음식",
  koreanPopularity: 95,
};

describe("MenuItemCard", () => {
  it("기본 렌더링 (매치 없음)", () => {
    const html = renderToStaticMarkup(
      <MenuItemCard item={MENU_ITEM} matches={[]} />,
    );
    expect(html).toContain("Phở Bò");
    expect(html).toContain("퍼 보");
    expect(html).toContain("소고기 쌀국수");
    expect(html).toContain("15,000");
    expect(html).toContain("베트남 국민 음식");
  });

  it("한국인 BEST 배지 (koreanPopularity ≥ 80)", () => {
    const html = renderToStaticMarkup(
      <MenuItemCard item={MENU_ITEM} matches={[]} />,
    );
    expect(html).toContain("한국인 BEST");
  });

  it("한국인 BEST 미표시 (koreanPopularity < 80)", () => {
    const item = { ...MENU_ITEM, koreanPopularity: 50 };
    const html = renderToStaticMarkup(
      <MenuItemCard item={item} matches={[]} />,
    );
    expect(html).not.toContain("한국인 BEST");
  });

  it("critical 매치 → 위험 배지", () => {
    const matches = [
      { category: "갑각류", keyword: "새우", severity: "critical" as const },
    ];
    const html = renderToStaticMarkup(
      <MenuItemCard item={MENU_ITEM} matches={matches} />,
    );
    expect(html).toContain("위험");
    expect(html).toContain("border-danger");
  });

  it("preference 매치 → 제외 식이 포함", () => {
    const matches = [
      { category: "고수", keyword: "고수", severity: "preference" as const },
    ];
    const html = renderToStaticMarkup(
      <MenuItemCard item={MENU_ITEM} matches={matches} />,
    );
    expect(html).toContain("제외 식이 포함");
  });

  it("재료 매칭 시 하이라이트 스타일", () => {
    const matches = [
      { category: "고수", keyword: "고수", severity: "preference" as const },
    ];
    const html = renderToStaticMarkup(
      <MenuItemCard item={MENU_ITEM} matches={matches} />,
    );
    expect(html).toContain("bg-danger-soft");
  });

  it("최대 5개 재료만 표시", () => {
    const item = {
      ...MENU_ITEM,
      ingredients: ["a", "b", "c", "d", "e", "f", "g"],
    };
    const html = renderToStaticMarkup(
      <MenuItemCard item={item} matches={[]} />,
    );
    expect(html).toContain("e");
    expect(html).not.toContain(">f<");
  });
});

// ─── ReceivedTripBanner ────────────────────────────────

import { ReceivedTripBanner } from "@/components/share/ReceivedTripBanner";

describe("ReceivedTripBanner", () => {
  it("제목 + 설명 + CTA 버튼 포함", () => {
    const html = renderToStaticMarkup(
      <ReceivedTripBanner destination="다낭" onDismiss={() => {}} />,
    );
    expect(html).toContain("내 목록에 추가됐어요");
    expect(html).toContain("다음에 다시 보고 싶다면 받은 여행 목록에서 찾을 수 있어요");
    expect(html).toContain("받은 여행 보기");
  });

  it("role=status aria-live", () => {
    const html = renderToStaticMarkup(
      <ReceivedTripBanner destination="하노이" onDismiss={() => {}} />,
    );
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });

  it("닫기 버튼 aria-label", () => {
    const html = renderToStaticMarkup(
      <ReceivedTripBanner onDismiss={() => {}} />,
    );
    expect(html).toContain("배너 닫기");
  });
});

// ─── BentoSummary ──────────────────────────────────────

import { BentoSummary } from "@/components/dashboard/BentoSummary";

vi.mock("@/lib/utils/format-krw", () => ({
  formatKrw: (n: number) => `₩${n.toLocaleString()}`,
}));

const BENTO_DATA = {
  itinerary: { count: 5, verifiedCount: 3, allVerified: false },
  cost: { totalKrw: 500000, perPersonKrw: 250000 },
  checklist: { totalCount: 10, doneCount: 7, percent: 70 },
  vote: { totalCount: 3, pendingCount: 1 },
};

describe("BentoSummary", () => {
  it("4개 카드 렌더링", () => {
    const html = renderToStaticMarkup(<BentoSummary data={BENTO_DATA} />);
    expect(html).toContain("일정 요약");
    expect(html).toContain("일정 5곳");
    expect(html).toContain("예산 요약");
    expect(html).toContain("체크리스트 요약");
    expect(html).toContain("투표 요약");
  });

  it("itinerary allVerified → AI 검증 완료", () => {
    const data = { ...BENTO_DATA, itinerary: { count: 5, verifiedCount: 5, allVerified: true } };
    const html = renderToStaticMarkup(<BentoSummary data={data} />);
    expect(html).toContain("AI 검증 완료");
  });

  it("itinerary 부분 검증", () => {
    const html = renderToStaticMarkup(<BentoSummary data={BENTO_DATA} />);
    expect(html).toContain("검증 3/5곳");
  });

  it("비용 0 → 기록 없음", () => {
    const data = { ...BENTO_DATA, cost: { totalKrw: 0, perPersonKrw: 0 } };
    const html = renderToStaticMarkup(<BentoSummary data={data} />);
    expect(html).toContain("기록 없음");
  });

  it("체크리스트 진행률", () => {
    const html = renderToStaticMarkup(<BentoSummary data={BENTO_DATA} />);
    expect(html).toContain("70% 완료");
    expect(html).toContain('role="progressbar"');
  });

  it("체크리스트 0 → 준비물 미설정", () => {
    const data = { ...BENTO_DATA, checklist: { totalCount: 0, doneCount: 0, percent: 0 } };
    const html = renderToStaticMarkup(<BentoSummary data={data} />);
    expect(html).toContain("준비물 미설정");
  });

  it("투표 pending → 미응답 카운트", () => {
    const html = renderToStaticMarkup(<BentoSummary data={BENTO_DATA} />);
    expect(html).toContain("미응답 1건");
  });

  it("투표 0 → 투표 없음", () => {
    const data = { ...BENTO_DATA, vote: { totalCount: 0, pendingCount: 0 } };
    const html = renderToStaticMarkup(<BentoSummary data={data} />);
    expect(html).toContain("투표 없음");
  });

  it("투표 전부 응답 → 전부 응답 완료", () => {
    const data = { ...BENTO_DATA, vote: { totalCount: 3, pendingCount: 0 } };
    const html = renderToStaticMarkup(<BentoSummary data={data} />);
    expect(html).toContain("전부 응답 완료");
  });
});

// ─── EmergencyCards ────────────────────────────────────

import { ContactCard, LossGuideCard, EMERGENCY_CATEGORY_LABEL, EMERGENCY_CATEGORY_ICON } from "@/components/city/EmergencyCards";

describe("ContactCard", () => {
  it("기본 렌더링", () => {
    const html = renderToStaticMarkup(
      <ContactCard
        contact={{ label: "주한 대사관", phone: "+84 123 456", category: "embassy" }}
      />,
    );
    expect(html).toContain("주한 대사관");
    expect(html).toContain("+84 123 456");
    expect(html).toContain("account_balance");
    expect(html).toContain("tel:+84123456");
  });

  it("hours 표시", () => {
    const html = renderToStaticMarkup(
      <ContactCard
        contact={{ label: "경찰", phone: "113", category: "police", hours: "24시간" }}
      />,
    );
    expect(html).toContain("24시간");
  });

  it("notes 표시", () => {
    const html = renderToStaticMarkup(
      <ContactCard
        contact={{ label: "병원", phone: "115", category: "ambulance", notes: "영어 가능" }}
      />,
    );
    expect(html).toContain("영어 가능");
  });

  it("전화번호 없으면 tel 링크 없음", () => {
    const html = renderToStaticMarkup(
      <ContactCard contact={{ label: "통역", category: "translator" }} />,
    );
    expect(html).not.toContain("tel:");
  });
});

describe("LossGuideCard", () => {
  it("기본 렌더링", () => {
    const guide = {
      emoji: "💳",
      title: "카드 분실 시",
      steps: ["1. 카드사 전화", "2. 분실 신고"],
      contacts: [{ label: "비자 글로벌", phone: "+1-800-847-2911" }],
    };
    const html = renderToStaticMarkup(<LossGuideCard guide={guide} />);
    expect(html).toContain("카드 분실 시");
    expect(html).toContain("💳");
    expect(html).toContain("카드사 전화");
    expect(html).toContain("분실 신고");
    expect(html).toContain("비자 글로벌");
    expect(html).toContain("+1-800-847-2911");
  });

  it("url 있으면 링크 렌더링", () => {
    const guide = {
      emoji: "📄",
      title: "여권 분실",
      steps: ["1. 경찰 신고"],
      contacts: [{ label: "대사관", url: "https://example.com" }],
    };
    const html = renderToStaticMarkup(<LossGuideCard guide={guide} />);
    expect(html).toContain("https://example.com");
  });

  it("contacts 없으면 연락 섹션 미표시", () => {
    const guide = { emoji: "🔑", title: "열쇠 분실", steps: ["관리실 연락"], contacts: [] };
    const html = renderToStaticMarkup(<LossGuideCard guide={guide} />);
    expect(html).not.toContain("연락·자료");
  });
});

describe("EMERGENCY_CATEGORY constants", () => {
  it("6개 카테고리 라벨", () => {
    expect(EMERGENCY_CATEGORY_LABEL.embassy).toBe("영사관");
    expect(EMERGENCY_CATEGORY_LABEL.police).toBe("경찰");
    expect(EMERGENCY_CATEGORY_LABEL.ambulance).toBe("병원·응급");
  });

  it("6개 카테고리 아이콘", () => {
    expect(EMERGENCY_CATEGORY_ICON.embassy).toBe("account_balance");
    expect(EMERGENCY_CATEGORY_ICON.card_lost).toBe("credit_card_off");
  });
});

// ─── CityGuideCards ────────────────────────────────────

import { EmergencyRow, PhraseCard, CuratedGuideCard } from "@/components/city/CityGuideCards";

describe("EmergencyRow", () => {
  it("기본 렌더링", () => {
    const html = renderToStaticMarkup(
      <EmergencyRow contact={{ label: "경찰", phone: "113" }} />,
    );
    expect(html).toContain("경찰");
    expect(html).toContain("113");
    expect(html).toContain("전화");
  });

  it("notes 표시", () => {
    const html = renderToStaticMarkup(
      <EmergencyRow contact={{ label: "병원", phone: "115", notes: "24시간" }} />,
    );
    expect(html).toContain("24시간");
  });
});

describe("PhraseCard", () => {
  it("기본 렌더링", () => {
    const html = renderToStaticMarkup(
      <PhraseCard
        phrase={{ situation: "greeting", korean: "안녕하세요", local: "Xin chào", pronunciation: "신 짜오" }}
      />,
    );
    expect(html).toContain("인사");
    expect(html).toContain("안녕하세요");
    expect(html).toContain("Xin chào");
    expect(html).toContain("신 짜오");
  });

  it("pronunciation 없으면 미표시", () => {
    const html = renderToStaticMarkup(
      <PhraseCard phrase={{ situation: "thanks", korean: "감사합니다", local: "Cảm ơn" }} />,
    );
    expect(html).not.toContain("italic");
  });
});

describe("CuratedGuideCard", () => {
  it("기본 렌더링", () => {
    const guide = {
      id: "food",
      title: "맛집 가이드",
      subtitle: "현지인 추천",
      hero: { emoji: "🍜", gradient: "from-amber to-amber-deep" },
      sections: [
        { heading: "쌀국수", body: "국물이 핵심", tip: "고수 빼달라고 하세요" },
      ],
    };
    const html = renderToStaticMarkup(<CuratedGuideCard guide={guide} />);
    expect(html).toContain("맛집 가이드");
    expect(html).toContain("현지인 추천");
    expect(html).toContain("🍜");
    expect(html).toContain("쌀국수");
    expect(html).toContain("국물이 핵심");
    expect(html).toContain("고수 빼달라고 하세요");
  });

  it("tip 없으면 tip 블록 미표시", () => {
    const guide = {
      id: "shop",
      title: "쇼핑",
      sections: [{ heading: "야시장", body: "흥정 필수" }],
    };
    const html = renderToStaticMarkup(<CuratedGuideCard guide={guide} />);
    expect(html).not.toContain("💡");
  });
});
