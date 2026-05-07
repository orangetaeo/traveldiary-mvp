/**
 * A1 모닝 브리핑 — 베트남어 한 줄 rotation invariant.
 */

import { describe, expect, test } from "vitest";
import {
  getMorningPhrase,
  MORNING_PHRASE_COUNT,
} from "@/lib/seed/morning-phrases";

describe("getMorningPhrase", () => {
  test("travelDay=1은 첫 문장(Xin chào)", () => {
    const p = getMorningPhrase(1);
    expect(p.vi).toBe("Xin chào");
    expect(p.ko).toBe("안녕하세요");
    expect(p.pronunciation).toBe("신 짜오");
  });

  test("travelDay별 매 day마다 다른 문장 (1~7)", () => {
    const seen = new Set<string>();
    for (let d = 1; d <= MORNING_PHRASE_COUNT; d++) {
      seen.add(getMorningPhrase(d).vi);
    }
    expect(seen.size).toBe(MORNING_PHRASE_COUNT);
  });

  test("주 단위 rotation — day 1과 day 8 동일", () => {
    expect(getMorningPhrase(1).vi).toBe(getMorningPhrase(8).vi);
    expect(getMorningPhrase(2).vi).toBe(getMorningPhrase(9).vi);
  });

  test("0 또는 음수도 안전(travelDay 경계) — first phrase fallback", () => {
    expect(getMorningPhrase(0).vi).toBeTruthy();
    expect(getMorningPhrase(-1).vi).toBeTruthy();
  });

  test("모든 phrase는 ko/vi/pronunciation 비어있지 않음", () => {
    for (let d = 1; d <= MORNING_PHRASE_COUNT; d++) {
      const p = getMorningPhrase(d);
      expect(p.ko.length).toBeGreaterThan(0);
      expect(p.vi.length).toBeGreaterThan(0);
      expect(p.pronunciation.length).toBeGreaterThan(0);
    }
  });

  test("MORNING_PHRASE_COUNT >= 7 (일주일 이상 rotation)", () => {
    expect(MORNING_PHRASE_COUNT).toBeGreaterThanOrEqual(7);
  });
});
