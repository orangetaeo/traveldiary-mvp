/**
 * 미테스트 컴포넌트 배치 13 — smoke 테스트.
 *
 * AllergenFilterChips, OtaCompareSection,
 * NotificationListView, ShareModal.
 *
 * client 컴포넌트는 hook을 vi.mock으로 스텁해 정적 렌더링.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
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

// ─── AllergenFilterChips ───────────────────────────────

import { AllergenFilterChips } from "@/components/allergen/AllergenFilterChips";

const CHIPS = [
  { raw: "shrimp", label: "새우", severity: "danger" as const, icon: "warning" },
  { raw: "peanut", label: "땅콩", severity: "danger" as const },
  { raw: "spicy", label: "매운맛", severity: "neutral" as const, icon: "local_fire_department" },
  { raw: "vegetarian", label: "채식", severity: "neutral" as const },
];

describe("AllergenFilterChips", () => {
  it("danger 칩 + neutral 칩 + divider", () => {
    const html = renderToStaticMarkup(
      <AllergenFilterChips items={CHIPS} selected={[]} onToggle={() => {}} />,
    );
    expect(html).toContain("새우");
    expect(html).toContain("땅콩");
    expect(html).toContain("매운맛");
    expect(html).toContain("채식");
    // divider between danger and neutral
    expect(html).toContain('aria-hidden="true"');
  });

  it("기본 aria-label", () => {
    const html = renderToStaticMarkup(
      <AllergenFilterChips items={CHIPS} selected={[]} onToggle={() => {}} />,
    );
    expect(html).toContain("알레르기·관심사 필터");
  });

  it("커스텀 aria-label", () => {
    const html = renderToStaticMarkup(
      <AllergenFilterChips items={CHIPS} selected={[]} onToggle={() => {}} ariaLabel="식이 필터" />,
    );
    expect(html).toContain("식이 필터");
  });

  it("active danger → aria-pressed=true", () => {
    const html = renderToStaticMarkup(
      <AllergenFilterChips items={CHIPS} selected={["shrimp"]} onToggle={() => {}} />,
    );
    expect(html).toContain('aria-pressed="true"');
  });

  it("inactive → aria-pressed=false", () => {
    const html = renderToStaticMarkup(
      <AllergenFilterChips items={CHIPS} selected={[]} onToggle={() => {}} />,
    );
    // All false
    expect(html).not.toContain('aria-pressed="true"');
  });

  it("onAdd → + 버튼", () => {
    const html = renderToStaticMarkup(
      <AllergenFilterChips items={CHIPS} selected={[]} onToggle={() => {}} onAdd={() => {}} />,
    );
    expect(html).toContain("필터 추가");
  });

  it("onAdd 없으면 + 버튼 없음", () => {
    const html = renderToStaticMarkup(
      <AllergenFilterChips items={CHIPS} selected={[]} onToggle={() => {}} />,
    );
    expect(html).not.toContain("필터 추가");
  });

  it("danger만 있으면 divider 없음", () => {
    const dangerOnly = CHIPS.filter((c) => c.severity === "danger");
    const html = renderToStaticMarkup(
      <AllergenFilterChips items={dangerOnly} selected={[]} onToggle={() => {}} />,
    );
    // divider is a w-px span between groups
    expect(html).not.toContain("w-px h-4 bg-divider");
  });
});

// ─── OtaCompareSection ─────────────────────────────────

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useTransition: () => [false, (fn: () => void) => fn()],
    useState: actual.useState,
    useEffect: actual.useEffect,
    useRef: actual.useRef,
    useCallback: actual.useCallback,
  };
});

vi.mock("@/actions/affiliate", () => ({
  trackAffiliateClick: vi.fn().mockResolvedValue({ redirectUrl: "https://example.com" }),
}));

vi.mock("@/lib/ota/outgoing", () => ({
  setOtaOutgoing: vi.fn(),
}));

vi.mock("@/lib/constants/ota-constants", () => ({
  OTA_LABEL: { klook: "Klook", kkday: "KKday", agoda: "Agoda" },
  OTA_TONE: {
    klook: "bg-orange-100 text-orange-800",
    kkday: "bg-green-100 text-green-800",
    agoda: "bg-blue-100 text-blue-800",
  },
}));

vi.mock("@/components/itinerary/OtaReentryConfirmBar", () => ({
  OtaReentryConfirmBar: () => null,
}));

import { OtaCompareSection } from "@/components/itinerary/OtaCompareSection";

const OTA_OFFERS = [
  {
    id: "klook-pq-cable",
    ota: "klook" as const,
    title: "썬월드 케이블카",
    priceKrw: 45000,
    originalPriceKrw: 55000,
    url: "https://klook.com/cable",
    rating: 4.5,
    reviewCount: 1200,
  },
  {
    id: "kkday-pq-cable",
    ota: "kkday" as const,
    title: "썬월드 케이블카",
    priceKrw: 48000,
    url: "https://kkday.com/cable",
  },
];

describe("OtaCompareSection", () => {
  it("빈 offers → null", () => {
    const html = renderToStaticMarkup(
      <OtaCompareSection itemId="item-1" offers={[]} />,
    );
    expect(html).toBe("");
  });

  it("가격 비교 헤더", () => {
    const html = renderToStaticMarkup(
      <OtaCompareSection itemId="item-1" offers={OTA_OFFERS} />,
    );
    expect(html).toContain("예약 가격 비교");
    expect(html).toContain("어필리에이트 링크");
  });

  it("OTA 라벨 표시", () => {
    const html = renderToStaticMarkup(
      <OtaCompareSection itemId="item-1" offers={OTA_OFFERS} />,
    );
    expect(html).toContain("Klook");
    expect(html).toContain("KKday");
  });

  it("최저가 마커", () => {
    const html = renderToStaticMarkup(
      <OtaCompareSection itemId="item-1" offers={OTA_OFFERS} />,
    );
    expect(html).toContain("최저가");
  });

  it("할인율 표시", () => {
    const html = renderToStaticMarkup(
      <OtaCompareSection itemId="item-1" offers={OTA_OFFERS} />,
    );
    // 55000 → 45000 = 18% off
    expect(html).toContain("-18%");
  });

  it("가격 표시", () => {
    const html = renderToStaticMarkup(
      <OtaCompareSection itemId="item-1" offers={OTA_OFFERS} />,
    );
    expect(html).toContain("45,000원");
    expect(html).toContain("48,000원");
  });

  it("정렬: 가격 오름차순", () => {
    const html = renderToStaticMarkup(
      <OtaCompareSection itemId="item-1" offers={OTA_OFFERS} />,
    );
    const klookPos = html.indexOf("Klook");
    const kkdayPos = html.indexOf("KKday");
    expect(klookPos).toBeLessThan(kkdayPos); // 45000 < 48000
  });

  it("리뷰 카운트 표시", () => {
    const html = renderToStaticMarkup(
      <OtaCompareSection itemId="item-1" offers={OTA_OFFERS} />,
    );
    expect(html).toContain("★ 4.5");
    expect(html).toContain("1,200");
  });
});

// ─── NotificationListView (정적 스냅샷) ────────────────

import { NotificationListView } from "@/components/notifications/NotificationListView";

vi.mock("@/lib/utils/color-mappings", () => ({
  COLOR_BG: { purple: "bg-purple-soft", amber: "bg-amber-soft", danger: "bg-danger-soft" },
  COLOR_TEXT: { purple: "text-purple", amber: "text-amber", danger: "text-danger" },
}));

const NOW = new Date("2026-07-01T12:00:00Z");

describe("NotificationListView", () => {
  beforeEach(() => {
    vi.setSystemTime(NOW);
  });

  it("빈 알림 → empty 상태", () => {
    const html = renderToStaticMarkup(
      <NotificationListView notifications={[]} />,
    );
    expect(html).toContain("아직 알림이 없어요");
    expect(html).toContain("notifications_off");
  });

  it("알림 렌더링 + 필터 탭", () => {
    const notifications = [
      {
        id: "n1",
        title: "새 공유",
        body: "누군가 여행을 공유했어요",
        icon: "share",
        iconColor: "purple" as const,
        category: "companion" as const,
        read: false,
        createdAt: NOW.toISOString(),
      },
    ];
    const html = renderToStaticMarkup(
      <NotificationListView notifications={notifications} />,
    );
    expect(html).toContain("새 공유");
    expect(html).toContain("누군가 여행을 공유했어요");
    // Filter tabs
    expect(html).toContain("전체");
    expect(html).toContain("여행");
    expect(html).toContain("동행");
    expect(html).toContain("시스템");
  });

  it("unread count 뱃지", () => {
    const notifications = [
      {
        id: "n1",
        title: "알림1",
        body: "내용",
        icon: "info",
        iconColor: "purple" as const,
        category: "system" as const,
        read: false,
        createdAt: NOW.toISOString(),
      },
      {
        id: "n2",
        title: "알림2",
        body: "내용",
        icon: "info",
        iconColor: "purple" as const,
        category: "system" as const,
        read: true,
        createdAt: NOW.toISOString(),
      },
    ];
    const html = renderToStaticMarkup(
      <NotificationListView notifications={notifications} />,
    );
    // 1 unread
    expect(html).toContain("bg-purple text-white");
  });

  it("href 있으면 링크 카드", () => {
    const notifications = [
      {
        id: "n1",
        title: "일정",
        body: "새 일정",
        icon: "map",
        iconColor: "amber" as const,
        category: "travel" as const,
        read: false,
        createdAt: NOW.toISOString(),
        href: "/trips/t-1",
      },
    ];
    const html = renderToStaticMarkup(
      <NotificationListView notifications={notifications} />,
    );
    expect(html).toContain("/trips/t-1");
  });
});
