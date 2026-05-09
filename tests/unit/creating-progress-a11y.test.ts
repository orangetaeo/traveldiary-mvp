/**
 * /itinerary/creating progress bar a11y — role="progressbar" + aria-valuenow.
 *
 * 자율 cap (작은 a11y 개선): progress bar가 aria-hidden="true"로 스크린리더에 완전 숨겨져 있었음.
 * 사용자가 일정 생성 진행을 인지 못 하던 갭. progressbar role + valuenow/min/max로 노출.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const SRC = fs.readFileSync(
  path.resolve(__dirname, "../../app/itinerary/creating/page.tsx"),
  "utf-8",
);

describe("/itinerary/creating — progress bar a11y", () => {
  it('role="progressbar" 부착 (이전 aria-hidden="true" 제거)', () => {
    expect(SRC).toContain('role="progressbar"');
    // aria-hidden="true"는 스크린리더 숨김 → 진행 알림 차단됐던 회귀 가드
    expect(SRC).not.toMatch(/aria-hidden="true"\s*\n\s*>\s*\n\s*<div\s+className="h-full bg-purple/);
  });

  it("aria-valuenow는 done ? 100 : progress 분기", () => {
    expect(SRC).toMatch(/aria-valuenow=\{done\s*\?\s*100\s*:\s*progress\}/);
  });

  it("aria-valuemin={0} + aria-valuemax={100} 명시", () => {
    expect(SRC).toContain("aria-valuemin={0}");
    expect(SRC).toContain("aria-valuemax={100}");
  });

  it('aria-label="일정 생성 진행" (스크린리더 컨텍스트)', () => {
    expect(SRC).toContain('aria-label="일정 생성 진행"');
  });

  it("동적 width는 inline style 보존 (progressbar 필수, eslint-disable 명시)", () => {
    expect(SRC).toMatch(/style=\{\{\s*width:\s*`\$\{done\s*\?\s*100\s*:\s*progress\}%`\s*\}\}/);
    expect(SRC).toContain("// eslint-disable-next-line react/forbid-dom-props");
  });

  it("percentage 텍스트 노출은 aria-live=\"polite\" 보존 (회귀 가드)", () => {
    expect(SRC).toMatch(/aria-live="polite"[\s\S]{0,150}\{done\s*\?\s*"100"\s*:\s*progress\}%/);
  });

  it("progress state + done state는 보존 (회귀 가드)", () => {
    expect(SRC).toMatch(/const\s+\[active,\s*setActive\]\s*=\s*useState\(0\)/);
    expect(SRC).toMatch(/const\s+\[done,\s*setDone\]\s*=\s*useState\(false\)/);
    expect(SRC).toMatch(/const\s+progress\s*=\s*Math\.min\(100,/);
  });

  it("Suspense + ItineraryCreatingInner 구조 보존 (회귀 가드)", () => {
    expect(SRC).toContain("Suspense");
    expect(SRC).toContain("ItineraryCreatingInner");
  });

  it("STEP_MS 2800 + TIP_INTERVAL_MS 4000 보존 (timing 회귀 가드)", () => {
    expect(SRC).toContain("STEP_MS = 2800");
    expect(SRC).toContain("TIP_INTERVAL_MS = 4000");
  });
});
