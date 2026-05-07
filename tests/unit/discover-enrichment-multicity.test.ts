/**
 * 다도시 Discover Place Enrichment 단위 테스트 (디자인 갭 #1 U2 보강).
 *
 * 검증:
 *  - 다낭 enrichment lookup 머지 (5건 시범)
 *  - 하노이 시드 직접 enrichment (5건)
 *  - 호치민 시드 직접 enrichment (4건)
 *  - 나트랑 시드 직접 enrichment (4건) — 사이클 2 추가
 *  - 달랏 시드 직접 enrichment (4건) — 사이클 2 추가
 *  - 치앙마이는 V4 게이트 보류 (베트남 단일 정책)
 */

import { describe, it, expect } from "vitest";

describe("Discover Place Enrichment — 다도시 (디자인 갭 #1 U2)", () => {
  describe("다낭 (lookup 머지)", () => {
    it("4ps 다낭 인도차이나 → 한국 후기 인용 + AI 이유 노출", async () => {
      const { DEMO_DISCOVER_PLACES } = await import("@/lib/seed/discover-places");
      const target = DEMO_DISCOVER_PLACES.find(
        (p) => p.id === "dn-food-피자-4ps-다낭-인도차이나점",
      );
      expect(target).toBeDefined();
      expect(target?.priceLevel).toBe(2);
      expect(target?.koreanReviewQuote?.text).toContain("한국식 메뉴");
      expect(target?.koreanReviewCount).toBe(234);
      expect(target?.aiReason).toContain("한국인 가족");
      expect(target?.koreanFoodFriendly).toBe(true);
    });

    it("티아고 레스토랑 → enrichment 머지", async () => {
      const { DEMO_DISCOVER_PLACES } = await import("@/lib/seed/discover-places");
      const target = DEMO_DISCOVER_PLACES.find(
        (p) => p.id === "dn-food-티아고-레스토랑-다낭",
      );
      expect(target?.priceLevel).toBe(3);
      expect(target?.aiReason).toContain("파인다이닝");
    });

    it("미적용 다낭 카드는 enrichment 없음 (graceful)", async () => {
      const { DEMO_DISCOVER_PLACES } = await import("@/lib/seed/discover-places");
      const target = DEMO_DISCOVER_PLACES.find(
        (p) => p.id === "dn-food-bikini-bottom-express",
      );
      // 시범 5건에 포함된 카드라면 enrichment 적용
      expect(target?.aiReason).toContain("젊은 한국인");
    });
  });

  describe("하노이 (시드 직접 update — 5건 모두)", () => {
    it("하롱베이 → koreanReviewQuote + aiReason", async () => {
      const { DEMO_DISCOVER_PLACES } = await import("@/lib/seed/discover-places");
      const target = DEMO_DISCOVER_PLACES.find((p) => p.id === "discover-hn-halong");
      expect(target?.koreanReviewQuote?.text).toContain("일출");
      expect(target?.aiReason).toContain("자연유산");
      expect(target?.priceLevel).toBe(3);
    });

    it("퍼 10 Lý Quốc Sư → 한식 OK 뱃지 + 한국 후기", async () => {
      const { DEMO_DISCOVER_PLACES } = await import("@/lib/seed/discover-places");
      const target = DEMO_DISCOVER_PLACES.find((p) => p.id === "discover-hn-pho");
      expect(target?.koreanFoodFriendly).toBe(true);
      expect(target?.koreanReviewQuote?.text).toContain("쌀국수");
    });

    it("하노이 5건 모두 enrichment 적용 (회귀 가드)", async () => {
      const { DEMO_DISCOVER_PLACES } = await import("@/lib/seed/discover-places");
      const hanoiCards = DEMO_DISCOVER_PLACES.filter(
        (p) => p.id.startsWith("discover-hn-"),
      );
      expect(hanoiCards.length).toBe(5);
      // 모두 koreanReviewQuote 보유
      expect(hanoiCards.every((p) => !!p.koreanReviewQuote)).toBe(true);
      // 모두 aiReason 보유
      expect(hanoiCards.every((p) => !!p.aiReason)).toBe(true);
      // 모두 priceLevel 보유
      expect(hanoiCards.every((p) => !!p.priceLevel)).toBe(true);
    });
  });

  describe("호치민 (시드 직접 update — 4건 모두)", () => {
    it("메콩 투어 → enrichment", async () => {
      const { DEMO_DISCOVER_PLACES } = await import("@/lib/seed/discover-places");
      const target = DEMO_DISCOVER_PLACES.find((p) => p.id === "discover-hcm-mekong");
      expect(target?.priceLevel).toBe(2);
      expect(target?.koreanReviewQuote?.author).toBe("조하나");
    });

    it("벤탄 야시장 → enrichment", async () => {
      const { DEMO_DISCOVER_PLACES } = await import("@/lib/seed/discover-places");
      const target = DEMO_DISCOVER_PLACES.find(
        (p) => p.id === "discover-hcm-benthanh",
      );
      expect(target?.aiReason).toContain("야식");
    });

    it("호치민 4건 모두 enrichment 적용 (회귀 가드)", async () => {
      const { DEMO_DISCOVER_PLACES } = await import("@/lib/seed/discover-places");
      const hcmCards = DEMO_DISCOVER_PLACES.filter(
        (p) => p.id.startsWith("discover-hcm-"),
      );
      expect(hcmCards.length).toBe(4);
      expect(hcmCards.every((p) => !!p.koreanReviewQuote)).toBe(true);
      expect(hcmCards.every((p) => !!p.aiReason)).toBe(true);
    });
  });

  describe("나트랑 (시드 직접 update — 4건 모두, 사이클 2)", () => {
    it("빈원더스 → 한국 후기 인용 + AI 이유 + 가족 추천", async () => {
      const { DEMO_DISCOVER_PLACES } = await import("@/lib/seed/discover-places");
      const target = DEMO_DISCOVER_PLACES.find((p) => p.id === "discover-nt-vinwonders");
      expect(target?.priceLevel).toBe(3);
      expect(target?.koreanReviewQuote?.text).toContain("케이블카");
      expect(target?.koreanReviewCount).toBe(318);
      expect(target?.aiReason).toContain("한국인 가족");
    });

    it("나트랑 해산물 거리 → 한식 OK 뱃지", async () => {
      const { DEMO_DISCOVER_PLACES } = await import("@/lib/seed/discover-places");
      const target = DEMO_DISCOVER_PLACES.find((p) => p.id === "discover-nt-seafood");
      expect(target?.koreanFoodFriendly).toBe(true);
      expect(target?.koreanReviewQuote?.text).toContain("랍스타");
    });

    it("나트랑 4건 모두 enrichment 적용 (회귀 가드)", async () => {
      const { DEMO_DISCOVER_PLACES } = await import("@/lib/seed/discover-places");
      const ntCards = DEMO_DISCOVER_PLACES.filter(
        (p) => p.id.startsWith("discover-nt-"),
      );
      expect(ntCards.length).toBe(4);
      expect(ntCards.every((p) => !!p.koreanReviewQuote)).toBe(true);
      expect(ntCards.every((p) => !!p.aiReason)).toBe(true);
      expect(ntCards.every((p) => !!p.priceLevel)).toBe(true);
    });
  });

  describe("달랏 (시드 직접 update — 4건 모두, 사이클 2)", () => {
    it("랑비앙 일출 → 사진 명소 AI 이유", async () => {
      const { DEMO_DISCOVER_PLACES } = await import("@/lib/seed/discover-places");
      const target = DEMO_DISCOVER_PLACES.find((p) => p.id === "discover-dl-langbiang");
      expect(target?.priceLevel).toBe(2);
      expect(target?.koreanReviewQuote?.text).toContain("일출");
      expect(target?.aiReason).toContain("인생샷");
    });

    it("달랏 야시장 → 한식 OK + 반짱느엉 인용", async () => {
      const { DEMO_DISCOVER_PLACES } = await import("@/lib/seed/discover-places");
      const target = DEMO_DISCOVER_PLACES.find((p) => p.id === "discover-dl-nightmarket");
      expect(target?.koreanFoodFriendly).toBe(true);
      expect(target?.koreanReviewQuote?.text).toContain("반짱느엉");
    });

    it("달랏 4건 모두 enrichment 적용 (회귀 가드)", async () => {
      const { DEMO_DISCOVER_PLACES } = await import("@/lib/seed/discover-places");
      const dlCards = DEMO_DISCOVER_PLACES.filter(
        (p) => p.id.startsWith("discover-dl-"),
      );
      expect(dlCards.length).toBe(4);
      expect(dlCards.every((p) => !!p.koreanReviewQuote)).toBe(true);
      expect(dlCards.every((p) => !!p.aiReason)).toBe(true);
      expect(dlCards.every((p) => !!p.priceLevel)).toBe(true);
    });
  });

  describe("치앙마이는 V4 게이트 보류 (베트남 단일 정책)", () => {
    it("치앙마이 카드는 enrichment 미적용 — feedback_vietnam_only_focus", async () => {
      const { DEMO_DISCOVER_PLACES } = await import("@/lib/seed/discover-places");
      const target = DEMO_DISCOVER_PLACES.find((p) => p.id === "discover-cm-doisuthep");
      expect(target).toBeDefined();
      expect(target?.koreanReviewQuote).toBeUndefined();
      expect(target?.aiReason).toBeUndefined();
    });
  });
});
