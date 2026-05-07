/**
 * 사이클 10 (ADR-049 §위험) — restoreUserAccount 트랜잭션 단위 테스트.
 *
 * audit-log atomicity (S-13 박제) + 안전 가드(다른 user 소유 trip skip) 단언.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// 트랜잭션 mock — anonymize 테스트 패턴 답습
type TripRow = { id: string; ownerId: string };

interface MockState {
  user: { id: string; deletedAt: Date | null } | null;
  trips: TripRow[];
  auditCalls: Array<Record<string, unknown>>;
  userUpdateCalls: Array<Record<string, unknown>>;
}

const state: MockState = {
  user: null,
  trips: [],
  auditCalls: [],
  userUpdateCalls: [],
};

function createTx() {
  return {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
        state.user && state.user.id === where.id ? state.user : null,
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Record<string, unknown>;
        }) => {
          state.userUpdateCalls.push({ where, data });
          if (state.user && state.user.id === where.id) {
            state.user = { ...state.user, ...(data as { deletedAt?: Date | null }) };
          }
          return state.user;
        },
      ),
    },
    trip: {
      findMany: vi.fn(
        async ({
          where,
        }: {
          where: { id: { in: string[] }; ownerId: string };
        }) => {
          return state.trips.filter(
            (t) =>
              where.id.in.includes(t.id) && t.ownerId === where.ownerId,
          );
        },
      ),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: { in: string[] }; ownerId: string };
          data: { ownerId: string };
        }) => {
          let count = 0;
          for (const t of state.trips) {
            if (where.id.in.includes(t.id) && t.ownerId === where.ownerId) {
              t.ownerId = data.ownerId;
              count++;
            }
          }
          return { count };
        },
      ),
    },
    auditLog: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        state.auditCalls.push(data);
      }),
    },
  };
}

const mockPrisma = {
  $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(createTx())),
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

beforeEach(() => {
  state.user = null;
  state.trips = [];
  state.auditCalls = [];
  state.userUpdateCalls = [];
  vi.clearAllMocks();
  mockPrisma.$transaction.mockImplementation(
    async (fn: (tx: unknown) => unknown) => fn(createTx()),
  );
});

describe("restoreUserAccount", () => {
  it("user_not_found → reason 반환", async () => {
    const { restoreUserAccount } = await import("@/lib/auth/account-restore");
    const result = await restoreUserAccount({
      userId: "missing",
      email: null,
      kakaoId: null,
      name: null,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("user_not_found");
  });

  it("이미 복구된 user(deletedAt=null) → user_not_anonymized", async () => {
    state.user = { id: "u1", deletedAt: null };
    const { restoreUserAccount } = await import("@/lib/auth/account-restore");
    const result = await restoreUserAccount({
      userId: "u1",
      email: "x@example.com",
      kakaoId: null,
      name: null,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("user_not_anonymized");
  });

  it("정상 복구 (PII만, trip 없음) → ok + restoredTripCount=0", async () => {
    state.user = { id: "u1", deletedAt: new Date() };
    const { restoreUserAccount } = await import("@/lib/auth/account-restore");
    const result = await restoreUserAccount({
      userId: "u1",
      email: "x@example.com",
      kakaoId: "kakao-1",
      name: "홍길동",
    });
    expect(result.ok).toBe(true);
    expect(result.restoredTripCount).toBe(0);
    expect(state.userUpdateCalls).toHaveLength(1);
    expect(state.userUpdateCalls[0].data).toMatchObject({
      deletedAt: null,
      email: "x@example.com",
      kakaoId: "kakao-1",
      name: "홍길동",
    });
  });

  it("Trip reassign — SYSTEM_OWNER_ID인 trip만 reassign", async () => {
    state.user = { id: "u1", deletedAt: new Date() };
    state.trips = [
      { id: "t1", ownerId: "system-owner-pqc" },
      { id: "t2", ownerId: "system-owner-pqc" },
      { id: "t3", ownerId: "other-user" }, // 다른 user 소유 — skip 대상
    ];
    const { restoreUserAccount } = await import("@/lib/auth/account-restore");
    const result = await restoreUserAccount({
      userId: "u1",
      email: null,
      kakaoId: null,
      name: null,
      reassignTripIds: ["t1", "t2", "t3"],
    });
    expect(result.ok).toBe(true);
    expect(result.restoredTripCount).toBe(2);
    expect(result.skippedTripIds).toEqual(["t3"]);
    // 실제 ownerId 변경 확인
    expect(state.trips.find((t) => t.id === "t1")?.ownerId).toBe("u1");
    expect(state.trips.find((t) => t.id === "t2")?.ownerId).toBe("u1");
    expect(state.trips.find((t) => t.id === "t3")?.ownerId).toBe(
      "other-user",
    );
  });

  it("audit log은 트랜잭션 내부 atomic (S-13 박제)", async () => {
    state.user = { id: "u1", deletedAt: new Date() };
    state.trips = [{ id: "t1", ownerId: "system-owner-pqc" }];
    const { restoreUserAccount } = await import("@/lib/auth/account-restore");
    await restoreUserAccount({
      userId: "u1",
      email: "x@y.com",
      kakaoId: null,
      name: null,
      reassignTripIds: ["t1"],
      operator: "ops-A",
    });
    expect(state.auditCalls).toHaveLength(1);
    expect(state.auditCalls[0]).toMatchObject({
      actorId: "u1",
      action: "auth.account_restore",
      resource: "User",
      resourceId: "u1",
    });
    const meta = state.auditCalls[0].metadata as Record<string, unknown>;
    expect(meta.operator).toBe("ops-A");
    expect(meta.restoredTripCount).toBe(1);
    expect(meta.requestedTripCount).toBe(1);
  });

  it("source grep — tx.auditLog.create 박제 (외부 writeAuditLog 미사용)", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const src = fs.readFileSync(
      path.resolve("lib/auth/account-restore.ts"),
      "utf-8",
    );
    expect(src).toContain("tx.auditLog.create");
    expect(src).not.toContain("writeAuditLog(");
    expect(src).toContain("$transaction");
  });

  it("MAX_TRIP_IDS 50 cap 박제", async () => {
    const { ACCOUNT_RESTORE_MAX_TRIP_IDS } = await import(
      "@/lib/auth/account-restore"
    );
    expect(ACCOUNT_RESTORE_MAX_TRIP_IDS).toBe(50);
  });

  it("51개 tripIds 입력 시 처음 50개만 처리 (cap)", async () => {
    state.user = { id: "u1", deletedAt: new Date() };
    state.trips = Array.from({ length: 60 }, (_, i) => ({
      id: `t${i}`,
      ownerId: "system-owner-pqc",
    }));
    const requested = Array.from({ length: 51 }, (_, i) => `t${i}`);
    const { restoreUserAccount } = await import("@/lib/auth/account-restore");
    const result = await restoreUserAccount({
      userId: "u1",
      email: null,
      kakaoId: null,
      name: null,
      reassignTripIds: requested,
    });
    expect(result.ok).toBe(true);
    expect(result.restoredTripCount).toBe(50);
  });

  it("빈 userId → user_not_found (입력 가드)", async () => {
    const { restoreUserAccount } = await import("@/lib/auth/account-restore");
    const result = await restoreUserAccount({
      userId: "",
      email: null,
      kakaoId: null,
      name: null,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("user_not_found");
  });
});
