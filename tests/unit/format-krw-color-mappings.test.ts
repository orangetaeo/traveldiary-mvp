/**
 * 공유 유틸리티 테스트 — formatKrw + color-mappings.
 */

import { describe, it, expect } from "vitest";
import { formatKrw } from "@/lib/utils/format-krw";
import { COLOR_BG, COLOR_TEXT } from "@/lib/utils/color-mappings";

describe("formatKrw", () => {
  it("양수 → ₩N,NNN", () => {
    expect(formatKrw(10000)).toBe("₩10,000");
    expect(formatKrw(1_240_000)).toBe("₩1,240,000");
  });

  it("음수 → 절대값 (₩N,NNN)", () => {
    expect(formatKrw(-5000)).toBe("₩5,000");
  });

  it("0 → ₩0", () => {
    expect(formatKrw(0)).toBe("₩0");
  });

  it("소수점 → 정수 표현 그대로", () => {
    expect(formatKrw(1234.56)).toContain("1,234");
  });
});

describe("COLOR_BG", () => {
  it("4색 존재 (purple, coral, amber, gray)", () => {
    expect(COLOR_BG.purple).toBe("bg-purple-soft");
    expect(COLOR_BG.coral).toBe("bg-accent-soft");
    expect(COLOR_BG.amber).toBe("bg-amber-soft");
    expect(COLOR_BG.gray).toBe("bg-surface-soft");
  });
});

describe("COLOR_TEXT", () => {
  it("4색 존재 (purple, coral, amber, gray)", () => {
    expect(COLOR_TEXT.purple).toBe("text-purple");
    expect(COLOR_TEXT.coral).toBe("text-accent");
    expect(COLOR_TEXT.amber).toBe("text-amber-deep");
    expect(COLOR_TEXT.gray).toBe("text-ink-soft");
  });
});
