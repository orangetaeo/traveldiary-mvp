/**
 * OwnedTripsSection — /trips 페이지 본인 trip 우선 노출 회귀 가드 (cap 7, 2026-05-08).
 *
 * 검증:
 *   1. 컴포넌트 — trips 0건 시 미노출 (return null)
 *   2. 헤더 — "내 여행 N개" + "+ 새 여행" /onboarding CTA (cap 4 답습)
 *   3. 카드 — destination/D-Day/status 노출 + isInTravel 분기 primaryHref
 *   4. /trips page — sortTripsByPriority + Prisma 조회 wiring (cap 6 답습)
 *   5. /trips page — OwnedTripsSection이 ReceivedTripsSection 위에 위치
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SECTION = readFileSync(
  resolve(process.cwd(), "components/trips/OwnedTripsSection.tsx"),
  "utf-8",
);
const TRIPS_PAGE = readFileSync(
  resolve(process.cwd(), "app/trips/page.tsx"),
  "utf-8",
);

describe("OwnedTripsSection 컴포넌트", () => {
  it("trips 0건 시 미노출 (return null) — Mode A 사용자에 대한 BC", () => {
    expect(SECTION).toContain("trips.length === 0");
    expect(SECTION).toContain("return null");
  });

  it("OwnedTripCardData 인터페이스 — id/destination/destinationCode/nights/startDate/itemCount/currentMode", () => {
    expect(SECTION).toContain("export interface OwnedTripCardData");
    expect(SECTION).toMatch(/id:\s*string/);
    expect(SECTION).toMatch(/destination:\s*string/);
    expect(SECTION).toMatch(/nights:\s*number/);
    expect(SECTION).toMatch(/startDate:\s*string/);
    expect(SECTION).toMatch(/itemCount:\s*number/);
    expect(SECTION).toMatch(/currentMode:\s*string\s*\|\s*null/);
  });

  it("헤더 — \"내 여행 N개\" + \"+ 새 여행\" /onboarding CTA (cap 4 답습)", () => {
    expect(SECTION).toContain("내 여행");
    expect(SECTION).toContain("trips.length");
    expect(SECTION).toContain('href="/onboarding"');
    expect(SECTION).toContain('aria-label="새 여행 만들기 — 온보딩"');
    expect(SECTION).toContain("새 여행");
  });

  it("카드 — D-Day 분기 라벨 (D-N / 출발 당일 / D+N)", () => {
    expect(SECTION).toContain("D-${dDayNum}");
    expect(SECTION).toContain("출발 당일");
    expect(SECTION).toContain("D+${-dDayNum}");
  });

  it("카드 isInTravel 분기 — primaryHref가 /travel/[id] 또는 /itinerary/[id] (DashboardHero 답습)", () => {
    expect(SECTION).toContain('trip.currentMode === "in-travel"');
    expect(SECTION).toMatch(/`\/travel\/\$\{trip\.id\}`/);
    expect(SECTION).toMatch(/`\/itinerary\/\$\{trip\.id\}`/);
  });

  it("Badge 톤 union — info | amber | success (warning 부재, DashboardHero 답습)", () => {
    expect(SECTION).toMatch(/"info"\s*\|\s*"amber"\s*\|\s*"success"/);
    expect(SECTION).not.toContain('"warning"');
  });
});

describe("/trips page wiring (cap 7)", () => {
  it("Prisma 조회 — ownerId: currentUserId + deletedAt: null + orderBy startDate asc + take 20", () => {
    expect(TRIPS_PAGE).toContain("ownerId: currentUserId");
    expect(TRIPS_PAGE).toContain("deletedAt: null");
    expect(TRIPS_PAGE).toMatch(/orderBy:\s*\{\s*startDate:\s*"asc"\s*\}/);
    expect(TRIPS_PAGE).toMatch(/take:\s*20/);
  });

  it("sortTripsByPriority + todayISO 답습 (cap 6)", () => {
    expect(TRIPS_PAGE).toContain("@/lib/utils/trip-priority");
    expect(TRIPS_PAGE).toContain("sortTripsByPriority(mapped, todayISO())");
  });

  it("OwnedTripsSection 임포트 + 렌더링 (ReceivedTripsSection 위)", () => {
    expect(TRIPS_PAGE).toContain("@/components/trips/OwnedTripsSection");
    expect(TRIPS_PAGE).toContain("<OwnedTripsSection trips={ownedTrips} />");
    // OwnedTripsSection이 ReceivedTripsSection보다 먼저 등장 (사용자 본인 우선)
    const ownedIdx = TRIPS_PAGE.indexOf("<OwnedTripsSection");
    const receivedIdx = TRIPS_PAGE.indexOf("<ReceivedTripsSection");
    expect(ownedIdx).toBeGreaterThan(0);
    expect(receivedIdx).toBeGreaterThan(0);
    expect(ownedIdx).toBeLessThan(receivedIdx);
  });

  it("DB 오류 fallback — try/catch 빈 배열 + 데모 카드 보존 (BC)", () => {
    expect(TRIPS_PAGE).toMatch(
      /try\s*\{[\s\S]+?prisma\.trip\.findMany[\s\S]+?\}\s*catch/,
    );
    // 데모 카드 + filter chip + ReceivedTripsSection 보존
    expect(TRIPS_PAGE).toContain("buildCards(listDemoTrips()");
    expect(TRIPS_PAGE).toContain("FILTER_CHIPS");
    expect(TRIPS_PAGE).toContain("<ReceivedTripsSection");
  });

  it("default async function 진화 — Prisma await 위해", () => {
    expect(TRIPS_PAGE).toContain("export default async function TripsPage");
  });
});
