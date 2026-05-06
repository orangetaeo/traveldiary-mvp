/**
 * allergens.ts 순수 함수 단위 테스트.
 *
 * 커버리지 갭 해소:
 * - normalizeExclude: 사용자 입력 → AllergenCategory 정규화
 * - matchAllergens: 텍스트 × 사용자 제외 목록 → 매칭 결과
 * - buildWarning: 매칭 결과 → 경고 문자열
 * - ALLERGEN_CHIPS: UI 칩 데이터 무결성
 */

import { describe, it, expect } from "vitest";
import {
  normalizeExclude,
  matchAllergens,
  buildWarning,
  ALLERGEN_CHIPS,
} from "@/lib/allergens";
import type { AllergenMatch } from "@/lib/allergens";

/* ════════════════════════════════════════════
 * normalizeExclude
 * ════════════════════════════════════════════ */

describe("normalizeExclude", () => {
  it("정확한 alias → 카테고리 반환", () => {
    expect(normalizeExclude("새우 알레르기")).toBe("새우");
    expect(normalizeExclude("갑각류 알레르기")).toBe("갑각류");
    expect(normalizeExclude("돼지고기 안 먹음")).toBe("돼지고기");
    expect(normalizeExclude("비건")).toBe("비건");
    expect(normalizeExclude("글루텐 프리")).toBe("글루텐");
  });

  it("직접 카테고리 이름 → 카테고리 반환", () => {
    expect(normalizeExclude("새우")).toBe("새우");
    expect(normalizeExclude("계란")).toBe("계란");
    expect(normalizeExclude("우유")).toBe("우유");
  });

  it("공백 트림", () => {
    expect(normalizeExclude("  새우 알레르기  ")).toBe("새우");
  });

  it("부분 일치 — 변종 표현", () => {
    // "새우 알레르기" alias를 포함하는 문자열
    expect(normalizeExclude("저는 새우 알레르기가 있어요")).toBe("새우");
  });

  it("알 수 없는 문자열 → null", () => {
    expect(normalizeExclude("xyz")).toBeNull();
  });

  it("빈 문자열 → 부분 일치 fallback (첫 alias 반환)", () => {
    // "" 는 모든 alias에 포함되므로 첫 alias의 카테고리가 반환됨
    const result = normalizeExclude("");
    expect(result).not.toBeNull();
  });
});

/* ════════════════════════════════════════════
 * matchAllergens
 * ════════════════════════════════════════════ */

describe("matchAllergens", () => {
  it("빈 excludes → 빈 결과", () => {
    expect(matchAllergens("새우 볶음밥", [])).toEqual([]);
  });

  it("매칭 없는 텍스트 → 빈 결과", () => {
    expect(matchAllergens("커피와 과일", ["새우 알레르기"])).toEqual([]);
  });

  it("한국어 키워드 매칭", () => {
    const result = matchAllergens("새우 볶음밥", ["새우 알레르기"]);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("새우");
    expect(result[0].keyword).toBe("새우");
    expect(result[0].severity).toBe("critical");
  });

  it("베트남어 키워드 매칭", () => {
    const result = matchAllergens("Tôm nướng mỡ hành", ["새우 알레르기"]);
    // "tôm" = 새우 (대소문자 무시)
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("새우");
  });

  it("영어 키워드 매칭", () => {
    const result = matchAllergens("Grilled shrimp", ["새우 알레르기"]);
    expect(result).toHaveLength(1);
    expect(result[0].keyword).toBe("shrimp");
  });

  it("severity — '알레르기' 포함 시 critical", () => {
    const result = matchAllergens("달걀 샌드위치", ["계란 알레르기"]);
    expect(result[0].severity).toBe("critical");
  });

  it("severity — '안 먹음' 시 preference", () => {
    const result = matchAllergens("돼지고기 덮밥", ["돼지고기 안 먹음"]);
    expect(result[0].severity).toBe("preference");
  });

  it("severity — 단순 카테고리명 시 preference", () => {
    const result = matchAllergens("비프 스테이크 (beef)", ["소고기"]);
    expect(result[0].severity).toBe("preference");
  });

  it("중복 카테고리 → 첫 매칭만", () => {
    // "새우"와 "대하"는 같은 "새우" 카테고리
    const result = matchAllergens("새우와 대하", ["새우 알레르기", "새우"]);
    expect(result).toHaveLength(1);
  });

  it("복수 카테고리 동시 매칭", () => {
    const result = matchAllergens(
      "새우 계란 볶음밥",
      ["새우 알레르기", "계란 알레르기"],
    );
    expect(result).toHaveLength(2);
    const categories = result.map((m) => m.category);
    expect(categories).toContain("새우");
    expect(categories).toContain("계란");
  });

  it("비건 — 고기/생선/계란/우유 모두 감지", () => {
    const result = matchAllergens("고기 국수", ["비건"]);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("비건");
    expect(result[0].keyword).toBe("고기");
  });

  it("대소문자 무시", () => {
    const result = matchAllergens("CHICKEN rice", ["닭고기 안 먹음"]);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("닭고기");
  });
});

