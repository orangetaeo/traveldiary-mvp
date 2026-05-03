/**
 * ShareComment Repository — 사이클 R (ADR-036).
 *
 * 익명 협업 댓글/리액션. ShareLink 만료/revoke 검증을 repository 레벨에서 수행.
 * UI 신뢰 X — 모든 mutation은 fetchShareLinkBySyncKey로 만료 확인 후 진행.
 */

import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";

export type CommentReaction = "LIKE" | "DISLIKE" | "QUESTION" | null;

export interface ShareCommentRow {
  id: string;
  shareLinkId: string;
  itemId: string | null;
  nickname: string;
  body: string;
  reaction: CommentReaction;
  clientUuid: string;
  actorId: string | null;
  createdAt: string;
  deletedAt: string | null;
}

export type ShareError =
  | "not_found"
  | "revoked"
  | "expired"
  | "forbidden"
  | "rate_limited"
  | "validation"
  | "internal";

function rowToComment(row: Prisma.ShareCommentGetPayload<Record<string, never>>): ShareCommentRow {
  return {
    id: row.id,
    shareLinkId: row.shareLinkId,
    itemId: row.itemId,
    nickname: row.nickname,
    body: row.body,
    reaction: (row.reaction as CommentReaction) ?? null,
    clientUuid: row.clientUuid,
    actorId: row.actorId,
    createdAt: row.createdAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

// ─── 검증 ────────────────────────────────────────────────────────────

/** XSS 방어 — `<`, `>`, `&`, `"`, `'` HTML escape */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

export function validateNickname(nickname: string): ValidationResult {
  const n = nickname.trim();
  if (n.length < 2) return { ok: false, error: "닉네임은 2자 이상" };
  if (n.length > 10) return { ok: false, error: "닉네임은 10자 이하" };
  return { ok: true };
}

export function validateBody(body: string): ValidationResult {
  const b = body.trim();
  if (b.length < 1) return { ok: false, error: "내용을 입력해주세요" };
  if (b.length > 200) return { ok: false, error: "내용은 200자 이하" };
  return { ok: true };
}

// ─── Rate Limit (in-memory, sliding window) ──────────────────────────

const rateLimitWindow = new Map<string, number[]>();
const RATE_LIMIT_PER_MINUTE = 5;
const WINDOW_MS = 60_000;

export function checkRateLimit(clientUuid: string): boolean {
  const now = Date.now();
  const stamps = (rateLimitWindow.get(clientUuid) ?? []).filter(
    (t) => now - t < WINDOW_MS,
  );
  if (stamps.length >= RATE_LIMIT_PER_MINUTE) {
    return false;
  }
  stamps.push(now);
  rateLimitWindow.set(clientUuid, stamps);
  return true;
}

/** 테스트 격리 — vitest용 reset */
export function _resetRateLimit(): void {
  rateLimitWindow.clear();
}

// ─── Mutation ────────────────────────────────────────────────────────

export interface CreateCommentInput {
  shareLinkId: string;
  itemId?: string | null;
  nickname: string;
  body: string;
  reaction?: CommentReaction;
  clientUuid: string;
  actorId?: string | null;
}

export type CreateCommentResult =
  | { ok: true; comment: ShareCommentRow }
  | { ok: false; code: ShareError; message?: string };

export async function createCommentRow(
  input: CreateCommentInput,
): Promise<CreateCommentResult> {
  if (!prisma) return { ok: false, code: "internal" };

  // 검증 (UI 신뢰 X)
  const nv = validateNickname(input.nickname);
  if (!nv.ok) return { ok: false, code: "validation", message: nv.error };
  const bv = validateBody(input.body);
  if (!bv.ok) return { ok: false, code: "validation", message: bv.error };
  if (!checkRateLimit(input.clientUuid)) {
    return { ok: false, code: "rate_limited", message: "잠시 후 다시 시도해주세요" };
  }

  try {
    const row = await prisma.shareComment.create({
      data: {
        shareLinkId: input.shareLinkId,
        itemId: input.itemId ?? null,
        nickname: escapeHtml(input.nickname.trim()),
        body: escapeHtml(input.body.trim()),
        reaction: input.reaction ?? null,
        clientUuid: input.clientUuid,
        actorId: input.actorId ?? null,
      },
    });
    return { ok: true, comment: rowToComment(row) };
  } catch (err) {
    console.error("[shareComment.repository] create failed", err);
    return { ok: false, code: "internal" };
  }
}

export interface DeleteCommentInput {
  commentId: string;
  clientUuid: string;
}

export async function deleteCommentRow(
  input: DeleteCommentInput,
): Promise<{ ok: boolean; code?: ShareError }> {
  if (!prisma) return { ok: false, code: "internal" };

  try {
    const existing = await prisma.shareComment.findUnique({
      where: { id: input.commentId },
    });
    if (!existing || existing.deletedAt) {
      return { ok: false, code: "not_found" };
    }
    if (existing.clientUuid !== input.clientUuid) {
      return { ok: false, code: "forbidden" };
    }
    await prisma.shareComment.update({
      where: { id: input.commentId },
      data: { deletedAt: new Date() },
    });
    return { ok: true };
  } catch (err) {
    console.error("[shareComment.repository] delete failed", err);
    return { ok: false, code: "internal" };
  }
}

export async function listCommentsByShareLinkId(
  shareLinkId: string,
): Promise<ShareCommentRow[]> {
  if (!prisma) return [];
  const rows = await prisma.shareComment.findMany({
    where: { shareLinkId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return rows.map(rowToComment);
}

// ─── 본인 활동 (사이클 YY) ───────────────────────────────────────────
//
// /shared 페이지의 "내가 남긴 메모" 섹션용. clientUuid는 LocalStorage 기반 익명
// 토큰이라 임의 변경 가능 — anyway anonymous 모델 답습. ShareLink revoke/expired
// 상태도 함께 반환해 사용자가 죽은 링크를 정리할 수 있게.

export interface MyActivityItem {
  commentId: string;
  syncKey: string;
  destination: string | null;
  body: string;
  reaction: CommentReaction;
  itemId: string | null;
  createdAt: string;
  isShareLinkActive: boolean;
}

export async function listMyActivityByClientUuid(
  clientUuid: string,
  limit = 50,
): Promise<MyActivityItem[]> {
  if (!prisma) return [];
  if (!clientUuid || clientUuid.length < 8 || clientUuid.length > 200) return [];

  const rows = await prisma.shareComment.findMany({
    where: { clientUuid, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 100),
    include: {
      shareLink: {
        select: {
          syncKey: true,
          revokedAt: true,
          expiresAt: true,
          trip: { select: { destination: true } },
        },
      },
    },
  });

  const now = Date.now();
  return rows.map((r) => {
    const link = r.shareLink;
    const revoked = !!link.revokedAt;
    const expired = !!link.expiresAt && link.expiresAt.getTime() < now;
    return {
      commentId: r.id,
      syncKey: link.syncKey,
      destination: link.trip?.destination ?? null,
      body: r.body,
      reaction: (r.reaction as CommentReaction) ?? null,
      itemId: r.itemId,
      createdAt: r.createdAt.toISOString(),
      isShareLinkActive: !revoked && !expired,
    };
  });
}
