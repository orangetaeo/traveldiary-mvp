/**
 * A11 — 키보드 네비게이션 구조 검증.
 *
 * 핵심 인터랙션 모두 Tab + Enter 가능.
 * focus-visible 지원 + aria 속성 확인.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

// ═══════════════════════════════════════════
// 1. 숨겨진 버튼 focus-visible 보장
// ═══════════════════════════════════════════

describe("A11 — 삭제 버튼 키보드 접근성", () => {
  it("ChecklistBucketList 삭제 버튼 focus-visible:opacity-100", () => {
    const src = fs.readFileSync(
      path.resolve("components/checklist/ChecklistBucketList.tsx"),
      "utf-8",
    );
    expect(src).toContain("focus-visible:opacity-100");
  });

  it("CostEntriesList 삭제 버튼 focus-visible:opacity-100", () => {
    const src = fs.readFileSync(
      path.resolve("components/cost/CostEntriesList.tsx"),
      "utf-8",
    );
    expect(src).toContain("focus-visible:opacity-100");
  });
});

// ═══════════════════════════════════════════
// 2. DayTabsBar 키보드 접근성
// ═══════════════════════════════════════════

describe("A11 — DayTabsBar 키보드 접근성", () => {
  const src = fs.readFileSync(
    path.resolve("components/itinerary/DayTabsBar.tsx"),
    "utf-8",
  );

  it("button 요소 사용", () => {
    expect(src).toContain("<button");
    expect(src).toContain('type="button"');
  });

  it("aria-current 활성 상태", () => {
    expect(src).toContain("aria-current");
  });
});

// ═══════════════════════════════════════════
// 3. 필터 키보드 접근성
// ═══════════════════════════════════════════

describe("A11 — 체크리스트 필터 키보드 접근성", () => {
  const src = fs.readFileSync(
    path.resolve("components/checklist/ChecklistCategoryFilter.tsx"),
    "utf-8",
  );

  it("radio group ARIA", () => {
    expect(src).toContain("radiogroup");
    expect(src).toContain("radio");
  });

  it("aria-checked 상태", () => {
    expect(src).toContain("aria-checked");
  });
});

// ═══════════════════════════════════════════
// 4. 이동 버튼 키보드 접근성
// ═══════════════════════════════════════════

describe("A11 — 일정 이동 버튼 접근성", () => {
  const src = fs.readFileSync(
    path.resolve("components/itinerary/ItineraryItemCard.tsx"),
    "utf-8",
  );

  it("위로/아래로 aria-label", () => {
    expect(src).toContain("aria-label");
  });

  it("button 요소 사용", () => {
    expect(src).toContain("<button");
  });
});

// ═══════════════════════════════════════════
// 5. BottomNav 키보드 접근성
// ═══════════════════════════════════════════

describe("A11 — BottomNav 키보드 접근성", () => {
  const src = fs.readFileSync(
    path.resolve("components/ui/BottomNav.tsx"),
    "utf-8",
  );

  it("Link 요소 사용 (semantic)", () => {
    expect(src).toContain("Link");
  });

  it("aria-current 활성 상태", () => {
    expect(src).toContain("aria-current");
  });
});
