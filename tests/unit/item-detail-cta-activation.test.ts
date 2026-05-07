/**
 * 옵션 T (자율 발견 — Session AB cap 3) — item detail dead button 활성화 회귀.
 *
 * 검증:
 *   1. 헤더 "알림" 버튼 → Link href="/notifications" (button → Link 진화)
 *   2. 헤더에 dashboard 진입 칩 추가 (`?focus=itinerary`, PR #305/#307/#311 답습)
 *   3. 하단 "이 일정 유지" → Link href="/trips/[id]?focus=itinerary" (button → Link 진화)
 *   4. 기존 "대안 보기" Link BC 보존 (/itinerary/[id])
 *   5. 기존 헤더 "뒤로" arrow_back 보존
 *
 * page.tsx async 컴포넌트는 mock 부담이 커서 source grep으로 분리 검증
 * (Session N 박제 답습).
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = readFileSync(
  resolve(process.cwd(), "app/itinerary/[id]/item/[itemId]/page.tsx"),
  "utf-8",
);

describe("옵션 T — item detail 헤더 dead button 활성화", () => {
  it("'알림' button → Link href=\"/notifications\" (button 요소 제거)", () => {
    expect(SRC).toContain('href="/notifications"');
    expect(SRC).toContain('aria-label="알림"');
    // button + onClick 없는 dead button 패턴 부재
    expect(SRC).not.toMatch(/<button[^>]*aria-label="알림"/);
  });

  it("dashboard 진입 칩 추가 (?focus=itinerary)", () => {
    expect(SRC).toContain("/trips/${params.id}?focus=itinerary");
    expect(SRC).toContain('aria-label="여행 대시보드 — 일정 카드 강조"');
  });

  it("기존 헤더 '뒤로' arrow_back Link BC 보존", () => {
    expect(SRC).toMatch(/href=`\/itinerary\/\$\{params\.id\}`[\s\S]*?aria-label="뒤로"/);
  });
});

describe("옵션 T — Bottom Action Bar dead button 활성화", () => {
  it("'이 일정 유지' button → Link href={`/trips/${params.id}?focus=itinerary`}", () => {
    expect(SRC).toContain("이 일정 유지");
    expect(SRC).toContain('aria-label="이 일정 유지 — 여행 대시보드로 돌아가기"');
    // bg-purple Link 존재 (button 아님)
    expect(SRC).toMatch(
      /<Link[\s\S]*?\?focus=itinerary[\s\S]*?bg-purple[\s\S]*?>\s*[\s\S]*?이 일정 유지/,
    );
  });

  it("기존 '대안 보기' Link → /itinerary/[id] BC 보존", () => {
    expect(SRC).toContain("대안 보기");
    expect(SRC).toMatch(
      /<Link[\s\S]*?href=`\/itinerary\/\$\{params\.id\}`[\s\S]*?대안 보기/,
    );
  });

  it("Bottom Action Bar fixed + bg-surface-card BC 보존", () => {
    expect(SRC).toMatch(/Bottom Action Bar/);
    expect(SRC).toContain("fixed bottom-0");
    expect(SRC).toContain("bg-surface-card/90");
  });
});

describe("옵션 T — focus key 화이트리스트 답습", () => {
  it("itinerary key 화이트리스트 일치", () => {
    const FOCUS_KEY_SRC = readFileSync(
      resolve(process.cwd(), "lib/utils/focus-key.ts"),
      "utf-8",
    );
    expect(FOCUS_KEY_SRC).toContain('"itinerary"');
  });
});
