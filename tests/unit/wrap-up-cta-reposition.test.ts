/**
 * 옵션 P (Session AB) — wrap-up CTA 재배치 회귀.
 *
 * 검증:
 *   1. recap 진입 CTA 존재 (/wrap-up/[tripId]/recap)
 *   2. dashboard cross-link (?focus=itinerary, ?focus=cost)
 *   3. dead share 버튼 제거 (헤더 우측은 dashboard 칩)
 *   4. 기존 BC 보존 (뒤로 → /itinerary)
 *
 * page.tsx async 컴포넌트는 mock 부담이 커서 source grep으로 분리 검증
 * (Session N 박제 답습).
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = readFileSync(
  resolve(process.cwd(), "app/wrap-up/[tripId]/page.tsx"),
  "utf-8",
);

describe("옵션 P — wrap-up CTA 재배치", () => {
  it("primary CTA: /wrap-up/[tripId]/recap 진입", () => {
    expect(SRC).toContain("/wrap-up/${trip.id}/recap");
    expect(SRC).toContain("추억 리캡 보기");
    expect(SRC).toContain("auto_stories");
  });

  it("secondary CTA: /trips/[tripId]?focus=itinerary (dashboard cross-link)", () => {
    expect(SRC).toContain("/trips/${trip.id}?focus=itinerary");
    expect(SRC).toContain("여행 대시보드로");
  });

  it("tertiary link: /trips/[tripId]?focus=cost (통계)", () => {
    expect(SRC).toContain("/trips/${trip.id}?focus=cost");
    expect(SRC).toContain("통계 자세히 →");
  });

  it("dead share button 제거 → header 우측 dashboard 칩으로 진화", () => {
    // 기존 dead button 흔적 부재
    expect(SRC).not.toMatch(/<button[^>]*aria-label="공유"/);
    // header 우측에 dashboard ?focus=itinerary
    expect(SRC).toMatch(
      /<header[\s\S]*?\/trips\/\$\{trip\.id\}\?focus=itinerary[\s\S]*?dashboard[\s\S]*?<\/header>/,
    );
  });

  it("기존 뒤로가기 → /itinerary BC 보존", () => {
    expect(SRC).toContain("/itinerary/${trip.id}");
    expect(SRC).toContain("일정으로 돌아가기");
  });

  it("기존 '내 여행 보관하기' 카피 제거 (CTA 재배치 완료)", () => {
    expect(SRC).not.toContain("내 여행 보관하기");
  });

  it("dashboard 진입 칩 2 곳 (header + bottom CTA secondary)", () => {
    const dashboardMatches = SRC.match(/material-symbols-outlined[^>]*>\s*dashboard\s*</g);
    expect(dashboardMatches?.length ?? 0).toBeGreaterThanOrEqual(2);
  });
});

describe("옵션 P — focus key 화이트리스트 답습", () => {
  it("itinerary + cost 2 key 모두 알려진 화이트리스트", () => {
    const FOCUS_KEY_SRC = readFileSync(
      resolve(process.cwd(), "lib/utils/focus-key.ts"),
      "utf-8",
    );
    for (const key of ["itinerary", "cost"]) {
      expect(FOCUS_KEY_SRC).toContain(`"${key}"`);
    }
  });
});
