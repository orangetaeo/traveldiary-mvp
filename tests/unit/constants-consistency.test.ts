/**
 * 상수 ↔ 타입 일관성 검증.
 *
 * UI 상수(label, tone, order)의 키가 lib/types.ts의 union type과 일치하는지 확인.
 * 새 카테고리 추가 시 상수 누락을 자동 감지.
 */

import { describe, it, expect } from "vitest";
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
import {
  OTA_LABEL,
  OTA_COLOR,
  OTA_TONE,
} from "@/lib/constants/ota-constants";
import {
  REACTION_EMOJI,
  REACTION_FULL_LABEL,
} from "@/lib/constants/reaction-constants";
import type {
  ChecklistCategory,
  DDayBucket,
  CostStatus,
  CostCategory,
} from "@/lib/types";

/* ════════════════════════════════════════════
 * 체크리스트 상수
 * ════════════════════════════════════════════ */

const ALL_BUCKETS: DDayBucket[] = ["D-30", "D-14", "D-7", "D-1", "during", "after"];
const ALL_CHECKLIST_CATEGORIES: ChecklistCategory[] = [
  "documents", "clothing", "electronics", "forbidden", "declarable", "custom",
];

describe("checklist constants — DDayBucket 일관성", () => {
  it("BUCKET_ORDER가 모든 DDayBucket 포함", () => {
    expect(BUCKET_ORDER).toEqual(ALL_BUCKETS);
  });

  it("BUCKET_LABEL 키가 DDayBucket 전체와 일치", () => {
    expect(Object.keys(BUCKET_LABEL).sort()).toEqual([...ALL_BUCKETS].sort());
  });

  it("BUCKET_LABEL 값이 비어있지 않음", () => {
    for (const [key, label] of Object.entries(BUCKET_LABEL)) {
      expect(label.length, `${key}의 label이 비어있음`).toBeGreaterThan(0);
    }
  });
});

describe("checklist constants — ChecklistCategory 일관성", () => {
  it("CATEGORY_ORDER가 모든 ChecklistCategory 포함", () => {
    expect(CATEGORY_ORDER).toEqual(ALL_CHECKLIST_CATEGORIES);
  });

  it("CHECKLIST_CATEGORY_LABEL 키가 ChecklistCategory 전체와 일치", () => {
    expect(Object.keys(CHECKLIST_CATEGORY_LABEL).sort()).toEqual(
      [...ALL_CHECKLIST_CATEGORIES].sort(),
    );
  });

  it("CATEGORY_TONE 키가 ChecklistCategory 전체와 일치", () => {
    expect(Object.keys(CATEGORY_TONE).sort()).toEqual(
      [...ALL_CHECKLIST_CATEGORIES].sort(),
    );
  });

  it("CATEGORY_ACTIVE_TONE 키가 ChecklistCategory 전체와 일치", () => {
    expect(Object.keys(CATEGORY_ACTIVE_TONE).sort()).toEqual(
      [...ALL_CHECKLIST_CATEGORIES].sort(),
    );
  });

  it("CATEGORY_TONE 값이 Tailwind 클래스 형식", () => {
    for (const [key, tone] of Object.entries(CATEGORY_TONE)) {
      expect(tone, `${key}의 tone이 비어있음`).toBeTruthy();
      expect(tone, `${key}의 tone에 bg- 클래스 없음`).toContain("bg-");
      expect(tone, `${key}의 tone에 text- 클래스 없음`).toContain("text-");
    }
  });

  it("label과 tone 키셋이 동일", () => {
    expect(Object.keys(CHECKLIST_CATEGORY_LABEL).sort()).toEqual(
      Object.keys(CATEGORY_TONE).sort(),
    );
  });
});

/* ════════════════════════════════════════════
 * 비용 상수
 * ════════════════════════════════════════════ */

const ALL_COST_CATEGORIES: CostCategory[] = [
  "food", "transport", "accommodation", "shopping", "activity", "other",
];
const ALL_COST_STATUSES: CostStatus[] = ["paid", "booked", "planned"];

