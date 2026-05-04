/**
 * Admin 접근 가드 단위 테스트 — 사이클 BLOCKER3.
 *
 * lib/auth/admin-guard.ts의 assertAdminAccess 검증:
 *  - ADMIN_SECRET_KEY env 설정 + 일치 → 통과
 *  - env 미설정 → notFound (fail-closed)
 *  - key 미제공 → notFound
 *  - key 불일치 → notFound
 *  - timing-safe: 길이 다른 key 불일치 → notFound
 *
 * server-only import는 vitest에서 무시 (빈 모듈 mock).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// server-only는 vitest에서 사용 불가 — 빈 모듈로 mock
vi.mock("server-only", () => ({}));

// next/navigation mock — notFound를 캡처
const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({
  notFound: () => notFoundMock(),
}));

describe("assertAdminAccess", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.ADMIN_SECRET_KEY;
    vi.resetModules();
    notFoundMock.mockClear();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ADMIN_SECRET_KEY = originalEnv;
    } else {
      delete process.env.ADMIN_SECRET_KEY;
    }
  });

  async function loadGuard() {
    const mod = await import("@/lib/auth/admin-guard");
    return mod.assertAdminAccess;
  }

  it("env 설정 + key 일치 → 통과 (notFound 미호출)", async () => {
    process.env.ADMIN_SECRET_KEY = "test-secret-abc";
    const assertAdminAccess = await loadGuard();
    assertAdminAccess({ key: "test-secret-abc" });
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it("env 미설정 → notFound (fail-closed)", async () => {
    delete process.env.ADMIN_SECRET_KEY;
    const assertAdminAccess = await loadGuard();
    expect(() => assertAdminAccess({ key: "anything" })).toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("key 미제공 → notFound", async () => {
    process.env.ADMIN_SECRET_KEY = "test-secret-abc";
    const assertAdminAccess = await loadGuard();
    expect(() => assertAdminAccess({})).toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("key 불일치 → notFound", async () => {
    process.env.ADMIN_SECRET_KEY = "correct-key";
    const assertAdminAccess = await loadGuard();
    expect(() => assertAdminAccess({ key: "wrong-key!!" })).toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("key 길이 다름 → notFound (timing-safe 길이 체크)", async () => {
    process.env.ADMIN_SECRET_KEY = "short";
    const assertAdminAccess = await loadGuard();
    expect(() => assertAdminAccess({ key: "very-long-different-key" })).toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("key=undefined (명시) → notFound", async () => {
    process.env.ADMIN_SECRET_KEY = "test-secret";
    const assertAdminAccess = await loadGuard();
    expect(() => assertAdminAccess({ key: undefined })).toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("빈 문자열 key + 빈 문자열 env → 통과하지 않음 (falsy guard)", async () => {
    process.env.ADMIN_SECRET_KEY = "";
    const assertAdminAccess = await loadGuard();
    expect(() => assertAdminAccess({ key: "" })).toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});

describe("Admin 페이지 구조 검증", () => {
  it("affiliate 페이지에 assertAdminAccess 호출 존재", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/admin/affiliate/page.tsx"),
      "utf-8",
    );
    expect(src).toContain("assertAdminAccess(searchParams)");
    expect(src).toContain("admin-guard");
  });

  it("m2-skip-reasons 페이지에 assertAdminAccess 호출 존재", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/admin/m2-skip-reasons/page.tsx"),
      "utf-8",
    );
    expect(src).toContain("assertAdminAccess(searchParams)");
    expect(src).toContain("admin-guard");
  });
});
