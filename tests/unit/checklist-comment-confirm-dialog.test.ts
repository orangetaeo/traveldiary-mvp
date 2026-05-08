/**
 * ChecklistView + CommentSection — ConfirmDialog 적용 검증.
 *
 * 모든 window.confirm() / confirm() 호출이 ConfirmDialog로 교체됨.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/* ═══════ 1. ChecklistView ═══════ */

const checkSrc = fs.readFileSync(
  path.resolve("components/checklist/ChecklistView.tsx"),
  "utf-8",
);

describe("ChecklistView — ConfirmDialog 적용", () => {
  it("native confirm() 미사용", () => {
    // confirm( 패턴이 있으되, showBulkDeleteConfirm 같은 state 이름은 허용
    const lines = checkSrc.split("\n");
    const confirmCalls = lines.filter(
      (l) => /\bconfirm\(/.test(l) && !l.includes("Confirm") && !l.includes("confirm ="),
    );
    expect(confirmCalls).toHaveLength(0);
  });

  it("ConfirmDialog import 존재", () => {
    expect(checkSrc).toContain("ConfirmDialog");
  });

  it("단일 삭제 — deletingItem 상태", () => {
    expect(checkSrc).toContain("deletingItem");
  });

  it("단일 삭제 — handleConfirmDelete 함수", () => {
    expect(checkSrc).toContain("handleConfirmDelete");
  });

  it("일괄 삭제 — showBulkDeleteConfirm 상태", () => {
    expect(checkSrc).toContain("showBulkDeleteConfirm");
  });

  it("일괄 삭제 — executeBulkDelete 함수", () => {
    expect(checkSrc).toContain("executeBulkDelete");
  });

  it("템플릿 추가 — showTemplateConfirm 상태", () => {
    expect(checkSrc).toContain("showTemplateConfirm");
  });

  it("템플릿 추가 — executeAddTemplate 함수", () => {
    expect(checkSrc).toContain("executeAddTemplate");
  });

  it("3개의 ConfirmDialog 렌더링", () => {
    const matches = checkSrc.match(/<ConfirmDialog/g);
    expect(matches?.length).toBe(3);
  });

  it("템플릿 추가 — danger=false (비파괴적 동작)", () => {
    expect(checkSrc).toContain("danger={false}");
  });

  it("일괄 삭제 — 아이콘 delete_sweep", () => {
    expect(checkSrc).toContain("delete_sweep");
  });

  it("템플릿 추가 — 아이콘 playlist_add", () => {
    expect(checkSrc).toContain("playlist_add");
  });
});

/* ═══════ 2. CommentSection ═══════ */

const commentSrc = fs.readFileSync(
  path.resolve("components/share/CommentSection.tsx"),
  "utf-8",
);

describe("CommentSection — ConfirmDialog 적용", () => {
  it("native confirm() 미사용", () => {
    const lines = commentSrc.split("\n");
    const confirmCalls = lines.filter(
      (l) => /\bconfirm\(/.test(l) && !l.includes("Confirm") && !l.includes("confirm ="),
    );
    expect(confirmCalls).toHaveLength(0);
  });

  it("ConfirmDialog import 존재", () => {
    expect(commentSrc).toContain("ConfirmDialog");
  });

  it("deletingCommentId 상태 존재", () => {
    expect(commentSrc).toContain("deletingCommentId");
  });

  it("handleConfirmDeleteComment 함수 존재", () => {
    expect(commentSrc).toContain("handleConfirmDeleteComment");
  });

  it("ConfirmDialog 렌더링", () => {
    expect(commentSrc).toContain("<ConfirmDialog");
    expect(commentSrc).toContain('title="댓글 삭제"');
  });
});

/* ═══════ 3. 이번 PR 대상 — native confirm 잔여 검증 ═══════ */

describe("ChecklistView + CommentSection — native confirm() 제거 완료", () => {
  const files = [
    "components/checklist/ChecklistView.tsx",
    "components/share/CommentSection.tsx",
  ];

  for (const file of files) {
    it(`${file} — window.confirm/confirm() 미사용`, () => {
      const src = fs.readFileSync(path.resolve(file), "utf-8");
      const lines = src.split("\n");
      const calls = lines.filter(
        (l) =>
          (/window\.confirm/.test(l) || /\bconfirm\(/.test(l)) &&
          !l.includes("Confirm") &&
          !l.includes("confirm =") &&
          !l.includes("showBulkDeleteConfirm") &&
          !l.includes("showTemplateConfirm") &&
          !l.includes("handleConfirm"),
      );
      expect(calls).toHaveLength(0);
    });
  }
});
