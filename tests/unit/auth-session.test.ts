/**
 * Auth session 테스트 — Batch 33b.
 *
 * lib/auth/session.ts: getCurrentUserId, getActorId, getOwnerId, SYSTEM_OWNER_ID
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockCookiesGet = vi.fn();
const mockVerifyToken = vi.fn();

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: (...args: unknown[]) => mockCookiesGet(...args),
  }),
}));

vi.mock("@/lib/auth/jwt", () => ({
  verifyToken: (...args: unknown[]) => mockVerifyToken(...args),
}));

describe("auth/session — getCurrentUserId", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("쿠키 없음 → null", async () => {
    mockCookiesGet.mockReturnValue(undefined);
    const { getCurrentUserId } = await import("@/lib/auth/session");
    const result = await getCurrentUserId();
    expect(result).toBeNull();
  });

  it("토큰 검증 실패 → null", async () => {
    mockCookiesGet.mockReturnValue({ value: "bad-token" });
    mockVerifyToken.mockResolvedValue(null);
    const { getCurrentUserId } = await import("@/lib/auth/session");
    const result = await getCurrentUserId();
    expect(result).toBeNull();
  });

  it("토큰 type !== access → null", async () => {
    mockCookiesGet.mockReturnValue({ value: "refresh-tok" });
    mockVerifyToken.mockResolvedValue({ sub: "user-1", type: "refresh" });
    const { getCurrentUserId } = await import("@/lib/auth/session");
    const result = await getCurrentUserId();
    expect(result).toBeNull();
  });

  it("유효 access 토큰 → user id", async () => {
    mockCookiesGet.mockReturnValue({ value: "valid-tok" });
    mockVerifyToken.mockResolvedValue({ sub: "user-42", type: "access" });
    const { getCurrentUserId } = await import("@/lib/auth/session");
    const result = await getCurrentUserId();
    expect(result).toBe("user-42");
  });

  it("verifyToken 예외 → null (fail-safe)", async () => {
    mockCookiesGet.mockReturnValue({ value: "tok" });
    mockVerifyToken.mockRejectedValue(new Error("expired"));
    const { getCurrentUserId } = await import("@/lib/auth/session");
    const result = await getCurrentUserId();
    expect(result).toBeNull();
  });
});

describe("auth/session — getActorId + getOwnerId", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("getActorId = getCurrentUserId", async () => {
    mockCookiesGet.mockReturnValue({ value: "tok" });
    mockVerifyToken.mockResolvedValue({ sub: "user-99", type: "access" });
    const { getActorId } = await import("@/lib/auth/session");
    expect(await getActorId()).toBe("user-99");
  });

  it("getOwnerId — 인증 시 user id", async () => {
    mockCookiesGet.mockReturnValue({ value: "tok" });
    mockVerifyToken.mockResolvedValue({ sub: "user-5", type: "access" });
    const { getOwnerId } = await import("@/lib/auth/session");
    expect(await getOwnerId()).toBe("user-5");
  });

  it("getOwnerId — 미인증 시 SYSTEM_OWNER_ID", async () => {
    mockCookiesGet.mockReturnValue(undefined);
    const { getOwnerId, SYSTEM_OWNER_ID } = await import("@/lib/auth/session");
    const result = await getOwnerId();
    expect(result).toBe(SYSTEM_OWNER_ID);
    expect(result).toBe("system-owner-pqc");
  });
});
