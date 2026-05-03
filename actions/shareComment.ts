"use server";

/**
 * ShareComment Server Actions — 사이클 R (ADR-036).
 *
 * 익명 댓글/리액션. ShareLink 만료/revoke 시 차단 (repository 레벨).
 * AuditLog 동시 구현 (S-13 절대 규칙).
 */

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";
import { getActorId } from "@/lib/auth/session";
import { fetchShareLinkBySyncKey } from "@/lib/repositories/share.repository";
import {
  createCommentRow,
  deleteCommentRow,
  type CommentReaction,
  type CreateCommentResult,
  type ShareError,
} from "@/lib/repositories/shareComment.repository";
import { isDbConnected } from "@/lib/prisma";

export interface CreateCommentActionInput {
  syncKey: string;
  itemId?: string | null;
  nickname: string;
  body: string;
  reaction?: CommentReaction;
  clientUuid: string;
}

export type CreateCommentActionResult =
  | { ok: true; demo: true }
  | { ok: true; demo: false; commentId: string }
  | { ok: false; code: ShareError; message?: string };

export async function createCommentAction(
  input: CreateCommentActionInput,
): Promise<CreateCommentActionResult> {
  if (!isDbConnected) {
    // 데모 모드 — 클라이언트 LocalStorage에서 처리
    return { ok: true, demo: true };
  }

  // ShareLink 만료/revoke 검증 (repository 레벨)
  const link = await fetchShareLinkBySyncKey(input.syncKey);
  if (!link) return { ok: false, code: "not_found" };
  const linkRow = link.link;
  if (linkRow.revokedAt) return { ok: false, code: "revoked" };
  if (linkRow.expiresAt && new Date(linkRow.expiresAt) < new Date()) {
    return { ok: false, code: "expired" };
  }

  // 사이클 GG (ADR-038 트리거 ②) — 카카오 OAuth 사용자는 actorId 매핑, 익명은 null.
  // 클라이언트가 보내는 값 신뢰 X — 서버 JWT에서만 추출.
  const actorId = await getActorId();

  const result: CreateCommentResult = await createCommentRow({
    shareLinkId: linkRow.id,
    itemId: input.itemId ?? null,
    nickname: input.nickname,
    body: input.body,
    reaction: input.reaction ?? null,
    clientUuid: input.clientUuid,
    actorId,
  });

  if (!result.ok) {
    return { ok: false, code: result.code, message: result.message };
  }

  await writeAuditLog({
    actorId,
    action: "comment.create",
    resource: "ShareComment",
    resourceId: result.comment.id,
    metadata: {
      shareLinkId: linkRow.id,
      tripId: linkRow.tripId,
      itemId: input.itemId ?? null,
      hasReaction: !!input.reaction,
    },
  });

  revalidatePath(`/share/${input.syncKey}`);
  return { ok: true, demo: false, commentId: result.comment.id };
}

export interface DeleteCommentActionInput {
  syncKey: string;
  commentId: string;
  clientUuid: string;
}

export async function deleteCommentAction(
  input: DeleteCommentActionInput,
): Promise<{ ok: boolean; code?: ShareError }> {
  if (!isDbConnected) return { ok: true };

  // OAuth 사용자가 LocalStorage 초기화 후에도 본인 댓글 삭제 가능 — clientUuid OR actorId.
  const actorId = await getActorId();

  const result = await deleteCommentRow({
    commentId: input.commentId,
    clientUuid: input.clientUuid,
    actorId,
  });

  if (!result.ok) return result;

  await writeAuditLog({
    actorId,
    action: "comment.delete",
    resource: "ShareComment",
    resourceId: input.commentId,
    metadata: { syncKey: input.syncKey },
  });

  revalidatePath(`/share/${input.syncKey}`);
  return { ok: true };
}
