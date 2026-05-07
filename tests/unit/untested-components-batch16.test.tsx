/**
 * 미테스트 컴포넌트 배치 16 — smoke 테스트.
 *
 * JsonLd (3종), TransportCard, ItineraryItemCard.
 */

import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// ─── 공통 mock ────────────────────────────────────────

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

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useState: actual.useState,
    useTransition: () => [false, (fn: () => void) => fn()],
    useEffect: () => {},
    useRef: actual.useRef,
    useCallback: actual.useCallback,
  };
});

// ─── JsonLd ───────────────────────────────────────────

import {
  OrganizationJsonLd,
  WebAppJsonLd,
  BreadcrumbJsonLd,
} from "@/components/seo/JsonLd";

describe("OrganizationJsonLd", () => {
  it("schema.org Organization JSON-LD 출력", () => {
    const html = renderToStaticMarkup(
      <OrganizationJsonLd
        name="TravelDiary"
        url="https://traveldiary.app"
        description="AI 여행 동반자"
        logo="https://traveldiary.app/logo.png"
      />,
    );
    expect(html).toContain("application/ld+json");
    expect(html).toContain('"@type":"Organization"');
    expect(html).toContain('"name":"TravelDiary"');
    expect(html).toContain("https://traveldiary.app");
    expect(html).toContain("AI 여행 동반자");
    expect(html).toContain("logo.png");
  });
});

describe("WebAppJsonLd", () => {
  it("WebApplication JSON-LD 출력", () => {
    const html = renderToStaticMarkup(
      <WebAppJsonLd
        name="TravelDiary"
        url="https://traveldiary.app"
        description="여행 일정 관리"
        applicationCategory="TravelApplication"
        operatingSystem="Any"
      />,
    );
    expect(html).toContain('"@type":"WebApplication"');
    expect(html).toContain('"applicationCategory":"TravelApplication"');
    expect(html).toContain('"operatingSystem":"Any"');
    expect(html).toContain('"price":"0"');
    expect(html).toContain('"priceCurrency":"KRW"');
    expect(html).toContain('"inLanguage":"ko"');
  });
});

describe("BreadcrumbJsonLd", () => {
  it("BreadcrumbList JSON-LD 출력", () => {
    const items = [
      { name: "홈", url: "https://traveldiary.app" },
      { name: "일정", url: "https://traveldiary.app/itinerary" },
    ];
    const html = renderToStaticMarkup(<BreadcrumbJsonLd items={items} />);
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).toContain('"position":1');
    expect(html).toContain('"position":2');
    expect(html).toContain('"name":"홈"');
    expect(html).toContain('"name":"일정"');
  });

  it("빈 배열 → 빈 itemListElement", () => {
    const html = renderToStaticMarkup(<BreadcrumbJsonLd items={[]} />);
    expect(html).toContain('"itemListElement":[]');
  });
});

// ─── TransportCard ────────────────────────────────────

vi.mock("@/components/ui/Card", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement("div", { className: `card ${className ?? ""}` }, children),
}));

vi.mock("@/components/ui/Badge", () => ({
  Badge: ({ children, tone }: { children: React.ReactNode; tone: string }) =>
    React.createElement("span", { "data-tone": tone }, children),
}));

import { TransportCard, type TransportOption } from "@/components/itinerary/TransportCard";

const TRANSPORT_OPTIONS: TransportOption[] = [
  { mode: "walk", durationMin: 15, priceKrw: 0 },
  { mode: "grab", durationMin: 5, priceKrw: 25000 },
  { mode: "bus", durationMin: 20, priceKrw: 5000, note: "노선 03" },
];

