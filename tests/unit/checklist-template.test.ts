/**
 * 체크리스트 기본 템플릿 시드 무결성 테스트.
 */

import { describe, it, expect } from "vitest";
import { DEFAULT_CHECKLIST_TEMPLATE } from "@/lib/seed/checklist-template";

const VALID_CATEGORIES = [
  "documents",
  "clothing",
  "electronics",
  "forbidden",
  "declarable",
  "custom",
];

const VALID_BUCKETS = ["D-30", "D-14", "D-7", "D-1", "during", "after"];

describe("DEFAULT_CHECKLIST_TEMPLATE 시드", () => {
  it("22건 존재", () => {
    expect(DEFAULT_CHECKLIST_TEMPLATE).toHaveLength(22);
  });

  it("모든 항목에 필수 필드 존재", () => {
    for (const item of DEFAULT_CHECKLIST_TEMPLATE) {
      expect(item.category).toBeTruthy();
      expect(item.text).toBeTruthy();
      expect(item.dDayBucket).toBeTruthy();
    }
  });

  it("카테고리는 유효값만", () => {
    for (const item of DEFAULT_CHECKLIST_TEMPLATE) {
      expect(VALID_CATEGORIES).toContain(item.category);
    }
  });

  it("dDayBucket은 유효값만", () => {
    for (const item of DEFAULT_CHECKLIST_TEMPLATE) {
      expect(VALID_BUCKETS).toContain(item.dDayBucket);
    }
  });

  it("6개 bucket 모두 존재 (시간순 커버)", () => {
    const buckets = new Set(DEFAULT_CHECKLIST_TEMPLATE.map((t) => t.dDayBucket));
    for (const b of VALID_BUCKETS) {
      expect(buckets).toContain(b);
    }
  });

  it("카테고리 다양성 — 4종 이상", () => {
    const cats = new Set(DEFAULT_CHECKLIST_TEMPLATE.map((t) => t.category));
    expect(cats.size).toBeGreaterThanOrEqual(4);
  });

  it("cityNote는 정의된 경우 비어있지 않음", () => {
    for (const item of DEFAULT_CHECKLIST_TEMPLATE) {
      if (item.cityNote !== undefined) {
        expect(item.cityNote.length).toBeGreaterThan(0);
      }
    }
  });

  it("cityNote 포함 항목 2건 이상 (베트남 특화)", () => {
    const withNote = DEFAULT_CHECKLIST_TEMPLATE.filter((t) => t.cityNote);
    expect(withNote.length).toBeGreaterThanOrEqual(2);
  });

  it("D-30 bucket에 여권·비자 관련 항목 존재", () => {
    const d30 = DEFAULT_CHECKLIST_TEMPLATE.filter((t) => t.dDayBucket === "D-30");
    const hasPassport = d30.some((t) => t.text.includes("여권"));
    expect(hasPassport).toBe(true);
  });
});
