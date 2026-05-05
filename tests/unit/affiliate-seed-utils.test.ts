/**
 * Affiliate URL + Seed 유틸 테스트 — Batch 9.
 *
 * 3 모듈:
 *  - lib/utils/affiliate.ts: buildAffiliateUrl (OTA별 파라미터 부착)
 *  - lib/seed/checklist-template.ts: DEFAULT_CHECKLIST_TEMPLATE 데이터 무결성
 *  - lib/seed/demo-date.ts: demoStartDate, todayISO 순수 함수
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/* ────────── affiliate ────────── */

vi.mock("server-only", () => ({}));

describe("utils — buildAffiliateUrl", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("klook — aid 파라미터 부착", async () => {
    process.env.KLOOK_AFFILIATE_ID = "klk-123";
    const { buildAffiliateUrl } = await import("@/lib/utils/affiliate");
    const result = buildAffiliateUrl("klook", "https://klook.com/activity/1234");
    expect(result.tracked).toBe(true);
    expect(result.url).toContain("aid=klk-123");
  });

  it("kkday — cid 파라미터 부착", async () => {
    process.env.KKDAY_AFFILIATE_ID = "kkd-456";
    const { buildAffiliateUrl } = await import("@/lib/utils/affiliate");
    const result = buildAffiliateUrl("kkday", "https://kkday.com/product/7890");
    expect(result.tracked).toBe(true);
    expect(result.url).toContain("cid=kkd-456");
  });

  it("agoda — cid 파라미터 부착", async () => {
    process.env.AGODA_AFFILIATE_ID = "agd-789";
    const { buildAffiliateUrl } = await import("@/lib/utils/affiliate");
    const result = buildAffiliateUrl("agoda", "https://agoda.com/hotel/test");
    expect(result.tracked).toBe(true);
    expect(result.url).toContain("cid=agd-789");
  });

  it("env 미설정 → tracked false, 원본 URL 반환", async () => {
    delete process.env.KLOOK_AFFILIATE_ID;
    const { buildAffiliateUrl } = await import("@/lib/utils/affiliate");
    const original = "https://klook.com/activity/9999";
    const result = buildAffiliateUrl("klook", original);
    expect(result.tracked).toBe(false);
    expect(result.url).toBe(original);
  });

  it("잘못된 URL → tracked false, 원본 반환", async () => {
    process.env.KLOOK_AFFILIATE_ID = "test";
    const { buildAffiliateUrl } = await import("@/lib/utils/affiliate");
    const result = buildAffiliateUrl("klook", "not-a-url");
    expect(result.tracked).toBe(false);
    expect(result.url).toBe("not-a-url");
  });

  it("기존 쿼리 파라미터 보존", async () => {
    process.env.KLOOK_AFFILIATE_ID = "my-id";
    const { buildAffiliateUrl } = await import("@/lib/utils/affiliate");
    const result = buildAffiliateUrl("klook", "https://klook.com/act?lang=ko&cur=KRW");
    expect(result.url).toContain("lang=ko");
    expect(result.url).toContain("cur=KRW");
    expect(result.url).toContain("aid=my-id");
  });
});

/* ────────── checklist-template ────────── */

