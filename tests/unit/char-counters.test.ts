/**
 * 폼 글자수 카운터 검증.
 *
 * 대상: AddCostForm, VoteListView, CommentSection
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function readSrc(relPath: string): string {
  return fs.readFileSync(path.resolve(relPath), "utf-8");
}

/* ═══════ AddCostForm ═══════ */
describe("AddCostForm 글자수 카운터", () => {
  const src = readSrc("components/cost/AddCostForm.tsx");

  it("항목명 카운터 — /50 표시", () => {
    expect(src).toContain("/50");
  });

  it("항목명 카운터 — aria-live='polite'", () => {
    expect(src).toContain('aria-live="polite"');
  });

  it("항목명 카운터 — aria-describedby 연결", () => {
    expect(src).toContain('aria-describedby="cost-label-count"');
    expect(src).toContain('id="cost-label-count"');
  });

  it("항목명 90% 임계 — 45자 이상 시 text-danger", () => {
    expect(src).toContain("draftLabel.length >= 45");
    expect(src).toContain("text-danger");
  });
});

/* ═══════ VoteListView ═══════ */
describe("VoteListView 글자수 카운터", () => {
  const src = readSrc("components/vote/VoteListView.tsx");

  it("질문 카운터 — /120 표시", () => {
    expect(src).toContain("/120");
  });

  it("질문 카운터 — aria-live='polite'", () => {
    expect(src).toContain('aria-live="polite"');
  });

  it("질문 카운터 — aria-describedby 연결", () => {
    expect(src).toContain('aria-describedby="vote-question-count"');
    expect(src).toContain('id="vote-question-count"');
  });

  it("질문 90% 임계 — 108자 이상 시 text-danger", () => {
    expect(src).toContain("draftQuestion.length >= 108");
  });

  it("옵션 카운터 — /80 표시 (72자 이상 시)", () => {
    expect(src).toContain("/80");
    expect(src).toContain("opt.length >= 72");
  });

  it("옵션 input — aria-label 존재", () => {
    expect(src).toContain('aria-label={`옵션 ${i + 1}`}');
  });

  it("질문 input — aria-label 존재", () => {
    expect(src).toContain('aria-label="투표 질문"');
  });
});

/* ═══════ CommentSection ═══════ */
describe("CommentSection 글자수 카운터", () => {
  const src = readSrc("components/share/CommentSection.tsx");

  it("닉네임 카운터 — /10 표시", () => {
    expect(src).toContain("/10");
  });

  it("닉네임 카운터 — aria-describedby 연결", () => {
    expect(src).toContain('aria-describedby="nickname-count"');
    expect(src).toContain('id="nickname-count"');
  });

  it("닉네임 — 2자 미만 시 text-danger", () => {
    expect(src).toContain("nickname.length < 2");
    expect(src).toContain("text-danger");
  });

  it("본문 카운터 — /200 표시", () => {
    expect(src).toContain("/200");
  });

  it("본문 카운터 — aria-describedby 연결", () => {
    expect(src).toContain('aria-describedby="comment-body-count"');
    expect(src).toContain('id="comment-body-count"');
  });

  it("본문 — 180자 이상 시 text-danger", () => {
    expect(src).toContain("body.length >= 180");
  });

  it("본문 카운터 — aria-live='polite'", () => {
    // body count와 nickname count 둘 다 aria-live 있어야 함
    const matches = src.match(/aria-live="polite"/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });
});
