/**
 * lib/utils/format-krw.ts 단위 테스트.
 */

import { describe, it, expect } from "vitest";
import { formatKrw } from "@/lib/utils/format-krw";

describe("formatKrw", () => {
  it("양수 금액 — ₩N,NNN 형식", () => {
    expect(formatKrw(1000)).toBe("₩1,000");
  });

  it("0 → ₩0", () => {
    expect(formatKrw(0)).toBe("₩0");
  });

  it("음수 → 절대값 (부호 제거)", () => {
    expect(formatKrw(-5000)).toBe("₩5,000");
  });

  it("큰 금액 — 쉼표 구분", () => {
    expect(formatKrw(1250000)).toBe("₩1,250,000");
  });

  it("소수점 금액", () => {
    // toLocaleString("ko-KR")은 소수점 유지
    const result = formatKrw(1234.56);
    expect(result).toContain("₩");
    expect(result).toContain("1,234");
  });

  it("₩ 접두어 항상 존재", () => {
    expect(formatKrw(0)).toMatch(/^₩/);
    expect(formatKrw(999999)).toMatch(/^₩/);
    expect(formatKrw(-1)).toMatch(/^₩/);
  });
});
