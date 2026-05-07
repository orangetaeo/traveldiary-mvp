/**
 * 미테스트 컴포넌트 배치 14 — smoke 테스트.
 *
 * LogoutOrchestrator, AccountDeleteOrchestrator,
 * ItineraryMapWithDirections, PostTripRecapView.
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

const mockReplace = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh,
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

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

// ─── LogoutOrchestrator ────────────────────────────────

vi.mock("@/components/auth/LogoutConfirmModal", () => ({
  LogoutConfirmModal: ({
    open,
    pending,
    errorMessage,
  }: {
    open: boolean;
    pending: boolean;
    errorMessage: string | null;
  }) =>
    open
      ? React.createElement(
          "div",
          { "data-testid": "logout-modal" },
          `pending=${String(pending)},error=${errorMessage ?? "null"}`,
        )
      : null,
}));

import { LogoutOrchestrator } from "@/components/auth/LogoutOrchestrator";

describe("LogoutOrchestrator", () => {
  it("trigger render-prop 호출", () => {
    const html = renderToStaticMarkup(
      <LogoutOrchestrator
        trigger={({ onClick }) =>
          React.createElement("button", { onClick }, "로그아웃")
        }
      />,
    );
    expect(html).toContain("로그아웃");
  });

  it("초기 상태: 모달 미표시", () => {
    const html = renderToStaticMarkup(
      <LogoutOrchestrator
        trigger={({ onClick }) =>
          React.createElement("button", { onClick }, "로그아웃")
        }
      />,
    );
    expect(html).not.toContain("logout-modal");
  });
});

// ─── AccountDeleteOrchestrator ─────────────────────────

vi.mock("@/components/auth/AccountDeleteWarningModal", () => ({
  AccountDeleteWarningModal: ({ open }: { open: boolean }) =>
    open
      ? React.createElement("div", { "data-testid": "warning-modal" }, "경고")
      : null,
}));

vi.mock("@/components/auth/AccountDeleteConfirmModal", () => ({
  AccountDeleteConfirmModal: ({
    open,
    pending,
    errorMessage,
  }: {
    open: boolean;
    pending: boolean;
    errorMessage: string | null;
  }) =>
    open
      ? React.createElement(
          "div",
          { "data-testid": "confirm-modal" },
          `pending=${String(pending)},error=${errorMessage ?? "null"}`,
        )
      : null,
}));

import { AccountDeleteOrchestrator } from "@/components/auth/AccountDeleteOrchestrator";

describe("AccountDeleteOrchestrator", () => {
  it("trigger render-prop 호출", () => {
    const html = renderToStaticMarkup(
      <AccountDeleteOrchestrator
        trigger={({ onClick }) =>
          React.createElement("button", { onClick }, "계정 삭제")
        }
      />,
    );
    expect(html).toContain("계정 삭제");
  });

  it("초기 상태: 두 모달 모두 미표시", () => {
    const html = renderToStaticMarkup(
      <AccountDeleteOrchestrator
        trigger={({ onClick }) =>
          React.createElement("button", { onClick }, "계정 삭제")
        }
      />,
    );
    expect(html).not.toContain("warning-modal");
    expect(html).not.toContain("confirm-modal");
  });
});

// ─── ItineraryMapWithDirections ────────────────────────

vi.mock("@/lib/services/geolocation", () => ({
  getCurrentLocation: vi.fn(),
}));

import { ItineraryMapWithDirections } from "@/components/itinerary/ItineraryMapWithDirections";

describe("ItineraryMapWithDirections", () => {
  it("place 모드 iframe (origin 없음)", () => {
    const html = renderToStaticMarkup(
      <ItineraryMapWithDirections
        lat={10.2}
        lng={103.9}
        placeName="선월드"
        apiKey="test-key"
      />,
    );
    expect(html).toContain("https://www.google.com/maps/embed/v1/place");
    expect(html).toContain("10.2%2C103.9");
    expect(html).toContain("test-key");
    expect(html).toContain('title="선월드 지도"');
  });

  it("기본 height=240", () => {
    const html = renderToStaticMarkup(
      <ItineraryMapWithDirections lat={10} lng={103} apiKey="k" />,
    );
    expect(html).toContain("height:240px");
  });

  it("커스텀 height", () => {
    const html = renderToStaticMarkup(
      <ItineraryMapWithDirections lat={10} lng={103} apiKey="k" height={400} />,
    );
    expect(html).toContain("height:400px");
  });

  it("길찾기 버튼 텍스트", () => {
    const html = renderToStaticMarkup(
      <ItineraryMapWithDirections lat={10} lng={103} apiKey="k" />,
    );
    expect(html).toContain("내 위치에서 길찾기");
  });

  it("프라이버시 안내", () => {
    const html = renderToStaticMarkup(
      <ItineraryMapWithDirections lat={10} lng={103} apiKey="k" />,
    );
    expect(html).toContain("서버에 전송되지 않습니다");
  });

  it("placeName 없으면 '지도' 타이틀", () => {
    const html = renderToStaticMarkup(
      <ItineraryMapWithDirections lat={10} lng={103} apiKey="k" />,
    );
    expect(html).toContain('title="지도"');
  });
});

// ─── PostTripRecapView ─────────────────────────────────

vi.mock("@/lib/utils/format-krw", () => ({
  formatKrw: (n: number) => `₩${n.toLocaleString()}`,
}));

vi.mock("@/lib/utils/color-mappings", () => ({
  COLOR_BG: { purple: "bg-purple-soft", amber: "bg-amber-soft", danger: "bg-danger-soft" },
  COLOR_TEXT: { purple: "text-purple", amber: "text-amber", danger: "text-danger" },
}));

import { PostTripRecapView } from "@/components/recap/PostTripRecapView";

const RECAP_STATS = {
  placesVisited: 12,
  longestStay: "바나힐",
  totalDistanceKm: 45,
  totalSteps: 58000,
  totalSpentKRW: 850000,
  biggestCategory: "맛집",
};

const HIGHLIGHTS = [
  { id: "h1", emoji: "🍜", label: "최고의 맛집", name: "반세오", icon: "restaurant", color: "amber" as const },
];

const MOMENTS = [
  { id: "m1", imageUrl: "https://example.com/photo.jpg", alt: "사진", dayLabel: "Day 1" },
  { id: "m2", imageUrl: null, alt: "없음", dayLabel: "Day 2" },
];

describe("PostTripRecapView", () => {
  it("히어로 + 타이틀", () => {
    const html = renderToStaticMarkup(
      <PostTripRecapView
        tripId="t-1"
        tripTitle="다낭 여행"
        dateRange="7/1 ~ 7/5"
        stats={RECAP_STATS}
        highlights={HIGHLIGHTS}
        moments={MOMENTS}
      />,
    );
    expect(html).toContain("다낭 여행");
    expect(html).toContain("7/1 ~ 7/5");
  });

  it("통계 카드 3종", () => {
    const html = renderToStaticMarkup(
      <PostTripRecapView
        tripId="t-1"
        tripTitle="다낭"
        dateRange="7/1~7/5"
        stats={RECAP_STATS}
        highlights={HIGHLIGHTS}
        moments={MOMENTS}
      />,
    );
    expect(html).toContain("12곳 방문");
    expect(html).toContain("바나힐");
    expect(html).toContain("45km");
    expect(html).toContain("58,000");
    expect(html).toContain("₩850,000");
    expect(html).toContain("맛집");
  });

  it("하이라이트 렌더링", () => {
    const html = renderToStaticMarkup(
      <PostTripRecapView
        tripId="t-1"
        tripTitle="다낭"
        dateRange="7/1~7/5"
        stats={RECAP_STATS}
        highlights={HIGHLIGHTS}
        moments={MOMENTS}
      />,
    );
    expect(html).toContain("Trip Highlights");
    expect(html).toContain("🍜");
    expect(html).toContain("최고의 맛집");
    expect(html).toContain("반세오");
  });

  it("모먼트 — 이미지 + placeholder", () => {
    const html = renderToStaticMarkup(
      <PostTripRecapView
        tripId="t-1"
        tripTitle="다낭"
        dateRange="7/1~7/5"
        stats={RECAP_STATS}
        highlights={HIGHLIGHTS}
        moments={MOMENTS}
      />,
    );
    expect(html).toContain("Moments");
    expect(html).toContain("https://example.com/photo.jpg");
    expect(html).toContain("Day 1");
    expect(html).toContain("Day 2");
    expect(html).toContain("photo_camera"); // placeholder icon
  });

  it("뒤로 링크 → /wrap-up/tripId", () => {
    const html = renderToStaticMarkup(
      <PostTripRecapView
        tripId="t-1"
        tripTitle="다낭"
        dateRange="7/1~7/5"
        stats={RECAP_STATS}
        highlights={HIGHLIGHTS}
        moments={MOMENTS}
      />,
    );
    expect(html).toContain("/wrap-up/t-1");
  });

  it("공유 CTA 2종", () => {
    const html = renderToStaticMarkup(
      <PostTripRecapView
        tripId="t-1"
        tripTitle="다낭"
        dateRange="7/1~7/5"
        stats={RECAP_STATS}
        highlights={HIGHLIGHTS}
        moments={MOMENTS}
      />,
    );
    // 옵션 R — dead button 2개를 ShareModal 단일 진입으로 통합
    expect(html).toContain("여행 공유하기");
    expect(html).toContain("마무리 페이지로");
  });
});
