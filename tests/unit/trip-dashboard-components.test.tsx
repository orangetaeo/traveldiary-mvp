/**
 * Trip Dashboard 4 컴포넌트 단위 테스트.
 *
 * renderToStaticMarkup 정적 마크업 검증 (testing-library 미도입 정책).
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TripHero } from "@/components/dashboard/TripHero";
import { BentoSummary } from "@/components/dashboard/BentoSummary";
import { WeatherStrip } from "@/components/dashboard/WeatherStrip";
import { QuickActions } from "@/components/dashboard/QuickActions";
import type { TripDashboardData } from "@/lib/services/trip-dashboard";

const FULL_DATA: TripDashboardData = {
  itinerary: { count: 12, verifiedCount: 12, allVerified: true },
  cost: { totalKrw: 1_240_000, perPersonKrw: 413_333 },
  checklist: { doneCount: 8, totalCount: 15, percent: 53 },
  vote: { totalCount: 2, pendingCount: 1 },
  party: { size: 3 },
};

const EMPTY_DATA: TripDashboardData = {
  itinerary: { count: 0, verifiedCount: 0, allVerified: false },
  cost: { totalKrw: 0, perPersonKrw: 0 },
  checklist: { doneCount: 0, totalCount: 0, percent: 0 },
  vote: { totalCount: 0, pendingCount: 0 },
  party: { size: 1 },
};

describe("TripHero", () => {
  it("destination + nights/days + 시작일 + D-Day 양수 (출발 전)", () => {
    const html = renderToStaticMarkup(
      <TripHero
        destination="푸꾸옥"
        destinationFlag="🇻🇳"
        nights={4}
        startDateLabel="5월 13일 (화)"
        dDayValue={7}
        partySize={3}
      />,
    );
    expect(html).toContain("푸꾸옥");
    expect(html).toContain("4박 5일");
    expect(html).toContain("5월 13일 (화) 출발");
    expect(html).toContain("D-7");
    expect(html).toContain("🇻🇳");
  });

  it("D-Day 0 → 'D-Day' 표시", () => {
    const html = renderToStaticMarkup(
      <TripHero
        destination="다낭"
        nights={3}
        startDateLabel="5월 6일 (수)"
        dDayValue={0}
        partySize={3}
      />,
    );
    expect(html).toContain("D-Day");
    expect(html).not.toContain("D-0");
  });

  it("D-Day 음수 → 'D+N' 표시 (출발 후)", () => {
    const html = renderToStaticMarkup(
      <TripHero
        destination="하노이"
        nights={2}
        startDateLabel="5월 1일 (금)"
        dDayValue={-3}
        partySize={3}
      />,
    );
    expect(html).toContain("D+3");
  });

  it("partySize 1 → 아바타 stack 미렌더", () => {
    const html = renderToStaticMarkup(
      <TripHero
        destination="달랏"
        nights={3}
        startDateLabel="5월 8일 (금)"
        dDayValue={2}
        partySize={1}
      />,
    );
    expect(html).not.toContain("일행");
  });

  it("partySize 5 → +2명 표시 (3 visible + 2 remaining)", () => {
    const html = renderToStaticMarkup(
      <TripHero
        destination="호치민"
        nights={3}
        startDateLabel="5월 15일 (금)"
        dDayValue={9}
        partySize={5}
      />,
    );
    expect(html).toContain("+2명");
  });
});

describe("BentoSummary", () => {
  it("Full data → 4 카드 모두 렌더 + 시안 카피", () => {
    const html = renderToStaticMarkup(<BentoSummary data={FULL_DATA} />);
    expect(html).toContain("일정 12곳");
    expect(html).toContain("AI 검증 완료");
    expect(html).toContain("예산 ₩1,240,000");
    expect(html).toContain("1인 ₩413,333");
    expect(html).toContain("준비물 8/15");
    expect(html).toContain("53% 완료");
    expect(html).toContain("투표 2건");
    expect(html).toContain("미응답 1건");
  });

  it("Empty data → 빈 상태 카피", () => {
    const html = renderToStaticMarkup(<BentoSummary data={EMPTY_DATA} />);
    expect(html).toContain("일정 미설정");
    expect(html).toContain("기록 없음");
    expect(html).toContain("준비물 미설정");
    expect(html).toContain("투표 없음");
    expect(html).not.toContain("AI 검증 완료");
  });

  it("일부 verified (count > verifiedCount) → 'AI 검증 완료' 미렌더 + 'N/M곳' 표시", () => {
    const data: TripDashboardData = {
      ...FULL_DATA,
      itinerary: { count: 12, verifiedCount: 9, allVerified: false },
    };
    const html = renderToStaticMarkup(<BentoSummary data={data} />);
    expect(html).not.toContain("AI 검증 완료");
    expect(html).toContain("검증 9/12곳");
  });

  it("vote pending=0 → '전부 응답 완료' 표시", () => {
    const data: TripDashboardData = {
      ...FULL_DATA,
      vote: { totalCount: 3, pendingCount: 0 },
    };
    const html = renderToStaticMarkup(<BentoSummary data={data} />);
    expect(html).toContain("전부 응답 완료");
    expect(html).not.toContain("미응답");
  });

  it("progressbar a11y (role + aria-valuenow)", () => {
    const html = renderToStaticMarkup(<BentoSummary data={FULL_DATA} />);
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="53"');
  });
});

describe("WeatherStrip", () => {
  it("5일 forecast → 5 카드 + 온도 + 아이콘 a11y label", () => {
    const html = renderToStaticMarkup(
      <WeatherStrip
        forecast={[
          { day: 1, icon: "sunny", tempC: 32 },
          { day: 2, icon: "cloudy", tempC: 30 },
          { day: 3, icon: "rainy", tempC: 28 },
          { day: 4, icon: "sunny", tempC: 31 },
          { day: 5, icon: "sunny", tempC: 33 },
        ]}
      />,
    );
    expect(html).toContain("Day 1");
    expect(html).toContain("Day 5");
    expect(html).toContain("32°");
    expect(html).toContain("28°");
    expect(html).toContain("Day 3 비 섭씨 28도");
  });

  it("빈 forecast → null 리턴 (섹션 미렌더)", () => {
    const html = renderToStaticMarkup(<WeatherStrip forecast={[]} />);
    expect(html).toBe("");
  });
});

describe("QuickActions", () => {
  it("3 버튼 + tripId 라우팅", () => {
    const html = renderToStaticMarkup(<QuickActions tripId="trip-pqc" />);
    expect(html).toContain('href="/itinerary/trip-pqc"');
    expect(html).toContain('href="/checklist/trip-pqc"');
    expect(html).toContain('href="/cost/trip-pqc"');
    expect(html).toContain("일정 보기");
    expect(html).toContain("체크리스트");
    expect(html).toContain("비용 관리");
  });
});
