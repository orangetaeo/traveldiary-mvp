/**
 * lib/repositories/shareComment.repository.ts — 순수 함수 단위 테스트.
 *
 * escapeHtml, validateNickname, validateBody, checkRateLimit.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@prisma/client", () => ({ Prisma: {} }));
vi.mock("@/lib/prisma", () => ({ prisma: null }));

import {
  escapeHtml,
  validateNickname,
  validateBody,
  checkRateLimit,
  _resetRateLimit,
} from "@/lib/repositories/shareComment.repository";

// ═══════════════════════════════════════════════════════════════
// escapeHtml
// ═══════════════════════════════════════════════════════════════

describe("escapeHtml", () => {
  it("< → &lt;", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("& → &amp;", () => {
    expect(escapeHtml("A & B")).toBe("A &amp; B");
  });

  it("\" → &quot;", () => {
    expect(escapeHtml('key="value"')).toBe("key=&quot;value&quot;");
  });

  it("' → &#39;", () => {
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  it("복합", () => {
    expect(escapeHtml('<a href="x">&')).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;",
    );
  });

  it("이스케이프 불필요 → 원본 반환", () => {
    expect(escapeHtml("안녕하세요 ABC 123")).toBe("안녕하세요 ABC 123");
  });
});

// ═══════════════════════════════════════════════════════════════
// validateNickname
// ═══════════════════════════════════════════════════════════════

describe("validateNickname", () => {
  it("2~10자 → ok", () => {
    expect(validateNickname("여행자")).toEqual({ ok: true });
    expect(validateNickname("AB")).toEqual({ ok: true });
    expect(validateNickname("1234567890")).toEqual({ ok: true });
  });

  it("1자 → 에러", () => {
    const r = validateNickname("가");
    expect(r.ok).toBe(false);
    expect(r.error).toContain("2자");
  });

  it("11자 → 에러", () => {
    const r = validateNickname("12345678901");
    expect(r.ok).toBe(false);
    expect(r.error).toContain("10자");
  });

  it("공백만 → 에러 (trim 후 0자)", () => {
    expect(validateNickname("   ").ok).toBe(false);
  });

  it("앞뒤 공백 trim 후 판단", () => {
    expect(validateNickname("  여행  ").ok).toBe(true); // trim → "여행" (2자)
  });
});

// ═══════════════════════════════════════════════════════════════
// validateBody
// ═══════════════════════════════════════════════════════════════

describe("validateBody", () => {
  it("1~200자 → ok", () => {
    expect(validateBody("좋아요!")).toEqual({ ok: true });
    expect(validateBody("A".repeat(200))).toEqual({ ok: true });
  });

  it("빈 문자열 → 에러", () => {
    const r = validateBody("");
    expect(r.ok).toBe(false);
    expect(r.error).toContain("입력");
  });

  it("201자 → 에러", () => {
    const r = validateBody("A".repeat(201));
    expect(r.ok).toBe(false);
    expect(r.error).toContain("200자");
  });

  it("공백만 → 에러", () => {
    expect(validateBody("   ").ok).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// checkRateLimit
// ═══════════════════════════════════════════════════════════════

describe("checkRateLimit", () => {
  beforeEach(() => {
    _resetRateLimit();
  });

  it("5회 이내 → true", () => {
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit("client-1")).toBe(true);
    }
  });

  it("6번째 → false", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("client-1");
    expect(checkRateLimit("client-1")).toBe(false);
  });

  it("다른 clientUuid → 독립", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("client-1");
    expect(checkRateLimit("client-2")).toBe(true);
  });

  it("윈도우 만료 후 → 재허용", () => {
    const realDateNow = Date.now;
    let fakeNow = 1000000;
    Date.now = () => fakeNow;

    try {
      for (let i = 0; i < 5; i++) checkRateLimit("client-1");
      expect(checkRateLimit("client-1")).toBe(false);

      // 60초 후
      fakeNow += 60_001;
      expect(checkRateLimit("client-1")).toBe(true);
    } finally {
      Date.now = realDateNow;
    }
  });

  it("_resetRateLimit → 전체 초기화", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("client-1");
    _resetRateLimit();
    expect(checkRateLimit("client-1")).toBe(true);
  });
});