describe("TransportCard", () => {
  it("from → to 헤더", () => {
    const html = renderToStaticMarkup(
      <TransportCard
        from="선월드"
        to="미케 비치"
        options={TRANSPORT_OPTIONS}
        recommendedMode="walk"
        recommendedReason="강변 산책로 좋음"
      />,
    );
    expect(html).toContain("선월드");
    expect(html).toContain("미케 비치");
  });

  it("3가지 모드 옵션 렌더링", () => {
    const html = renderToStaticMarkup(
      <TransportCard
        from="A"
        to="B"
        options={TRANSPORT_OPTIONS}
        recommendedMode="walk"
        recommendedReason="추천"
      />,
    );
    expect(html).toContain("15분");
    expect(html).toContain("5분");
    expect(html).toContain("20분");
    expect(html).toContain("₩0");
    expect(html).toContain("₩25,000");
    expect(html).toContain("₩5,000");
  });

  it("note 표시", () => {
    const html = renderToStaticMarkup(
      <TransportCard
        from="A"
        to="B"
        options={TRANSPORT_OPTIONS}
        recommendedMode="walk"
        recommendedReason="추천"
      />,
    );
    expect(html).toContain("노선 03");
  });

  it("distanceKm 뱃지 표시", () => {
    const html = renderToStaticMarkup(
      <TransportCard
        from="A"
        to="B"
        distanceKm={1.2}
        options={TRANSPORT_OPTIONS}
        recommendedMode="walk"
        recommendedReason="추천"
      />,
    );
    expect(html).toContain("1.2km");
  });

  it("distanceKm 없으면 뱃지 미표시", () => {
    const html = renderToStaticMarkup(
      <TransportCard
        from="A"
        to="B"
        options={TRANSPORT_OPTIONS}
        recommendedMode="walk"
        recommendedReason="추천"
      />,
    );
    expect(html).not.toContain("transport-distance-badge");
  });

  it("AI 추천 배너", () => {
    const html = renderToStaticMarkup(
      <TransportCard
        from="A"
        to="B"
        options={TRANSPORT_OPTIONS}
        recommendedMode="walk"
        recommendedReason="강변 산책로 좋고 야경 명소 통과"
      />,
    );
    expect(html).toContain("AI 추천");
    expect(html).toContain("강변 산책로 좋고 야경 명소 통과");
  });

  it("기본 선택 모드에 따른 액션 버튼", () => {
    const html = renderToStaticMarkup(
      <TransportCard
        from="A"
        to="B"
        options={TRANSPORT_OPTIONS}
        recommendedMode="walk"
        recommendedReason="추천"
      />,
    );
    // recommendedMode="walk" → useState 초기값 → walk 액션 라벨
    expect(html).toContain("지도에서 동선 보기");
  });

  it("radiogroup aria-label", () => {
    const html = renderToStaticMarkup(
      <TransportCard
        from="A"
        to="B"
        options={TRANSPORT_OPTIONS}
        recommendedMode="walk"
        recommendedReason="추천"
      />,
    );
    expect(html).toContain("이동 수단 선택");
  });

  it("가격 예상치 안내", () => {
    const html = renderToStaticMarkup(
      <TransportCard
        from="A"
        to="B"
        options={TRANSPORT_OPTIONS}
        recommendedMode="walk"
        recommendedReason="추천"
      />,
    );
    expect(html).toContain("가격은 기준 시간/거리 기반 예상치");
  });

  it("price undefined → '—'", () => {
    const opts: TransportOption[] = [
      { mode: "walk", durationMin: 10 },
    ];
    const html = renderToStaticMarkup(
      <TransportCard
        from="A"
        to="B"
        options={opts}
        recommendedMode="walk"
        recommendedReason="추천"
      />,
    );
    expect(html).toContain("—");
  });
});

// ─── ItineraryItemCard ────────────────────────────────

vi.mock("@/components/ui/EvidencePanel", () => ({
  EvidencePanel: ({ evidence }: { evidence: unknown }) =>
    React.createElement("div", { "data-testid": "evidence" }, JSON.stringify(evidence)),
}));

vi.mock("@/lib/utils/item-display", () => ({
  splitName: (name: string) => {
    const m = name.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (m) return { ko: m[1].trim(), en: m[2].trim() };
    return { ko: name, en: "" };
  },
  formatTime: (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  },
  CATEGORY_ICON: {
    food: "restaurant",
    spot: "photo_camera",
    shopping: "shopping_bag",
    rest: "bed",
  },
}));

import { ItineraryItemCard, splitItemName, formatItineraryTime } from "@/components/itinerary/ItineraryItemCard";

const MOCK_ITEM = {
  id: "item-1",
  scheduledAt: "2026-07-01T10:30:00Z",
  durationMinutes: 60,
  flexibility: "flexible" as const,
  priority: 3 as const,
  flexMinutes: 30,
  dependencies: [],
  name: "미케 비치 (My Khe Beach)",
  category: "spot" as const,
  location: { lat: 16.06, lng: 108.24, address: "다낭 미케" },
  evidence: { sources: [], score: 0 },
};

