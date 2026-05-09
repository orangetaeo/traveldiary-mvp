/**
 * 컴포넌트 스모크 테스트 — batch 11.
 *
 * CategoryBadge, FilterChip, QuickActions, LogoutConfirmModal,
 * TripHero, WeatherStrip — renderToStaticMarkup 스모크.
 */

import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// ═══════════════════════════════════════════════════════════════
// CategoryBadge
// ═══════════════════════════════════════════════════════════════

import { CategoryBadge } from "@/components/itinerary/CategoryBadge";

describe("CategoryBadge", () => {
  const categories = ["food", "spot", "shopping", "rest"] as const;
  const labels = ["맛집", "관광", "쇼핑", "휴식"];

  categories.forEach((cat, i) => {
    it(`${cat} → "${labels[i]}" 라벨`, () => {
      const html = renderToStaticMarkup(<CategoryBadge category={cat} />);
      expect(html).toContain(labels[i]);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// FilterChip
// ═══════════════════════════════════════════════════════════════

import { FilterChip } from "@/components/ui/FilterChip";

describe("FilterChip", () => {
  it("기본 비활성 렌더링", () => {
    const html = renderToStaticMarkup(<FilterChip>한식</FilterChip>);
    expect(html).toContain("한식");
    expect(html).toContain("border-divider");
  });

  it("active=true → purple 배경", () => {
    const html = renderToStaticMarkup(<FilterChip active>한식</FilterChip>);
    expect(html).toContain("bg-purple");
  });

  it("variant=danger 비활성 → danger-deep 테두리 (Stitch)", () => {
    const html = renderToStaticMarkup(
      <FilterChip variant="danger">알레르기</FilterChip>,
    );
    expect(html).toContain("border-danger-deep");
    expect(html).toContain("text-danger-deep");
  });

  it("variant=danger + active → danger-soft 배경 (Stitch)", () => {
    const html = renderToStaticMarkup(
      <FilterChip variant="danger" active>
        알레르기
      </FilterChip>,
    );
    expect(html).toContain("bg-danger-soft");
    expect(html).toContain("text-danger-deep");
  });
});

// ═══════════════════════════════════════════════════════════════
// QuickActions
// ═══════════════════════════════════════════════════════════════

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => React.createElement("a", { href, className }, children),
}));

import { QuickActions } from "@/components/dashboard/QuickActions";

describe("QuickActions", () => {
  it("3개 링크 렌더링 (일정/체크리스트/비용)", () => {
    const html = renderToStaticMarkup(<QuickActions tripId="t1" />);
    expect(html).toContain("일정 보기");
    expect(html).toContain("체크리스트");
    expect(html).toContain("비용 관리");
  });

  it("tripId가 URL에 포함", () => {
    const html = renderToStaticMarkup(<QuickActions tripId="trip-abc" />);
    expect(html).toContain("/itinerary/trip-abc");
    expect(html).toContain("/checklist/trip-abc");
    expect(html).toContain("/cost/trip-abc");
  });

  it("primary 버튼 스타일 (일정 보기만)", () => {
    const html = renderToStaticMarkup(<QuickActions tripId="t1" />);
    // primary 버튼은 bg-purple text-white
    expect(html).toContain("bg-purple");
  });
});

// ═══════════════════════════════════════════════════════════════
// LogoutConfirmModal
// ═══════════════════════════════════════════════════════════════

import { LogoutConfirmModal } from "@/components/auth/LogoutConfirmModal";

describe("LogoutConfirmModal", () => {
  const noop = () => {};

  it("open=false → null 반환", () => {
    const html = renderToStaticMarkup(
      <LogoutConfirmModal
        open={false}
        pending={false}
        onConfirm={noop}
        onCancel={noop}
      />,
    );
    expect(html).toBe("");
  });

  it("open=true → 모달 타이틀 렌더링", () => {
    const html = renderToStaticMarkup(
      <LogoutConfirmModal
        open={true}
        pending={false}
        onConfirm={noop}
        onCancel={noop}
      />,
    );
    expect(html).toContain("로그아웃하시겠어요?");
    expect(html).toContain("로그아웃");
    expect(html).toContain("취소");
  });

  it("pending=true → '처리 중…' 버튼 텍스트", () => {
    const html = renderToStaticMarkup(
      <LogoutConfirmModal
        open={true}
        pending={true}
        onConfirm={noop}
        onCancel={noop}
      />,
    );
    expect(html).toContain("처리 중…");
    expect(html).not.toContain(">로그아웃</button>");
  });

  it("errorMessage 표시", () => {
    const html = renderToStaticMarkup(
      <LogoutConfirmModal
        open={true}
        pending={false}
        errorMessage="네트워크 오류"
        onConfirm={noop}
        onCancel={noop}
      />,
    );
    expect(html).toContain("네트워크 오류");
    expect(html).toContain('role="alert"');
  });

  it("errorMessage 없으면 alert 미노출", () => {
    const html = renderToStaticMarkup(
      <LogoutConfirmModal
        open={true}
        pending={false}
        onConfirm={noop}
        onCancel={noop}
      />,
    );
    expect(html).not.toContain('role="alert"');
  });

  it("aria-modal 접근성 속성", () => {
    const html = renderToStaticMarkup(
      <LogoutConfirmModal
        open={true}
        pending={false}
        onConfirm={noop}
        onCancel={noop}
      />,
    );
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('role="dialog"');
  });
});

// ═══════════════════════════════════════════════════════════════
// TripHero
// ═══════════════════════════════════════════════════════════════

import { TripHero } from "@/components/dashboard/TripHero";

describe("TripHero", () => {
  const BASE_PROPS = {
    destination: "다낭",
    destinationFlag: "🇻🇳",
    nights: 3,
    startDateLabel: "7월 1일 (화)",
    dDayValue: 7,
    partySize: 1,
  };

  it("기본 렌더링 (도시명 + N박 N+1일)", () => {
    const html = renderToStaticMarkup(<TripHero {...BASE_PROPS} />);
    expect(html).toContain("다낭");
    expect(html).toContain("3박 4일");
  });

  it("출발일 라벨 표시", () => {
    const html = renderToStaticMarkup(<TripHero {...BASE_PROPS} />);
    expect(html).toContain("7월 1일 (화) 출발");
  });

  it("D-Day 양수 → D-N 표시", () => {
    const html = renderToStaticMarkup(
      <TripHero {...BASE_PROPS} dDayValue={7} />,
    );
    expect(html).toContain("D-7");
  });

  it("D-Day 당일 → D-Day 표시", () => {
    const html = renderToStaticMarkup(
      <TripHero {...BASE_PROPS} dDayValue={0} />,
    );
    expect(html).toContain("D-Day");
  });

  it("D-Day 음수 → D+N 표시", () => {
    const html = renderToStaticMarkup(
      <TripHero {...BASE_PROPS} dDayValue={-3} />,
    );
    expect(html).toContain("D+3");
  });

  it("국기 이모지 표시", () => {
    const html = renderToStaticMarkup(<TripHero {...BASE_PROPS} />);
    expect(html).toContain("🇻🇳");
  });

  it("partySize=1 → 아바타 미표시", () => {
    const html = renderToStaticMarkup(
      <TripHero {...BASE_PROPS} partySize={1} />,
    );
    expect(html).not.toContain("일행");
  });

  it("partySize=3 → 아바타 표시 (A, B, C)", () => {
    const html = renderToStaticMarkup(
      <TripHero {...BASE_PROPS} partySize={3} />,
    );
    expect(html).toContain("일행 2명");
    expect(html).toContain(">A<");
    expect(html).toContain(">B<");
    expect(html).toContain(">C<");
  });

  it("partySize=5 → +2명 표기", () => {
    const html = renderToStaticMarkup(
      <TripHero {...BASE_PROPS} partySize={5} />,
    );
    expect(html).toContain("+2명");
  });

  it("hero gradient 커스터마이즈", () => {
    const html = renderToStaticMarkup(
      <TripHero
        {...BASE_PROPS}
        hero={{ emoji: "🏖️", gradient: "from-blue-500 to-cyan-400" }}
      />,
    );
    expect(html).toContain("from-blue-500 to-cyan-400");
    expect(html).toContain("🏖️");
  });

  it("hero 미지정 → 기본 gradient", () => {
    const html = renderToStaticMarkup(<TripHero {...BASE_PROPS} />);
    expect(html).toContain("from-purple to-purple-deep");
    expect(html).toContain("✈️");
  });
});

// ═══════════════════════════════════════════════════════════════
// WeatherStrip
// ═══════════════════════════════════════════════════════════════

import { WeatherStrip } from "@/components/dashboard/WeatherStrip";

describe("WeatherStrip", () => {
  it("빈 배열 → null 반환", () => {
    const html = renderToStaticMarkup(<WeatherStrip forecast={[]} />);
    expect(html).toBe("");
  });

  it("forecast 카드 렌더링 (Day N + 온도)", () => {
    const forecast = [
      { day: 1, icon: "sunny" as const, tempC: 32 },
      { day: 2, icon: "rainy" as const, tempC: 28 },
    ];
    const html = renderToStaticMarkup(<WeatherStrip forecast={forecast} />);
    expect(html).toContain("Day 1");
    expect(html).toContain("Day 2");
    expect(html).toContain("32°");
    expect(html).toContain("28°");
  });

  it("날씨 아이콘 매핑 (sunny → sunny, rainy → rainy)", () => {
    const forecast = [
      { day: 1, icon: "sunny" as const, tempC: 30 },
      { day: 2, icon: "rainy" as const, tempC: 25 },
    ];
    const html = renderToStaticMarkup(<WeatherStrip forecast={forecast} />);
    // material-symbols 아이콘 이름
    expect(html).toContain(">sunny<");
    expect(html).toContain(">rainy<");
  });

  it("partly_cloudy 아이콘 매핑 → partly_cloudy_day", () => {
    const forecast = [
      { day: 1, icon: "partly_cloudy" as const, tempC: 27 },
    ];
    const html = renderToStaticMarkup(<WeatherStrip forecast={forecast} />);
    expect(html).toContain("partly_cloudy_day");
  });

  it("aria-label 접근성 (온도 + 아이콘 라벨)", () => {
    const forecast = [
      { day: 1, icon: "sunny" as const, tempC: 32 },
    ];
    const html = renderToStaticMarkup(<WeatherStrip forecast={forecast} />);
    expect(html).toContain("Day 1 맑음 섭씨 32도");
  });

  it("섹션 라벨", () => {
    const forecast = [
      { day: 1, icon: "cloudy" as const, tempC: 26 },
    ];
    const html = renderToStaticMarkup(<WeatherStrip forecast={forecast} />);
    expect(html).toContain("날씨 예보");
  });
});
