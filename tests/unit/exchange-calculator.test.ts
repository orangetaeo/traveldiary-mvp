/**
 * ExchangeCalculator — KRW ↔ 현지통화 양방향 환전 계산기.
 *
 * 자율 cap 갭: /city/[slug]/payment EXCHANGE_KRW_SAMPLES 정적 카드만 있어
 * 사용자 본인 금액 직접 입력 환전 못 함.
 *
 * 검증:
 *  - parseAmount: 콤마/공백 정규화 + NaN 처리
 *  - formatNumber: 천 단위 콤마 + 음수/NaN 빈 문자열
 *  - 컴포넌트 wiring (소스 단언): props + handler + a11y
 *  - page.tsx에 ExchangeCalculator import + EXCHANGE_KRW_SAMPLES 위에 배치
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  parseAmount,
  formatNumber,
} from "@/components/payment/ExchangeCalculator";

const ROOT = path.resolve(__dirname, "../..");
const read = (rel: string) => fs.readFileSync(path.resolve(ROOT, rel), "utf-8");

/* ════════════════════════════════════════════
 * parseAmount — 입력 정규화
 * ════════════════════════════════════════════ */

describe("parseAmount", () => {
  it("정상 숫자 → number", () => {
    expect(parseAmount("10000")).toBe(10000);
  });

  it("천 단위 콤마 → 정상 파싱", () => {
    expect(parseAmount("1,000,000")).toBe(1_000_000);
  });

  it("공백 포함 → 정상 파싱", () => {
    expect(parseAmount(" 50 000 ")).toBe(50_000);
  });

  it("빈 문자열 → NaN", () => {
    expect(Number.isNaN(parseAmount(""))).toBe(true);
  });

  it("부호만 \"-\" → NaN (입력 도중 상태 안전)", () => {
    expect(Number.isNaN(parseAmount("-"))).toBe(true);
  });

  it("음수 → number (parseFloat 자체는 음수 허용 — handler에서 차단)", () => {
    expect(parseAmount("-100")).toBe(-100);
  });

  it("문자 포함 \"abc\" → NaN", () => {
    expect(Number.isNaN(parseAmount("abc"))).toBe(true);
  });

  it("null/undefined-ish 비-string → NaN", () => {
    // @ts-expect-error 의도된 비-string 입력 가드
    expect(Number.isNaN(parseAmount(null))).toBe(true);
  });
});

/* ════════════════════════════════════════════
 * formatNumber — 천 단위 콤마
 * ════════════════════════════════════════════ */

