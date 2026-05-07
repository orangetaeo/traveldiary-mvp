/**
 * 모달 컴포넌트 스모크 테스트 — batch 10.
 *
 * AddItemModal, ReplanModal, ShareModal — renderToStaticMarkup 스모크.
 */

import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/actions/share", () => ({
  createShareLinkAction: vi.fn().mockResolvedValue({ ok: true, demo: true, syncKey: "demo-key" }),
}));

vi.mock("@/components/share/KakaoShareButton", () => ({
  KakaoShareButton: ({ url }: { url: string }) =>
    React.createElement("a", { href: url }, "카카오 공유"),
}));

vi.mock("@/components/itinerary/ImpactDisplay", () => ({
  ImpactDisplay: () => React.createElement("div", null, "impact"),
}));

// ═══════════════════════════════════════════════════════════════
// AddItemModal
// ═══════════════════════════════════════════════════════════════

import { AddItemModal } from "@/components/itinerary/AddItemModal";

const TRIP = {
  id: "trip-1",
  title: "다낭 여행",
  destination: "다낭",
  destinationCode: "DAD",
  startDate: "2026-07-01",
  nights: 3,
  currentMode: "pre-travel" as const,
  updatedAt: new Date().toISOString(),
};

describe("AddItemModal", () => {
  it("open=false → null", () => {
    const html = renderToStaticMarkup(
      React.createElement(AddItemModal, {
        open: false,
        trip: TRIP,
        defaultDayIndex: 0,
        onClose: vi.fn(),
        onSubmit: vi.fn(),
      }),
    );
    expect(html).toBe("");
  });

  it("open=true → dialog 렌더링", () => {
    const html = renderToStaticMarkup(
      React.createElement(AddItemModal, {
        open: true,
        trip: TRIP,
        defaultDayIndex: 0,
        onClose: vi.fn(),
        onSubmit: vi.fn(),
      }),
    );
    expect(html).toContain("일정 추가");
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
  });

  it("Day 옵션 nights+1개", () => {
    const html = renderToStaticMarkup(
      React.createElement(AddItemModal, {
        open: true,
        trip: TRIP,
        defaultDayIndex: 0,
        onClose: vi.fn(),
        onSubmit: vi.fn(),
      }),
    );
    // 3박 → Day 1~4 = 4개 option
    expect(html).toContain("Day 1");
    expect(html).toContain("Day 4");
  });

  it("카테고리 4종 표시", () => {
    const html = renderToStaticMarkup(
      React.createElement(AddItemModal, {
        open: true,
        trip: TRIP,
        defaultDayIndex: 0,
        onClose: vi.fn(),
        onSubmit: vi.fn(),
      }),
    );
    // food, spot, shopping, rest 중 label 확인
    expect(html).toContain("음식점");
  });

  it("isPending → 버튼 텍스트 변경", () => {
    const html = renderToStaticMarkup(
      React.createElement(AddItemModal, {
        open: true,
        trip: TRIP,
        defaultDayIndex: 0,
        onClose: vi.fn(),
        onSubmit: vi.fn(),
        isPending: true,
      }),
    );
    expect(html).toContain("추가 중");
  });

  it("AI 추천 suggestions 표시", () => {
    const suggestions = [
      {
        id: "p-1",
        name: "바나힐",
        category: "spot" as const,
        rating: 4.5,
        reviewCount: 100,
        badge: "ai" as const,
        lat: 15.99,
        lng: 107.99,
      },
    ];
    const html = renderToStaticMarkup(
      React.createElement(AddItemModal, {
        open: true,
        trip: TRIP,
        defaultDayIndex: 0,
        suggestions,
        onClose: vi.fn(),
        onSubmit: vi.fn(),
      }),
    );
    expect(html).toContain("바나힐");
    expect(html).toContain("AI");
  });

  it("닫기 버튼 aria-label", () => {
    const html = renderToStaticMarkup(
      React.createElement(AddItemModal, {
        open: true,
        trip: TRIP,
        defaultDayIndex: 0,
        onClose: vi.fn(),
        onSubmit: vi.fn(),
      }),
    );
    expect(html).toContain('aria-label="닫기"');
  });
});

// ═══════════════════════════════════════════════════════════════
// ReplanModal
// ═══════════════════════════════════════════════════════════════

import { ReplanModal } from "@/components/itinerary/ReplanModal";

