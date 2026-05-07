/**
 * actions/share.ts 단위 테스트.
 *
 * createShareLinkAction — 데모/권한/DB 저장/audit log 분기.
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

const mockCanWriteTrip = vi.fn();
vi.mock("@/lib/auth/authorize", () => ({
  canWriteTrip: (...args: unknown[]) => mockCanWriteTrip(...args),
}));

const mockCreateShareLinkRow = vi.fn();
vi.mock("@/lib/repositories/share.repository", () => ({
  createShareLinkRow: (...args: unknown[]) => mockCreateShareLinkRow(...args),
}));

let mockIsDbConnected = true;
vi.mock("@/lib/prisma", () => ({
  get isDbConnected() { return mockIsDbConnected; },
}));

vi.mock("@/lib/seed", () => ({
  DEMO_TRIP_ID: "demo-trip-danang",
}));

// randomBytes mock — 고정 syncKey 반환
vi.mock("crypto", () => ({
  randomBytes: () => ({
    toString: () => "test-sync-key-base64url",
  }),
}));

import { createShareLinkAction } from "@/actions/share";

describe("createShareLinkAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsDbConnected = true;
    mockGetActorId.mockResolvedValue("user-1");
    mockCanWriteTrip.mockResolvedValue(true);
    mockWriteAuditLog.mockResolvedValue(undefined);
  });

  it("DB 미연결 → demo + syncKey", async () => {
    mockIsDbConnected = false;
    const r = await createShareLinkAction({ tripId: "t1" });
    expect(r.ok).toBe(true);
    if (r.ok && "demo" in r && r.demo) {
      expect(r.syncKey).toBe("test-sync-key-base64url");
    }
  });

  it("데모 trip ID → demo", async () => {
    const r = await createShareLinkAction({ tripId: "demo-trip-danang" });
    expect(r).toMatchObject({ ok: true, demo: true });
  });

  it("권한 없음 → forbidden", async () => {
    mockCanWriteTrip.mockResolvedValue(false);
    const r = await createShareLinkAction({ tripId: "t1" });
    expect(r).toEqual({ ok: false, code: "forbidden" });
  });

  it("DB 저장 실패 → internal", async () => {
    mockCreateShareLinkRow.mockResolvedValue(null);
    const r = await createShareLinkAction({ tripId: "t1" });
    expect(r).toEqual({ ok: false, code: "internal" });
  });

  it("성공 → ok + data + audit log", async () => {
    const link = {
      id: "link-1",
      tripId: "t1",
      syncKey: "test-sync-key-base64url",
      permission: "view",
      expiresAt: new Date("2026-06-06"),
    };
    mockCreateShareLinkRow.mockResolvedValue(link);

    const r = await createShareLinkAction({ tripId: "t1" });

    expect(r).toMatchObject({ ok: true, demo: false, data: link });
    expect(mockWriteAuditLog).toHaveBeenCalledOnce();
    const log = mockWriteAuditLog.mock.calls[0][0];
    expect(log.action).toBe("share.create");
    expect(log.resource).toBe("ShareLink");
    expect(log.resourceId).toBe("link-1");
    expect(log.after.permission).toBe("view");
  });

  it("기본 permission = view", async () => {
    mockCreateShareLinkRow.mockResolvedValue({ id: "l1", tripId: "t1" });
    await createShareLinkAction({ tripId: "t1" });
    const arg = mockCreateShareLinkRow.mock.calls[0][0];
    expect(arg.permission).toBe("view");
  });

  it("permission = edit 전달", async () => {
    mockCreateShareLinkRow.mockResolvedValue({ id: "l1", tripId: "t1" });
    await createShareLinkAction({ tripId: "t1", permission: "edit" });
    const arg = mockCreateShareLinkRow.mock.calls[0][0];
    expect(arg.permission).toBe("edit");
  });

  it("기본 만료일 30일", async () => {
    mockCreateShareLinkRow.mockResolvedValue({ id: "l1", tripId: "t1" });
    const before = Date.now();
    await createShareLinkAction({ tripId: "t1" });
    const arg = mockCreateShareLinkRow.mock.calls[0][0];
    const expiresAt = arg.expiresAt as Date;
    const diffDays = (expiresAt.getTime() - before) / (24 * 60 * 60 * 1000);
    expect(diffDays).toBeGreaterThan(29);
    expect(diffDays).toBeLessThanOrEqual(31);
  });

  it("커스텀 만료일 7일", async () => {
    mockCreateShareLinkRow.mockResolvedValue({ id: "l1", tripId: "t1" });
    const before = Date.now();
    await createShareLinkAction({ tripId: "t1", expiresInDays: 7 });
    const arg = mockCreateShareLinkRow.mock.calls[0][0];
    const expiresAt = arg.expiresAt as Date;
    const diffDays = (expiresAt.getTime() - before) / (24 * 60 * 60 * 1000);
    expect(diffDays).toBeGreaterThan(6);
    expect(diffDays).toBeLessThanOrEqual(8);
  });
});
