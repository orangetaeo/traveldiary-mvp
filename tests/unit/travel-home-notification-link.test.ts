/**
 * 옵션 U (자율 발견 — Session AB cap 4) — TravelHome 헤더 알림 dead button 활성화 회귀.
 *
 * 검증:
 *   1. 알림 button → Link href="/notifications" 진화 (button 요소 부재)
 *   2. aria-label "알림" 보존 (BC)
 *   3. 헤더 4 아이콘 그룹 일관성 — 응급/오늘브리핑/일정전체와 함께 모두 Link
 *   4. PR #313 (item detail 알림)와 동일 패턴
 *
 * source-grep으로 검증 (Session N 박제 답습).
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = readFileSync(
  resolve(process.cwd(), "components/travel/TravelHome.tsx"),
  "utf-8",
);

describe("옵션 U — TravelHome 헤더 알림 Link 활성화", () => {
  it("'알림' button → Link href=\"/notifications\" 진화", () => {
    expect(SRC).toContain('href="/notifications"');
    expect(SRC).toContain('aria-label="알림"');
  });

  it("button 요소가 알림 영역에서 제거됨 (dead button 패턴 부재)", () => {
    // <button>...aria-label="알림"...</button> 패턴 부재
    expect(SRC).not.toMatch(
      /<button[\s\S]{0,200}aria-label="알림"[\s\S]{0,200}<\/button>/,
    );
  });

  it("헤더 4 아이콘 모두 Link로 일관 (응급/오늘브리핑/일정전체/알림)", () => {
    // 응급(EmergencyHeaderButton 컴포넌트), 오늘브리핑/일정전체/알림 모두 진입
    expect(SRC).toContain('href={`/morning/${trip.id}`}'); // 오늘 브리핑
    expect(SRC).toContain('href={`/itinerary/${trip.id}`}'); // 일정 전체
    expect(SRC).toContain('href="/notifications"'); // 알림 (본 PR)
  });

  it("기존 notifications material symbol icon 보존", () => {
    expect(SRC).toMatch(
      /href="\/notifications"[\s\S]{0,200}material-symbols-outlined[^>]*>notifications</,
    );
  });
});