const TRIGGER_ITEM = {
  id: "item-1",
  name: "미케 비치",
  scheduledAt: "2026-07-01T10:00:00Z",
  durationMinutes: 90,
  flexibility: "flexible" as const,
  priority: 2 as const,
  flexMinutes: 30,
  dependencies: [],
  category: "spot" as const,
  location: { lat: 16.06, lng: 108.24, address: "다낭" },
  evidence: {
    overall: "verified" as const,
    breakdown: [],
    lastChecked: new Date().toISOString(),
  },
};

describe("ReplanModal", () => {
  it("open=false → null", () => {
    const html = renderToStaticMarkup(
      React.createElement(ReplanModal, {
        open: false,
        trigger: null,
        triggerItem: null,
        results: [],
        onApply: vi.fn(),
        onClose: vi.fn(),
      }),
    );
    expect(html).toBe("");
  });

  it("open=true → dialog + 트리거 레이블", () => {
    const html = renderToStaticMarkup(
      React.createElement(ReplanModal, {
        open: true,
        trigger: { type: "delay", minutes: 30 },
        triggerItem: TRIGGER_ITEM,
        results: [
          {
            option: {
              id: "opt-1",
              label: "추천",
              title: "15분 앞당기기",
              description: "다음 일정 조정",
              impacts: [],
            },
            itemsAfter: [],
          },
        ],
        onApply: vi.fn(),
        onClose: vi.fn(),
      }),
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain("미케 비치 30분 지연 감지");
    expect(html).toContain("15분 앞당기기");
    expect(html).toContain("추천");
  });

  it("3개 옵션 표시", () => {
    const options = [
      { id: "a", label: "추천", title: "A", description: "a", impacts: [] },
      { id: "b", label: "안전", title: "B", description: "b", impacts: [] },
      { id: "c", label: "강행", title: "C", description: "c", impacts: [] },
    ];
    const html = renderToStaticMarkup(
      React.createElement(ReplanModal, {
        open: true,
        trigger: { type: "weather", condition: "rain", minutes: 0 },
        triggerItem: TRIGGER_ITEM,
        results: options.map((o) => ({ option: o, itemsAfter: [] })),
        onApply: vi.fn(),
        onClose: vi.fn(),
      }),
    );
    expect(html).toContain("추천");
    expect(html).toContain("안전");
    expect(html).toContain("강행");
  });

  it("footer 안내 문구", () => {
    const html = renderToStaticMarkup(
      React.createElement(ReplanModal, {
        open: true,
        trigger: { type: "manual", minutes: 10 },
        triggerItem: TRIGGER_ITEM,
        results: [
          { option: { id: "x", label: "추천", title: "T", description: "D", impacts: [] }, itemsAfter: [] },
        ],
        onApply: vi.fn(),
        onClose: vi.fn(),
      }),
    );
    expect(html).toContain("카드를 탭하면 즉시 적용");
  });
});

// ═══════════════════════════════════════════════════════════════
// ShareModal
// ═══════════════════════════════════════════════════════════════

import { ShareModal } from "@/components/share/ShareModal";

describe("ShareModal", () => {
  it("open=false → null", () => {
    const html = renderToStaticMarkup(
      React.createElement(ShareModal, {
        open: false,
        tripId: "trip-1",
        onClose: vi.fn(),
      }),
    );
    expect(html).toBe("");
  });

  it("open=true → dialog 렌더링", () => {
    const html = renderToStaticMarkup(
      React.createElement(ShareModal, {
        open: true,
        tripId: "trip-1",
        onClose: vi.fn(),
      }),
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain("여행 공유 링크");
  });

  it("권한 토글 (보기/편집)", () => {
    const html = renderToStaticMarkup(
      React.createElement(ShareModal, {
        open: true,
        tripId: "trip-1",
        onClose: vi.fn(),
      }),
    );
    expect(html).toContain("보기 전용");
    expect(html).toContain("편집 가능");
    expect(html).toContain('role="radiogroup"');
  });

  it("닫기 버튼", () => {
    const html = renderToStaticMarkup(
      React.createElement(ShareModal, {
        open: true,
        tripId: "trip-1",
        onClose: vi.fn(),
      }),
    );
    expect(html).toContain('aria-label="닫기"');
  });

  it("30일 만료 안내", () => {
    const html = renderToStaticMarkup(
      React.createElement(ShareModal, {
        open: true,
        tripId: "trip-1",
        onClose: vi.fn(),
      }),
    );
    expect(html).toContain("30일 후 자동 만료");
  });
});
