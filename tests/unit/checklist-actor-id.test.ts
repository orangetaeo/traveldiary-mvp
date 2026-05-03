/**
 * 사이클 TT (ADR-045) — ChecklistItem.actorId NULLABLE 시범 도입 회귀.
 *
 * R1 사인오프 조건 (STEP 4):
 *  1. createChecklistItem이 actorId 받아 Prisma create.data에 전달
 *  2. actorId 미제공 시 null 저장 (NULL 호환성)
 *  3. bulkCreateChecklistItems가 두 번째 인자 actorId를 모든 row에 전파
 *  4. inputs[i].actorId가 있으면 우선 (per-row override)
 *  5. rowToItem이 row.actorId를 ChecklistItem.actorId로 노출
 *
 * 사이클 UUU (TT 백로그) — toggle/move/setDone/delete/bulkDelete가 actorId
 * 컬럼을 만지지 않음을 회귀 고정. write payload 키 부재 + read result 보존
 * 양방향 단언으로 silent drift 차단 (T12 권고). 미래 누군가 spread 리팩터로
 * actorId를 덮어쓰는 사고 방지.
 *
 * 답습: tests/unit/checklist-bulk-toggle.test.ts (vi.hoisted + vi.mock prisma).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockCreate,
  mockTransaction,
  mockUpdate,
  mockUpdateMany,
  mockDelete,
  mockDeleteMany,
  mockFindUnique,
  mockFindFirst,
  mockFindMany,
  mockFindUniqueOrThrow,
} = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockTransaction: vi.fn(),
  mockUpdate: vi.fn(),
  mockUpdateMany: vi.fn(),
  mockDelete: vi.fn(),
  mockDeleteMany: vi.fn(),
  mockFindUnique: vi.fn(),
  mockFindFirst: vi.fn(),
  mockFindMany: vi.fn(),
  mockFindUniqueOrThrow: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    checklistItem: {
      create: mockCreate,
      update: mockUpdate,
      updateMany: mockUpdateMany,
      delete: mockDelete,
      deleteMany: mockDeleteMany,
      findUnique: mockFindUnique,
      findFirst: mockFindFirst,
      findMany: mockFindMany,
      findUniqueOrThrow: mockFindUniqueOrThrow,
    },
    $transaction: mockTransaction,
  },
  isDbConnected: true,
}));

vi.mock("server-only", () => ({}));

import {
  createChecklistItem,
  bulkCreateChecklistItems,
  toggleChecklistItem,
  moveChecklistItem,
  setChecklistItemsDone,
  deleteChecklistItem,
  bulkDeleteChecklistItems,
} from "@/lib/repositories/checklist.repository";

interface TxStub {
  checklistItem: {
    create: typeof mockCreate;
    update: typeof mockUpdate;
    updateMany: typeof mockUpdateMany;
    delete: typeof mockDelete;
    deleteMany: typeof mockDeleteMany;
    findUnique: typeof mockFindUnique;
    findFirst: typeof mockFindFirst;
    findMany: typeof mockFindMany;
    findUniqueOrThrow: typeof mockFindUniqueOrThrow;
  };
}

function buildRow(overrides: {
  id?: string;
  tripId?: string;
  actorId?: string | null;
  category?: string;
  text?: string;
  dDayBucket?: string;
  sortOrder?: number;
}) {
  return {
    id: overrides.id ?? "ci-1",
    tripId: overrides.tripId ?? "trip-A",
    category: overrides.category ?? "documents",
    text: overrides.text ?? "여권",
    dDayBucket: overrides.dDayBucket ?? "D-30",
    done: false,
    cityNote: null,
    sortOrder: overrides.sortOrder ?? 0,
    actorId: overrides.actorId ?? null,
    createdAt: new Date("2026-05-03T00:00:00Z"),
    updatedAt: new Date("2026-05-03T00:00:00Z"),
  };
}

beforeEach(() => {
  mockCreate.mockReset();
  mockTransaction.mockReset();
  mockUpdate.mockReset();
  mockUpdateMany.mockReset();
  mockDelete.mockReset();
  mockDeleteMany.mockReset();
  mockFindUnique.mockReset();
  mockFindFirst.mockReset();
  mockFindMany.mockReset();
  mockFindUniqueOrThrow.mockReset();
  mockTransaction.mockImplementation(
    async (cb: (tx: TxStub) => Promise<unknown>) => {
      return cb({
        checklistItem: {
          create: mockCreate,
          update: mockUpdate,
          updateMany: mockUpdateMany,
          delete: mockDelete,
          deleteMany: mockDeleteMany,
          findUnique: mockFindUnique,
          findFirst: mockFindFirst,
          findMany: mockFindMany,
          findUniqueOrThrow: mockFindUniqueOrThrow,
        },
      });
    },
  );
});

describe("사이클 TT — createChecklistItem actorId stamp", () => {
  it("actorId 제공 시 Prisma create.data.actorId에 그대로 전달", async () => {
    mockCreate.mockResolvedValueOnce(
      buildRow({ id: "ci-1", actorId: "user-kakao-1" }),
    );

    const result = await createChecklistItem({
      tripId: "trip-A",
      category: "documents",
      text: "여권",
      dDayBucket: "D-30",
      actorId: "user-kakao-1",
    });

    expect(result).not.toBeNull();
    expect(result?.actorId).toBe("user-kakao-1");
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate.mock.calls[0][0].data.actorId).toBe("user-kakao-1");
  });

  it("actorId 미제공 시 null 저장 (NULL 호환성, legacy/DEMO/미인증)", async () => {
    mockCreate.mockResolvedValueOnce(buildRow({ actorId: null }));

    const result = await createChecklistItem({
      tripId: "trip-A",
      category: "documents",
      text: "여권",
      dDayBucket: "D-30",
    });

    expect(result?.actorId).toBe(null);
    expect(mockCreate.mock.calls[0][0].data.actorId).toBe(null);
  });

  it("actorId === null 명시도 null 저장 (DEMO_TRIP_ID 강제 패턴)", async () => {
    mockCreate.mockResolvedValueOnce(buildRow({ actorId: null }));

    await createChecklistItem({
      tripId: "trip-DEMO",
      category: "documents",
      text: "여권",
      dDayBucket: "D-30",
      actorId: null,
    });

    expect(mockCreate.mock.calls[0][0].data.actorId).toBe(null);
  });

  it("rowToItem이 DB row의 actorId를 ChecklistItem.actorId로 노출", async () => {
    mockCreate.mockResolvedValueOnce(
      buildRow({ id: "ci-2", actorId: "user-X" }),
    );

    const result = await createChecklistItem({
      tripId: "trip-A",
      category: "clothing",
      text: "여름옷",
      dDayBucket: "D-7",
      actorId: "user-X",
    });

    expect(result?.id).toBe("ci-2");
    expect(result?.actorId).toBe("user-X");
  });
});

describe("사이클 TT — bulkCreateChecklistItems actorId 전파", () => {
  it("두 번째 인자 actorId를 모든 row에 전파", async () => {
    mockCreate
      .mockResolvedValueOnce(buildRow({ id: "ci-1", actorId: "user-A" }))
      .mockResolvedValueOnce(buildRow({ id: "ci-2", actorId: "user-A" }))
      .mockResolvedValueOnce(buildRow({ id: "ci-3", actorId: "user-A" }));

    const result = await bulkCreateChecklistItems(
      "trip-A",
      [
        { category: "documents", text: "여권", dDayBucket: "D-30" },
        { category: "documents", text: "비자", dDayBucket: "D-30" },
        { category: "clothing", text: "여름옷", dDayBucket: "D-7" },
      ],
      "user-A",
    );

    expect(result).not.toBeNull();
    expect(result?.length).toBe(3);
    expect(mockCreate).toHaveBeenCalledTimes(3);
    expect(mockCreate.mock.calls[0][0].data.actorId).toBe("user-A");
    expect(mockCreate.mock.calls[1][0].data.actorId).toBe("user-A");
    expect(mockCreate.mock.calls[2][0].data.actorId).toBe("user-A");
  });

  it("actorId 인자 미제공 시 모든 row null (미인증 fallback)", async () => {
    mockCreate
      .mockResolvedValueOnce(buildRow({ id: "ci-1", actorId: null }))
      .mockResolvedValueOnce(buildRow({ id: "ci-2", actorId: null }));

    await bulkCreateChecklistItems("trip-A", [
      { category: "documents", text: "여권", dDayBucket: "D-30" },
      { category: "documents", text: "비자", dDayBucket: "D-30" },
    ]);

    expect(mockCreate.mock.calls[0][0].data.actorId).toBe(null);
    expect(mockCreate.mock.calls[1][0].data.actorId).toBe(null);
  });

  it("inputs[i].actorId가 있으면 두 번째 인자보다 우선 (per-row override)", async () => {
    mockCreate
      .mockResolvedValueOnce(buildRow({ id: "ci-1", actorId: "user-OVERRIDE" }))
      .mockResolvedValueOnce(buildRow({ id: "ci-2", actorId: "user-DEFAULT" }));

    await bulkCreateChecklistItems(
      "trip-A",
      [
        {
          category: "documents",
          text: "여권",
          dDayBucket: "D-30",
          actorId: "user-OVERRIDE",
        },
        { category: "documents", text: "비자", dDayBucket: "D-30" },
      ],
      "user-DEFAULT",
    );

    expect(mockCreate.mock.calls[0][0].data.actorId).toBe("user-OVERRIDE");
    expect(mockCreate.mock.calls[1][0].data.actorId).toBe("user-DEFAULT");
  });

  it("두 번째 인자 actorId === null 명시도 null 전파 (DEMO 강제)", async () => {
    mockCreate.mockResolvedValueOnce(buildRow({ id: "ci-1", actorId: null }));

    await bulkCreateChecklistItems(
      "trip-DEMO",
      [{ category: "documents", text: "여권", dDayBucket: "D-30" }],
      null,
    );

    expect(mockCreate.mock.calls[0][0].data.actorId).toBe(null);
  });
});

// ═══════════════════════════════════════════════════════════════════
// D5 가드 — _resolveActorIdForTrip (T12 STEP 4 발견 → STEP 3 복귀)
//
// XX(ADR-044) 이후 DEMO_TRIP_ID는 isDbConnected=true이면 DB 영속화됨.
// 인증 사용자가 DEMO trip에 add 시 시드 row가 user.id로 stamp되는 오염 차단.
// ═══════════════════════════════════════════════════════════════════

import { resolveActorIdForTrip } from "@/lib/auth/actor-resolution";
import { DEMO_TRIP_IDS } from "@/lib/seed";

describe("사이클 TT — resolveActorIdForTrip (D5 DEMO_TRIP_ID 가드)", () => {
  it("일반 trip + 인증 사용자 → actorId 그대로 반환", () => {
    expect(resolveActorIdForTrip("trip-real-A", "user-kakao-1")).toBe(
      "user-kakao-1",
    );
  });

  it("일반 trip + 미인증 → null 그대로", () => {
    expect(resolveActorIdForTrip("trip-real-A", null)).toBe(null);
  });

  it.each(DEMO_TRIP_IDS)(
    "DEMO_TRIP_ID(%s) + 인증 사용자 → null 강제 (시드 오염 차단)",
    (demoId) => {
      expect(resolveActorIdForTrip(demoId, "user-kakao-1")).toBe(null);
    },
  );

  it("DEMO_TRIP_ID + 미인증 → null (그대로)", () => {
    expect(resolveActorIdForTrip(DEMO_TRIP_IDS[0], null)).toBe(null);
  });

  it("DEMO_TRIP_IDS는 베트남 6 trip 모두 포함 (회귀 안전망)", () => {
    expect(DEMO_TRIP_IDS.length).toBeGreaterThanOrEqual(6);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 사이클 UUU (TT 백로그 OBS 해소) — actorId 보존 회귀
//
// TT가 도입한 NULLABLE actorId 컬럼을 만지지 않는 mutation 5종이 정말로
// 컬럼을 보존하는지 명시 고정. 향후 spread 리팩터 등으로 actorId가 무음
// drift 되는 사고 방지. write payload 키 부재 + read result 보존 양방향.
// 5명 회의 합의: T13/T12/T14/T18 + R1 6 조건 사인오프.
//
// Prisma update invariant (T14): data에 명시되지 않은 컬럼은 SQL UPDATE
// 절에 포함되지 않음. 따라서 mock도 같은 규약을 지켜야 — applyUpdate 헬퍼
// 가 stub row와 args.data를 머지하여 "Prisma 동작"을 모방 (T12 silent
// drift 방어).
// ═══════════════════════════════════════════════════════════════════

type StubRow = ReturnType<typeof buildRow>;

function applyUpdate(stub: StubRow, data: Record<string, unknown>): StubRow {
  return { ...stub, ...data };
}

describe("사이클 UUU — toggleChecklistItem actorId 보존", () => {
  it("actorId=null인 row를 toggle해도 actorId는 null 유지", async () => {
    const stub = buildRow({ id: "ci-1", actorId: null, done: false });
    mockFindUnique.mockResolvedValueOnce(stub);
    mockUpdate.mockImplementationOnce(async (args: { data: Record<string, unknown> }) =>
      applyUpdate(stub, args.data),
    );

    const result = await toggleChecklistItem("ci-1");

    expect(result).not.toBe("not_found");
    expect(result).not.toBeNull();
    if (result === "not_found" || result === null) return;
    // write payload — actorId 키 부재 (T13 D2 (a))
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect("actorId" in mockUpdate.mock.calls[0][0].data).toBe(false);
    // read result — null 보존 (T14 toBeNull)
    expect(result.item.actorId).toBeNull();
  });

  it("actorId=user1인 row를 toggle해도 actorId는 user1 유지", async () => {
    const stub = buildRow({ id: "ci-2", actorId: "user-kakao-1", done: true });
    mockFindUnique.mockResolvedValueOnce(stub);
    mockUpdate.mockImplementationOnce(async (args: { data: Record<string, unknown> }) =>
      applyUpdate(stub, args.data),
    );

    const result = await toggleChecklistItem("ci-2");

    if (result === "not_found" || result === null) {
      throw new Error("expected toggle success");
    }
    expect("actorId" in mockUpdate.mock.calls[0][0].data).toBe(false);
    expect(result.item.actorId).toBe("user-kakao-1");
  });
});

describe("사이클 UUU — moveChecklistItem actorId 보존 (target + neighbor)", () => {
  it("up 방향 swap — target/neighbor 모두 actorId 보존", async () => {
    const target = buildRow({
      id: "ci-target",
      actorId: "user-A",
      sortOrder: 2,
    });
    const neighbor = buildRow({
      id: "ci-neighbor",
      actorId: "user-B",
      sortOrder: 1,
    });
    mockFindUnique.mockResolvedValueOnce(target);
    mockFindFirst.mockResolvedValueOnce(neighbor);
    mockUpdate
      .mockImplementationOnce(async (args: { data: Record<string, unknown> }) =>
        applyUpdate(target, args.data),
      )
      .mockImplementationOnce(async (args: { data: Record<string, unknown> }) =>
        applyUpdate(neighbor, args.data),
      );
    mockFindUniqueOrThrow.mockResolvedValueOnce(
      applyUpdate(target, { sortOrder: 1 }),
    );

    const result = await moveChecklistItem("ci-target", "up");

    if (result === "not_found" || result === "no_op" || result === null) {
      throw new Error("expected move success");
    }
    // 두 update 호출 모두 actorId 키 부재
    expect(mockUpdate).toHaveBeenCalledTimes(2);
    expect("actorId" in mockUpdate.mock.calls[0][0].data).toBe(false);
    expect("actorId" in mockUpdate.mock.calls[1][0].data).toBe(false);
    // target read result 보존
    expect(result.item.actorId).toBe("user-A");
  });

  it("down 방향 swap — target=null/neighbor=user 모두 보존", async () => {
    const target = buildRow({
      id: "ci-target",
      actorId: null,
      sortOrder: 0,
    });
    const neighbor = buildRow({
      id: "ci-neighbor",
      actorId: "user-X",
      sortOrder: 1,
    });
    mockFindUnique.mockResolvedValueOnce(target);
    mockFindFirst.mockResolvedValueOnce(neighbor);
    mockUpdate
      .mockImplementationOnce(async (args: { data: Record<string, unknown> }) =>
        applyUpdate(target, args.data),
      )
      .mockImplementationOnce(async (args: { data: Record<string, unknown> }) =>
        applyUpdate(neighbor, args.data),
      );
    mockFindUniqueOrThrow.mockResolvedValueOnce(
      applyUpdate(target, { sortOrder: 1 }),
    );

    const result = await moveChecklistItem("ci-target", "down");

    if (result === "not_found" || result === "no_op" || result === null) {
      throw new Error("expected move success");
    }
    expect("actorId" in mockUpdate.mock.calls[0][0].data).toBe(false);
    expect("actorId" in mockUpdate.mock.calls[1][0].data).toBe(false);
    expect(result.item.actorId).toBeNull();
  });
});

describe("사이클 UUU — setChecklistItemsDone actorId 보존 (II 답습)", () => {
  it("done=true 일괄 토글 — updateMany.data에 actorId 키 부재", async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 3 });

    const result = await setChecklistItemsDone({
      tripId: "trip-A",
      itemIds: ["ci-1", "ci-2", "ci-3"],
      done: true,
    });

    expect(result).not.toBe("count_mismatch");
    expect(result).not.toBe("empty");
    expect(result).not.toBeNull();
    expect(mockUpdateMany).toHaveBeenCalledTimes(1);
    expect("actorId" in mockUpdateMany.mock.calls[0][0].data).toBe(false);
    expect(mockUpdateMany.mock.calls[0][0].data).toEqual({ done: true });
  });

  it("done=false 일괄 토글 — actorId 키 부재 (반대 방향도 동일 invariant)", async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 2 });

    await setChecklistItemsDone({
      tripId: "trip-A",
      itemIds: ["ci-1", "ci-2"],
      done: false,
    });

    expect("actorId" in mockUpdateMany.mock.calls[0][0].data).toBe(false);
    expect(mockUpdateMany.mock.calls[0][0].data).toEqual({ done: false });
  });
});

describe("사이클 UUU — deleteChecklistItem before snapshot에 actorId 노출", () => {
  it("단건 삭제 audit — before.actorId가 노출 (감사 가능 컬럼)", async () => {
    const stub = buildRow({
      id: "ci-1",
      actorId: "user-DEL",
      text: "삭제 대상",
    });
    mockFindUnique.mockResolvedValueOnce(stub);
    mockDelete.mockResolvedValueOnce(stub);

    const result = await deleteChecklistItem("ci-1");

    if (result === "not_found" || result === null) {
      throw new Error("expected delete success");
    }
    expect(result.before.actorId).toBe("user-DEL");
  });
});

describe("사이클 UUU — bulkDeleteChecklistItems beforeSnapshot[].actorId (T13 D4)", () => {
  it("일괄 삭제 snapshot — 각 row의 actorId 노출 (50 limit 답습 패턴 유지)", async () => {
    const rows = [
      buildRow({ id: "ci-1", actorId: "user-A" }),
      buildRow({ id: "ci-2", actorId: null }),
      buildRow({ id: "ci-3", actorId: "user-B" }),
    ];
    mockFindMany.mockResolvedValueOnce(rows);
    mockDeleteMany.mockResolvedValueOnce({ count: 3 });

    const result = await bulkDeleteChecklistItems({
      tripId: "trip-A",
      itemIds: ["ci-1", "ci-2", "ci-3"],
    });

    if (result === "count_mismatch" || result === "empty" || result === null) {
      throw new Error("expected bulk delete success");
    }
    expect(result.beforeSnapshot.length).toBe(3);
    expect(result.beforeSnapshot[0].actorId).toBe("user-A");
    expect(result.beforeSnapshot[1].actorId).toBeNull();
    expect(result.beforeSnapshot[2].actorId).toBe("user-B");
  });
});

describe("사이클 UUU — mock 규약 self-test (T12 silent drift 방어)", () => {
  it("applyUpdate 헬퍼는 stub row와 args.data만 머지하고 다른 컬럼은 보존", () => {
    const stub = buildRow({ id: "ci-x", actorId: "user-Z", done: false });
    const merged = applyUpdate(stub, { done: true });

    expect(merged.done).toBe(true);
    expect(merged.actorId).toBe("user-Z"); // ← 핵심 invariant
    expect(merged.id).toBe("ci-x");
    expect(merged.tripId).toBe(stub.tripId);
  });
});

describe("사이클 UUU — negative invariant (R1 6 조건 #3)", () => {
  it("moveChecklistItem no_op 시 update 호출 0회 — actorId 건드릴 경로 없음", async () => {
    // 버킷 첫 항목을 위로 이동 시도 → neighbor 없음 → no_op
    const target = buildRow({
      id: "ci-only",
      actorId: "user-PRESERVED",
      sortOrder: 0,
    });
    mockFindUnique.mockResolvedValueOnce(target);
    mockFindFirst.mockResolvedValueOnce(null); // neighbor 없음

    const result = await moveChecklistItem("ci-only", "up");

    expect(result).toBe("no_op");
    expect(mockUpdate).toHaveBeenCalledTimes(0); // ← negative invariant
  });
});
