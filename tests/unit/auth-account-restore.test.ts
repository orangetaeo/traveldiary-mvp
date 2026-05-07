/**
 * lib/auth/account-restore.ts 단위 테스트.
 *
 * restoreUserAccount 트랜잭션 — PII 복원 + trip reassign + audit.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth/session", () => ({
  SYSTEM_OWNER_ID: "system-owner",
}));

vi.mock("@/lib/audit-log", () => ({
  sanitizeAuditValue: (v: unknown) => v,
}));

const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();
const mockUpdateMany = vi.fn();
const mockUpdate = vi.fn();
const mockAuditCreate = vi.fn();

const mockTx = {
  user: {
    findUnique: (...args: unknown[]) => mockFindUnique(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
  trip: {
    findMany: (...args: unknown[]) => mockFindMany(...args),
    updateMany: (...args: unknown[]) => mockUpdateMany(...args),
  },
  auditLog: {
    create: (...args: unknown[]) => mockAuditCreate(...args),
  },
};

let mockPrisma: unknown = {
  $transaction: (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx),
};

vi.mock("@/lib/prisma", () => ({
  get prisma() { return mockPrisma; },
}));

import {
  restoreUserAccount,
  ACCOUNT_RESTORE_MAX_TRIP_IDS,
} from "@/lib/auth/account-restore";

describe("restoreUserAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      $transaction: (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx),
    };
    mockUpdate.mockResolvedValue({});
    mockAuditCreate.mockResolvedValue({});
  });

  it("MAX_TRIP_IDS 상수 = 50", () => {
    expect(ACCOUNT_RESTORE_MAX_TRIP_IDS).toBe(50);
  });

  it("DB 미연결 → db_unavailable", async () => {
    mockPrisma = null;
    const r = await restoreUserAccount({
      userId: "u1",
      email: null,
      kakaoId: null,
      name: null,
    });
    expect(r).toEqual({ ok: false, reason: "db_unavailable" });
  });

  it("userId 빈 문자열 → user_not_found", async () => {
    const r = await restoreUserAccount({
      userId: "",
      email: null,
      kakaoId: null,
      name: null,
    });
    expect(r).toEqual({ ok: false, reason: "user_not_found" });
  });

  it("user 없음 → user_not_found", async () => {
    mockFindUnique.mockResolvedValue(null);
    const r = await restoreUserAccount({
      userId: "u1",
      email: "test@test.com",
      kakaoId: null,
      name: "테스터",
    });
    expect(r).toEqual({ ok: false, reason: "user_not_found" });
  });

  it("deletedAt null (미삭제 사용자) → user_not_anonymized", async () => {
    mockFindUnique.mockResolvedValue({ id: "u1", deletedAt: null });
    const r = await restoreUserAccount({
      userId: "u1",
      email: "test@test.com",
      kakaoId: null,
      name: "테스터",
    });
    expect(r).toEqual({ ok: false, reason: "user_not_anonymized" });
  });

  it("PII만 복원 (trip 없음) → ok + restoredTripCount=0", async () => {
    mockFindUnique.mockResolvedValue({ id: "u1", deletedAt: new Date() });

    const r = await restoreUserAccount({
      userId: "u1",
      email: "test@test.com",
      kakaoId: "kakao-123",
      name: "테스터",
    });

    expect(r.ok).toBe(true);
    expect(r.restoredTripCount).toBe(0);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: expect.objectContaining({
          deletedAt: null,
          email: "test@test.com",
          kakaoId: "kakao-123",
          name: "테스터",
        }),
      }),
    );
    expect(mockAuditCreate).toHaveBeenCalledOnce();
  });

  it("trip reassign — SYSTEM_OWNER_ID 소유만 이전", async () => {
    mockFindUnique.mockResolvedValue({ id: "u1", deletedAt: new Date() });
    mockFindMany.mockResolvedValue([{ id: "trip-1" }, { id: "trip-2" }]);
    mockUpdateMany.mockResolvedValue({ count: 2 });

    const r = await restoreUserAccount({
      userId: "u1",
      email: null,
      kakaoId: null,
      name: null,
      reassignTripIds: ["trip-1", "trip-2", "trip-3"],
    });

    expect(r.ok).toBe(true);
    expect(r.restoredTripCount).toBe(2);
    // trip-3은 SYSTEM_OWNER_ID 소유가 아니므로 skip
    expect(r.skippedTripIds).toEqual(["trip-3"]);
  });

  it("트랜잭션 예외 → tx_failed", async () => {
    mockPrisma = {
      $transaction: () => Promise.reject(new Error("deadlock")),
    };

    const r = await restoreUserAccount({
      userId: "u1",
      email: null,
      kakaoId: null,
      name: null,
    });
    expect(r).toEqual({ ok: false, reason: "tx_failed" });
  });

  it("audit log 기록 (action=auth.account_restore)", async () => {
    mockFindUnique.mockResolvedValue({ id: "u1", deletedAt: new Date() });

    await restoreUserAccount({
      userId: "u1",
      email: null,
      kakaoId: null,
      name: null,
      operator: "admin-cli",
    });

    const auditCall = mockAuditCreate.mock.calls[0][0];
    expect(auditCall.data.action).toBe("auth.account_restore");
    expect(auditCall.data.actorId).toBe("u1");
    expect(auditCall.data.metadata.operator).toBe("admin-cli");
  });
});
