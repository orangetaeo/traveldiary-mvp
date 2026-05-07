/**
 * lib/auth/authorize.ts 단위 테스트.
 *
 * canWriteTrip + canWriteTripResource — DEMO_TRIP_ID/단일사용자/DB/소유권 분기.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetActorId = vi.fn();
vi.mock("@/lib/auth/session", () => ({
  getActorId: () => mockGetActorId(),
}));

vi.mock("@/lib/seed", () => ({
  DEMO_TRIP_ID: "demo-trip-danang",
}));

const mockFindUnique = vi.fn();
let mockPrisma: unknown = {
  trip: { findUnique: (...args: unknown[]) => mockFindUnique(...args) },
};

vi.mock("@/lib/prisma", () => ({
  get prisma() { return mockPrisma; },
}));

import { canWriteTrip, canWriteTripResource } from "@/lib/auth/authorize";

describe("canWriteTrip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      trip: { findUnique: (...args: unknown[]) => mockFindUnique(...args) },
    };
    mockGetActorId.mockResolvedValue("user-1");
  });

  it("DEMO_TRIP_ID → 항상 true", async () => {
    expect(await canWriteTrip("demo-trip-danang")).toBe(true);
    expect(mockGetActorId).not.toHaveBeenCalled();
  });

  it("actorId null (단일 사용자 모드) → true", async () => {
    mockGetActorId.mockResolvedValue(null);
    expect(await canWriteTrip("trip-1")).toBe(true);
  });

  it("prisma null (DB 미연결) → true", async () => {
    mockPrisma = null;
    expect(await canWriteTrip("trip-1")).toBe(true);
  });

  it("trip 없음 → false", async () => {
    mockFindUnique.mockResolvedValue(null);
    expect(await canWriteTrip("trip-1")).toBe(false);
  });

  it("ownerId 일치 → true", async () => {
    mockFindUnique.mockResolvedValue({ ownerId: "user-1" });
    expect(await canWriteTrip("trip-1")).toBe(true);
  });

  it("ownerId 불일치 → false", async () => {
    mockFindUnique.mockResolvedValue({ ownerId: "other-user" });
    expect(await canWriteTrip("trip-1")).toBe(false);
  });

  it("DB 에러 → false", async () => {
    mockFindUnique.mockRejectedValue(new Error("DB down"));
    expect(await canWriteTrip("trip-1")).toBe(false);
  });
});

describe("canWriteTripResource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      trip: { findUnique: (...args: unknown[]) => mockFindUnique(...args) },
    };
    mockGetActorId.mockResolvedValue("user-1");
  });

  it("canWriteTrip 위임", async () => {
    mockFindUnique.mockResolvedValue({ ownerId: "user-1" });
    expect(await canWriteTripResource("trip-1")).toBe(true);
  });
});
