/**
 * /city/[slug]/emergency 응급 라우트 + 분실 가이드 무결성 — 사이클 P (ADR-035).
 *
 * 검증:
 *  1. 8 활성 도시 모두 resolveCity 통과 + 응급 contacts ≥ 3
 *  2. 한국어 통역(translator) 카테고리 모든 도시에 존재 (Country.GLOBAL)
 *  3. 분실 가이드 4 카테고리 (passport/card/phone/theft) 무결성
 *  4. 각 가이드 steps ≥ 3 단계
 *  5. 분실 가이드 contacts 최소 1개
 */

import { describe, it, expect } from "vitest";
import {
  listVietnamCities,
  resolveCity,
} from "@/lib/seed/cities";
import {
  KOREAN_LOSS_GUIDES,
  getLossGuide,
  type LossCategory,
} from "@/lib/constants/koreanLossContacts";

describe("사이클 P — /city/[slug]/emergency 라우트 무결성", () => {
  it("8 활성 베트남 도시 모두 resolveCity 통과 (응급 풀 페이지 진입 가능)", () => {
    const vn = listVietnamCities();
    expect(vn.length).toBeGreaterThanOrEqual(8);
    for (const city of vn) {
      const resolved = resolveCity(city.slug);
      expect(resolved, `city ${city.code}`).not.toBeNull();
    }
  });

  it("8 도시 모두 응급 contacts ≥ 3건 (영사관·경찰·병원 최소)", () => {
    const vn = listVietnamCities();
    for (const city of vn) {
      const r = resolveCity(city.slug)!;
      expect(r.emergencyContacts.length, `${city.code}`).toBeGreaterThanOrEqual(3);
    }
  });

  it("8 도시 모두 한국어 통역 서비스 (Country.GLOBAL translator) 포함", () => {
    const vn = listVietnamCities();
    for (const city of vn) {
      const r = resolveCity(city.slug)!;
      const translator = r.emergencyContacts.find((c) => c.category === "translator");
      expect(translator, `${city.code} translator`).toBeDefined();
      expect(translator?.phone).toMatch(/3210/); // 외교부 영사 콜센터
    }
  });

  it("8 도시 모두 영사관(embassy) 카테고리 보유", () => {
    const vn = listVietnamCities();
    for (const city of vn) {
      const r = resolveCity(city.slug)!;
      const embassy = r.emergencyContacts.find((c) => c.category === "embassy");
      expect(embassy, `${city.code} embassy`).toBeDefined();
    }
  });
});

describe("사이클 P — 분실 통합 가이드 무결성", () => {
  it("4 카테고리 모두 정의됨 (passport/card/phone/theft)", () => {
    expect(KOREAN_LOSS_GUIDES.length).toBe(4);
    const cats = KOREAN_LOSS_GUIDES.map((g) => g.category).sort();
    expect(cats).toEqual(["card", "passport", "phone", "theft"]);
  });

  it("각 가이드 steps ≥ 3 단계 (패닉 상황 안내)", () => {
    for (const g of KOREAN_LOSS_GUIDES) {
      expect(g.steps.length, `${g.category} steps`).toBeGreaterThanOrEqual(3);
    }
  });

  it("각 가이드 contacts 최소 1개 (행동 안내 가능)", () => {
    for (const g of KOREAN_LOSS_GUIDES) {
      expect(g.contacts.length, `${g.category} contacts`).toBeGreaterThanOrEqual(1);
    }
  });

  it("각 가이드 emoji + title + preparation 채움", () => {
    for (const g of KOREAN_LOSS_GUIDES) {
      expect(g.emoji.length).toBeGreaterThan(0);
      expect(g.title.length).toBeGreaterThan(0);
      expect(g.preparation, `${g.category} preparation`).toBeTruthy();
    }
  });

  it("getLossGuide(category) — 4 카테고리 모두 조회 가능", () => {
    const cats: LossCategory[] = ["passport", "card", "phone", "theft"];
    for (const c of cats) {
      expect(getLossGuide(c), `${c}`).toBeDefined();
    }
  });

  it("getLossGuide(unknown) → undefined", () => {
    expect(getLossGuide("unknown" as LossCategory)).toBeUndefined();
  });
});

