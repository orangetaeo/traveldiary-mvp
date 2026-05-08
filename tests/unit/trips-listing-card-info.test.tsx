/**
 * /trips listing TripCard 정보 구조 회귀 — 사이클 ZZ+1.
 *
 * 사용자 흐름 갭 — 여러 trip 중 자기 여행 빠르게 식별:
 *   - D-Day 뱃지 (출발 전/당일/진행 중/완료 4 상태)
 *   - 출발일 ("5월 12일 (월) 출발")
 *   - 동행자 수 ("친구와" / "혼자" 등)
 *
 * 데모 시드는 모두 진행 중(이미 출발) → '여행 중' 또는 '여행 완료' 뱃지 노출.
 * 시드 dependent 단언은 contain/regex로 느슨하게 (feedback_regression_test_minimums 답습).
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import TripsPage from "@/app/trips/page";

describe("Session ZZ+1 — TripCard 정보 구조 강화", () => {
  it("D-Day 뱃지 노출 (data-testid='trip-card-dday' 최소 1건)", async () => {
    const html = renderToStaticMarkup(await TripsPage({ searchParams: {} }));
    expect(html).toMatch(/data-testid="trip-card-dday"/);
  });

  it("D-Day 라벨은 4 패턴 중 하나 매칭", async () => {
    const html = renderToStaticMarkup(await TripsPage({ searchParams: {} }));
    // 시드 trip은 모두 startDate가 과거이므로 '여행 중' 또는 '여행 완료'
    // 미래 trip 추가 시 'D-N'/'출발 당일'도 매칭 (regex로 느슨하게)
    expect(html).toMatch(/D-\d+|출발 당일|여행 중 · D\+\d+|여행 완료/);
  });

  it("출발일 + '출발' 라벨 + 'event' 아이콘 노출", async () => {
    const html = renderToStaticMarkup(await TripsPage({ searchParams: {} }));
    expect(html).toMatch(/\d+월 \d+일 \([일월화수목금토]\) 출발/);
    // material-symbols 아이콘
    expect(html).toContain(">event<");
  });

  it("동행자 라벨 노출 ('group' 아이콘 + 4종 한국어 중 하나)", async () => {
    const html = renderToStaticMarkup(await TripsPage({ searchParams: {} }));
    expect(html).toContain(">group<");
    expect(html).toMatch(/혼자|친구와|가족과|그룹/);
  });

  it("aria-label에 D-Day 라벨 포함 (스크린리더 컨텍스트)", async () => {
    const html = renderToStaticMarkup(await TripsPage({ searchParams: {} }));
    // 예: aria-label="푸꾸옥 7박 8일 여행 대시보드 · 여행 중 · D+3"
    expect(html).toMatch(/aria-label="[^"]*여행 대시보드 · (D-\d+|출발 당일|여행 중 · D\+\d+|여행 완료)"/);
  });
});
