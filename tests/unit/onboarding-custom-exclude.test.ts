/**
 * /onboarding Step 4 — 사용자 정의 기피 항목 입력.
 *
 * 자율 cap 갭: 기존 EXCLUDES 정적 3개 chip("새우 알레르기", "매운 거 못 먹음", "비건")만 있어
 * 사용자 본인 알레르기(호두/글루텐/유제품 등) 입력 불가 → 일정에서 제외 못 함.
 *
 * 검증:
 *  - addCustomExclude / removeCustomExclude handler (preset 중복·trim·30자 cap)
 *  - Step 4 props에 새 핸들러 전달 + customInput 내부 state
 *  - input + 추가 button + Enter 키 wiring
 *  - customExcludes는 EXCLUDES preset 외 항목만 표시 + close button으로 제거
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const SRC = fs.readFileSync(
  path.resolve(__dirname, "../../app/onboarding/page.tsx"),
  "utf-8",
);

/* ════════════════════════════════════════════
 * addCustomExclude / removeCustomExclude handlers
 * ════════════════════════════════════════════ */

describe("/onboarding — addCustomExclude / removeCustomExclude", () => {
  it("addCustomExclude는 trim + 30자 cap 적용", () => {
    expect(SRC).toMatch(/addCustomExclude\s*=\s*\(raw:\s*string\)/);
    expect(SRC).toMatch(/raw\.trim\(\)\.slice\(0,\s*30\)/);
  });

  it("addCustomExclude는 EXCLUDES preset 중복 시 무시 (입력 분리 보장)", () => {
    expect(SRC).toMatch(/EXCLUDES\.includes\(value\)/);
  });

  it("addCustomExclude는 excludes 중복 시 무시 (이미 추가된 사용자 정의)", () => {
    expect(SRC).toMatch(/prev\.includes\(value\)\s*\?\s*prev\s*:\s*\[\.\.\.prev,\s*value\]/);
  });

  it("removeCustomExclude → setExcludes filter 제거", () => {
    expect(SRC).toMatch(/removeCustomExclude\s*=\s*\(value:\s*string\)/);
    expect(SRC).toMatch(/prev\.filter\(\(x\)\s*=>\s*x\s*!==\s*value\)/);
  });

  it("Step4에 addCustomExclude / removeCustomExclude prop 전달", () => {
    expect(SRC).toMatch(/<Step4[\s\S]*?addCustomExclude=\{addCustomExclude\}[\s\S]*?removeCustomExclude=\{removeCustomExclude\}/);
  });

  it("Step4 props 인터페이스 정의", () => {
    expect(SRC).toMatch(/addCustomExclude:\s*\(raw:\s*string\)\s*=>\s*void/);
    expect(SRC).toMatch(/removeCustomExclude:\s*\(value:\s*string\)\s*=>\s*void/);
  });

  it("toggleExclude (기존 preset chip)는 보존 — 회귀 가드", () => {
    expect(SRC).toMatch(/toggleExclude\s*=\s*\(v:\s*string\)/);
  });
});

/* ════════════════════════════════════════════
 * Step 4 input UI
 * ════════════════════════════════════════════ */

describe("/onboarding Step 4 — 사용자 정의 기피 input UI", () => {
  it("customInput 내부 state (Step 4 함수 내)", () => {
    expect(SRC).toMatch(/const\s+\[customInput,\s*setCustomInput\]\s*=\s*useState\(""\)/);
  });

  it("customExcludes는 EXCLUDES preset 외 항목 (filter)", () => {
    expect(SRC).toMatch(/customExcludes\s*=\s*excludes\.filter\(\(e\)\s*=>\s*!EXCLUDES\.includes\(e\)\)/);
  });

  it("input에 maxLength 30 + placeholder 예시", () => {
    expect(SRC).toContain('maxLength={30}');
    expect(SRC).toContain("호두 알레르기");
  });

  it("input aria-label \"사용자 정의 기피 항목 입력\"", () => {
    expect(SRC).toContain('aria-label="사용자 정의 기피 항목 입력"');
  });

  it("input onChange는 30자 cap (slice)", () => {
    expect(SRC).toMatch(/setCustomInput\(e\.target\.value\.slice\(0,\s*30\)\)/);
  });

  it("Enter 키로 추가 (preventDefault + handleAddCustom)", () => {
    expect(SRC).toMatch(/e\.key\s*===\s*"Enter"/);
    expect(SRC).toMatch(/e\.preventDefault\(\)/);
    expect(SRC).toContain("handleAddCustom");
  });

  it("추가 버튼 type=\"button\" + aria-label + disabled (input 빈값 시)", () => {
    expect(SRC).toMatch(/type="button"[\s\S]{0,300}?aria-label="기피 항목 추가"/);
    expect(SRC).toMatch(/disabled=\{!customInput\.trim\(\)\}/);
  });

  it("handleAddCustom은 input 비우고 addCustomExclude 호출", () => {
    expect(SRC).toMatch(/handleAddCustom\s*=\s*\(\)\s*=>/);
    expect(SRC).toMatch(/addCustomExclude\(value\)/);
    expect(SRC).toMatch(/setCustomInput\(""\)/);
  });

  it("사용자 chip은 close button + aria-label 동적 \"기피 항목 X 제거\"", () => {
    expect(SRC).toMatch(/aria-label=\{`기피 항목 \$\{e\} 제거`\}/);
  });

  it("사용자 chip은 bg-danger-soft + border-danger (preset과 별도 시각)", () => {
    expect(SRC).toMatch(/customExcludes\.map\([\s\S]*?bg-danger-soft text-danger-deep[\s\S]*?border-danger\/30/);
  });

  it("안내 문구 (본인 알레르기·식이 제한 입력 가능)", () => {
    expect(SRC).toContain("본인 알레르기");
    expect(SRC).toContain("식이 제한");
  });

  it("기존 preset EXCLUDES Chip 회귀 보존 (toggleExclude wiring)", () => {
    expect(SRC).toMatch(/EXCLUDES\.map\(\([\s\S]*?Chip[\s\S]*?onClick=\{\(\)\s*=>\s*toggleExclude\(e\)\}/);
  });

  it("createTripFromOnboarding에 excludes 그대로 전달 (회귀 가드)", () => {
    expect(SRC).toMatch(/preferences:\s*\{[\s\S]*?excludes[\s\S]*?\}/);
  });
});
