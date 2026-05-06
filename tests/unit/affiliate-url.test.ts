/**
 * lib/utils/affiliate.ts 단위 테스트.
 *
 * buildAffiliateUrl: OTA provider별 어필리에이트 파라미터 삽입 순수 함수.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

import { buildAffiliateUrl } from "@/lib/utils/affiliate";

describe("buildAffiliateUrl", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.KLOOK_AFFILIATE_ID;
    delete process.env.KKDAY_AFFILIATE_ID;
    delete process.env.AGODA_AFFILIATE_ID;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // ─── env 미설정 → tracked=false ───────────────────────────

  it("klook — env 미설정 → 원본 URL + tracked=false", () => {
    const result = buildAffiliateUrl("klook", "https://klook.com/activity/123");
    expect(result.tracked).toBe(false);
    expect(result.url).toBe("https://klook.com/activity/123");
  });

  it("kkday — env 미설정 → 원본 URL + tracked=false", () => {
    const result = buildAffiliateUrl("kkday", "https://kkday.com/product/456");
    expect(result.tracked).toBe(false);
    expect(result.url).toBe("https://kkday.com/product/456");
  });

  it("agoda — env 미설정 → 원본 URL + tracked=false", () => {
    const result = buildAffiliateUrl("agoda", "https://agoda.com/hotel/789");
    expect(result.tracked).toBe(false);
    expect(result.url).toBe("https://agoda.com/hotel/789");
  });

  // ─── env 설정 → tracked=true ──────────────────────────────

  it("klook — env 설정 → ?aid= 추가 + tracked=true", () => {
    process.env.KLOOK_AFFILIATE_ID = "klk123";
    const result = buildAffiliateUrl("klook", "https://klook.com/activity/123");
    expect(result.tracked).toBe(true);
    const u = new URL(result.url);
    expect(u.searchParams.get("aid")).toBe("klk123");
  });

  it("kkday — env 설정 → ?cid= 추가 + tracked=true", () => {
    process.env.KKDAY_AFFILIATE_ID = "kkd456";
    const result = buildAffiliateUrl("kkday", "https://kkday.com/product/456");
    expect(result.tracked).toBe(true);
    const u = new URL(result.url);
    expect(u.searchParams.get("cid")).toBe("kkd456");
  });

  it("agoda — env 설정 → ?cid= 추가 + tracked=true", () => {
    process.env.AGODA_AFFILIATE_ID = "agd789";
    const result = buildAffiliateUrl("agoda", "https://agoda.com/hotel/789");
    expect(result.tracked).toBe(true);
    const u = new URL(result.url);
    expect(u.searchParams.get("cid")).toBe("agd789");
  });

  // ─── 기존 쿼리 파라미터 보존 ──────────────────────────────

  it("기존 쿼리 파라미터 보존", () => {
    process.env.KLOOK_AFFILIATE_ID = "klk123";
    const result = buildAffiliateUrl(
      "klook",
      "https://klook.com/activity/123?lang=ko&currency=KRW",
    );
    expect(result.tracked).toBe(true);
    const u = new URL(result.url);
    expect(u.searchParams.get("lang")).toBe("ko");
    expect(u.searchParams.get("currency")).toBe("KRW");
    expect(u.searchParams.get("aid")).toBe("klk123");
  });

  // ─── 잘못된 URL → tracked=false ────────────────────────────

  it("잘못된 URL → tracked=false + 원본 반환", () => {
    process.env.KLOOK_AFFILIATE_ID = "klk123";
    const result = buildAffiliateUrl("klook", "not-a-valid-url");
    expect(result.tracked).toBe(false);
    expect(result.url).toBe("not-a-valid-url");
  });

  // ─── 빈 env 문자열 → null 취급 ─────────────────────────────

  it("빈 문자열 env → tracked=false", () => {
    process.env.KLOOK_AFFILIATE_ID = "";
    const result = buildAffiliateUrl("klook", "https://klook.com/activity/123");
    expect(result.tracked).toBe(false);
  });
});
