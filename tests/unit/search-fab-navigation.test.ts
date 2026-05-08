/**
 * Speed Dial FAB 검색 버튼 네비게이션 — 소스 grep 테스트.
 *
 * 홈 페이지 + TravelHome의 검색 FAB가 /discover 페이지로 연결되는지 확인.
 * dead button (onClick/href 없는 <button>) 회귀 방지.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const HOME_SRC = fs.readFileSync(
  path.resolve("app/page.tsx"),
  "utf-8",
);
const TRAVEL_HOME_SRC = fs.readFileSync(
  path.resolve("components/travel/TravelHome.tsx"),
  "utf-8",
);

/* ════════════════════════════════════════════
 * 홈 페이지 — Speed Dial 검색 FAB
 * ════════════════════════════════════════════ */

describe("app/page.tsx — 검색 FAB", () => {
  it("검색 FAB가 Link 컴포넌트로 렌더링됨 (dead button 아님)", () => {
    // "주변 검색" aria-label 주변에 Link 또는 href가 있어야 함
    expect(HOME_SRC).toContain("/discover");
  });

  it("discover 경로에 day 파라미터 포함", () => {
    expect(HOME_SRC).toContain("discover?day=0");
  });

  it("검색 FAB가 <button> 아닌 <Link>로 렌더링", () => {
    const idx = HOME_SRC.indexOf('aria-label="주변 검색"');
    const searchSection = HOME_SRC.slice(Math.max(0, idx - 300), idx + 50);
    expect(searchSection).toContain("<Link");
    expect(searchSection).not.toContain("<button");
  });
});

/* ════════════════════════════════════════════
 * TravelHome — Speed Dial 검색 FAB
 * ════════════════════════════════════════════ */

describe("TravelHome — 검색 FAB", () => {
  it("검색 FAB가 /discover로 연결됨", () => {
    expect(TRAVEL_HOME_SRC).toContain("/discover");
  });

  it("trip.id 기반 discover 경로", () => {
    expect(TRAVEL_HOME_SRC).toContain("trip.id}/discover");
  });

  it("검색 FAB가 <Link>로 렌더링", () => {
    const idx = TRAVEL_HOME_SRC.indexOf('aria-label="주변 검색"');
    const searchSection = TRAVEL_HOME_SRC.slice(Math.max(0, idx - 200), idx + 50);
    expect(searchSection).toContain("<Link");
    expect(searchSection).not.toContain("<button");
  });
});

/* ════════════════════════════════════════════
 * discover 페이지 존재 확인
 * ════════════════════════════════════════════ */

describe("discover 페이지 인프라", () => {
  it("discover 페이지 파일 존재", () => {
    const discoverPage = path.resolve("app/itinerary/[id]/discover/page.tsx");
    expect(fs.existsSync(discoverPage)).toBe(true);
  });

  it("discover 페이지에서 day 쿼리 파라미터 처리", () => {
    const discoverSrc = fs.readFileSync(
      path.resolve("app/itinerary/[id]/discover/page.tsx"),
      "utf-8",
    );
    expect(discoverSrc).toContain("searchParams");
    expect(discoverSrc).toContain("day");
  });
});
