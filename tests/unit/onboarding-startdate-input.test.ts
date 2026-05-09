/**
 * /onboarding Step 3 — 출발일 사용자 입력 + 숙박 버튼 a11y.
 *
 * 자율 cap 갭: 사용자가 출발일을 변경할 방법이 없음(getDefaultStartDate 자동 7일 후만).
 * 사용자 시나리오: 4월 13일 출발 예정인데 default가 그 외 날짜면 trip이 잘못 생성됨.
 *
 * 검증:
 *  - startDate state mutable (useState)
 *  - <input type="date"> + min={today} + aria-label
 *  - setStartDate prop 전달 + onChange wiring
 *  - 숙박 +/- 버튼 aria-label + disabled + type="button"
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const SRC = fs.readFileSync(
  path.resolve(__dirname, "../../app/onboarding/page.tsx"),
  "utf-8",
);

/* ════════════════════════════════════════════
 * 출발일 — mutable state + input wiring
 * ════════════════════════════════════════════ */

describe("/onboarding Step 3 — 출발일 입력", () => {
  it("startDate state는 mutable (setStartDate)", () => {
    expect(SRC).toMatch(/const\s+\[startDate,\s*setStartDate\]\s*=\s*useState\(getDefaultStartDate\)/);
  });

  it("Step3 컴포넌트에 startDate + setStartDate prop 전달", () => {
    expect(SRC).toMatch(/<Step3[\s\S]*?startDate=\{startDate\}[\s\S]*?setStartDate=\{setStartDate\}/);
  });

  it("Step3 props 인터페이스에 startDate / setStartDate 정의", () => {
    expect(SRC).toMatch(/startDate:\s*string;[\s\S]*?setStartDate:\s*\(d:\s*string\)\s*=>\s*void/);
  });

  it('<input type="date"> 추가 + min={getTodayIso()}', () => {
    expect(SRC).toMatch(/type="date"/);
    expect(SRC).toMatch(/min=\{getTodayIso\(\)\}/);
  });

  it("date input onChange → setStartDate (빈값 시 default fallback)", () => {
    expect(SRC).toMatch(/setStartDate\(e\.target\.value\s*\|\|\s*getDefaultStartDate\(\)\)/);
  });

  it('date input aria-label="출발일 선택"', () => {
    expect(SRC).toContain('aria-label="출발일 선택"');
  });

  it("date input은 sr-only (시각 라벨로 startDateLabel 노출)", () => {
    expect(SRC).toMatch(/<input[\s\S]*?type="date"[\s\S]*?className="sr-only"/);
  });

  it("출발일 카드는 <label>로 wrap (focus-within:ring으로 시각 피드백)", () => {
    expect(SRC).toMatch(/<label[\s\S]*?focus-within:ring-2 focus-within:ring-purple[\s\S]*?출발일[\s\S]*?type="date"/);
  });

  it("getTodayIso 헬퍼 정의 (오늘 ISO date)", () => {
    expect(SRC).toMatch(/function\s+getTodayIso\(\)\s*:\s*string/);
    expect(SRC).toMatch(/new Date\(\)\.toISOString\(\)\.slice\(0,\s*10\)/);
  });
});

/* ════════════════════════════════════════════
 * 숙박 +/- 버튼 a11y
 * ════════════════════════════════════════════ */

describe("/onboarding Step 3 — 숙박 버튼 a11y", () => {
  it("숙박 줄이기 버튼 aria-label + 동적 현재 박수", () => {
    expect(SRC).toMatch(/aria-label=\{`숙박 줄이기 \(현재 \$\{nights\}박\)`\}/);
  });

  it("숙박 늘리기 버튼 aria-label + 동적 현재 박수", () => {
    expect(SRC).toMatch(/aria-label=\{`숙박 늘리기 \(현재 \$\{nights\}박\)`\}/);
  });

  it("숙박 +/- 버튼 모두 type=\"button\" (form submit 방지)", () => {
    const decreaseMatch = SRC.match(/<button[\s\S]*?aria-label=\{`숙박 줄이기[\s\S]*?<\/button>/);
    const increaseMatch = SRC.match(/<button[\s\S]*?aria-label=\{`숙박 늘리기[\s\S]*?<\/button>/);
    expect(decreaseMatch?.[0]).toContain('type="button"');
    expect(increaseMatch?.[0]).toContain('type="button"');
  });

  it("숙박 줄이기 disabled=\"nights <= 1\" + opacity-40", () => {
    expect(SRC).toMatch(/disabled=\{nights\s*<=\s*1\}/);
  });

  it("숙박 늘리기 disabled=\"nights >= 30\" + opacity-40", () => {
    expect(SRC).toMatch(/disabled=\{nights\s*>=\s*30\}/);
  });

  it("disabled 시 시각 피드백 (opacity-40)", () => {
    expect(SRC).toContain("disabled:opacity-40");
  });

  it('현재 박수 노출은 aria-live="polite" (스크린리더 즉시 안내)', () => {
    expect(SRC).toMatch(/aria-live="polite"[\s\S]{0,100}\{nights\}박/);
  });
});

/* ════════════════════════════════════════════
 * formStartDate 라벨 — 회귀 보존
 * ════════════════════════════════════════════ */

describe("/onboarding Step 3 — startDate 시각 라벨 회귀 가드", () => {
  it("startDateLabel (formatStartDateKo) 시각 노출 보존", () => {
    expect(SRC).toContain("startDateLabel");
    expect(SRC).toContain("formatStartDateKo(startDate)");
  });

  it("getDefaultStartDate (오늘+7일) 헬퍼 보존", () => {
    expect(SRC).toMatch(/function\s+getDefaultStartDate\(\)/);
    expect(SRC).toMatch(/d\.setDate\(d\.getDate\(\)\s*\+\s*7\)/);
  });

  it("createTripFromOnboarding에 startDate 전달 (회귀 가드)", () => {
    expect(SRC).toMatch(/createTripFromOnboarding\(\{[\s\S]*?startDate[\s\S]*?\}\)/);
  });
});