describe("formatNumber", () => {
  it("정수 → ko-KR 천 단위 콤마", () => {
    expect(formatNumber(1_234_567)).toBe("1,234,567");
  });

  it("소수 → 반올림 후 콤마", () => {
    expect(formatNumber(99.7)).toBe("100");
  });

  it("0 → \"0\"", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("음수 → 빈 문자열", () => {
    expect(formatNumber(-100)).toBe("");
  });

  it("NaN → 빈 문자열", () => {
    expect(formatNumber(NaN)).toBe("");
  });

  it("Infinity → 빈 문자열", () => {
    expect(formatNumber(Infinity)).toBe("");
  });
});

/* ════════════════════════════════════════════
 * ExchangeCalculator 컴포넌트 — 소스 단언
 * ════════════════════════════════════════════ */

describe("ExchangeCalculator 소스 — 양방향 wiring", () => {
  const SRC = read("components/payment/ExchangeCalculator.tsx");

  it('"use client" 지시어 (input handler 필수)', () => {
    expect(SRC.split("\n")[0]).toContain('"use client"');
  });

  it("Props 인터페이스: rate / currency / symbol", () => {
    expect(SRC).toMatch(/rate:\s*number/);
    expect(SRC).toMatch(/currency:\s*string/);
    expect(SRC).toMatch(/symbol:\s*string/);
  });

  it("KRW input handleKrwChange + 양방향 갱신", () => {
    expect(SRC).toContain("handleKrwChange");
    expect(SRC).toMatch(/setLocal\(formatNumber\(Math\.round\(krwAmount\s*\*\s*rate\)\)\)/);
  });

  it("현지 input handleLocalChange + 양방향 갱신 (rate > 0 가드)", () => {
    expect(SRC).toContain("handleLocalChange");
    expect(SRC).toMatch(/rate\s*>\s*0/);
    expect(SRC).toMatch(/setKrw\(formatNumber\(Math\.round\(localAmount\s*\/\s*rate\)\)\)/);
  });

  it("초기화 버튼 — handleReset 호출", () => {
    expect(SRC).toContain("handleReset");
    expect(SRC).toMatch(/setKrw\(KRW_DEFAULT\)/);
  });

  it('aria-label "한국 원화 금액 입력" + "(currency) 금액 입력"', () => {
    expect(SRC).toContain('aria-label="한국 원화 금액 입력"');
    expect(SRC).toContain('aria-label={`${currency} 금액 입력`}');
  });

  it('inputMode="numeric" (모바일 숫자 키패드)', () => {
    expect(SRC).toContain('inputMode="numeric"');
  });

  it("음수 입력 차단 (Number.isFinite + >= 0)", () => {
    expect(SRC).toMatch(/Number\.isFinite\(krwAmount\)\s*&&\s*krwAmount\s*>=\s*0/);
    expect(SRC).toMatch(/Number\.isFinite\(localAmount\)\s*&&\s*localAmount\s*>=\s*0/);
  });

  it("환율 변동 안내문 보존 (회귀 가드)", () => {
    expect(SRC).toContain("환율 변동·환전 마진 미반영");
  });

  it("section은 aria-labelledby로 heading 연결", () => {
    expect(SRC).toMatch(/aria-labelledby="exchange-calc-input-heading"/);
  });

  it("sync_alt 아이콘 부모는 aria-hidden (장식)", () => {
    // sync_alt가 시각 화살표만 — 부모 div에 aria-hidden 부착해 children 모두 숨김
    expect(SRC).toMatch(/aria-hidden[\s\S]{0,200}sync_alt/);
  });
});

/* ════════════════════════════════════════════
 * /city/[slug]/payment/page.tsx 통합
 * ════════════════════════════════════════════ */

describe("/city/[slug]/payment/page.tsx — ExchangeCalculator 통합", () => {
  const SRC = read("app/city/[slug]/payment/page.tsx");

  it("ExchangeCalculator import", () => {
    expect(SRC).toMatch(
      /import\s*\{\s*ExchangeCalculator\s*\}\s*from\s*"@\/components\/payment\/ExchangeCalculator"/,
    );
  });

  it("ExchangeCalculator 컴포넌트 렌더 + rate/currency/symbol prop 전달", () => {
    expect(SRC).toMatch(/<ExchangeCalculator[\s\S]{0,300}rate=\{rate\}[\s\S]{0,300}currency=\{city\.payment\.currency\}[\s\S]{0,300}symbol=\{symbol\}/);
  });

  it("EXCHANGE_KRW_SAMPLES 정적 카드 보존 (회귀 가드 — 빠른 참조 유지)", () => {
    expect(SRC).toContain("EXCHANGE_KRW_SAMPLES");
    expect(SRC).toContain("자주 쓰는 단위 빠른 참조");
  });

  it("ExchangeCalculator는 정적 카드보다 위에 배치 (사용자 입력 우선)", () => {
    const calcIdx = SRC.indexOf("<ExchangeCalculator");
    const samplesIdx = SRC.indexOf("EXCHANGE_KRW_SAMPLES.map");
    expect(calcIdx).toBeGreaterThan(0);
    expect(samplesIdx).toBeGreaterThan(0);
    expect(calcIdx).toBeLessThan(samplesIdx);
  });
});
