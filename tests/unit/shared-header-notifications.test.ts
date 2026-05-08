/**
 * 자율 진행 cap 3 (2026-05-08) — /shared 페이지 헤더 빈 spacer → /notifications Link 진화.
 *
 * PR #316 (TravelHome) + PR #348 (Trip Dashboard) + PR #368 (booking) 답습 (5번째).
 * 빈 헤더 spacer (`<span className="w-10" aria-hidden />`) 변형 → 의미 있는 진입점 활성화.
 *
 * source-grep으로 검증.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = readFileSync(
  resolve(process.cwd(), "app/shared/page.tsx"),
  "utf-8",
);

describe("/shared 헤더 — 빈 spacer 제거 + /notifications 진입", () => {
  it("빈 spacer span (`<span className=\"w-10\" aria-hidden />`) 제거됨", () => {
    expect(SRC).not.toMatch(/<span className="w-10" aria-hidden\s*\/>/);
  });

  it("/notifications Link 진입 추가됨", () => {
    expect(SRC).toContain('href="/notifications"');
  });

  it("aria-label '알림' 명시 (스크린 리더 명확화)", () => {
    expect(SRC).toContain('aria-label="알림"');
  });

  it("notifications material symbol 아이콘 사용", () => {
    expect(SRC).toMatch(/material-symbols-outlined">notifications</);
  });

  it("좌측 arrow_back Link (Trips으로) BC 100% 보존", () => {
    expect(SRC).toContain('href="/trips"');
    expect(SRC).toContain('aria-label="Trips으로"');
    expect(SRC).toMatch(/material-symbols-outlined">arrow_back</);
  });

  it("h1 '받은 여행' 텍스트 BC 보존", () => {
    expect(SRC).toContain("받은 여행");
  });
});

describe("/shared 페이지 — 사이클 SS/YY/KK 기능 BC 보존", () => {
  it("MyIdentityPanel (사이클 SS) BC 보존", () => {
    expect(SRC).toContain("MyIdentityPanel");
  });

  it("MyActivitySection (사이클 YY) BC 보존", () => {
    expect(SRC).toContain("MyActivitySection");
  });

  it("BottomNav active='trips' BC 보존", () => {
    expect(SRC).toContain('BottomNav active="trips"');
  });
});
