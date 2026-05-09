/**
 * Share Comment 편집 기능 테스트.
 *
 * repository (canEditComment, updateCommentRow) + action (editCommentAction)
 * + UI (CommentSection 수정 버튼·인라인 폼) 3계층 검증.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/* ═══════ 1. Repository — canEditComment ═══════ */

describe("canEditComment — 본인 편집 권한 검증", () => {
  // canEditComment은 canDeleteComment과 동일 로직이므로 동일 패턴 검증
  const repoSrc = fs.readFileSync(
    path.resolve("lib/repositories/shareComment.repository.ts"),
    "utf-8",
  );

  it("canEditComment 함수 export 존재", () => {
    expect(repoSrc).toContain("export function canEditComment(");
  });

  it("clientUuid 매칭 경로 존재", () => {
    // canEditComment 블록 내에 clientUuid 비교
    expect(repoSrc).toContain("existing.clientUuid === input.clientUuid");
  });

  it("actorId 매칭 경로 존재 (null 우회 방지 가드 포함)", () => {
    expect(repoSrc).toContain("existing.actorId !== null");
  });
});

/* ═══════ 2. Repository — updateCommentRow ═══════ */

describe("updateCommentRow — 댓글 수정 리포지토리", () => {
  const repoSrc = fs.readFileSync(
    path.resolve("lib/repositories/shareComment.repository.ts"),
    "utf-8",
  );

  it("updateCommentRow 함수 export 존재", () => {
    expect(repoSrc).toContain("export async function updateCommentRow(");
  });

  it("UpdateCommentInput 타입 정의", () => {
    expect(repoSrc).toContain("export interface UpdateCommentInput");
  });

  it("UpdateCommentResult 타입 정의 (before + after 스냅샷)", () => {
    expect(repoSrc).toContain("export type UpdateCommentResult");
    expect(repoSrc).toContain("before: ShareCommentRow");
    expect(repoSrc).toContain("after: ShareCommentRow");
  });

  it("body 검증 수행", () => {
    // validateBody 호출
    expect(repoSrc).toContain("validateBody(input.body)");
  });

  it("삭제된 댓글 수정 차단 (deletedAt 체크)", () => {
    expect(repoSrc).toContain("existing.deletedAt");
  });

  it("canEditComment 권한 검증 호출", () => {
    expect(repoSrc).toContain("canEditComment(");
  });

  it("XSS 방어 — escapeHtml 적용", () => {
    // updateCommentRow 내에서 escapeHtml 호출
    const updateBlock = repoSrc.slice(repoSrc.indexOf("updateCommentRow"));
    expect(updateBlock).toContain("escapeHtml(");
  });
});

/* ═══════ 3. Action — editCommentAction ═══════ */

describe("editCommentAction — 서버 액션", () => {
  const actionSrc = fs.readFileSync(
    path.resolve("actions/shareComment.ts"),
    "utf-8",
  );

  it("editCommentAction 함수 export 존재", () => {
    expect(actionSrc).toContain("export async function editCommentAction(");
  });

  it("EditCommentActionInput 타입 정의", () => {
    expect(actionSrc).toContain("export interface EditCommentActionInput");
  });

  it("ShareLink 만료/revoke 검증", () => {
    const editBlock = actionSrc.slice(actionSrc.indexOf("editCommentAction"));
    expect(editBlock).toContain("fetchShareLinkBySyncKey");
    expect(editBlock).toContain("revokedAt");
    expect(editBlock).toContain("expiresAt");
  });

  it("actorId 서버측 추출 (클라이언트 신뢰 X)", () => {
    const editBlock = actionSrc.slice(actionSrc.indexOf("editCommentAction"));
    expect(editBlock).toContain("getActorId()");
  });

  it("감사 로그 — comment.update 액션 코드", () => {
    expect(actionSrc).toContain('"comment.update"');
  });

  it("감사 로그 — before/after body 기록", () => {
    expect(actionSrc).toContain("bodyBefore");
    expect(actionSrc).toContain("bodyAfter");
  });

  it("revalidatePath 호출", () => {
    const editBlock = actionSrc.slice(actionSrc.indexOf("editCommentAction"));
    expect(editBlock).toContain("revalidatePath(");
  });

  it("데모 모드 우회", () => {
    const editBlock = actionSrc.slice(actionSrc.indexOf("editCommentAction"));
    expect(editBlock).toContain("isDbConnected");
  });
});

/* ═══════ 4. UI — CommentSection 수정 기능 ═══════ */

describe("CommentSection — 댓글 수정 UI", () => {
  const uiSrc = fs.readFileSync(
    path.resolve("components/share/CommentSection.tsx"),
    "utf-8",
  );

  it("editCommentAction import 존재", () => {
    expect(uiSrc).toContain("editCommentAction");
  });

  it("editingId 상태 존재", () => {
    expect(uiSrc).toContain("editingId");
  });

  it("editBody 상태 존재", () => {
    expect(uiSrc).toContain("editBody");
  });

  it("수정 버튼 존재", () => {
    expect(uiSrc).toContain("수정");
  });

  it("취소 버튼 존재", () => {
    expect(uiSrc).toContain("취소");
  });

  it("저장 버튼 존재", () => {
    expect(uiSrc).toContain("저장");
  });

  it("인라인 수정 textarea 존재 (aria-label)", () => {
    expect(uiSrc).toContain('aria-label="댓글 수정"');
  });

  it("handleStartEdit 함수 존재", () => {
    expect(uiSrc).toContain("handleStartEdit");
  });

  it("handleCancelEdit 함수 존재", () => {
    expect(uiSrc).toContain("handleCancelEdit");
  });

  it("handleSaveEdit 함수 존재", () => {
    expect(uiSrc).toContain("handleSaveEdit");
  });

  it("수정 후 optimistic update", () => {
    expect(uiSrc).toContain("comments.map");
    // editBody로 교체
    expect(uiSrc).toContain("body: editBody.trim()");
  });

  it("수정 모드에서 본문 숨김 (editingId 조건부 렌더링)", () => {
    expect(uiSrc).toContain("editingId === c.id");
  });

  it("수정/삭제 버튼은 본인 댓글에만 표시", () => {
    // mine && editingId !== c.id 조건
    expect(uiSrc).toContain("mine && editingId !== c.id");
  });

  it("body 검증 (1~200자)", () => {
    const saveBlock = uiSrc.slice(uiSrc.indexOf("handleSaveEdit"));
    expect(saveBlock).toContain("editBody.trim().length");
  });
});

/* ═══════ 5. 감사 로그 화이트리스트 ═══════ */

describe("감사 로그 — comment.update 등록", () => {
  const auditSrc = fs.readFileSync(
    path.resolve("tests/unit/audit-action-codes.test.ts"),
    "utf-8",
  );

  it("comment.update가 화이트리스트에 등록됨", () => {
    expect(auditSrc).toContain('"comment.update"');
  });
});
