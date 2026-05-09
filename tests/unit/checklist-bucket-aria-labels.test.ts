/**
 * 자율 진행 (2026-05-08) — ChecklistBucketList aria-label 일관성 강화 (3번째 답습).
 *
 * 답습 시리즈:
 *   1) ItineraryItemCard (PR #410, ${ko}) — 4 button (수정/삭제/위로/아래로)
 *   2) CostEntriesList (PR #412, ${entry.label}) — 2 button (수정/삭제)
 *   3) ChecklistBucketList (본 PR, ${item.text}) — 6 button (선택 모드 1 + 토글 1 + 위로/아래로 2 + 수정/삭제 2)
 *
 * source-grep으로 검증.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = readFileSync(
  resolve(process.cwd(), "components/checklist/ChecklistBucketList.tsx"),
  "utf-8",
);

describe("ChecklistBucketList — aria-label 항목명(item.text) 포함 (3번째 답습)", () => {
  it("선택 모드 button — 선택/선택 해제 모두 ${item.text} 포함", () => {
    expect(SRC).toMatch(/aria-label=\{isSelected \? `\$\{item\.text\} 선택 해제` : `\$\{item\.text\} 선택`\}/);
  });

  it("토글 button — 체크/체크 해제 모두 ${item.text} 포함", () => {
    expect(SRC).toMatch(/aria-label=\{item\.done \? `\$\{item\.text\} 체크 해제` : `\$\{item\.text\} 체크`\}/);
  });

  it("위로 이동 button aria-label에 ${item.text} 포함", () => {
    expect(SRC).toMatch(/aria-label=\{`\$\{item\.text\} 위로 이동`\}/);
  });

  it("아래로 이동 button aria-label에 ${item.text} 포함", () => {
    expect(SRC).toMatch(/aria-label=\{`\$\{item\.text\} 아래로 이동`\}/);
  });

  it("수정 button aria-label에 ${item.text} 포함", () => {
    expect(SRC).toMatch(/aria-label=\{`\$\{item\.text\} 수정`\}/);
  });

  it("삭제 button aria-label에 ${item.text} 포함", () => {
    expect(SRC).toMatch(/aria-label=\{`\$\{item\.text\} 삭제`\}/);
  });

  it("정적 문자열 aria-label='수정' / '삭제' / '위로 이동' / '아래로 이동' / '체크' / '체크 해제' / '선택' / '선택 해제' 0건", () => {
    expect(SRC).not.toMatch(/aria-label="수정"/);
    expect(SRC).not.toMatch(/aria-label="삭제"/);
    expect(SRC).not.toMatch(/aria-label="위로 이동"/);
    expect(SRC).not.toMatch(/aria-label="아래로 이동"/);
    // 토글/선택은 동적 표현식이므로 정적 문자열은 본래 없음 — 가드는 일관성 보장 위함
    expect(SRC).not.toMatch(/aria-label=\{[^}]*\?\s*"체크 해제"\s*:\s*"체크"\}/);
    expect(SRC).not.toMatch(/aria-label=\{[^}]*\?\s*"선택 해제"\s*:\s*"선택"\}/);
  });
});

describe("ChecklistBucketList — 기존 BC 100% 보존", () => {
  it("item.text 변수 자체는 그대로 렌더 (텍스트 노출 보존)", () => {
    expect(SRC).toContain("{item.text}");
  });

  it("onToggle / onDelete / onMove / onEdit / onSelectToggle callback prop BC", () => {
    expect(SRC).toContain("onToggle: (item: ChecklistItem) => void");
    expect(SRC).toContain("onDelete: (item: ChecklistItem) => void");
    expect(SRC).toContain('onMove?: (item: ChecklistItem, direction: "up" | "down") => void');
    expect(SRC).toContain("onEdit?: (item: ChecklistItem) => void");
    expect(SRC).toContain("onSelectToggle?: (item: ChecklistItem) => void");
  });

  it("selectionMode prop BC", () => {
    expect(SRC).toContain("selectionMode?: boolean");
    expect(SRC).toContain("selectedIds?: Set<string>");
  });

  it("check_circle / radio_button_unchecked / check_box / check_box_outline_blank icon BC", () => {
    expect(SRC).toContain("check_circle");
    expect(SRC).toContain("radio_button_unchecked");
    expect(SRC).toContain("check_box");
    expect(SRC).toContain("check_box_outline_blank");
  });

  it("keyboard_arrow_up / keyboard_arrow_down / edit / close icon BC", () => {
    expect(SRC).toContain("keyboard_arrow_up");
    expect(SRC).toContain("keyboard_arrow_down");
    expect(SRC).toContain("edit");
    expect(SRC).toContain("close");
  });

  it("button 모두 type='button' BC (form submit 차단)", () => {
    const matches = SRC.match(/type="button"/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(6);
  });

  it("aria-checked role='checkbox' BC (선택 모드 a11y)", () => {
    expect(SRC).toContain('role="checkbox"');
    expect(SRC).toContain('aria-checked={isSelected ? "true" : "false"}');
  });

  it("mobile-first opacity 패턴 보존 (PR #363 박제)", () => {
    expect(SRC).toContain("opacity-70 md:opacity-0 md:group-hover:opacity-100");
  });

  it("focus-visible:opacity-100 보존 (키보드 a11y)", () => {
    expect(SRC).toContain("focus-visible:opacity-100");
  });
});