const CARD_PROPS = {
  item: MOCK_ITEM,
  tripId: "trip-1",
  isFeatured: false,
  isOnTrip: false,
  showEvidence: false,
  isDragging: false,
  isDragOver: false,
  onDragStart: vi.fn(),
  onDragOver: vi.fn(),
  onDragLeave: vi.fn(),
  onDragEnd: vi.fn(),
  onDrop: vi.fn(),
  isFirst: false,
  isLast: false,
  onMoveUp: vi.fn(),
  onMoveDown: vi.fn(),
};

describe("ItineraryItemCard", () => {
  it("이름 분리 (한국어 + 영어)", () => {
    const html = renderToStaticMarkup(<ItineraryItemCard {...CARD_PROPS} />);
    expect(html).toContain("미케 비치");
    expect(html).toContain("My Khe Beach");
  });

  it("시간 표시", () => {
    const html = renderToStaticMarkup(<ItineraryItemCard {...CARD_PROPS} />);
    expect(html).toContain("10:30");
  });

  it("flexible → AI 추천 배지", () => {
    const html = renderToStaticMarkup(<ItineraryItemCard {...CARD_PROPS} />);
    expect(html).toContain("AI 추천");
  });

  it("booked → 예약 완료 배지", () => {
    const item = { ...MOCK_ITEM, flexibility: "booked" as const };
    const html = renderToStaticMarkup(
      <ItineraryItemCard {...CARD_PROPS} item={item} />,
    );
    expect(html).toContain("예약 완료");
  });

  it("링크 → /itinerary/tripId/item/itemId", () => {
    const html = renderToStaticMarkup(<ItineraryItemCard {...CARD_PROPS} />);
    expect(html).toContain("/itinerary/trip-1/item/item-1");
  });

  it("featured 모드 — '진행 중' (isOnTrip=true)", () => {
    const html = renderToStaticMarkup(
      <ItineraryItemCard {...CARD_PROPS} isFeatured={true} isOnTrip={true} />,
    );
    expect(html).toContain("진행 중");
  });

  it("featured 모드 — 'AI 추천' (isOnTrip=false)", () => {
    const html = renderToStaticMarkup(
      <ItineraryItemCard {...CARD_PROPS} isFeatured={true} isOnTrip={false} />,
    );
    // featured + not on trip → "AI 추천" 텍스트 (caption)
    const html2 = html;
    expect(html2).toContain("AI 추천");
  });

  it("화살표 버튼 aria-label", () => {
    const html = renderToStaticMarkup(<ItineraryItemCard {...CARD_PROPS} />);
    expect(html).toContain("위로 이동");
    expect(html).toContain("아래로 이동");
  });

  it("isFirst → 위로 이동 disabled", () => {
    const html = renderToStaticMarkup(
      <ItineraryItemCard {...CARD_PROPS} isFirst={true} />,
    );
    // disabled 속성이 첫 번째 버튼에 적용
    expect(html).toContain("disabled");
  });

  it("showEvidence → EvidencePanel 표시", () => {
    const html = renderToStaticMarkup(
      <ItineraryItemCard {...CARD_PROPS} showEvidence={true} />,
    );
    expect(html).toContain("evidence");
  });

  it("showEvidence=false → EvidencePanel 미표시", () => {
    const html = renderToStaticMarkup(
      <ItineraryItemCard {...CARD_PROPS} showEvidence={false} />,
    );
    expect(html).not.toContain("data-testid=\"evidence\"");
  });

  it("영어 이름 없는 경우", () => {
    const item = { ...MOCK_ITEM, name: "반미" };
    const html = renderToStaticMarkup(
      <ItineraryItemCard {...CARD_PROPS} item={item} />,
    );
    expect(html).toContain("반미");
  });
});

describe("ItineraryItemCard deprecated re-exports", () => {
  it("splitItemName = splitName", () => {
    const result = splitItemName("킹콩마트 (King Kong Mart)");
    expect(result.ko).toBe("킹콩마트");
    expect(result.en).toBe("King Kong Mart");
  });

  it("formatItineraryTime = formatTime", () => {
    const result = formatItineraryTime("2026-07-01T14:00:00Z");
    expect(result).toBe("14:00");
  });
});
