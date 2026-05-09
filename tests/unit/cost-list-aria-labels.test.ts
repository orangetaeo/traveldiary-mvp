/**
 * 자율 진행 (2026-05-08) — CostEntriesList aria-label 일관성 강화.
 *
 * 갭: 수정/삭제 button의 aria-label이 정적 문자열 ("수정" / "삭제") →
 *     스크린 리더 사용자가 어느 비용 항목 button인지 불명확.
 *
 * 답습: ItineraryItemCard (PR #410, 도착 체크인) + PhraseCard 패턴.
 *       `aria-label={`${entry.label} 수정`}` / `aria-label={`${entry.label} 삭제`}`
 *
 * source-grep으로 검증.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = readFileSync(
  resolve(process.cwd(), "components/cost/CostEntriesList.tsx"),
  "utf-8",
);

describe("CostEntriesList — aria-label 항목명(entry.label) 포함", () => {
  it("수정 button aria-label에 ${entry.label} 포함", () => {
    expect(SRC).toMatch(/aria-label=\{`\$\{entry\.label\} 수정`\}/);
  });

  it("삭제 button aria-label에 ${entry.label} 포함", () => {
    expect(SRC).toMatch(/aria-label=\{`\$\{entry\.label\} 삭제`\}/);
  });

  it("정적 문자열 aria-label='수정' / '삭제' 0건", () => {
    expect(SRC).not.toMatch(/aria-label="수정"/);
    expect(SRC).not.toMatch(/aria-label="삭제"/);
  });

  it("aria-label에 ${entry.label} 포함 button 2개 (수정 + 삭제)", () => {
    const matches = SRC.match(/aria-label=\{`\$\{entry\.label\}/g) ?? [];
    expect(matches.length).toBe(2);
  });
});

describe("CostEntriesList — 기존 BC 100% 보존", () => {
  it("entry.label 변수 자체는 그대로 사용 (라인 71)", () => {
    expect(SRC).toMatch(/className="text-td-body text-ink truncate">\{entry\.label\}/);
  });

  it("onEdit / onDelete callback prop BC", () => {
    expect(SRC).toContain("onDelete: (entry: CostEntry) => void");
    expect(SRC).toContain("onEdit?: (entry: CostEntry) => void");
  });

  it("edit / close material icon BC", () => {
    expect(SRC).toContain("edit");
    expect(SRC).toContain("close");
  });

  it("button 모두 type='button' BC (form submit 차단)", () => {
    const matches = SRC.match(/type="button"/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it("mobile-first opacity 패턴 보존 (PR #363 박제)", () => {
    expect(SRC).toContain("opacity-70 md:opacity-0 md:group-hover:opacity-100");
  });

  it("focus-visible:opacity-100 보존 (키보드 a11y)", () => {
    expect(SRC).toContain("focus-visible:opacity-100");
  });
});
