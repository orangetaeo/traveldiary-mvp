/**
 * Actor Resolution + Loss Guides + Known Reasons 테스트 — Batch 10.
 *
 * 3 모듈:
 *  - lib/auth/actor-resolution.ts: resolveActorIdForTrip (DEMO trip 오염 차단)
 *  - lib/constants/koreanLossContacts.ts: KOREAN_LOSS_GUIDES 데이터 무결성 + getLossGuide
 *  - lib/autonomy/known-reasons.ts: 상수 화이트리스트 + isKnown* 가드 함수
 */

import { describe, it, expect } from "vitest";
import { resolveActorIdForTrip } from "@/lib/auth/actor-resolution";
import { DEMO_TRIP_IDS } from "@/lib/seed";
import {
  KOREAN_LOSS_GUIDES,
  getLossGuide,
  type LossCategory,
} from "@/lib/constants/koreanLossContacts";
import {
  PAUSED_FLAG_REASONS,
  QUARANTINE_REASONS,
  INPUT_GUARD_REASONS,
  BLOCKED_BY_REASONS,
  isKnownPausedFlagReason,
  isKnownBlockedByReason,
} from "@/lib/autonomy/known-reasons";

/* ────────── actor-resolution ────────── */

describe("auth — resolveActorIdForTrip", () => {
  it("일반 trip + actorId → actorId 반환", () => {
    expect(resolveActorIdForTrip("trip-abc", "user-1")).toBe("user-1");
  });

  it("일반 trip + null → null 반환", () => {
    expect(resolveActorIdForTrip("trip-xyz", null)).toBeNull();
  });

  it("DEMO trip + actorId → null 강제 (오염 차단)", () => {
    expect(DEMO_TRIP_IDS.length).toBeGreaterThan(0);
    const demoTripId = DEMO_TRIP_IDS[0];
    expect(resolveActorIdForTrip(demoTripId, "user-123")).toBeNull();
  });

  it("DEMO trip + null → null", () => {
    expect(resolveActorIdForTrip(DEMO_TRIP_IDS[0], null)).toBeNull();
  });
});

/* ────────── koreanLossContacts ────────── */

describe("constants — KOREAN_LOSS_GUIDES", () => {
  const categories: LossCategory[] = ["passport", "card", "phone", "theft"];

  it("4 카테고리 가이드 존재", () => {
    expect(KOREAN_LOSS_GUIDES.length).toBe(4);
  });

  it.each(categories)("%s — 필수 필드 존재", (cat) => {
    const guide = getLossGuide(cat);
    expect(guide).toBeDefined();
    expect(guide!.title).toBeTruthy();
    expect(guide!.emoji).toBeTruthy();
    expect(guide!.steps.length).toBeGreaterThanOrEqual(3);
    expect(guide!.contacts.length).toBeGreaterThanOrEqual(1);
  });

  it("passport — 영사 콜센터 0404 포함", () => {
    const guide = getLossGuide("passport")!;
    const consul = guide.contacts.find((c) => c.phone?.includes("0404"));
    expect(consul).toBeDefined();
  });

  it("card — 분실 통합 전화번호 포함", () => {
    const guide = getLossGuide("card")!;
    const hasPhone = guide.contacts.some((c) => c.phone);
    expect(hasPhone).toBe(true);
  });

  it("각 가이드 steps — 순번 1~N 시작", () => {
    for (const guide of KOREAN_LOSS_GUIDES) {
      for (let i = 0; i < guide.steps.length; i++) {
        expect(guide.steps[i]).toMatch(new RegExp(`^${i + 1}\\.`));
      }
    }
  });

  it("preparation 권장 — passport/card/phone/theft 모두 존재", () => {
    for (const guide of KOREAN_LOSS_GUIDES) {
      expect(guide.preparation).toBeTruthy();
      expect(guide.preparation!.includes("출국 전")).toBe(true);
    }
  });

  it("getLossGuide — 존재하지 않는 카테고리 → undefined", () => {
    expect(getLossGuide("nonexistent" as LossCategory)).toBeUndefined();
  });
});

/* ────────── known-reasons ────────── */

describe("autonomy — known-reasons", () => {
  describe("PAUSED_FLAG_REASONS", () => {
    it("3건 존재 (budget.emergency, manual, flag.corrupt)", () => {
      expect(PAUSED_FLAG_REASONS.length).toBe(3);
      expect(PAUSED_FLAG_REASONS).toContain("budget.emergency");
      expect(PAUSED_FLAG_REASONS).toContain("manual");
      expect(PAUSED_FLAG_REASONS).toContain("flag.corrupt");
    });

    it("isKnownPausedFlagReason — 유효 값 true", () => {
      expect(isKnownPausedFlagReason("budget.emergency")).toBe(true);
      expect(isKnownPausedFlagReason("manual")).toBe(true);
    });

    it("isKnownPausedFlagReason — 무효 값 false", () => {
      expect(isKnownPausedFlagReason("unknown")).toBe(false);
      expect(isKnownPausedFlagReason(123)).toBe(false);
      expect(isKnownPausedFlagReason(null)).toBe(false);
      expect(isKnownPausedFlagReason(undefined)).toBe(false);
    });
  });

  describe("QUARANTINE_REASONS", () => {
    it("3건 존재", () => {
      expect(QUARANTINE_REASONS.length).toBe(3);
      expect(QUARANTINE_REASONS).toContain("flag.parse_failed");
      expect(QUARANTINE_REASONS).toContain("flag.unknown_reason");
      expect(QUARANTINE_REASONS).toContain("state.parse_failed");
    });
  });

  describe("INPUT_GUARD_REASONS", () => {
    it("3건 존재", () => {
      expect(INPUT_GUARD_REASONS.length).toBe(3);
      expect(INPUT_GUARD_REASONS).toContain("negative_value");
      expect(INPUT_GUARD_REASONS).toContain("non_finite_value");
      expect(INPUT_GUARD_REASONS).toContain("missing_field");
    });
  });

  describe("BLOCKED_BY_REASONS", () => {
    it("3건 존재 (quota, budget, emergency)", () => {
      expect(BLOCKED_BY_REASONS.length).toBe(3);
      expect(BLOCKED_BY_REASONS).toContain("quota");
      expect(BLOCKED_BY_REASONS).toContain("budget");
      expect(BLOCKED_BY_REASONS).toContain("emergency");
    });

    it("isKnownBlockedByReason — 유효 값 true", () => {
      expect(isKnownBlockedByReason("quota")).toBe(true);
      expect(isKnownBlockedByReason("budget")).toBe(true);
      expect(isKnownBlockedByReason("emergency")).toBe(true);
    });

    it("isKnownBlockedByReason — 무효 값 false", () => {
      expect(isKnownBlockedByReason("rate_limit")).toBe(false);
      expect(isKnownBlockedByReason("")).toBe(false);
      expect(isKnownBlockedByReason(42)).toBe(false);
    });
  });
});
