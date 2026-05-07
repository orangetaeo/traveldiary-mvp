/**
 * 미테스트 컴포넌트 배치 17 — smoke 테스트.
 *
 * CostView, AutoModeDetector, InstallPrompt.
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
    useState: actual.useState,
    useTransition: () => [false, (fn: () => void) => fn()],
    useEffect: () => {},
    useRef: actual.useRef,
    useCallback: actual.useCallback,
  };
});

// ─── CostView mock 의존성 ─────────────────────────────

vi.mock("@/lib/hooks/useToast", () => ({
  useToast: () => ({ toast: null, show: vi.fn() }),
}));

vi.mock("@/components/ui/Toast", () => ({
  Toast: () => null,
}));

vi.mock("@/actions/cost", () => ({
  addCost: vi.fn(),
  deleteCost: vi.fn(),
  settleCost: vi.fn(),
}));

vi.mock("@/components/cost/SettlementCard", () => ({
  SettlementCard: () =>
    React.createElement("div", { "data-testid": "settlement-card" }, "정산"),
}));

vi.mock("@/components/cost/AddCostForm", () => ({
  AddCostForm: () =>
    React.createElement("div", { "data-testid": "add-cost-form" }, "추가폼"),
}));

vi.mock("@/components/cost/CostTotals", () => ({
  CostTotals: () =>
    React.createElement("div", { "data-testid": "cost-totals" }, "총합"),
}));

vi.mock("@/components/cost/CostEntriesList", () => ({
  CostEntriesList: () =>
    React.createElement("div", { "data-testid": "cost-entries" }, "내역"),
}));

import { CostView } from "@/components/cost/CostView";

const MOCK_TRIP = {
  id: "trip-1",
  title: "다낭 여행",
  destination: "다낭",
  destinationCode: "da-nang",
  startDate: "2026-07-01",
  endDate: "2026-07-05",
  nights: 4,
  currentMode: "pre-travel" as const,
  demo: false,
  updatedAt: "2026-06-30T00:00:00Z",
};

describe("CostView", () => {
  it("헤더 + 뒤로 버튼", () => {
    const html = renderToStaticMarkup(
      <CostView
        trip={MOCK_TRIP}
        initialEntries={[]}
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={0.055}
      />,
    );
    expect(html).toContain("비용 관리");
    expect(html).toContain("arrow_back");
    expect(html).toContain(`/itinerary/${MOCK_TRIP.id}`);
  });

  it("뒤로 링크에 day 파라미터 포함", () => {
    const html = renderToStaticMarkup(
      <CostView
        trip={MOCK_TRIP}
        initialEntries={[]}
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={0.055}
        initialDay={2}
      />,
    );
    expect(html).toContain("/itinerary/trip-1?day=2");
  });

  it("하위 컴포넌트 렌더링", () => {
    const html = renderToStaticMarkup(
      <CostView
        trip={MOCK_TRIP}
        initialEntries={[]}
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={0.055}
      />,
    );
    expect(html).toContain("cost-totals");
    expect(html).toContain("add-cost-form");
    expect(html).toContain("settlement-card");
    expect(html).toContain("cost-entries");
  });
});

// ─── AutoModeDetector mock 의존성 ─────────────────────

vi.mock("@/lib/mode-transition", () => ({
  calculateDDay: vi.fn(),
  detectMode: vi.fn(),
  isWithinBoundary: vi.fn(),
}));

vi.mock("@/lib/services/geolocation", () => ({
  getCurrentLocation: vi.fn(),
}));

vi.mock("@/actions/trip", () => ({
  recordModeTransitionSkip: vi.fn(),
  setTripMode: vi.fn(),
}));

import { AutoModeDetector } from "@/components/travel/AutoModeDetector";

const AUTO_TRIP = {
  ...MOCK_TRIP,
  currentMode: "pre-travel" as const,
};

describe("AutoModeDetector", () => {
  it("기본 렌더링 — 제목 + 프라이버시 안내", () => {
    const html = renderToStaticMarkup(<AutoModeDetector trip={AUTO_TRIP} />);
    expect(html).toContain("내 위치로 자동 전환 (M2)");
    expect(html).toContain("좌표는 서버에 전송되지");
  });

  it("버튼 텍스트 (기본 상태)", () => {
    const html = renderToStaticMarkup(<AutoModeDetector trip={AUTO_TRIP} />);
    expect(html).toContain("📍 내 위치로 자동 전환");
  });

  it("my_location 아이콘", () => {
    const html = renderToStaticMarkup(<AutoModeDetector trip={AUTO_TRIP} />);
    expect(html).toContain("my_location");
  });
});

// ─── InstallPrompt ────────────────────────────────────

import { InstallPrompt } from "@/components/pwa/InstallPrompt";

describe("InstallPrompt", () => {
  it("초기 dismissed=true → null 렌더링", () => {
    // useEffect가 mock되어 dismissed=true(초기값) 유지 → null 반환
    const html = renderToStaticMarkup(<InstallPrompt />);
    expect(html).toBe("");
  });
});

// ─── funnel.ts 단위 테스트 ────────────────────────────

describe("trackFunnelStep (analytics/funnel)", () => {
  it("FunnelStep 타입 유효성", async () => {
    // 타입 레벨 테스트 — import만으로 모듈 로드 확인
    const mod = await import("@/lib/analytics/funnel");
    expect(typeof mod.trackFunnelStep).toBe("function");
  });

  it("sendBeacon 없는 환경 — fetch fallback", async () => {
    const originalBeacon = navigator.sendBeacon;
    const mockFetch = vi.fn().mockResolvedValue({});
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;

    // sendBeacon 제거
    Object.defineProperty(navigator, "sendBeacon", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { trackFunnelStep } = await import("@/lib/analytics/funnel");
    trackFunnelStep("view");

    // fetch가 호출됐는지 확인
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/analytics/funnel",
      expect.objectContaining({
        method: "POST",
        keepalive: true,
      }),
    );

    // 복원
    globalThis.fetch = originalFetch;
    Object.defineProperty(navigator, "sendBeacon", {
      value: originalBeacon,
      writable: true,
      configurable: true,
    });
  });

  it("sendBeacon 있는 환경 — sendBeacon 호출", async () => {
    const mockBeacon = vi.fn().mockReturnValue(true);
    const originalBeacon = navigator.sendBeacon;
    Object.defineProperty(navigator, "sendBeacon", {
      value: mockBeacon,
      writable: true,
      configurable: true,
    });

    const { trackFunnelStep } = await import("@/lib/analytics/funnel");
    trackFunnelStep("step1", { userId: "u1" });

    expect(mockBeacon).toHaveBeenCalledWith(
      "/api/analytics/funnel",
      expect.any(Blob),
    );

    // 복원
    Object.defineProperty(navigator, "sendBeacon", {
      value: originalBeacon,
      writable: true,
      configurable: true,
    });
  });
});
