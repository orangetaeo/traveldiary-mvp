/**
 * 가로 스크롤 회귀 가드 — touch-pan-x + overscroll-x-contain 일괄 적용 검증.
 *
 * 사용자 보고: CityContextStrip 모바일 가로 스와이프 시 페이지가 위로 밀림
 * (PR #339 정적 anchor + PR #346 touch-action 직교 2 원인 fix).
 *
 * 회귀 가드: `overflow-x-auto`를 사용하는 모든 컨테이너는 동일 className에
 *   - `touch-pan-x` (수직 제스처 부모 위임)
 *   - `overscroll-x-contain` (scroll chaining 차단)
 * 두 토큰을 함께 가져야 한다.
 *
 * 새 컴포넌트 추가 시 이 목록에도 추가하거나 패턴 즉시 적용 — 둘 중 하나 필수.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

// __dirname 대신 process.cwd() 사용 — 다른 source-grep 테스트와 동일 패턴.
// vitest는 worktree root에서 실행됨 (npm run test:unit / vitest run).
const ROOT = process.cwd();

const FILES = [
  "app/wrap-up/[tripId]/page.tsx",
  "app/trips/page.tsx",
  "app/itinerary/[id]/item/[itemId]/page.tsx",
  "app/city/[slug]/page.tsx",
  "components/recap/PostTripRecapView.tsx",
  "components/dashboard/WeatherStrip.tsx",
  "components/allergen/AllergenFilterChips.tsx",
  "components/admin/TimeWindowFilter.tsx",
  "components/notifications/NotificationListView.tsx",
  "components/itinerary/AddItemModal.tsx",
  "components/itinerary/DayRouteMapView.tsx",
  "components/itinerary/DayTabsBar.tsx",
  "components/itinerary/PlaceDiscoveryView.tsx",
  "components/checklist/ChecklistTimeline.tsx",
  "components/checklist/ChecklistDoneFilter.tsx",
  "components/checklist/ChecklistCategoryFilter.tsx",
  "components/city/CityContextStrip.tsx",
  // 홈 재설계 (2026-05-08) — 매직 모먼트 캐러셀 + 다중 trip 칩 selector
  "components/home/MagicMomentsCarousel.tsx",
  "components/home/DashboardHero.tsx",
];

describe("가로 스크롤 컨테이너 — touch-pan-x + overscroll-x-contain 회귀 가드", () => {
  it.each(FILES)(
    "%s — overflow-x-auto가 등장하는 모든 className은 touch-pan-x 동반",
    (relPath) => {
      const source = fs.readFileSync(path.join(ROOT, relPath), "utf-8");
      const lines = source.split("\n");

      const matchingLines = lines.filter(
        (line) =>
          line.includes("overflow-x-auto") &&
          !line.includes("//") && // 주석 라인 false positive 회피
          !line.includes("expect"), // 테스트 단언 라인 false positive 회피
      );

      expect(matchingLines.length).toBeGreaterThan(0);

      for (const line of matchingLines) {
        expect(line, `line: ${line.trim()}`).toContain("touch-pan-x");
        expect(line, `line: ${line.trim()}`).toContain(
          "overscroll-x-contain",
        );
      }
    },
  );

  it("총 18곳 검증 (CityContextStrip 포함)", () => {
    let totalMatches = 0;
    for (const relPath of FILES) {
      const source = fs.readFileSync(path.join(ROOT, relPath), "utf-8");
      const lines = source.split("\n");
      const matches = lines.filter(
        (line) =>
          line.includes("overflow-x-auto") &&
          !line.includes("//") &&
          !line.includes("expect"),
      );
      totalMatches += matches.length;
    }
    // wrap-up: 2곳, 나머지 17 파일: 1곳씩 = 19곳 (CityContextStrip은 PR #346로 이미 적용)
    expect(totalMatches).toBeGreaterThanOrEqual(18);
  });
});
