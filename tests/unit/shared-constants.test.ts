/**
 * 공유 상수 모듈 단위 테스트.
 * lib/constants/ + lib/utils/*-constants.ts 정합성 검증.
 */

import { describe, it, expect } from "vitest";
import {
  OTA_LABEL,
  OTA_COLOR,
  OTA_TONE,
} from "@/lib/constants/ota-constants";
import {
  REACTION_EMOJI,
  REACTION_FULL_LABEL,
} from "@/lib/constants/reaction-constants";
import {
  BUCKET_ORDER,
  BUCKET_LABEL,
  CHECKLIST_CATEGORY_LABEL,
  CATEGORY_ORDER,
  CATEGORY_TONE,
  CATEGORY_ACTIVE_TONE,
} from "@/lib/utils/checklist-constants";
import {
  COST_CATEGORY_LABEL,
  COST_CATEGORY_OPTIONS,
  STATUS_LABEL,
  STATUS_TONE,
} from "@/lib/utils/cost-constants";

// ═══════════════════════════════════════════
// OTA Constants
// ═══════════════════════════════════════════

describe("OTA constants", () => {
  it("OTA_LABEL — 3 provider + unknown", () => {
    expect(OTA_LABEL.klook).toBe("Klook");
    expect(OTA_LABEL.kkday).toBe("KKday");
    expect(OTA_LABEL.agoda).toBe("Agoda");
    expect(OTA_LABEL.unknown).toBe("기타");
  });

  it("OTA_COLOR — 3 provider + unknown", () => {
    expect(Object.keys(OTA_COLOR)).toHaveLength(4);
    expect(OTA_COLOR.klook).toContain("bg-");
  });

  it("OTA_TONE — 3 provider (unknown 제외)", () => {
    expect(Object.keys(OTA_TONE)).toHaveLength(3);
    expect(OTA_TONE.klook).toContain("text-");
  });
});

// ═══════════════════════════════════════════
// Reaction Constants
// ═══════════════════════════════════════════

describe("Reaction constants", () => {
  it("REACTION_EMOJI — 3종 이모지", () => {
    expect(REACTION_EMOJI.LIKE).toBe("👍");
    expect(REACTION_EMOJI.DISLIKE).toBe("👎");
    expect(REACTION_EMOJI.QUESTION).toBe("❓");
  });

  it("REACTION_FULL_LABEL — 이모지 + 텍스트", () => {
    expect(REACTION_FULL_LABEL.LIKE).toContain("👍");
    expect(REACTION_FULL_LABEL.LIKE).toContain("좋아");
    expect(REACTION_FULL_LABEL.DISLIKE).toContain("별로");
    expect(REACTION_FULL_LABEL.QUESTION).toContain("질문");
  });

  it("EMOJI와 FULL_LABEL 키 일치", () => {
    expect(Object.keys(REACTION_EMOJI).sort()).toEqual(
      Object.keys(REACTION_FULL_LABEL).sort(),
    );
  });
});

// ═══════════════════════════════════════════
// Checklist Constants
// ═══════════════════════════════════════════

describe("Checklist constants", () => {
  it("BUCKET_ORDER — 6 버킷", () => {
    expect(BUCKET_ORDER).toHaveLength(6);
    expect(BUCKET_ORDER[0]).toBe("D-30");
    expect(BUCKET_ORDER[5]).toBe("after");
  });

  it("BUCKET_LABEL — BUCKET_ORDER 키와 일치", () => {
    for (const bucket of BUCKET_ORDER) {
      expect(BUCKET_LABEL[bucket]).toBeDefined();
    }
  });

  it("CHECKLIST_CATEGORY_LABEL — 6종", () => {
    expect(Object.keys(CHECKLIST_CATEGORY_LABEL).length).toBeGreaterThanOrEqual(5);
    expect(CHECKLIST_CATEGORY_LABEL.documents).toBe("서류");
  });

  it("CATEGORY_ORDER, TONE, ACTIVE_TONE 키 동일", () => {
    const orderSet = new Set(CATEGORY_ORDER);
    for (const key of Object.keys(CATEGORY_TONE)) {
      expect(orderSet.has(key as (typeof CATEGORY_ORDER)[number])).toBe(true);
    }
    for (const key of Object.keys(CATEGORY_ACTIVE_TONE)) {
      expect(orderSet.has(key as (typeof CATEGORY_ORDER)[number])).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════
// Cost Constants
// ═══════════════════════════════════════════

describe("Cost constants", () => {
  it("COST_CATEGORY_LABEL — 5종 이상", () => {
    expect(Object.keys(COST_CATEGORY_LABEL).length).toBeGreaterThanOrEqual(5);
    expect(COST_CATEGORY_LABEL.food).toBe("식비");
  });

  it("COST_CATEGORY_OPTIONS — id/label 구조", () => {
    expect(COST_CATEGORY_OPTIONS.length).toBeGreaterThanOrEqual(5);
    for (const opt of COST_CATEGORY_OPTIONS) {
      expect(opt.id).toBeDefined();
      expect(opt.label).toBeDefined();
      // label은 COST_CATEGORY_LABEL과 일치
      expect(COST_CATEGORY_LABEL[opt.id]).toBe(opt.label);
    }
  });

  it("STATUS_LABEL — paid/booked/planned", () => {
    expect(STATUS_LABEL.paid).toBeDefined();
    expect(STATUS_LABEL.booked).toBeDefined();
    expect(STATUS_LABEL.planned).toBeDefined();
  });

  it("STATUS_TONE — STATUS_LABEL 키와 일치", () => {
    expect(Object.keys(STATUS_TONE).sort()).toEqual(
      Object.keys(STATUS_LABEL).sort(),
    );
  });
});
