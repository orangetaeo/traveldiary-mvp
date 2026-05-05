/**
 * ValidationBadges + MenuItemCard 컴포넌트 테스트 — Batch 12.
 *
 * 2 컴포넌트:
 *  - ValidationBadges: 5단계 검증 결과 시각화 (booking/distance/price)
 *  - MenuItemCard: 알레르기 매칭 + 한국인 인기 + 가격 렌더링
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ValidationBadges } from "@/components/itinerary/ValidationBadges";
import { MenuItemCard } from "@/components/translate/MenuItemCard";
import type { MenuItem } from "@/lib/seed/menu-phu-quoc";

/* ────────── ValidationBadges ────────── */

describe("ValidationBadges", () => {
  it("forbidden → '권한 없음' 뱃지", () => {
    const html = renderToStaticMarkup(
      <ValidationBadges result={{ mode: "forbidden" }} />,
    );
    expect(html).toContain("권한");
    expect(html).toContain("lock");
  });

  it("not_found → 렌더 없음 (null)", () => {
    const html = renderToStaticMarkup(
      <ValidationBadges result={{ mode: "not_found" }} />,
    );
    expect(html).toBe("");
  });

  it("ok + booking required → '예약 권장'", () => {
    const html = renderToStaticMarkup(
      <ValidationBadges
        result={{
          mode: "ok",
          booking: { required: true, reason: "인기 식당", source: "types" },
          distance: { status: "no_next", reason: "" },
          price: { status: "no_estimate", reason: "", deltaPct: null },
        }}
      />,
    );
    expect(html).toContain("예약 권장");
    expect(html).toContain("인기 식당");
  });

  it("ok + booking not required → '워크인 가능'", () => {
    const html = renderToStaticMarkup(
      <ValidationBadges
        result={{
          mode: "ok",
          booking: { required: false, reason: "일반 명소", source: "fallback" },
          distance: { status: "no_next", reason: "" },
          price: { status: "no_offers", reason: "", deltaPct: null },
        }}
      />,
    );
    expect(html).toContain("워크인 가능");
  });

  it("distance verified → '이동 검증 완료'", () => {
    const html = renderToStaticMarkup(
      <ValidationBadges
        result={{
          mode: "ok",
          booking: { required: false, reason: "", source: "fallback" },
          distance: { status: "verified", reason: "도보 5분" },
          price: { status: "no_estimate", reason: "", deltaPct: null },
        }}
      />,
    );
    expect(html).toContain("이동 검증 완료");
  });

  it("distance mismatch → '이동시간 부족' + emphasized", () => {
    const html = renderToStaticMarkup(
      <ValidationBadges
        result={{
          mode: "ok",
          booking: { required: false, reason: "", source: "fallback" },
          distance: { status: "mismatch", reason: "차량 40분 필요" },
          price: { status: "no_estimate", reason: "", deltaPct: null },
        }}
      />,
    );
    expect(html).toContain("이동시간 부족");
  });

  it("distance no_next → 숨김 (렌더 없음)", () => {
    const html = renderToStaticMarkup(
      <ValidationBadges
        result={{
          mode: "ok",
          booking: { required: false, reason: "", source: "fallback" },
          distance: { status: "no_next", reason: "" },
          price: { status: "verified", reason: "OTA 일치", deltaPct: 2.5 },
        }}
      />,
    );
    expect(html).not.toContain("이동");
  });

  it("price verified → '가격 검증 완료'", () => {
    const html = renderToStaticMarkup(
      <ValidationBadges
        result={{
          mode: "ok",
          booking: { required: false, reason: "", source: "fallback" },
          distance: { status: "no_next", reason: "" },
          price: { status: "verified", reason: "Klook ₩45,000", deltaPct: 1.2 },
        }}
      />,
    );
    expect(html).toContain("가격 검증 완료");
  });

  it("price no_estimate → 숨김", () => {
    const html = renderToStaticMarkup(
      <ValidationBadges
        result={{
          mode: "ok",
          booking: { required: false, reason: "", source: "fallback" },
          distance: { status: "no_next", reason: "" },
          price: { status: "no_estimate", reason: "", deltaPct: null },
        }}
      />,
    );
    expect(html).not.toContain("가격");
  });
});

/* ────────── MenuItemCard ────────── */

const sampleItem: MenuItem = {
  id: "test-menu",
  original: "Tôm hùm nướng",
  phonetic: "똠 훔 느엉",
  translated: "랍스터 구이",
  culturalNote: "인기 메뉴",
  price: { vnd: 500000, krw: 27000 },
  koreanPopularity: 96,
  ingredients: ["랍스터", "치즈", "마늘"],
  allergens: ["갑각류", "우유"],
};

describe("MenuItemCard", () => {
  it("기본 렌더 — 원문 + 발음 + 번역 표시", () => {
    const html = renderToStaticMarkup(<MenuItemCard item={sampleItem} matches={[]} />);
    expect(html).toContain("Tôm hùm nướng");
    expect(html).toContain("똠 훔 느엉");
    expect(html).toContain("랍스터 구이");
  });

  it("가격 표시 (KRW 포맷)", () => {
    const html = renderToStaticMarkup(<MenuItemCard item={sampleItem} matches={[]} />);
    expect(html).toContain("27,000");
    expect(html).toContain("원");
  });

  it("한국인 인기 ≥ 80 → 'BEST' 배지", () => {
    const html = renderToStaticMarkup(<MenuItemCard item={sampleItem} matches={[]} />);
    expect(html).toContain("한국인 BEST");
  });

  it("한국인 인기 < 80 → BEST 배지 없음", () => {
    const lowPop = { ...sampleItem, koreanPopularity: 50 };
    const html = renderToStaticMarkup(<MenuItemCard item={lowPop} matches={[]} />);
    expect(html).not.toContain("한국인 BEST");
  });

  it("critical 매치 → '⚠️ 위험' 배지 + border-danger", () => {
    const html = renderToStaticMarkup(
      <MenuItemCard
        item={sampleItem}
        matches={[{ category: "갑각류", keyword: "랍스터", severity: "critical" }]}
      />,
    );
    expect(html).toContain("위험");
    expect(html).toContain("border-danger");
  });

  it("preference 매치 → '제외 식이 포함' 배지", () => {
    const html = renderToStaticMarkup(
      <MenuItemCard
        item={sampleItem}
        matches={[{ category: "우유", keyword: "치즈", severity: "preference" }]}
      />,
    );
    expect(html).toContain("제외 식이 포함");
  });

  it("매칭된 재료 하이라이트 (danger-soft 스타일)", () => {
    const html = renderToStaticMarkup(
      <MenuItemCard
        item={sampleItem}
        matches={[{ category: "갑각류", keyword: "랍스터", severity: "critical" }]}
      />,
    );
    // 랍스터 재료가 하이라이트 됨
    expect(html).toContain("bg-danger-soft");
  });

  it("culturalNote 표시", () => {
    const html = renderToStaticMarkup(<MenuItemCard item={sampleItem} matches={[]} />);
    expect(html).toContain("인기 메뉴");
  });

  it("culturalNote 없으면 해당 영역 미렌더", () => {
    const noNote = { ...sampleItem, culturalNote: undefined };
    const html = renderToStaticMarkup(<MenuItemCard item={noNote} matches={[]} />);
    expect(html).not.toContain("인기 메뉴");
  });
});