describe("seed — checklist-template 무결성", () => {
  it("20개 이상 항목 (6 bucket)", async () => {
    const { DEFAULT_CHECKLIST_TEMPLATE } = await import("@/lib/seed/checklist-template");
    expect(DEFAULT_CHECKLIST_TEMPLATE.length).toBeGreaterThanOrEqual(20);
  });

  it("모든 항목에 필수 필드 존재", async () => {
    const { DEFAULT_CHECKLIST_TEMPLATE } = await import("@/lib/seed/checklist-template");
    for (const item of DEFAULT_CHECKLIST_TEMPLATE) {
      expect(item.category).toBeTruthy();
      expect(item.text).toBeTruthy();
      expect(item.dDayBucket).toBeTruthy();
    }
  });

  it("dDayBucket 6종만 사용", async () => {
    const { DEFAULT_CHECKLIST_TEMPLATE } = await import("@/lib/seed/checklist-template");
    const validBuckets = new Set(["D-30", "D-14", "D-7", "D-1", "during", "after"]);
    const usedBuckets = new Set(DEFAULT_CHECKLIST_TEMPLATE.map((t) => t.dDayBucket));
    for (const b of usedBuckets) {
      expect(validBuckets.has(b)).toBe(true);
    }
    // 6종 모두 사용
    expect(usedBuckets.size).toBe(6);
  });

  it("category 유효값만 사용", async () => {
    const { DEFAULT_CHECKLIST_TEMPLATE } = await import("@/lib/seed/checklist-template");
    const validCategories = new Set([
      "documents", "clothing", "electronics", "forbidden", "declarable", "custom",
    ]);
    for (const item of DEFAULT_CHECKLIST_TEMPLATE) {
      expect(validCategories.has(item.category)).toBe(true);
    }
  });

  it("텍스트 중복 없음", async () => {
    const { DEFAULT_CHECKLIST_TEMPLATE } = await import("@/lib/seed/checklist-template");
    const texts = DEFAULT_CHECKLIST_TEMPLATE.map((t) => t.text);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it("D-30 bucket에 여권 확인 포함", async () => {
    const { DEFAULT_CHECKLIST_TEMPLATE } = await import("@/lib/seed/checklist-template");
    const d30 = DEFAULT_CHECKLIST_TEMPLATE.filter((t) => t.dDayBucket === "D-30");
    const hasPassport = d30.some((t) => t.text.includes("여권"));
    expect(hasPassport).toBe(true);
  });

  it("cityNote 있는 항목 — 빈 문자열 아닌 의미있는 텍스트", async () => {
    const { DEFAULT_CHECKLIST_TEMPLATE } = await import("@/lib/seed/checklist-template");
    const withNote = DEFAULT_CHECKLIST_TEMPLATE.filter((t) => t.cityNote);
    expect(withNote.length).toBeGreaterThanOrEqual(3);
    for (const item of withNote) {
      expect(item.cityNote!.length).toBeGreaterThan(5);
    }
  });
});

/* ────────── demo-date ────────── */

describe("seed — demo-date", () => {
  it("demoStartDate(0) → 오늘 날짜 (YYYY-MM-DD)", async () => {
    const { demoStartDate } = await import("@/lib/seed/demo-date");
    const today = new Date().toISOString().slice(0, 10);
    expect(demoStartDate(0)).toBe(today);
  });

  it("demoStartDate(7) → 7일 후", async () => {
    const { demoStartDate } = await import("@/lib/seed/demo-date");
    const expected = new Date();
    expected.setDate(expected.getDate() + 7);
    expect(demoStartDate(7)).toBe(expected.toISOString().slice(0, 10));
  });

  it("demoStartDate(-3) → 3일 전", async () => {
    const { demoStartDate } = await import("@/lib/seed/demo-date");
    const expected = new Date();
    expected.setDate(expected.getDate() - 3);
    expect(demoStartDate(-3)).toBe(expected.toISOString().slice(0, 10));
  });

  it("todayISO() → YYYY-MM-DD 형식", async () => {
    const { todayISO } = await import("@/lib/seed/demo-date");
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("todayISO() = demoStartDate(0)", async () => {
    const { todayISO, demoStartDate } = await import("@/lib/seed/demo-date");
    expect(todayISO()).toBe(demoStartDate(0));
  });

  it("demoStartDate 결과는 항상 10자 (ISO date)", async () => {
    const { demoStartDate } = await import("@/lib/seed/demo-date");
    expect(demoStartDate(100).length).toBe(10);
    expect(demoStartDate(-100).length).toBe(10);
  });
});
