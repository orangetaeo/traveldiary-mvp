/**
 * 사이클 HH (ADR-038, T12 백로그) — P2003 FK race fallback 회귀.
 *
 * 사이클 GG에서 createCommentRow에 추가된 P2003 catch + actorId=null retry 분기는
 * 사이클 GG 시점에는 dead path (FK constraint 없음). 사이클 HH 마이그 0012 적용 후
 * User race condition으로 P2003 발생 시 actorId만 null로 떨어뜨려 익명화 fallback.
 *
 * vi.hoisted + vi.mock("@/lib/prisma") 패턴 — repository는 server-only이지만
 * 테스트는 mock 주입으로 분기 검증.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    shareComment: {
      create: mockCreate,
    },
  },
  isDbConnected: true,
}));

vi.mock("server-only", () => ({}));

import {
  createCommentRow,
  _resetRateLimit,
} from "@/lib/repositories/shareComment.repository";

function buildP2003(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError(
    "Foreign key constraint failed on the field: `actorId`",
    { code: "P2003", clientVersion: "7.0.0" },
  );
}

function buildRow(actorId: string | null) {
  return {
    id: "c-fallback-1",
    shareLinkId: "sl-1",
    itemId: null,
    nickname: "tester",
    body: "ok",
    reaction: null,
    clientUuid: "uuid-1",
    actorId,
    createdAt: new Date("2026-05-03T00:00:00Z"),
    deletedAt: null,
  };
}

describe("사이클 HH — P2003 FK fallback (T12 백로그)", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    _resetRateLimit();
  });

  it("actorId 있는 댓글에 P2003 발생 → actorId=null로 retry해 성공", async () => {
    mockCreate
      .mockRejectedValueOnce(buildP2003())
      .mockResolvedValueOnce(buildRow(null));

    const result = await createCommentRow({
      shareLinkId: "sl-1",
      nickname: "tester",
      body: "ok",
      clientUuid: "uuid-1",
      actorId: "user-deleted-race",
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.comment.actorId).toBe(null);
    expect(mockCreate).toHaveBeenCalledTimes(2);
    // 1회차: actorId 채워서 시도
    expect(mockCreate.mock.calls[0][0].data.actorId).toBe("user-deleted-race");
    // 2회차: actorId=null로 익명화 retry
    expect(mockCreate.mock.calls[1][0].data.actorId).toBe(null);
    // 본문/식별자는 보존
    expect(mockCreate.mock.calls[1][0].data.clientUuid).toBe("uuid-1");
  });

  it("actorId=null 익명 댓글의 P2003은 retry 안 함 (dead branch 가드)", async () => {
    mockCreate.mockRejectedValueOnce(buildP2003());

    const result = await createCommentRow({
      shareLinkId: "sl-1",
      nickname: "tester",
      body: "ok",
      clientUuid: "uuid-1",
      actorId: null,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("internal");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("P2003 외 다른 에러는 retry 없이 internal 반환", async () => {
    const otherErr = new Prisma.PrismaClientKnownRequestError("unique fail", {
      code: "P2002",
      clientVersion: "7.0.0",
    });
    mockCreate.mockRejectedValueOnce(otherErr);

    const result = await createCommentRow({
      shareLinkId: "sl-1",
      nickname: "tester",
      body: "ok",
      clientUuid: "uuid-1",
      actorId: "user-1",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("internal");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("P2003 retry도 실패하면 internal 반환 (무한 루프 차단)", async () => {
    mockCreate
      .mockRejectedValueOnce(buildP2003())
      .mockRejectedValueOnce(new Error("connection lost"));

    const result = await createCommentRow({
      shareLinkId: "sl-1",
      nickname: "tester",
      body: "ok",
      clientUuid: "uuid-1",
      actorId: "user-1",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("internal");
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});
