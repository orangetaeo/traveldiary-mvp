/**
 * Checklist Server Action 단위 테스트 — Batch 40.
 *
 * actions/checklist.ts:
 *  - addChecklistItem (demo, forbidden, success)
 *  - addFromTemplate (demo, forbidden, success with bulk audit)
 *  - toggleChecklist (demo, forbidden, not_found, success)
 *  - moveChecklist (demo, forbidden, not_found/no_op, success)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

/* ──────── Mocks ──────── */

vi.mock("server-only", () => ({}));

const mockWriteAuditLog = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/audit-log", () => ({
  writeAuditLog: (...args: unknown[]) => mockWriteAuditLog(...args),
}));

const mockGetActorId = vi.fn<() => Promise<string | null>>();
vi.mock("@/lib/auth/session", () => ({
  getActorId: () => mockGetActorId(),
}));

const mockCanWriteTrip = vi.fn<() => Promise<boolean>>();
vi.mock("@/lib/auth/authorize", () => ({
  canWriteTrip: () => mockCanWriteTrip(),
}));

vi.mock("@/lib/auth/actor-resolution", () => ({
  resolveActorIdForTrip: (_tripId: string, actorId: string | null) => actorId,
}));

const mockCreateChecklistItem = vi.fn();
const mockBulkCreateChecklistItems = vi.fn();
const mockToggleChecklistItem = vi.fn();
const mockMoveChecklistItem = vi.fn();
const mockEnsureDemoTrip = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/repositories/checklist.repository", () => ({
  createChecklistItem: (...args: unknown[]) => mockCreateChecklistItem(...args),
  bulkCreateChecklistItems: (...args: unknown[]) => mockBulkCreateChecklistItems(...args),
  toggleChecklistItem: (...args: unknown[]) => mockToggleChecklistItem(...args),
  moveChecklistItem: (...args: unknown[]) => mockMoveChecklistItem(...args),
  bulkDeleteChecklistItems: vi.fn(),
  deleteChecklistItem: vi.fn(),
  setChecklistItemsDone: vi.fn(),
}));

vi.mock("@/lib/repositories/trip.repository", () => ({
  ensureDemoTripInDb: (...args: unknown[]) => mockEnsureDemoTrip(...args),
}));

vi.mock("@/lib/seed/checklist-template", () => ({
  DEFAULT_CHECKLIST_TEMPLATE: [
    { category: "travel", text: "여권 챙기기", dDayBucket: "d-7" },
    { category: "travel", text: "환전하기", dDayBucket: "d-3" },
  ],
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {},
  isDbConnected: true,
}));

vi.mock("@/lib/seed", () => ({
  DEMO_TRIP_ID: "demo-trip-pqc",
  DEMO_TRIP_IDS: ["demo-trip-pqc"],
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

/* ════════════════════════════════════════════
 * addChecklistItem
 * ════════════════════════════════════════════ */

describe("actions/checklist — addChecklistItem", () => {
  const input = {
    tripId: "trip-1",
    category: "travel" as const,
    text: "여권 챙기기",
    dDayBucket: "d-7",
    sortOrder: 0,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mockCanWriteTrip.mockResolvedValue(true);
    mockGetActorId.mockResolvedValue("user-1");
  });

  it("forbidden → forbidden", async () => {
    mockCanWriteTrip.mockResolvedValue(false);
    const { addChecklistItem } = await import("@/actions/checklist");
    const result = await addChecklistItem(input);
    expect(result).toEqual({ ok: false, code: "forbidden" });
  });

  it("repo 실패 → internal", async () => {
    mockCreateChecklistItem.mockResolvedValue(null);
    const { addChecklistItem } = await import("@/actions/checklist");
    const result = await addChecklistItem(input);
    expect(result).toEqual({ ok: false, code: "internal" });
  });

  it("성공 → data + audit", async () => {
    const mockItem = { id: "ci-1", tripId: "trip-1", category: "travel", text: "여권", dDayBucket: "d-7" };
    mockCreateChecklistItem.mockResolvedValue(mockItem);
    const { addChecklistItem } = await import("@/actions/checklist");
    const result = await addChecklistItem(input);
    expect(result).toEqual({ ok: true, demo: false, data: mockItem });
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "checklist.add", resourceId: "ci-1" }),
    );
  });
});

/* ════════════════════════════════════════════
 * addFromTemplate
 * ════════════════════════════════════════════ */