describe("cost constants — CostCategory 일관성", () => {
  it("COST_CATEGORY_LABEL 키가 CostCategory 전체 포함", () => {
    expect(Object.keys(COST_CATEGORY_LABEL).sort()).toEqual(
      [...ALL_COST_CATEGORIES].sort(),
    );
  });

  it("COST_CATEGORY_OPTIONS ID가 CostCategory 전체와 일치", () => {
    const optionIds = COST_CATEGORY_OPTIONS.map((o) => o.id).sort();
    expect(optionIds).toEqual([...ALL_COST_CATEGORIES].sort());
  });

  it("COST_CATEGORY_OPTIONS label이 COST_CATEGORY_LABEL과 일치", () => {
    for (const opt of COST_CATEGORY_OPTIONS) {
      expect(COST_CATEGORY_LABEL[opt.id]).toBe(opt.label);
    }
  });
});

describe("cost constants — CostStatus 일관성", () => {
  it("STATUS_LABEL 키가 CostStatus 전체와 일치", () => {
    expect(Object.keys(STATUS_LABEL).sort()).toEqual(
      [...ALL_COST_STATUSES].sort(),
    );
  });

  it("STATUS_TONE 키가 CostStatus 전체와 일치", () => {
    expect(Object.keys(STATUS_TONE).sort()).toEqual(
      [...ALL_COST_STATUSES].sort(),
    );
  });

  it("STATUS_TONE 값이 Tailwind 클래스 형식", () => {
    for (const [key, tone] of Object.entries(STATUS_TONE)) {
      expect(tone, `${key}의 tone에 bg- 클래스 없음`).toContain("bg-");
      expect(tone, `${key}의 tone에 text- 클래스 없음`).toContain("text-");
    }
  });
});

/* ════════════════════════════════════════════
 * OTA 상수
 * ════════════════════════════════════════════ */

describe("OTA constants 일관성", () => {
  const KNOWN_OTAS = ["klook", "kkday", "agoda"];

  it("OTA_LABEL에 알려진 3 OTA 포함", () => {
    for (const ota of KNOWN_OTAS) {
      expect(ota in OTA_LABEL, `${ota} missing in OTA_LABEL`).toBe(true);
    }
  });

  it("OTA_COLOR에 알려진 3 OTA 포함", () => {
    for (const ota of KNOWN_OTAS) {
      expect(ota in OTA_COLOR, `${ota} missing in OTA_COLOR`).toBe(true);
    }
  });

  it("OTA_TONE에 알려진 3 OTA 포함", () => {
    for (const ota of KNOWN_OTAS) {
      expect(ota in OTA_TONE, `${ota} missing in OTA_TONE`).toBe(true);
    }
  });

  it("OTA_LABEL 값이 비어있지 않음", () => {
    for (const [key, label] of Object.entries(OTA_LABEL)) {
      expect(label.length, `${key}의 label이 비어있음`).toBeGreaterThan(0);
    }
  });
});

/* ════════════════════════════════════════════
 * 리액션 상수
 * ════════════════════════════════════════════ */

describe("reaction constants 일관성", () => {
  const KNOWN_REACTIONS = ["LIKE", "DISLIKE", "QUESTION"];

  it("REACTION_EMOJI에 알려진 리액션 포함", () => {
    for (const r of KNOWN_REACTIONS) {
      expect(r in REACTION_EMOJI, `${r} missing in REACTION_EMOJI`).toBe(true);
    }
  });

  it("REACTION_FULL_LABEL에 알려진 리액션 포함", () => {
    for (const r of KNOWN_REACTIONS) {
      expect(r in REACTION_FULL_LABEL, `${r} missing in REACTION_FULL_LABEL`).toBe(true);
    }
  });

  it("REACTION_EMOJI와 REACTION_FULL_LABEL 키셋 동일", () => {
    expect(Object.keys(REACTION_EMOJI).sort()).toEqual(
      Object.keys(REACTION_FULL_LABEL).sort(),
    );
  });

  it("REACTION_FULL_LABEL에 이모지 포함 (REACTION_EMOJI 값)", () => {
    for (const [key, emoji] of Object.entries(REACTION_EMOJI)) {
      const fullLabel = REACTION_FULL_LABEL[key];
      expect(fullLabel, `${key}의 full label에 이모지 없음`).toContain(emoji);
    }
  });
});
