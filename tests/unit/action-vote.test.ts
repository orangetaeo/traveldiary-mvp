/**
 * actions/vote.ts 단위 테스트.
 *
 * createVote + castVote — 데모/권한/validation/DB/audit 분기.
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
  canWriteTripOrViaShareLink: (...args: unknown[]) => mockCanWriteTrip(...args),
}));

const mockResolveActorIdForTrip = vi.fn();
vi.mock("@/lib/auth/actor-resolution", () => ({
  resolveActorIdForTrip: (...args: unknown[]) => mockResolveActorIdForTrip(...args),
}));

const mockCreateVoteRow = vi.fn();
const mockCastVoteToggle = vi.fn();
vi.mock("@/lib/repositories/vote.repository", () => ({
  createVoteRow: (...args: unknown[]) => mockCreateVoteRow(...args),
  castVoteToggle: (...args: unknown[]) => mockCastVoteToggle(...args),
}));

let mockIsDbConnected = true;
vi.mock("@/lib/prisma", () => ({
  get isDbConnected() { return mockIsDbConnected; },
}));

vi.mock("@/lib/seed", () => ({
  DEMO_TRIP_ID: "demo-trip-danang",
}));

import { createVote, castVote } from "@/actions/vote";

describe("createVote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsDbConnected = true;
    mockGetActorId.mockResolvedValue("user-1");
    mockCanWriteTrip.mockResolvedValue(true);
    mockResolveActorIdForTrip.mockReturnValue("actor-resolved");
  });

  it("DB 미연결 → demo", async () => {
    mockIsDbConnected = false;
    const r = await createVote({ tripId: "t1", question: "어디?", optionLabels: ["A", "B"] });
    expect(r).toEqual({ ok: true, demo: true });
  });

  it("데모 trip ID → demo", async () => {
    const r = await createVote({ tripId: "demo-trip-danang", question: "Q", optionLabels: ["A", "B"] });
    expect(r).toEqual({ ok: true, demo: true });
  });

  it("권한 없음 → forbidden", async () => {
    mockCanWriteTrip.mockResolvedValue(false);
    const r = await createVote({ tripId: "t1", question: "Q", optionLabels: ["A", "B"] });
    expect(r).toEqual({ ok: false, code: "forbidden" });
  });

  it("질문 빈값 → invalid", async () => {
    const r = await createVote({ tripId: "t1", question: "   ", optionLabels: ["A", "B"] });
    expect(r).toEqual({ ok: false, code: "invalid" });
  });

  it("옵션 1개 → invalid", async () => {
    const r = await createVote({ tripId: "t1", question: "Q", optionLabels: ["A"] });
    expect(r).toEqual({ ok: false, code: "invalid" });
  });

  it("옵션 빈값 필터링 후 1개 → invalid", async () => {
    const r = await createVote({ tripId: "t1", question: "Q", optionLabels: ["A", "  ", ""] });
    expect(r).toEqual({ ok: false, code: "invalid" });
  });

  it("DB 저장 실패 → internal", async () => {
    mockCreateVoteRow.mockResolvedValue(null);
    const r = await createVote({ tripId: "t1", question: "Q", optionLabels: ["A", "B"] });
    expect(r).toEqual({ ok: false, code: "internal" });
  });

  it("성공 → ok + data", async () => {
    const vote = { id: "v1", question: "Q", options: [] };
    mockCreateVoteRow.mockResolvedValue(vote);
    const r = await createVote({ tripId: "t1", question: "Q", optionLabels: ["A", "B"] });
    expect(r).toEqual({ ok: true, demo: false, data: vote });
  });

  it("createVoteRow에 trim된 labels 전달", async () => {
    mockCreateVoteRow.mockResolvedValue({ id: "v1" });
    await createVote({ tripId: "t1", question: " Q ", optionLabels: [" A ", " B "] });
    const arg = mockCreateVoteRow.mock.calls[0][0];
    expect(arg.question).toBe("Q");
    expect(arg.optionLabels).toEqual(["A", "B"]);
  });
});

describe("castVote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsDbConnected = true;
    mockGetActorId.mockResolvedValue("user-1");
    mockCanWriteTrip.mockResolvedValue(true);
    mockWriteAuditLog.mockResolvedValue(undefined);
  });

  it("DB 미연결 → demo", async () => {
    mockIsDbConnected = false;
    const r = await castVote({ voteId: "v1", tripId: "t1", optionIndex: 0 });
    expect(r).toEqual({ ok: true, demo: true });
  });

  it("데모 trip → demo", async () => {
    const r = await castVote({ voteId: "v1", tripId: "demo-trip-danang", optionIndex: 0 });
    expect(r).toEqual({ ok: true, demo: true });
  });

  it("권한 없음 → forbidden", async () => {
    mockCanWriteTrip.mockResolvedValue(false);
    const r = await castVote({ voteId: "v1", tripId: "t1", optionIndex: 0 });
    expect(r).toEqual({ ok: false, code: "forbidden" });
  });

  it("미인증 → no_actor", async () => {
    mockGetActorId.mockResolvedValue(null);
    const r = await castVote({ voteId: "v1", tripId: "t1", optionIndex: 0 });
    expect(r).toEqual({ ok: false, code: "no_actor" });
  });

  it("castVoteToggle null → internal", async () => {
    mockCastVoteToggle.mockResolvedValue(null);
    const r = await castVote({ voteId: "v1", tripId: "t1", optionIndex: 0 });
    expect(r).toEqual({ ok: false, code: "internal" });
  });

  it("castVoteToggle 'not_found' → not_found", async () => {
    mockCastVoteToggle.mockResolvedValue("not_found");
    const r = await castVote({ voteId: "v1", tripId: "t1", optionIndex: 0 });
    expect(r).toEqual({ ok: false, code: "not_found" });
  });

  it("성공 → ok + data + audit log", async () => {
    const vote = { id: "v1", question: "Q", options: [] };
    mockCastVoteToggle.mockResolvedValue(vote);

    const r = await castVote({ voteId: "v1", tripId: "t1", optionIndex: 1 });

    expect(r).toEqual({ ok: true, demo: false, data: vote });
    expect(mockWriteAuditLog).toHaveBeenCalledOnce();
    const log = mockWriteAuditLog.mock.calls[0][0];
    expect(log.actorId).toBe("user-1");
    expect(log.resource).toBe("Vote");
    expect(log.resourceId).toBe("v1");
    expect(log.metadata.optionIndex).toBe(1);
  });
});