describe("actions/checklist — addFromTemplate", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockCanWriteTrip.mockResolvedValue(true);
    mockGetActorId.mockResolvedValue("user-1");
  });

  it("forbidden", async () => {
    mockCanWriteTrip.mockResolvedValue(false);
    const { addFromTemplate } = await import("@/actions/checklist");
    const result = await addFromTemplate({ tripId: "trip-1" });
    expect(result).toEqual({ ok: false, code: "forbidden" });
  });

  it("성공 → bulk items + audit per item", async () => {
    const items = [
      { id: "ci-1", tripId: "trip-1", category: "travel", text: "여권", dDayBucket: "d-7" },
      { id: "ci-2", tripId: "trip-1", category: "travel", text: "환전", dDayBucket: "d-3" },
    ];
    mockBulkCreateChecklistItems.mockResolvedValue(items);
    const { addFromTemplate } = await import("@/actions/checklist");
    const result = await addFromTemplate({ tripId: "trip-1" });
    expect(result).toEqual({ ok: true, demo: false, data: items });
    // audit per item
    expect(mockWriteAuditLog).toHaveBeenCalledTimes(2);
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: expect.objectContaining({ origin: "template" }) }),
    );
  });
});

/* ════════════════════════════════════════════
 * toggleChecklist
 * ════════════════════════════════════════════ */

describe("actions/checklist — toggleChecklist", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockCanWriteTrip.mockResolvedValue(true);
    mockGetActorId.mockResolvedValue("user-1");
  });

  it("forbidden", async () => {
    mockCanWriteTrip.mockResolvedValue(false);
    const { toggleChecklist } = await import("@/actions/checklist");
    const result = await toggleChecklist({ itemId: "ci-1", tripId: "trip-1" });
    expect(result).toEqual({ ok: false, code: "forbidden" });
  });

  it("not_found", async () => {
    mockToggleChecklistItem.mockResolvedValue("not_found");
    const { toggleChecklist } = await import("@/actions/checklist");
    const result = await toggleChecklist({ itemId: "ci-1", tripId: "trip-1" });
    expect(result).toEqual({ ok: false, code: "not_found" });
  });

  it("internal (null)", async () => {
    mockToggleChecklistItem.mockResolvedValue(null);
    const { toggleChecklist } = await import("@/actions/checklist");
    const result = await toggleChecklist({ itemId: "ci-1", tripId: "trip-1" });
    expect(result).toEqual({ ok: false, code: "internal" });
  });

  it("성공 → toggle 결과 + audit (before/after)", async () => {
    mockToggleChecklistItem.mockResolvedValue({
      item: { id: "ci-1", done: true },
      before: { done: false },
      after: { done: true },
    });
    const { toggleChecklist } = await import("@/actions/checklist");
    const result = await toggleChecklist({ itemId: "ci-1", tripId: "trip-1" });
    expect(result).toEqual({ ok: true, demo: false, data: { id: "ci-1", done: true } });
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "checklist.toggle",
        before: { done: false },
        after: { done: true },
      }),
    );
  });
});

/* ════════════════════════════════════════════
 * moveChecklist
 * ════════════════════════════════════════════ */

describe("actions/checklist — moveChecklist", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockCanWriteTrip.mockResolvedValue(true);
    mockGetActorId.mockResolvedValue("user-1");
  });

  it("forbidden", async () => {
    mockCanWriteTrip.mockResolvedValue(false);
    const { moveChecklist } = await import("@/actions/checklist");
    const result = await moveChecklist({ itemId: "ci-1", tripId: "trip-1", direction: "up" });
    expect(result).toEqual({ ok: false, code: "forbidden" });
  });

  it("not_found", async () => {
    mockMoveChecklistItem.mockResolvedValue("not_found");
    const { moveChecklist } = await import("@/actions/checklist");
    const result = await moveChecklist({ itemId: "ci-1", tripId: "trip-1", direction: "up" });
    expect(result).toEqual({ ok: false, code: "not_found" });
  });

  it("no_op (버킷 끝) → not_found", async () => {
    mockMoveChecklistItem.mockResolvedValue("no_op");
    const { moveChecklist } = await import("@/actions/checklist");
    const result = await moveChecklist({ itemId: "ci-1", tripId: "trip-1", direction: "up" });
    expect(result).toEqual({ ok: false, code: "not_found" });
  });

  it("성공 → data + audit (direction + swappedWithId)", async () => {
    mockMoveChecklistItem.mockResolvedValue({
      item: { id: "ci-1", sortOrder: 2 },
      before: { sortOrder: 1 },
      after: { sortOrder: 2 },
      swappedWithId: "ci-2",
    });
    const { moveChecklist } = await import("@/actions/checklist");
    const result = await moveChecklist({ itemId: "ci-1", tripId: "trip-1", direction: "down" });
    expect(result).toEqual({ ok: true, demo: false, data: { id: "ci-1", sortOrder: 2 } });
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "checklist.reorder",
        metadata: expect.objectContaining({ direction: "down", swappedWithId: "ci-2" }),
      }),
    );
  });
});
