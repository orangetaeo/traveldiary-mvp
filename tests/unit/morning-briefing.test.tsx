/**
 * A1 모닝 브리핑 — MorningBriefing Client Component 정적 렌더 스모크.
 *
 * page.tsx async Server Component는 vi.mock 복잡성 회피하고 source grep으로 분리 검증
 * (Session N 박제: "next/link mock 차이로 분리 검증 layer 정착").
 */

import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => <a href={href} {...rest}>{children}</a>,
}));

import { MorningBriefing } from "@/components/morning/MorningBriefing";
import type { ItineraryItem, ResolvedCity, Trip } from "@/lib/types";
import type { WeatherDay } from "@/lib/seed/weather";

const TRIP: Trip = {
  id: "trip-pqc",
  destination: "푸꾸옥",
  destinationCode: "PQC",
  startDate: "2026-06-01",
  nights: 4,
  companion: "friends",
  preferences: { vibes: [], pace: "balanced", excludes: [] },
  createdAt: "2026-05-01T00:00:00Z",
  status: "in-progress",
  currentMode: "in-travel",
};

const CITY: ResolvedCity = {
  slug: "phu-quoc",
  code: "PQC",
  name: "푸꾸옥",
  country: { code: "VN", name: "베트남", flagEmoji: "🇻🇳" },
} as ResolvedCity;

const SUNNY: WeatherDay = { day: 1, icon: "sunny", tempC: 32 };

const ITEM: ItineraryItem = {
  id: "i1",
  tripId: "trip-pqc",
  dayIndex: 0,
  scheduledAt: "2026-06-01T02:00:00.000Z",
  durationMinutes: 60,
  flexibility: "flexible",
  priority: 3,
  flexMinutes: 30,
  name: "분짜 식당 (Bún Chả)",
  category: "food",
  location: { lat: 10.2, lng: 103.96, address: "푸꾸옥 즈엉동" },
  evidence: { reasons: [], sources: [], verifiedAt: "" },
  dependencies: [],
};

