/**
 * actions/shareComment.ts 단위 테스트.
 *
 * createCommentAction + deleteCommentAction — 데모/만료/revoke/DB/audit 분기.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockWriteAuditLog = vi.fn();
vi.mock("@/lib/audit-log", () => ({
  writeAuditLog: (...args: unknown[]) => mockWriteAuditLog(...args),
}));

const mockGetActorId = vi.fn();
vi.mock("@/lib/auth/session", () => ({
  getActorId: () => mockGetActorId(),
}));

const mockFetchShareLinkBySyncKey = vi.fn();
vi.mock("@/lib/repositories/share.repository", () => ({
  fetchShareLinkBySyncKey: (...args: unknown[]) => mockFetchShareLinkBySyncKey(...args),
}));

const mockCreateCommentRow = vi.fn();
const mockDeleteCommentRow = vi.fn();
vi.mock("@/lib/repositories/shareComment.repository", () => ({
  createCommentRow: (...args: unknown[]) => mockCreateCommentRow(...args),
  deleteCommentRow: (...args: unknown[]) => mockDeleteCommentRow(...args),
}));

let mockIsDbConnected = true;
vi.mock("@/lib/prisma", () => ({
  get isDbConnected() { return mockIsDbConnected; },
}));

import {
  createCommentAction,
  deleteCommentAction,
} from "@/actions/shareComment";

// ═══════════════════════════════════════════════════════════════
// createCommentAction
// ═══════════════════════════════════════════════════════════════

describe("createCommentAction", () => {
  const BASE_INPUT = {
    syncKey: "sync-abc",
    nickname: "여행자",
    body: "좋은 일정이네요!",
    clientUuid: "uuid-1",
  };

  const ACTIVE_LINK = {
    link: {
      id: "link-1",
      tripId: "t1",
      revokedAt: null,
      expiresAt: new Date(Date.now() + 86400000).toISOString(), // 1일 후
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsDbConnected = true;
    mockGetActorId.mockResolvedValue("user-1");
    mockWriteAuditLog.mockResolvedValue(undefined);
    mockFetchShareLinkBySyncKey.mockResolvedValue(ACTIVE_LINK);
  });

  it("DB 미연결 → demo", async () => {
    mockIsDbConnected = false;
    const r = await createCommentAction(BASE_INPUT);
    expect(r).toEqual({ ok: true, demo: true });
  });

  it("syncKey 미존재 → not_found", async () => {
    mockFetchShareLinkBySyncKey.mockResolvedValue(null);
    const r = await createCommentAction(BASE_INPUT);
    expect(r).toEqual({ ok: false, code: "not_found" });
  });

  it("링크 revoked → revoked", async () => {
    mockFetchShareLinkBySyncKey.mockResolvedValue({
      link: { ...ACTIVE_LINK.link, revokedAt: new Date().toISOString() },
    });
    const r = await createCommentAction(BASE_INPUT);
    expect(r).toEqual({ ok: false, code: "revoked" });
  });

  it("링크 만료 → expired", async () => {
    mockFetchShareLinkBySyncKey.mockResolvedValue({
      link: { ...ACTIVE_LINK.link, expiresAt: new Date("2020-01-01").toISOString() },
    });
    const r = await createCommentAction(BASE_INPUT);
    expect(r).toEqual({ ok: false, code: "expired" });
  });

  it("createCommentRow 실패 → 에러 전달", async () => {
    mockCreateCommentRow.mockResolvedValue({ ok: false, code: "rate_limited", message: "too fast" });
    const r = await createCommentAction(BASE_INPUT);
    expect(r).toEqual({ ok: false, code: "rate_limited", message: "too fast" });
  });

  it("성공 → ok + commentId + audit log", async () => {
    mockCreateCommentRow.mockResolvedValue({
      ok: true,
      comment: { id: "comment-1" },
    });

    const r = await createCommentAction(BASE_INPUT);

    expect(r).toEqual({ ok: true, demo: false, commentId: "comment-1" });
    expect(mockWriteAuditLog).toHaveBeenCalledOnce();
    const log = mockWriteAuditLog.mock.calls[0][0];
    expect(log.action).toBe("comment.create");
    expect(log.resource).toBe("ShareComment");
    expect(log.resourceId).toBe("comment-1");
    expect(log.metadata.shareLinkId).toBe("link-1");
  });

  it("itemId 전달", async () => {
    mockCreateCommentRow.mockResolvedValue({
      ok: true,
      comment: { id: "c-2" },
    });

    await createCommentAction({ ...BASE_INPUT, itemId: "item-1" });

    const arg = mockCreateCommentRow.mock.calls[0][0];
    expect(arg.itemId).toBe("item-1");
    const log = mockWriteAuditLog.mock.calls[0][0];
    expect(log.metadata.itemId).toBe("item-1");
  });

  it("reaction 전달", async () => {
    mockCreateCommentRow.mockResolvedValue({
      ok: true,
      comment: { id: "c-3" },
    });

    await createCommentAction({ ...BASE_INPUT, reaction: "heart" });

    const arg = mockCreateCommentRow.mock.calls[0][0];
    expect(arg.reaction).toBe("heart");
    const log = mockWriteAuditLog.mock.calls[0][0];
    expect(log.metadata.hasReaction).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// deleteCommentAction
// ═══════════════════════════════════════════════════════════════

describe("deleteCommentAction", () => {
  const BASE_INPUT = {
    syncKey: "sync-abc",
    commentId: "comment-1",
    clientUuid: "uuid-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsDbConnected = true;
    mockGetActorId.mockResolvedValue("user-1");
    mockWriteAuditLog.mockResolvedValue(undefined);
  });

  it("DB 미연결 → ok", async () => {
    mockIsDbConnected = false;
    const r = await deleteCommentAction(BASE_INPUT);
    expect(r).toEqual({ ok: true });
  });

  it("deleteCommentRow 실패 → 에러 전달", async () => {
    mockDeleteCommentRow.mockResolvedValue({ ok: false, code: "not_found" });
    const r = await deleteCommentAction(BASE_INPUT);
    expect(r).toEqual({ ok: false, code: "not_found" });
  });

  it("성공 → ok + audit log", async () => {
    mockDeleteCommentRow.mockResolvedValue({ ok: true });

    const r = await deleteCommentAction(BASE_INPUT);

    expect(r).toEqual({ ok: true });
    expect(mockWriteAuditLog).toHaveBeenCalledOnce();
    const log = mockWriteAuditLog.mock.calls[0][0];
    expect(log.action).toBe("comment.delete");
    expect(log.resource).toBe("ShareComment");
    expect(log.resourceId).toBe("comment-1");
    expect(log.metadata.syncKey).toBe("sync-abc");
  });

  it("actorId 전달", async () => {
    mockGetActorId.mockResolvedValue("user-xyz");
    mockDeleteCommentRow.mockResolvedValue({ ok: true });

    await deleteCommentAction(BASE_INPUT);

    const log = mockWriteAuditLog.mock.calls[0][0];
    expect(log.actorId).toBe("user-xyz");
    // deleteCommentRow에도 actorId 전달
    const arg = mockDeleteCommentRow.mock.calls[0][0];
    expect(arg.actorId).toBe("user-xyz");
  });
});
