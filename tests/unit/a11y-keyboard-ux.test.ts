/**
 * 접근성 + 키보드 UX 개선 검증.
 *
 * 대상 컴포넌트:
 * 1. AddCostForm — required/aria-required, aria-describedby
 * 2. CommentSection — Ctrl+Enter, char counter aria-live
 * 3. DirectionsGrid — aria-label on deeplinks
 * 4. VoteListView — aria-label on inputs, role="group" on option list
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function readSrc(relPath: string): string {
  return fs.readFileSync(path.resolve(relPath), "utf-8");
}

/* ═══════ 1. AddCostForm ═══════ */
describe("AddCostForm 접근성", () => {
  const src = readSrc("components/cost/AddCostForm.tsx");

  it("항목명 input — required + aria-required", () => {
    // required와 aria-required가 항목명 input 근처에 있어야 함
    const labelIdx = src.indexOf('aria-label="항목명"');
    expect(labelIdx).toBeGreaterThan(-1);
    const chunk = src.slice(Math.max(0, labelIdx - 300), labelIdx + 50);
    expect(chunk).toContain("required");
    expect(chunk).toContain('aria-required="true"');
  });

  it("금액 힌트 — id='amount-hint' 존재", () => {
    expect(src).toContain('id="amount-hint"');
  });

  it("KRW input — aria-describedby='amount-hint'", () => {
    const krwIdx = src.indexOf('placeholder="원"');
    expect(krwIdx).toBeGreaterThan(-1);
    const chunk = src.slice(krwIdx, krwIdx + 500);
    expect(chunk).toContain('aria-describedby="amount-hint"');
  });

  it("현지통화 input — aria-describedby='amount-hint'", () => {
    const localIdx = src.indexOf("placeholder={currencySymbol}");
    expect(localIdx).toBeGreaterThan(-1);
    const chunk = src.slice(localIdx, localIdx + 500);
    expect(chunk).toContain('aria-describedby="amount-hint"');
  });
});

/* ═══════ 2. CommentSection ═══════ */
describe("CommentSection 접근성 + 키보드", () => {
  const src = readSrc("components/share/CommentSection.tsx");

  it("Ctrl+Enter / Cmd+Enter 제출 지원", () => {
    expect(src).toContain("ctrlKey");
    expect(src).toContain("metaKey");
    expect(src).toContain('"Enter"');
  });

  it("글자수 카운터 — aria-live='polite'", () => {
    expect(src).toContain('aria-live="polite"');
  });

  it("글자수 카운터 — id='comment-char-count'", () => {
    expect(src).toContain('id="comment-char-count"');
  });

  it("textarea — aria-describedby='comment-char-count'", () => {
    expect(src).toContain('aria-describedby="comment-char-count"');
  });

  it("글자수 카운터 — 90% 임계 시 text-danger", () => {
    // body.length >= 180 ? "text-danger"
    expect(src).toContain("180");
    expect(src).toContain("text-danger");
  });

  it("글자수 표시 — /200 포맷", () => {
    expect(src).toContain("/200");
  });
});

/* ═══════ 3. DirectionsGrid ═══════ */
describe("DirectionsGrid 접근성", () => {
  const src = readSrc("components/itinerary/DirectionsGrid.tsx");

  it("Google Maps — aria-label 존재", () => {
    expect(src).toContain("Google Maps에서");
    expect(src).toContain("경로 보기");
  });

  it("카카오맵 — aria-label 존재", () => {
    expect(src).toContain("카카오맵에서");
  });

  it("Uber — aria-label 존재", () => {
    expect(src).toContain("Uber로");
  });

  it("Grab — aria-label 존재", () => {
    expect(src).toContain("Grab으로");
  });

  it("4개 링크 모두 aria-label 포함", () => {
    const ariaLabelCount = (src.match(/aria-label=/g) ?? []).length;
    expect(ariaLabelCount).toBeGreaterThanOrEqual(4);
  });
});

/* ═══════ 4. VoteListView ═══════ */
describe("VoteListView 접근성", () => {
  const src = readSrc("components/vote/VoteListView.tsx");

  it("투표 질문 input — aria-label + required", () => {
    const idx = src.indexOf('aria-label="투표 질문"');
    expect(idx).toBeGreaterThan(-1);
    const chunk = src.slice(Math.max(0, idx - 300), idx + 50);
    expect(chunk).toContain("required");
    expect(chunk).toContain('aria-required="true"');
  });

  it("옵션 input — aria-label 존재", () => {
    expect(src).toContain('aria-label={`옵션 ${i + 1}`}');
  });

  it("투표 옵션 리스트 — role='group' + aria-label", () => {
    expect(src).toContain('role="group"');
    expect(src).toContain("투표 옵션");
  });
});
