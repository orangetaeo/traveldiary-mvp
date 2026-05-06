/**
 * 자율 모드 reason 화이트리스트 + 타입 가드 테스트.
 *
 * known-reasons.ts — 안전 회로 핵심 상수 + isKnown* 가드.
 */

import { describe, it, expect } from "vitest";
import {
  PAUSED_FLAG_REASONS,
  isKnownPausedFlagReason,
  QUARANTINE_REASONS,
  INPUT_GUARD_REASONS,
  BLOCKED_BY_REASONS,
  isKnownBlockedByReason,
} from "@/lib/autonomy/known-reasons";

/* ════════════════════════════════════════════
 * PAUSED_FLAG_REASONS
 * ════════════════════════════════════════════ */

describe("PAUSED_FLAG_REASONS", () => {
  it("3개 reason 포함", () => {
    expect(PAUSED_FLAG_REASONS).toHaveLength(3);
  });

  it("budget.emergency 포함", () => {
    expect(PAUSED_FLAG_REASONS).toContain("budget.emergency");
  });

  it("manual 포함", () => {
    expect(PAUSED_FLAG_REASONS).toContain("manual");
  });

  it("flag.corrupt 포함", () => {
    expect(PAUSED_FLAG_REASONS).toContain("flag.corrupt");
  });
});

/* ════════════════════════════════════════════
 * isKnownPausedFlagReason
 * ════════════════════════════════════════════ */

describe("isKnownPausedFlagReason", () => {
  it.each(["budget.emergency", "manual", "flag.corrupt"] as const)(
    "%s → true",
    (reason) => {
      expect(isKnownPausedFlagReason(reason)).toBe(true);
    },
  );

  it("unknown string → false", () => {
    expect(isKnownPausedFlagReason("unknown_reason")).toBe(false);
  });

  it("빈 문자열 → false", () => {
    expect(isKnownPausedFlagReason("")).toBe(false);
  });

  it("null → false", () => {
    expect(isKnownPausedFlagReason(null)).toBe(false);
  });

  it("undefined → false", () => {
    expect(isKnownPausedFlagReason(undefined)).toBe(false);
  });

  it("number → false", () => {
    expect(isKnownPausedFlagReason(42)).toBe(false);
  });

  it("object → false", () => {
    expect(isKnownPausedFlagReason({ reason: "manual" })).toBe(false);
  });
});

/* ════════════════════════════════════════════
 * QUARANTINE_REASONS
 * ════════════════════════════════════════════ */

describe("QUARANTINE_REASONS", () => {
  it("3개 reason 포함", () => {
    expect(QUARANTINE_REASONS).toHaveLength(3);
  });

  it.each([
    "flag.parse_failed",
    "flag.unknown_reason",
    "state.parse_failed",
  ] as const)("%s 포함", (reason) => {
    expect(QUARANTINE_REASONS).toContain(reason);
  });
});

/* ════════════════════════════════════════════
 * INPUT_GUARD_REASONS
 * ════════════════════════════════════════════ */

describe("INPUT_GUARD_REASONS", () => {
  it("3개 reason 포함", () => {
    expect(INPUT_GUARD_REASONS).toHaveLength(3);
  });

  it.each([
    "negative_value",
    "non_finite_value",
    "missing_field",
  ] as const)("%s 포함", (reason) => {
    expect(INPUT_GUARD_REASONS).toContain(reason);
  });
});

/* ════════════════════════════════════════════
 * BLOCKED_BY_REASONS
 * ════════════════════════════════════════════ */

describe("BLOCKED_BY_REASONS", () => {
  it("3개 reason 포함", () => {
    expect(BLOCKED_BY_REASONS).toHaveLength(3);
  });

  it.each(["quota", "budget", "emergency"] as const)(
    "%s 포함",
    (reason) => {
      expect(BLOCKED_BY_REASONS).toContain(reason);
    },
  );
});

/* ════════════════════════════════════════════
 * isKnownBlockedByReason
 * ════════════════════════════════════════════ */

describe("isKnownBlockedByReason", () => {
  it.each(["quota", "budget", "emergency"] as const)(
    "%s → true",
    (reason) => {
      expect(isKnownBlockedByReason(reason)).toBe(true);
    },
  );

  it("unknown string → false", () => {
    expect(isKnownBlockedByReason("timeout")).toBe(false);
  });

  it("빈 문자열 → false", () => {
    expect(isKnownBlockedByReason("")).toBe(false);
  });

  it("null → false", () => {
    expect(isKnownBlockedByReason(null)).toBe(false);
  });

  it("undefined → false", () => {
    expect(isKnownBlockedByReason(undefined)).toBe(false);
  });

  it("number → false", () => {
    expect(isKnownBlockedByReason(0)).toBe(false);
  });

  it("배열 → false", () => {
    expect(isKnownBlockedByReason(["quota"])).toBe(false);
  });
});