/* ════════════════════════════════════════════
 * buildWarning
 * ════════════════════════════════════════════ */

describe("buildWarning", () => {
  it("빈 매칭 → null", () => {
    expect(buildWarning([])).toBeNull();
  });

  it("critical → ⚠️ 알레르기 위험 메시지", () => {
    const matches: AllergenMatch[] = [
      { category: "새우", keyword: "새우", severity: "critical" },
    ];
    const warning = buildWarning(matches);
    expect(warning).toContain("⚠️");
    expect(warning).toContain("새우");
    expect(warning).toContain("알레르기 위험");
  });

  it("critical 복수 → 카테고리 나열", () => {
    const matches: AllergenMatch[] = [
      { category: "새우", keyword: "새우", severity: "critical" },
      { category: "땅콩", keyword: "땅콩", severity: "critical" },
    ];
    const warning = buildWarning(matches);
    expect(warning).toContain("새우");
    expect(warning).toContain("땅콩");
  });

  it("preference only → '포함' 메시지 (⚠️ 없음)", () => {
    const matches: AllergenMatch[] = [
      { category: "돼지고기", keyword: "돼지", severity: "preference" },
    ];
    const warning = buildWarning(matches);
    expect(warning).not.toContain("⚠️");
    expect(warning).toContain("돼지고기");
    expect(warning).toContain("포함");
  });

  it("critical + preference 혼합 → critical 우선", () => {
    const matches: AllergenMatch[] = [
      { category: "새우", keyword: "새우", severity: "critical" },
      { category: "돼지고기", keyword: "돼지", severity: "preference" },
    ];
    const warning = buildWarning(matches);
    // critical이 있으므로 "알레르기 위험" 메시지
    expect(warning).toContain("⚠️");
    expect(warning).toContain("새우");
    // preference의 "돼지고기"는 critical 목록에 없으므로 미포함
    expect(warning).not.toContain("돼지고기");
  });
});

/* ════════════════════════════════════════════
 * ALLERGEN_CHIPS — UI 데이터 무결성
 * ════════════════════════════════════════════ */

describe("ALLERGEN_CHIPS", () => {
  it("7개 칩 존재", () => {
    expect(ALLERGEN_CHIPS).toHaveLength(7);
  });

  it("모든 칩에 raw + label 존재", () => {
    for (const chip of ALLERGEN_CHIPS) {
      expect(chip.raw.length).toBeGreaterThan(0);
      expect(chip.label.length).toBeGreaterThan(0);
    }
  });

  it("모든 칩의 raw가 normalizeExclude로 유효", () => {
    for (const chip of ALLERGEN_CHIPS) {
      const cat = normalizeExclude(chip.raw);
      expect(cat, `${chip.raw} → null`).not.toBeNull();
    }
  });

  it("칩 severity가 모두 danger", () => {
    for (const chip of ALLERGEN_CHIPS) {
      expect(chip.severity).toBe("danger");
    }
  });

  it("칩 icon이 모두 존재", () => {
    for (const chip of ALLERGEN_CHIPS) {
      expect(chip.icon).toBeDefined();
      expect(chip.icon!.length).toBeGreaterThan(0);
    }
  });
});
