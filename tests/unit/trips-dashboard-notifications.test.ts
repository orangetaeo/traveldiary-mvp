/**
 * /trips/[tripId] 헤더 — /notifications 진입 회귀 — 옵션 Z (2026-05-08).
 *
 * Trip Dashboard 헤더 우측 빈 spacer → /notifications Link 활성.
 * TravelHome 옵션 U 패턴 답습 (PR #316).
 *
 * dashboard-focus-entry-points.test.tsx source-grep 분리 검증 답습.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const TRIP_DASHBOARD = resolve(__dirname, "../../app/trips/[tripId]/page.tsx");

describe("/trips/[tripId] Trip Dashboard 헤더 — 옵션 Z 알림 진입", () => {
  it("우상단 /notifications Link 활성 (옵션 U 답습)", () => {
    const source = readFileSync(TRIP_DASHBOARD, "utf-8");
    expect(source).toContain('href="/notifications"');
    expect(source).toContain('aria-label="알림"');
  });

  it("notifications material symbol icon", () => {
    const source = readFileSync(TRIP_DASHBOARD, "utf-8");
    expect(source).toMatch(/material-symbols-outlined[^>]*>notifications</);
  });

  it("회귀 — 빈 spacer 제거 (이전 <span className=\"w-10\" aria-hidden />)", () => {
    const source = readFileSync(TRIP_DASHBOARD, "utf-8");
    expect(source).not.toMatch(/<span\s+className="w-10"\s+aria-hidden\s*\/>/);
  });

  it("회귀 — 기존 뒤로가기 Link 보존 (/trips 목록으로)", () => {
    const source = readFileSync(TRIP_DASHBOARD, "utf-8");
    expect(source).toContain('href="/trips"');
    expect(source).toContain("여행 목록으로");
  });

  it("회귀 — 헤더 제목 \"TravelDiary\" 보존", () => {
    const source = readFileSync(TRIP_DASHBOARD, "utf-8");
    expect(source).toContain('"font-semibold text-lg text-ink">TravelDiary</h1>');
  });
});
