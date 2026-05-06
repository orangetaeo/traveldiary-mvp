/**
 * lib/auth/admin-guard.ts 단위 테스트.
 *
 * timing-safe 비교 + env 미설정 fail-closed + notFound() 호출.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mockNotFound = vi.fn();
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ notFound: () => mockNotFound() }));

import { assertAdminAccess } from "@/lib/auth/admin-guard";

const VALID_KEY = "super-secret-admin-key-1234";

describe("auth/admin-guard", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    mockNotFound.mockClear();
    delete process.env.ADMIN_SECRET_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // ─── fail-closed ────────────────────────────────────────────

  it("env 미설정 → notFound()", () => {
    assertAdminAccess({ key: VALID_KEY });
    expect(mockNotFound).toHaveBeenCalledOnce();
  });

  it("key 미제공 → notFound()", () => {
    process.env.ADMIN_SECRET_KEY = VALID_KEY;
    assertAdminAccess({});
    expect(mockNotFound).toHaveBeenCalledOnce();
  });

  it("key undefined → notFound()", () => {
    process.env.ADMIN_SECRET_KEY = VALID_KEY;
    assertAdminAccess({ key: undefined });
    expect(mockNotFound).toHaveBeenCalledOnce();
  });

  it("key 불일치 → notFound()", () => {
    process.env.ADMIN_SECRET_KEY = VALID_KEY;
    assertAdminAccess({ key: "wrong-key" });
    expect(mockNotFound).toHaveBeenCalledOnce();
  });

  it("key 길이 다름 → notFound()", () => {
    process.env.ADMIN_SECRET_KEY = VALID_KEY;
    assertAdminAccess({ key: "short" });
    expect(mockNotFound).toHaveBeenCalledOnce();
  });

  // ─── 성공 ──────────────────────────────────────────────────

  it("올바른 key → notFound 미호출", () => {
    process.env.ADMIN_SECRET_KEY = VALID_KEY;
    assertAdminAccess({ key: VALID_KEY });
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  // ─── env + key 둘 다 미설정 ─────────────────────────────────

  it("env 미설정 + key 미제공 → notFound()", () => {
    assertAdminAccess({});
    expect(mockNotFound).toHaveBeenCalledOnce();
  });

  // ─── timing safe ────────────────────────────────────────────

  it("같은 길이 다른 값 → notFound()", () => {
    process.env.ADMIN_SECRET_KEY = "aaaa";
    assertAdminAccess({ key: "bbbb" });
    expect(mockNotFound).toHaveBeenCalledOnce();
  });
});
