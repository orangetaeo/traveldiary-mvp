/**
 * ADR-050 회귀 가드 — ItemCategory 6칩 확장 (stay/wellness 신설).
 *
 * 검증 범위:
 *   1) ItemCategory union 6 항목 (typecheck)
 *   2) CATEGORY_OPTIONS 6 항목 + 순서 고정 + 가로 스크롤 (touch-pan-x)
 *   3) CategoryBadge TONE/LABEL Record exhaustive
 *   4) item-display CATEGORY_LABEL/ICON/GRADIENT 6 항목
 *   5) highlight-suggestions CATEGORY_SUBTITLE 6 항목
 *   6) og/share story CATEGORY_EMOJI/LABEL 6 항목
 *   7) 06-export-discover toDiscoverCategory subCategory 분기 + CATEGORY_MAP
 *   8) Badge tone accent 신규
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ItemCategory } from "@/lib/types";
import { CATEGORY_OPTIONS } from "@/components/itinerary/add-item-utils";
import { CATEGORY_LABEL, CATEGORY_ICON, CATEGORY_GRADIENT } from "@/lib/utils/item-display";

const SIX_CATEGORIES: ItemCategory[] = [
  "food",
  "spot",
  "shopping",
  "stay",
  "wellness",
  "rest",
];

const ROOT = process.cwd();

function readSrc(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

describe("ADR-050 — ItemCategory 6칩 확장", () => {
  describe("1. lib/types.ts ItemCategory union", () => {
    it("6 값 union (typecheck 통과로 강제)", () => {
      // type assertion — 컴파일 시점 강제. 런타임 검증은 다른 테스트.
      const cats: ItemCategory[] = ["food", "spot", "shopping", "stay", "wellness", "rest"];
      expect(cats).toHaveLength(6);
    });

    it("source에 stay/wellness 신설 명시", () => {
      const src = readSrc("lib/types.ts");
      expect(src).toMatch(/"stay"/);
      expect(src).toMatch(/"wellness"/);
      expect(src).toMatch(/ADR-050/);
    });
  });

  describe("2. CATEGORY_OPTIONS 6 칩 + 순서", () => {
    it("길이 6", () => {
      expect(CATEGORY_OPTIONS).toHaveLength(6);
    });

    it("순서 고정 — food/spot/shopping/stay/wellness/rest", () => {
      expect(CATEGORY_OPTIONS.map((o) => o.id)).toEqual([
        "food", "spot", "shopping", "stay", "wellness", "rest",
      ]);
    });

    it("stay → hotel 아이콘", () => {
      expect(CATEGORY_OPTIONS.find((o) => o.id === "stay")?.icon).toBe("hotel");
    });

    it("wellness → spa 아이콘", () => {
      expect(CATEGORY_OPTIONS.find((o) => o.id === "wellness")?.icon).toBe("spa");
    });

    it("rest 라벨 '기타 휴식'", () => {
      expect(CATEGORY_OPTIONS.find((o) => o.id === "rest")?.label).toBe("기타 휴식");
    });
  });

  describe("3. AddItemModal — 가로 스크롤 (touch-pan-x, 사이클 BB 패턴 답습)", () => {
    const src = readSrc("components/itinerary/AddItemModal.tsx");

    it("touch-pan-x 클래스 존재", () => {
      expect(src).toMatch(/touch-pan-x/);
    });

    it("overscroll-x-contain 클래스 존재", () => {
      expect(src).toMatch(/overscroll-x-contain/);
    });

    it("role=radiogroup 명시", () => {
      expect(src).toMatch(/role="radiogroup"/);
    });

    it("aria-label '카테고리 선택' 명시", () => {
      expect(src).toMatch(/aria-label="카테고리 선택"/);
    });

    it("grid-cols-4 4 그리드 폐기", () => {
      expect(src).not.toMatch(/grid-cols-4 gap-td-xs/);
    });
  });

  describe("4. components/ui/Badge tone — accent 신규", () => {
    const src = readSrc("components/ui/Badge.tsx");

    it("BadgeTone union에 accent 포함", () => {
      expect(src).toMatch(/"info"\s*\|\s*"amber"\s*\|\s*"danger"\s*\|\s*"success"\s*\|\s*"neutral"\s*\|\s*"accent"/);
    });

    it("styles Record에 accent 매핑 — bg-accent-soft text-accent-deep", () => {
      expect(src).toMatch(/accent:\s*"bg-accent-soft text-accent-deep"/);
    });
  });

  describe("5. CategoryBadge — 6 카테고리 TONE/LABEL", () => {
    const src = readSrc("components/itinerary/CategoryBadge.tsx");

    it("TONE Record에 stay → success", () => {
      expect(src).toMatch(/stay:\s*"success"/);
    });

    it("TONE Record에 wellness → accent", () => {
      expect(src).toMatch(/wellness:\s*"accent"/);
    });

    it("LABEL Record에 stay → 숙소", () => {
      expect(src).toMatch(/stay:\s*"숙소"/);
    });

    it("LABEL Record에 wellness → 마사지", () => {
      expect(src).toMatch(/wellness:\s*"마사지"/);
    });

    it("rest 라벨 '기타 휴식'", () => {
      expect(src).toMatch(/rest:\s*"기타 휴식"/);
    });
  });

  describe("6. item-display — CATEGORY_LABEL/ICON/GRADIENT 6 항목", () => {
    it("CATEGORY_LABEL 모든 6 카테고리 키 존재", () => {
      for (const cat of SIX_CATEGORIES) {
        expect(CATEGORY_LABEL[cat]).toBeTruthy();
      }
    });

    it("CATEGORY_ICON stay → hotel, wellness → spa", () => {
      expect(CATEGORY_ICON.stay).toBe("hotel");
      expect(CATEGORY_ICON.wellness).toBe("spa");
    });

    it("CATEGORY_GRADIENT 6 카테고리 모두 비공백", () => {
      for (const cat of SIX_CATEGORIES) {
        expect(CATEGORY_GRADIENT[cat]).toBeTruthy();
        expect(CATEGORY_GRADIENT[cat].length).toBeGreaterThan(5);
      }
    });
  });

  describe("7. highlight-suggestions CATEGORY_SUBTITLE 6 항목", () => {
    const src = readSrc("lib/wrap-up/highlight-suggestions.ts");

    it("stay → '묵은 숙소'", () => {
      expect(src).toMatch(/stay:\s*"묵은 숙소"/);
    });

    it("wellness → '받은 마사지'", () => {
      expect(src).toMatch(/wellness:\s*"받은 마사지"/);
    });
  });

  describe("8. og/share story — 6 카테고리 emoji + label", () => {
    const src = readSrc("app/api/og/share/[key]/story/route.tsx");

    it("CATEGORY_EMOJI에 stay 🏨", () => {
      expect(src).toMatch(/stay:\s*"🏨"/);
    });

    it("CATEGORY_EMOJI에 wellness 💆", () => {
      expect(src).toMatch(/wellness:\s*"💆"/);
    });

    it("CATEGORY_LABEL에 stay → '숙소'", () => {
      expect(src).toMatch(/stay:\s*"숙소"/);
    });
  });

  describe("9. 06-export-discover — subCategory 기반 정확 분기 + CATEGORY_MAP", () => {
    const src = readSrc("scripts/seed-pipeline/06-export-discover.ts");

    it("CATEGORY_MAP rest → rest (강제 매핑 해제)", () => {
      // BEFORE는 `"rest": "spot"`. AFTER는 `"rest": "rest"`.
      expect(src).not.toMatch(/"rest":\s*"spot"/);
      expect(src).toMatch(/"rest":\s*"rest"/);
    });

    it("CATEGORY_MAP에 stay/wellness 신규", () => {
      expect(src).toMatch(/"stay":\s*"stay"/);
      expect(src).toMatch(/"wellness":\s*"wellness"/);
    });

    it("toDiscoverCategory에 마사지 subCategory 분기 → wellness", () => {
      // "스파/마사지", "뷰티", "마사지" → wellness
      expect(src).toMatch(/return\s+"wellness"/);
    });

    it("toDiscoverCategory에 숙소 subCategory 분기 → stay", () => {
      expect(src).toMatch(/return\s+"stay"/);
    });

    it("category === 'rest' 강제 spot 매핑 해제", () => {
      // BEFORE 마지막 줄: `if (category === "rest") return "spot";`
      expect(src).not.toMatch(/category === "rest"\)\s*return\s*"spot"/);
    });
  });

  describe("10. 마이그레이션 스크립트 050-recategorize-stay-wellness", () => {
    const src = readSrc("scripts/migrations/050-recategorize-stay-wellness.ts");

    it("SUB_TO_CATEGORY에 stay 대상 4종", () => {
      expect(src).toMatch(/"숙소":\s*"stay"/);
      expect(src).toMatch(/"리조트":\s*"stay"/);
      expect(src).toMatch(/"호텔":\s*"stay"/);
      expect(src).toMatch(/"게스트하우스":\s*"stay"/);
    });

    it("SUB_TO_CATEGORY에 wellness 대상 3종", () => {
      expect(src).toMatch(/"스파\/마사지":\s*"wellness"/);
      expect(src).toMatch(/"마사지":\s*"wellness"/);
      expect(src).toMatch(/"뷰티":\s*"wellness"/);
    });

    it("dry-run + --apply CLI 플래그 분리", () => {
      expect(src).toMatch(/--apply/);
      expect(src).toMatch(/DRY-RUN/);
    });

    it("apply는 transaction 안에서 수행", () => {
      expect(src).toMatch(/prisma\.\$transaction/);
    });

    it("writeAuditLog 호출 — action='adr-050-recategorize'", () => {
      expect(src).toMatch(/writeAuditLog/);
      expect(src).toMatch(/"adr-050-recategorize"/);
    });

    it("--verify 플래그 분리 (apply 후 검증)", () => {
      expect(src).toMatch(/--verify/);
    });

    it("롤백 절차 명시 (audit log 기반)", () => {
      expect(src).toMatch(/롤백/);
    });
  });

  describe("11. Place schema 코멘트 6 카테고리 반영", () => {
    const src = readSrc("prisma/schema.prisma");

    it("Place.category 코멘트에 stay/wellness 반영", () => {
      expect(src).toMatch(/ADR-050.*stay.*wellness/);
    });
  });
});
