/**
 * /trips/[tripId] 사용자 본인 trip 404 회귀 가드 (2026-05-08).
 *
 * 갭: 페이지가 getDemoTrip()만 사용 → 사용자 본인 trip ID 진입 시 404.
 * 영향: PR #365 DashboardHero/OwnedTripsSection/CityTripCTA의 `/trips/{tripId}` 링크
 * 모두 사용자 본인 trip에 대해 깨짐.
 *
 * Fix: resolveTripBundle (DB 우선 + 데모 fallback) 답습 — /itinerary/[id] 동일 패턴.
 *
 * 검증:
 *   1. import getDemoTrip → resolveTripBundle 전환
 *   2. generateMetadata + 페이지 본문 모두 await resolveTripBundle 사용
 *   3. notFound() 호출은 둘 다 null일 때만
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PAGE = readFileSync(
  resolve(process.cwd(), "app/trips/[tripId]/page.tsx"),
  "utf-8",
);

describe("/trips/[tripId] — resolveTripBundle 통합 lookup (fix 2026-05-08)", () => {
  it("getDemoTrip import 제거 — resolveTripBundle로 전환", () => {
    expect(PAGE).not.toContain('import { getDemoTrip }');
    expect(PAGE).toContain(
      'import { resolveTripBundle } from "@/lib/repositories/trip.repository"',
    );
  });

  it("페이지 본문 — await resolveTripBundle 사용 (DB 우선 + 데모 fallback)", () => {
    // 페이지 default 함수 안에 resolveTripBundle await 패턴
    expect(PAGE).toMatch(
      /const found\s*=\s*await\s+resolveTripBundle\(params\.tripId\)/,
    );
  });

  it("generateMetadata + 본문 — 모두 await resolveTripBundle 사용 (2 호출 사이트)", () => {
    // 페이지에 resolveTripBundle 호출이 최소 2번 (generateMetadata + 페이지 본문)
    const calls = PAGE.match(/await\s+resolveTripBundle\(/g);
    expect(calls).not.toBeNull();
    expect(calls!.length).toBeGreaterThanOrEqual(2);
  });

  it("notFound 호출은 resolveTripBundle null일 때만 (BC)", () => {
    expect(PAGE).toMatch(
      /const found\s*=\s*await\s+resolveTripBundle[\s\S]+?if\s*\(!found\)\s*notFound\(\)/,
    );
  });

  it("getDemoTrip 직접 호출 부재 (lookup 경로 통합 보장)", () => {
    expect(PAGE).not.toMatch(/\bgetDemoTrip\s*\(/);
  });
});
