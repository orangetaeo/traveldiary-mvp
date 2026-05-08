/**
 * /city/[slug] 사용자 본인 trip 우선 노출 회귀 가드 (2026-05-08).
 *
 * 갭: CityTripCTA가 데모 trip만 노출, 사용자 본인 trip 인식 X.
 * 답습: PR #365 cap 7 OwnedTripsSection 패턴 + isInTravel 분기.
 *
 * 검증:
 *   1. CityTripCTA — ownedTrips prop 추가 + OwnedCityTrip 인터페이스
 *   2. ownedTrips 우선 분기 — purple-soft + "내 여행" 라벨 + isInTravel primaryHref
 *   3. 데모 추천 BC 보존 — DemoRecommendationCard 추출 + compact 모드
 *   4. /city/[slug]/page.tsx — async 진화 + Prisma 조회 + CTA 전달
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const CTA = readFileSync(
  resolve(process.cwd(), "components/city/CityTripCTA.tsx"),
  "utf-8",
);
const PAGE = readFileSync(
  resolve(process.cwd(), "app/city/[slug]/page.tsx"),
  "utf-8",
);

describe("CityTripCTA — ownedTrips prop 진화", () => {
  it("OwnedCityTrip 인터페이스 export", () => {
    expect(CTA).toContain("export interface OwnedCityTrip");
    expect(CTA).toMatch(/id:\s*string/);
    expect(CTA).toMatch(/nights:\s*number/);
    expect(CTA).toMatch(/itemCount:\s*number/);
    expect(CTA).toMatch(/currentMode:\s*string\s*\|\s*null/);
    expect(CTA).toMatch(/dDayLabel:\s*string/);
  });

  it("ownedTrips prop 옵션 (default []) — BC 보존", () => {
    expect(CTA).toMatch(/ownedTrips\??:\s*OwnedCityTrip\[\]/);
    expect(CTA).toContain("ownedTrips = []");
  });

  it("ownedTrips 우선 분기 — purple-soft + \"내 여행\" 라벨", () => {
    expect(CTA).toContain("ownedTrips.length > 0");
    expect(CTA).toContain("bg-purple-soft");
    expect(CTA).toContain("border-purple/40");
    expect(CTA).toContain("내 여행");
  });

  it("isInTravel 분기 — primaryHref가 /travel/[id] 또는 /itinerary/[id] (DashboardHero 답습)", () => {
    expect(CTA).toContain('primary.currentMode === "in-travel"');
    expect(CTA).toMatch(/`\/travel\/\$\{primary\.id\}`/);
    expect(CTA).toMatch(/`\/itinerary\/\$\{primary\.id\}`/);
  });

  it("isInTravel CTA 라벨 분기 — \"여행 중 홈 열기\" / \"내 일정 자세히 보기\"", () => {
    expect(CTA).toContain("여행 중 홈 열기");
    expect(CTA).toContain("내 일정 자세히 보기");
  });

  it("D-Day Badge 노출 (info 톤 + dDayLabel 사용)", () => {
    expect(CTA).toMatch(/<Badge\s+tone="info">\{primary\.dDayLabel\}<\/Badge>/);
  });

  it("다중 ownedTrips 시 \"이 도시 내 여행 N건\" link", () => {
    expect(CTA).toContain("이 도시 내 여행");
    expect(CTA).toContain("ownedTrips.length");
  });

  it("DemoRecommendationCard 추출 — compact 모드 (ownedTrips 있을 때 secondary)", () => {
    expect(CTA).toContain("function DemoRecommendationCard");
    expect(CTA).toContain("compact?: boolean");
    expect(CTA).toContain('compact ? "데모 추천" : "추천 일정"');
    expect(CTA).toContain('mt-td-md'); // compact 모드 spacing
  });

  it("BC — trips 0건 시 amber \"준비 중\" + /trips 링크 보존", () => {
    expect(CTA).toContain("준비 중이에요");
    expect(CTA).toContain("bg-amber-soft");
    expect(CTA).toContain("다른 도시 일정 둘러보기");
  });
});

describe("/city/[slug] page — owned trips wiring", () => {
  it("default async function 진화 (Prisma await)", () => {
    expect(PAGE).toContain("export default async function CityPage");
  });

  it("Prisma 조회 — destinationCode 매칭 + 사용자 본인", () => {
    expect(PAGE).toContain("ownerId: currentUserId");
    expect(PAGE).toContain("destinationCode: city.code");
    expect(PAGE).toContain("deletedAt: null");
  });

  it("dDay + todayISO로 dDayLabel 계산 (호출 측 책임)", () => {
    expect(PAGE).toContain("@/lib/utils/item-display");
    expect(PAGE).toContain("@/lib/seed/demo-date");
    expect(PAGE).toContain("dDay(startDate, today)");
    expect(PAGE).toMatch(/dDayLabel\s*=/);
  });

  it("CityTripCTA에 ownedTrips prop 전달", () => {
    expect(PAGE).toMatch(
      /<CityTripCTA[\s\S]+?ownedTrips=\{ownedTrips\}[\s\S]+?\/>/,
    );
  });

  it("DB 오류 fallback — try/catch 빈 배열", () => {
    expect(PAGE).toMatch(
      /try\s*\{[\s\S]+?prisma\.trip\.findMany[\s\S]+?destinationCode:\s*city\.code[\s\S]+?\}\s*catch/,
    );
  });
});