describe("사이클 P — 검증 가능한 통합 번호만 시드 (T16 환각 차단)", () => {
  it("외교부 영사 콜센터 번호 정확 (passport·theft 가이드 + theft에 등장)", () => {
    const passport = getLossGuide("passport")!;
    const theft = getLossGuide("theft")!;
    const consularNumber = "+82-2-3210-0404";
    expect(
      passport.contacts.some((c) => c.phone === consularNumber),
    ).toBe(true);
    expect(
      theft.contacts.some((c) => c.phone === consularNumber),
    ).toBe(true);
  });

  it("카드 가이드 — 통합 분실신고 번호 1577-0000", () => {
    const card = getLossGuide("card")!;
    expect(
      card.contacts.some((c) => (c.phone ?? "").includes("1577-0000")),
    ).toBe(true);
  });

  it("phone 가이드 — 개별 통신사 번호 비포함 (사용자 사전 메모 권장)", () => {
    const phone = getLossGuide("phone")!;
    // 개별 SKT/KT/LGU+ 직통 번호는 검증 불가능 → 시드 X
    const phones = phone.contacts.map((c) => c.phone ?? "").join(" ");
    expect(phones).not.toMatch(/SKT.*\d{4}/);
    expect(phones).not.toMatch(/KT.*\d{4}/);
    // 본인 통신사 사전 메모 권장 안내가 contacts나 preparation에 있어야 함
    const hasPreparationGuide =
      phone.preparation?.includes("통신사") ||
      phone.contacts.some((c) => c.notes?.includes("본인 통신사"));
    expect(hasPreparationGuide).toBe(true);
  });
});

describe("사이클 P — KOREAN_LOSS_GUIDES URL 출처 검증", () => {
  it("외교부 0404.go.kr URL 노출 (passport 가이드)", () => {
    const passport = getLossGuide("passport")!;
    const hasOfficialUrl = passport.contacts.some((c) =>
      (c.url ?? "").includes("0404.go.kr"),
    );
    expect(hasOfficialUrl).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 사이클 Q — 백로그 정리 회귀 (번호 표기 통일 + 영사관 URL)
// ═══════════════════════════════════════════════════════════════════

describe("사이클 Q — 영사 콜센터 번호 표기 통일 (하이픈)", () => {
  it("외교부 영사 콜센터 정확 번호 +82-2-3210-0404 (하이픈)", () => {
    // GLOBAL translator (모든 도시에 merge)
    const vn = listVietnamCities();
    for (const city of vn) {
      const r = resolveCity(city.slug)!;
      const t = r.emergencyContacts.find((c) => c.category === "translator");
      expect(t?.phone, `${city.code} translator phone`).toBe("+82-2-3210-0404");
    }
  });

  it("KOREAN_LOSS_GUIDES도 동일 표기 (+82-2-3210-0404)", () => {
    const passport = getLossGuide("passport")!;
    const consular = passport.contacts.find((c) =>
      (c.label ?? "").includes("영사 콜센터"),
    );
    expect(consular?.phone).toBe("+82-2-3210-0404");
  });

  it("카드 분실 통합 번호도 하이픈 통일 (+82-2-1577-0000)", () => {
    const vn = listVietnamCities();
    for (const city of vn) {
      const r = resolveCity(city.slug)!;
      const card = r.emergencyContacts.find((c) => c.category === "card_lost");
      expect(card?.phone, `${city.code} card_lost`).toBe("+82-2-1577-0000");
    }
  });
});

describe("사이클 Q — 8 도시 영사관 공식 URL", () => {
  const EXPECTED_URL: Record<string, string> = {
    HAN: "https://overseas.mofa.go.kr/vn-ko/index.do",
    SGN: "https://overseas.mofa.go.kr/vn-hochiminh-ko/index.do",
    CTH: "https://overseas.mofa.go.kr/vn-hochiminh-ko/index.do",
    PQC: "https://overseas.mofa.go.kr/vn-hochiminh-ko/index.do",
    DLI: "https://overseas.mofa.go.kr/vn-hochiminh-ko/index.do",
    NHA: "https://overseas.mofa.go.kr/vn-hochiminh-ko/index.do",
    DAD: "https://overseas.mofa.go.kr/vn-danang-ko/index.do",
    HOI: "https://overseas.mofa.go.kr/vn-danang-ko/index.do",
  };

  it.each(Object.entries(EXPECTED_URL))(
    "%s 영사관 url = %s",
    (code, expectedUrl) => {
      const city = listVietnamCities().find((c) => c.code === code);
      expect(city, `city ${code}`).toBeDefined();
      const embassy = city!.emergencyContacts.find((c) => c.category === "embassy");
      expect(embassy?.url, `${code} embassy url`).toBe(expectedUrl);
    },
  );

  it("외교부 0404.go.kr — GLOBAL translator url", () => {
    const r = resolveCity("phu-quoc")!;
    const t = r.emergencyContacts.find((c) => c.category === "translator");
    expect(t?.url).toBe("https://www.0404.go.kr");
  });
});
