/**
 * 미테스트 컴포넌트 배치 18 — smoke 테스트.
 *
 * ChecklistView, ItineraryView, TravelHome.
 * 대형 클라이언트 뷰 컨테이너 — 하위 컴포넌트 모두 stub.
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

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useState: actual.useState,
    useMemo: actual.useMemo,
    useTransition: () => [false, (fn: () => void) => fn()],
    useEffect: () => {},
    useRef: actual.useRef,
    useCallback: actual.useCallback,
  };
});

vi.mock("@/lib/hooks/useToast", () => ({
  useToast: () => ({ toast: null, show: vi.fn() }),
}));

vi.mock("@/components/ui/Toast", () => ({
  Toast: () => null,
}));

// ─── ChecklistView mock 의존성 ────────────────────────

vi.mock("@/actions/checklist", () => ({
  addChecklistItem: vi.fn(),
  addFromTemplate: vi.fn(),
  bulkDeleteChecklist: vi.fn(),
  bulkToggleChecklist: vi.fn(),
  deleteChecklist: vi.fn(),
  moveChecklist: vi.fn(),
  toggleChecklist: vi.fn(),
}));

vi.mock("@/lib/seed/checklist-template", () => ({
  DEFAULT_CHECKLIST_TEMPLATE: [
    { category: "essential", text: "여권", dDayBucket: "d-7" },
    { category: "essential", text: "충전기", dDayBucket: "d-1" },
  ],
}));

vi.mock("@/lib/checklist-reorder", () => ({
  swapWithinBucket: vi.fn((items: unknown[]) => items),
}));

vi.mock("@/components/checklist/ChecklistEmptyState", () => ({
  ChecklistEmptyState: ({
    templateSize,
  }: {
    templateSize: number;
  }) =>
    React.createElement(
      "div",
      { "data-testid": "checklist-empty" },
      `empty-${templateSize}`,
    ),
}));

vi.mock("@/components/checklist/ChecklistBucketList", () => ({
  ChecklistBucketList: () =>
    React.createElement("div", { "data-testid": "bucket-list" }, "buckets"),
}));

vi.mock("@/components/checklist/AddChecklistForm", () => ({
  AddChecklistForm: () =>
    React.createElement("div", { "data-testid": "add-form" }, "add-form"),
}));

vi.mock("@/components/checklist/ChecklistCategoryFilter", () => ({
  ChecklistCategoryFilter: () =>
    React.createElement("div", { "data-testid": "category-filter" }),
  applyChecklistFilters: (
    items: unknown[],
    _filters: unknown,
  ) => items,
  type: {} as unknown,
}));

vi.mock("@/components/checklist/ChecklistSearchInput", () => ({
  ChecklistSearchInput: () =>
    React.createElement("div", { "data-testid": "search-input" }),
}));

vi.mock("@/components/checklist/ChecklistDoneFilter", () => ({
  ChecklistDoneFilter: () =>
    React.createElement("div", { "data-testid": "done-filter" }),
}));

import { ChecklistView } from "@/components/checklist/ChecklistView";

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

const MOCK_CHECKLIST_ITEMS = [
  {
    id: "ci-1",
    tripId: "trip-1",
    category: "essential",
    text: "여권",
    dDayBucket: "d-7",
    done: true,
    sortOrder: 0,
    createdAt: "2026-06-20T00:00:00Z",
    updatedAt: "2026-06-20T00:00:00Z",
  },
  {
    id: "ci-2",
    tripId: "trip-1",
    category: "clothing",
    text: "수영복",
    dDayBucket: "d-1",
    done: false,
    sortOrder: 1,
    createdAt: "2026-06-20T00:00:00Z",
    updatedAt: "2026-06-20T00:00:00Z",
  },
];

describe("ChecklistView", () => {
  it("헤더 — 'D-Day 체크리스트'", () => {
    const html = renderToStaticMarkup(
      <ChecklistView trip={MOCK_TRIP} initialItems={[]} />,
    );
    expect(html).toContain("D-Day 체크리스트");
    expect(html).toContain("arrow_back");
  });

  it("뒤로 링크 → /itinerary/trip-1", () => {
    const html = renderToStaticMarkup(
      <ChecklistView trip={MOCK_TRIP} initialItems={[]} />,
    );
    expect(html).toContain(`/itinerary/${MOCK_TRIP.id}`);
  });

  it("뒤로 링크에 day 파라미터 포함", () => {
    const html = renderToStaticMarkup(
      <ChecklistView trip={MOCK_TRIP} initialItems={[]} initialDay={2} />,
    );
    expect(html).toContain("/itinerary/trip-1?day=2");
  });

  it("빈 목록 → EmptyState 표시", () => {
    const html = renderToStaticMarkup(
      <ChecklistView trip={MOCK_TRIP} initialItems={[]} />,
    );
    expect(html).toContain("checklist-empty");
    expect(html).toContain("empty-2"); // DEFAULT_CHECKLIST_TEMPLATE.length = 2
  });

  it("항목 있으면 progress 표시", () => {
    const html = renderToStaticMarkup(
      <ChecklistView trip={MOCK_TRIP} initialItems={MOCK_CHECKLIST_ITEMS} />,
    );
    expect(html).toContain("준비 1/2");
    expect(html).toContain("50%");
    expect(html).toContain("다낭");
    expect(html).toContain("4박 5일");
  });

  it("항목 있으면 필터 + 목록 + 추가폼 표시", () => {
    const html = renderToStaticMarkup(
      <ChecklistView trip={MOCK_TRIP} initialItems={MOCK_CHECKLIST_ITEMS} />,
    );
    expect(html).toContain("search-input");
    expect(html).toContain("done-filter");
    expect(html).toContain("category-filter");
    expect(html).toContain("bucket-list");
    expect(html).toContain("add-form");
  });

  it("총 0개면 '선택' 버튼 미표시", () => {
    const html = renderToStaticMarkup(
      <ChecklistView trip={MOCK_TRIP} initialItems={[]} />,
    );
    expect(html).not.toContain(">선택<");
  });

  it("항목 있으면 '선택' 버튼 표시", () => {
    const html = renderToStaticMarkup(
      <ChecklistView trip={MOCK_TRIP} initialItems={MOCK_CHECKLIST_ITEMS} />,
    );
    expect(html).toContain("선택");
  });

  it("progress bar 렌더링", () => {
    const html = renderToStaticMarkup(
      <ChecklistView trip={MOCK_TRIP} initialItems={MOCK_CHECKLIST_ITEMS} />,
    );
    expect(html).toContain("progress-bar");
  });

  it("cityName 표시", () => {
    const html = renderToStaticMarkup(
      <ChecklistView
        trip={MOCK_TRIP}
        initialItems={MOCK_CHECKLIST_ITEMS}
        cityName="호이안"
      />,
    );
    expect(html).toContain("호이안");
  });

  it("cityName = destination이면 중복 미표시", () => {
    const html = renderToStaticMarkup(
      <ChecklistView
        trip={MOCK_TRIP}
        initialItems={MOCK_CHECKLIST_ITEMS}
        cityName="다낭"
      />,
    );
    // "다낭 · 다낭" 같은 중복 확인
    const matches = html.match(/다낭/g) ?? [];
    // destination + cityName 같으면 cityName 미표시 → 다낭 1회
    // 실제로는 condition: cityName && cityName !== trip.destination
    expect(matches.length).toBeLessThanOrEqual(2); // header title에도 나올 수 있음
  });
});

// ─── ItineraryView mock 의존성 ────────────────────────

vi.mock("@/components/itinerary/ReplanModal", () => ({
  ReplanModal: () => null,
}));

vi.mock("@/components/itinerary/ReplanTriggerCard", () => ({
  ReplanTriggerCard: () =>
    React.createElement("div", { "data-testid": "replan-trigger" }, "replan"),
}));

vi.mock("@/components/itinerary/TripSecondaryActions", () => ({
  TripSecondaryActions: () =>
    React.createElement("div", { "data-testid": "secondary-actions" }, "actions"),
}));

vi.mock("@/components/itinerary/ItineraryItemCard", () => ({
  ItineraryItemCard: ({ item }: { item: { id: string; name: string } }) =>
    React.createElement(
      "div",
      { "data-testid": `card-${item.id}` },
      item.name,
    ),
}));

vi.mock("@/components/itinerary/DayTabsBar", () => ({
  DayTabsBar: ({
    dayCount,
    activeDay,
  }: {
    dayCount: number;
    activeDay: number;
  }) =>
    React.createElement(
      "div",
      { "data-testid": "day-tabs" },
      `tabs-${dayCount}-active-${activeDay}`,
    ),
}));

vi.mock("@/components/itinerary/DayRouteMiniMap", () => ({
  DayRouteMiniMap: () =>
    React.createElement("div", { "data-testid": "mini-map" }),
}));

vi.mock("@/components/itinerary/AddItemDashedCard", () => ({
  AddItemDashedCard: ({ emphasized }: { emphasized: boolean }) =>
    React.createElement(
      "div",
      { "data-testid": "add-item-card" },
      `add-${emphasized ? "emphasized" : "normal"}`,
    ),
}));

vi.mock("@/components/itinerary/ItineraryCoachMark", () => ({
  ItineraryCoachMark: () => null,
}));

vi.mock("@/components/itinerary/AddItemModal", () => ({
  AddItemModal: () => null,
}));

vi.mock("@/components/share/ShareModal", () => ({
  ShareModal: () => null,
}));

vi.mock("@/lib/replan", () => ({
  generateReplanOptions: vi.fn(() => []),
}));

vi.mock("@/lib/mode-transition", () => ({
  calculateDDay: vi.fn(() => 3),
  dayProgress: vi.fn(() => ({
    done: 1,
    total: 5,
    current: null,
    next: null,
  })),
  detectMode: vi.fn(),
  isWithinBoundary: vi.fn(),
}));

vi.mock("@/actions/replan", () => ({
  commitReplan: vi.fn(),
}));

vi.mock("@/actions/trip", () => ({
  setTripMode: vi.fn(),
  recordModeTransitionSkip: vi.fn(),
}));

vi.mock("@/actions/itinerary", () => ({
  addItineraryItem: vi.fn(),
  reorderItineraryItems: vi.fn(),
}));

import { ItineraryView } from "@/components/itinerary/ItineraryView";

const MOCK_ITEMS = [
  {
    id: "item-1",
    tripId: "trip-1",
    dayIndex: 0,
    scheduledAt: "2026-07-01T09:00:00Z",
    durationMinutes: 60,
    flexibility: "flexible" as const,
    priority: 5 as const,
    flexMinutes: 30,
    dependencies: [],
    name: "미케 비치",
    category: "spot" as const,
    location: { lat: 16.06, lng: 108.24, address: "다낭" },
    evidence: { reasons: ["최고의 해변"], sources: [], verifiedAt: "2026-06-30T00:00:00Z" },
  },
  {
    id: "item-2",
    tripId: "trip-1",
    dayIndex: 0,
    scheduledAt: "2026-07-01T12:00:00Z",
    durationMinutes: 90,
    flexibility: "booked" as const,
    priority: 3 as const,
    flexMinutes: 0,
    dependencies: [],
    name: "반미 맛집 (Banh Mi)",
    category: "food" as const,
    location: { lat: 16.05, lng: 108.23, address: "다낭" },
    evidence: { reasons: [], sources: [] },
  },
];

describe("ItineraryView", () => {
  it("DayTabsBar 렌더링", () => {
    const html = renderToStaticMarkup(
      <ItineraryView trip={MOCK_TRIP} initialItems={MOCK_ITEMS} />,
    );
    // nights=4 → dayCount=5
    expect(html).toContain("tabs-5-active-0");
  });

  it("initialDay 전달", () => {
    const html = renderToStaticMarkup(
      <ItineraryView trip={MOCK_TRIP} initialItems={MOCK_ITEMS} initialDay={2} />,
    );
    expect(html).toContain("tabs-5-active-2");
  });

  it("Day 0 아이템 카드 렌더링", () => {
    const html = renderToStaticMarkup(
      <ItineraryView trip={MOCK_TRIP} initialItems={MOCK_ITEMS} />,
    );
    expect(html).toContain("미케 비치");
    expect(html).toContain("반미 맛집");
  });

  it("빈 day → 강조 모드 AddItemDashedCard", () => {
    const html = renderToStaticMarkup(
      <ItineraryView trip={MOCK_TRIP} initialItems={[]} />,
    );
    expect(html).toContain("add-emphasized");
  });

  it("아이템 있으면 normal AddItemDashedCard", () => {
    const html = renderToStaticMarkup(
      <ItineraryView trip={MOCK_TRIP} initialItems={MOCK_ITEMS} />,
    );
    expect(html).toContain("add-normal");
  });

  it("ReplanTriggerCard 표시", () => {
    const html = renderToStaticMarkup(
      <ItineraryView trip={MOCK_TRIP} initialItems={MOCK_ITEMS} />,
    );
    expect(html).toContain("replan-trigger");
  });

  it("TripSecondaryActions 표시", () => {
    const html = renderToStaticMarkup(
      <ItineraryView trip={MOCK_TRIP} initialItems={MOCK_ITEMS} />,
    );
    expect(html).toContain("secondary-actions");
  });

  it("DayRouteMiniMap 표시", () => {
    const html = renderToStaticMarkup(
      <ItineraryView trip={MOCK_TRIP} initialItems={MOCK_ITEMS} />,
    );
    expect(html).toContain("mini-map");
  });

  it("타임라인 가이드 라인 (아이템 있을 때)", () => {
    const html = renderToStaticMarkup(
      <ItineraryView trip={MOCK_TRIP} initialItems={MOCK_ITEMS} />,
    );
    expect(html).toContain("bg-divider");
  });
});

// ─── TravelHome mock 의존성 ──────────────────────────

vi.mock("@/components/ui/EvidencePanel", () => ({
  EvidencePanel: () =>
    React.createElement("div", { "data-testid": "evidence-panel" }),
}));

vi.mock("@/components/travel/AutoModeDetector", () => ({
  AutoModeDetector: () =>
    React.createElement("div", { "data-testid": "auto-mode-detector" }),
}));

vi.mock("@/components/city/CityContextStrip", () => ({
  CityContextStrip: () =>
    React.createElement("div", { "data-testid": "city-strip" }),
}));

vi.mock("@/components/city/EmergencyHeader", () => ({
  EmergencyHeaderButton: ({ citySlug }: { citySlug: string }) =>
    React.createElement(
      "div",
      { "data-testid": "emergency-btn" },
      `emergency-${citySlug}`,
    ),
}));

vi.mock("@/components/ui/SpeedDialFab", () => ({
  SpeedDialFab: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "speed-dial" }, children),
}));

vi.mock("@/components/travel/ModeTransitionWelcome", () => ({
  ModeTransitionWelcome: () => null,
}));

vi.mock("@/components/travel/ModeTransitionSkipSheet", () => ({
  ModeTransitionSkipSheet: () => null,
}));

import { TravelHome } from "@/components/travel/TravelHome";

const TRAVEL_TRIP = {
  ...MOCK_TRIP,
  currentMode: "in-travel" as const,
};

const TRAVEL_ITEMS = [
  {
    id: "ti-1",
    tripId: "trip-1",
    dayIndex: 0,
    scheduledAt: "2026-07-01T08:00:00Z",
    durationMinutes: 60,
    flexibility: "flexible" as const,
    priority: 3 as const,
    flexMinutes: 30,
    dependencies: [],
    name: "쌀국수 (Pho)",
    category: "food" as const,
    location: { lat: 16.06, lng: 108.24, address: "다낭" },
    evidence: { reasons: ["현지 인기"], sources: [] },
  },
  {
    id: "ti-2",
    tripId: "trip-1",
    dayIndex: 0,
    scheduledAt: "2026-07-01T10:00:00Z",
    durationMinutes: 120,
    flexibility: "booked" as const,
    priority: 5 as const,
    flexMinutes: 0,
    dependencies: [],
    name: "바나힐 (Ba Na Hills)",
    category: "spot" as const,
    location: { lat: 15.99, lng: 107.99, address: "바나힐" },
    evidence: { reasons: ["필수 방문지", "케이블카 포함"], sources: [] },
  },
];

const MOCK_CITY = {
  slug: "da-nang",
  name: "다낭",
  country: "베트남",
  countryCode: "VN",
};

describe("TravelHome", () => {
  it("GPS 배너 렌더링", () => {
    const html = renderToStaticMarkup(
      <TravelHome trip={TRAVEL_TRIP} items={TRAVEL_ITEMS} />,
    );
    expect(html).toContain("GPS 확인");
    expect(html).toContain("다낭 도착");
  });

  it("DAY 1 헤더", () => {
    const html = renderToStaticMarkup(
      <TravelHome trip={TRAVEL_TRIP} items={TRAVEL_ITEMS} />,
    );
    expect(html).toContain("DAY 1");
  });

  it("data-travel-mode='in-travel'", () => {
    const html = renderToStaticMarkup(
      <TravelHome trip={TRAVEL_TRIP} items={TRAVEL_ITEMS} />,
    );
    expect(html).toContain('data-travel-mode="in-travel"');
  });

  it("일정 전체 링크", () => {
    const html = renderToStaticMarkup(
      <TravelHome trip={TRAVEL_TRIP} items={TRAVEL_ITEMS} />,
    );
    expect(html).toContain(`/itinerary/${TRAVEL_TRIP.id}`);
    expect(html).toContain("일정 전체");
  });

  it("SpeedDial FAB (검색 + 카메라)", () => {
    const html = renderToStaticMarkup(
      <TravelHome trip={TRAVEL_TRIP} items={TRAVEL_ITEMS} />,
    );
    expect(html).toContain("speed-dial");
    expect(html).toContain("주변 검색");
    expect(html).toContain("카메라 번역");
    expect(html).toContain(`/translate?trip=${TRAVEL_TRIP.id}`);
  });

  it("city prop 있으면 EmergencyHeaderButton + CityContextStrip", () => {
    const html = renderToStaticMarkup(
      <TravelHome trip={TRAVEL_TRIP} items={TRAVEL_ITEMS} city={MOCK_CITY} />,
    );
    expect(html).toContain("emergency-da-nang");
    expect(html).toContain("city-strip");
  });

  it("city prop 없으면 EmergencyHeaderButton 미표시", () => {
    const html = renderToStaticMarkup(
      <TravelHome trip={TRAVEL_TRIP} items={TRAVEL_ITEMS} />,
    );
    expect(html).not.toContain("emergency-btn");
  });

  it("pre-travel 모드면 AutoModeDetector 표시", () => {
    const preTravelTrip = { ...TRAVEL_TRIP, currentMode: "pre-travel" as const };
    const html = renderToStaticMarkup(
      <TravelHome trip={preTravelTrip} items={TRAVEL_ITEMS} />,
    );
    expect(html).toContain("auto-mode-detector");
  });

  it("in-travel 모드면 AutoModeDetector 미표시", () => {
    const html = renderToStaticMarkup(
      <TravelHome trip={TRAVEL_TRIP} items={TRAVEL_ITEMS} />,
    );
    expect(html).not.toContain("auto-mode-detector");
  });

  it("Stats Grid — 진행률 + 현재 위치 + 예산", () => {
    const html = renderToStaticMarkup(
      <TravelHome trip={TRAVEL_TRIP} items={TRAVEL_ITEMS} />,
    );
    expect(html).toContain("진행률");
    expect(html).toContain("현재 위치");
    expect(html).toContain("예산 사용");
  });

  it("타임라인 항목 렌더링", () => {
    const html = renderToStaticMarkup(
      <TravelHome trip={TRAVEL_TRIP} items={TRAVEL_ITEMS} />,
    );
    // displayName removes parenthetical → "쌀국수", "바나힐"
    expect(html).toContain("쌀국수");
    expect(html).toContain("바나힐");
  });

  it("알림 버튼", () => {
    const html = renderToStaticMarkup(
      <TravelHome trip={TRAVEL_TRIP} items={TRAVEL_ITEMS} />,
    );
    expect(html).toContain("알림");
    expect(html).toContain("notifications");
  });

  it("Bottom Bar — 일정 전체 + 데모 토글", () => {
    const html = renderToStaticMarkup(
      <TravelHome trip={TRAVEL_TRIP} items={TRAVEL_ITEMS} />,
    );
    expect(html).toContain("일정 전체");
    expect(html).toContain("ADR-014");
  });
});

// ─── 헬퍼 함수 단위 테스트 ───────────────────────────

describe("ItineraryView groupByDay (간접 검증)", () => {
  it("다른 dayIndex 아이템 분리", () => {
    const day1Item = {
      ...MOCK_ITEMS[0],
      dayIndex: 1,
      scheduledAt: "2026-07-02T09:00:00Z",
    };
    const html = renderToStaticMarkup(
      <ItineraryView
        trip={MOCK_TRIP}
        initialItems={[...MOCK_ITEMS, day1Item]}
        initialDay={1}
      />,
    );
    // Day 1에는 day1Item만 표시
    expect(html).toContain("card-item-1");
    // Day 0 아이템은 Day 1에서 미표시 (initialDay=1)
    expect(html).not.toContain("card-item-2");
  });
});

describe("TravelHome displayName (간접 검증)", () => {
  it("영어 이름 괄호 제거", () => {
    const html = renderToStaticMarkup(
      <TravelHome trip={TRAVEL_TRIP} items={TRAVEL_ITEMS} />,
    );
    // "바나힐 (Ba Na Hills)" → "바나힐"
    expect(html).toContain("바나힐");
    expect(html).not.toContain("Ba Na Hills");
  });
});

describe("ChecklistView nearestProgressBucket (간접 검증)", () => {
  it("100% → data-progress=100", () => {
    const allDone = MOCK_CHECKLIST_ITEMS.map((it) => ({ ...it, done: true }));
    const html = renderToStaticMarkup(
      <ChecklistView trip={MOCK_TRIP} initialItems={allDone} />,
    );
    expect(html).toContain('data-progress="100"');
  });

  it("0% → data-progress=0", () => {
    const noneDone = MOCK_CHECKLIST_ITEMS.map((it) => ({ ...it, done: false }));
    const html = renderToStaticMarkup(
      <ChecklistView trip={MOCK_TRIP} initialItems={noneDone} />,
    );
    expect(html).toContain('data-progress="0"');
  });
});
