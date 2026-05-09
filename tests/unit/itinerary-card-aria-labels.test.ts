/**
 * 자율 진행 (2026-05-08) — ItineraryItemCard aria-label 일관성 강화.
 *
 * 갭: 수정/삭제/위로이동/아래로이동 4 button의 aria-label이 항목명(ko) 미포함 →
 *     스크린 리더 사용자가 어느 일정의 버튼인지 불명확.
 *
 * 답습: 같은 컴포넌트 내 도착 체크인 button (라인 179, 191)이 이미
 *       `aria-label={`${ko} 도착 체크인`}` 패턴 사용 중. PhraseCard도 동일.
 *
 * source-grep으로 검증.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = readFileSync(
  resolve(process.cwd(), "components/itinerary/ItineraryItemCard.tsx"),
  "utf-8",
);

describe("ItineraryItemCard — aria-label 항목명(ko) 포함 (도착 체크인 답습)", () => {
  it("수정 button aria-label에 ${ko} 포함", () => {
    expect(SRC).toMatch(/aria-label=\{`\$\{ko\} 수정`\}/);
  });

  it("삭제 button aria-label에 ${ko} 포함", () => {
    expect(SRC).toMatch(/aria-label=\{`\$\{ko\} 삭제`\}/);
  });

  it("위로 이동 button aria-label에 ${ko} 포함", () => {
    expect(SRC).toMatch(/aria-label=\{`\$\{ko\} 위로 이동`\}/);
  });

  it("아래로 이동 button aria-label에 ${ko} 포함", () => {
    expect(SRC).toMatch(/aria-label=\{`\$\{ko\} 아래로 이동`\}/);
  });

  it("정적 문자열 aria-label='수정' / '삭제' / '위로 이동' / '아래로 이동' 0건", () => {
    expect(SRC).not.toMatch(/aria-label="수정"/);
    expect(SRC).not.toMatch(/aria-label="삭제"/);
    expect(SRC).not.toMatch(/aria-label="위로 이동"/);
    expect(SRC).not.toMatch(/aria-label="아래로 이동"/);
  });

  it("도착 체크인 답습 패턴 BC (기존 라인 보존)", () => {
    expect(SRC).toMatch(/aria-label=\{`\$\{ko\} 도착 체크인`\}/);
    expect(SRC).toMatch(/aria-label=\{`\$\{ko\} 도착 체크인 취소`\}/);
  });

  it("aria-label에 ${ko} 포함 button 6개 (4 신규 + 2 도착)", () => {
    const matches = SRC.match(/aria-label=\{`\$\{ko\}/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(6);
  });
});

describe("ItineraryItemCard — 기존 BC 100% 보존", () => {
  it("ko 변수 splitName(item.name) 추출 BC", () => {
    expect(SRC).toMatch(/const \{ ko[^}]*\} = splitName\(item\.name\)/);
  });

  it("onEdit / onDelete / onMoveUp / onMoveDown callback prop BC", () => {
    expect(SRC).toContain("onEdit?: (item: ItineraryItem) => void");
    expect(SRC).toContain("onDelete?: (item: ItineraryItem) => void");
    expect(SRC).toContain("onMoveUp: (id: string) => void");
    expect(SRC).toContain("onMoveDown: (id: string) => void");
  });

  it("edit / delete / keyboard_arrow_up / keyboard_arrow_down material icon BC", () => {
    expect(SRC).toMatch(/material-symbols-outlined[\s\S]{0,100}edit/);
    expect(SRC).toMatch(/material-symbols-outlined[\s\S]{0,100}delete/);
    expect(SRC).toContain("keyboard_arrow_up");
    expect(SRC).toContain("keyboard_arrow_down");
  });

  it("isFirst / isLast disabled prop BC", () => {
    expect(SRC).toMatch(/disabled=\{isFirst\}/);
    expect(SRC).toMatch(/disabled=\{isLast\}/);
  });

  it("button 모두 type='button' BC (form submit 차단)", () => {
    const matches = SRC.match(/type="button"/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(4);
  });
});