describe("MorningBriefing — 정적 마크업", () => {
  it("도시 인사 + travelDay 표기", () => {
    const html = renderToStaticMarkup(
      <MorningBriefing
        trip={TRIP}
        city={CITY}
        travelDay={2}
        todayWeather={SUNNY}
        firstItem={ITEM}
        todayCount={3}
        phrase={{ ko: "감사합니다", vi: "Cảm ơn", pronunciation: "깜 언" }}
      />,
    );
    expect(html).toContain("푸꾸옥");
    expect(html).toContain("2");
    expect(html).toContain("일째");
    expect(html).toContain("오늘 일정 3개");
  });

  it("날씨 카드 — 아이콘 + 섭씨 + 라벨", () => {
    const html = renderToStaticMarkup(
      <MorningBriefing
        trip={TRIP}
        city={CITY}
        travelDay={1}
        todayWeather={{ day: 1, icon: "rainy", tempC: 28 }}
        firstItem={null}
        todayCount={0}
        phrase={{ ko: "안녕하세요", vi: "Xin chào", pronunciation: "신 짜오" }}
      />,
    );
    expect(html).toContain("rainy");
    expect(html).toContain("28");
    expect(html).toContain("비");
  });

  it("첫 일정 카드 — 이름·주소·출발 권장 시간 + 상세 링크", () => {
    const html = renderToStaticMarkup(
      <MorningBriefing
        trip={TRIP}
        city={CITY}
        travelDay={1}
        todayWeather={SUNNY}
        firstItem={ITEM}
        todayCount={3}
        phrase={{ ko: "감사합니다", vi: "Cảm ơn", pronunciation: "깜 언" }}
      />,
    );
    expect(html).toContain("분짜 식당");
    expect(html).toContain("푸꾸옥 즈엉동");
    expect(html).toContain("출발 권장");
    expect(html).toContain('href="/itinerary/trip-pqc/item/i1"');
  });

  it("첫 일정 없음 — 자유 일정 안내 노출 + 상세 링크 미노출", () => {
    const html = renderToStaticMarkup(
      <MorningBriefing
        trip={TRIP}
        city={CITY}
        travelDay={1}
        todayWeather={SUNNY}
        firstItem={null}
        todayCount={0}
        phrase={{ ko: "안녕하세요", vi: "Xin chào", pronunciation: "신 짜오" }}
      />,
    );
    expect(html).toContain("자유 일정");
    expect(html).not.toContain("출발 권장");
  });

  it("베트남어 카드 — vi/pronunciation/ko 모두 노출", () => {
    const html = renderToStaticMarkup(
      <MorningBriefing
        trip={TRIP}
        city={CITY}
        travelDay={3}
        todayWeather={SUNNY}
        firstItem={null}
        todayCount={0}
        phrase={{ ko: "맛있어요", vi: "Ngon quá", pronunciation: "응온 꽈" }}
      />,
    );
    expect(html).toContain("Ngon quá");
    expect(html).toContain("응온 꽈");
    expect(html).toContain("맛있어요");
    expect(html).toContain("오늘의 베트남어");
  });

  it("CTA — 전체 일정 보기 + 오늘의 진행 상황 (옵션 N) + 뒤로가기 링크", () => {
    const html = renderToStaticMarkup(
      <MorningBriefing
        trip={TRIP}
        city={CITY}
        travelDay={1}
        todayWeather={SUNNY}
        firstItem={null}
        todayCount={0}
        phrase={{ ko: "안녕하세요", vi: "Xin chào", pronunciation: "신 짜오" }}
      />,
    );
    expect(html).toContain("전체 일정 보기");
    expect(html).toContain("오늘의 진행 상황");
    expect(html).toContain('href="/itinerary/trip-pqc"');
    expect(html).toContain('href="/trips/trip-pqc?focus=itinerary"');
    expect(html).toContain('href="/travel/trip-pqc"');
  });

  it("city 미존재 시 trip.destination fallback", () => {
    const html = renderToStaticMarkup(
      <MorningBriefing
        trip={{ ...TRIP, destination: "달랏" }}
        city={null}
        travelDay={1}
        todayWeather={SUNNY}
        firstItem={null}
        todayCount={0}
        phrase={{ ko: "안녕하세요", vi: "Xin chào", pronunciation: "신 짜오" }}
      />,
    );
    expect(html).toContain("달랏");
  });

  it("출발 권장 시간 — 카테고리별 추정 (food=20, spot=30)", () => {
    const food = renderToStaticMarkup(
      <MorningBriefing
        trip={TRIP}
        city={CITY}
        travelDay={1}
        todayWeather={SUNNY}
        firstItem={{ ...ITEM, category: "food" }}
        todayCount={1}
        phrase={{ ko: "안녕하세요", vi: "Xin chào", pronunciation: "신 짜오" }}
      />,
    );
    expect(food).toContain("20");
    const spot = renderToStaticMarkup(
      <MorningBriefing
        trip={TRIP}
        city={CITY}
        travelDay={1}
        todayWeather={SUNNY}
        firstItem={{ ...ITEM, category: "spot" }}
        todayCount={1}
        phrase={{ ko: "안녕하세요", vi: "Xin chào", pronunciation: "신 짜오" }}
      />,
    );
    expect(spot).toContain("30");
  });
});

describe("/morning/[tripId] page.tsx — source grep", () => {
  const SRC = readFileSync(
    resolve(process.cwd(), "app/morning/[tripId]/page.tsx"),
    "utf-8",
  );

  it("force-dynamic + resolveTripBundle + notFound 표준", () => {
    expect(SRC).toContain('dynamic = "force-dynamic"');
    expect(SRC).toContain("resolveTripBundle");
    expect(SRC).toContain("notFound");
  });

  it("metadata title=오늘의 브리핑", () => {
    expect(SRC).toContain("오늘의 브리핑");
  });

  it("calculateTravelDay + getWeatherForecast + getMorningPhrase 인입", () => {
    expect(SRC).toContain("calculateTravelDay");
    expect(SRC).toContain("getWeatherForecast");
    expect(SRC).toContain("getMorningPhrase");
  });

  it("forecast 인덱스 안전 — Math.min + length-1", () => {
    expect(SRC).toContain("Math.min(travelDay - 1, forecast.length - 1)");
  });
});

describe("TravelHome — /morning/[id] 진입 링크 (회귀)", () => {
  const SRC = readFileSync(
    resolve(process.cwd(), "components/travel/TravelHome.tsx"),
    "utf-8",
  );

  it("wb_sunny 아이콘 + /morning/${trip.id} href", () => {
    expect(SRC).toContain("wb_sunny");
    expect(SRC).toContain("/morning/${trip.id}");
    expect(SRC).toContain("오늘의 브리핑");
  });
});
