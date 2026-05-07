/**
 * 사이클 8 (G3, ADR-049) — DELETE /api/auth/account 라우트 단위 테스트.
 *
 * api-auth-routes.test.ts (사이클 11b) 패턴 답습.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockVerifyToken = vi.fn();
vi.mock("@/lib/auth/jwt", () => ({
  verifyToken: (...args: unknown[]) => mockVerifyToken(...args),
}));

const mockAnonymize = vi.fn();
vi.mock("@/lib/auth/account-delete", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/account-delete")>(
    "@/lib/auth/account-delete",
  );
  return {
    ...actual,
    anonymizeUserAccount: (...args: unknown[]) => mockAnonymize(...args),
  };
});

function makeReq(opts: { body?: unknown; accessToken?: string }) {
  return {
    json: async () => opts.body,
    cookies: {
      get: (name: string) => {
        if (name === "access_token" && opts.accessToken) {
          return { value: opts.accessToken };
        }
        return undefined;
      },
    },
  };
}

describe("DELETE /api/auth/account", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("body 파싱 실패 → 400 invalid_body", async () => {
    const { DELETE } = await import("@/app/api/auth/account/route");
    const resp = await DELETE(
      { json: async () => { throw new Error("bad json"); }, cookies: { get: () => undefined } } as never,
    );
    expect(resp.status).toBe(400);
    expect((await resp.json()).code).toBe("invalid_body");
  });

  it("confirm 문구 불일치 → 400 confirm_mismatch", async () => {
    const { DELETE } = await import("@/app/api/auth/account/route");
    const resp = await DELETE(
      makeReq({ body: { confirm: "DELETE" } }) as never,
    );
    expect(resp.status).toBe(400);
    expect((await resp.json()).code).toBe("confirm_mismatch");
  });

  it("confirm 누락 → 400", async () => {
    const { DELETE } = await import("@/app/api/auth/account/route");
    const resp = await DELETE(makeReq({ body: {} }) as never);
    expect(resp.status).toBe(400);
  });

  it("토큰 없음 → 401 not_authenticated", async () => {
    const { DELETE } = await import("@/app/api/auth/account/route");
    const resp = await DELETE(
      makeReq({ body: { confirm: "계정 삭제" } }) as never,
    );
    expect(resp.status).toBe(401);
    expect((await resp.json()).code).toBe("not_authenticated");
  });

  it("invalid 토큰 → 401 invalid_token", async () => {
    mockVerifyToken.mockResolvedValue(null);
    const { DELETE } = await import("@/app/api/auth/account/route");
    const resp = await DELETE(
      makeReq({ body: { confirm: "계정 삭제" }, accessToken: "bad" }) as never,
    );
    expect(resp.status).toBe(401);
    expect((await resp.json()).code).toBe("invalid_token");
  });

  it("refresh 토큰만 있음 → 401 invalid_token", async () => {
    mockVerifyToken.mockResolvedValue({ sub: "user-1", type: "refresh" });
    const { DELETE } = await import("@/app/api/auth/account/route");
    const resp = await DELETE(
      makeReq({ body: { confirm: "계정 삭제" }, accessToken: "refresh-token" }) as never,
    );
    expect(resp.status).toBe(401);
    expect((await resp.json()).code).toBe("invalid_token");
  });

  it("anonymize 실패 → 500 with reason", async () => {
    mockVerifyToken.mockResolvedValue({ sub: "user-1", type: "access" });
    mockAnonymize.mockResolvedValue({ ok: false, reason: "tx_failed" });
    const { DELETE } = await import("@/app/api/auth/account/route");
    const resp = await DELETE(
      makeReq({ body: { confirm: "계정 삭제" }, accessToken: "ok" }) as never,
    );
    expect(resp.status).toBe(500);
    expect((await resp.json()).code).toBe("tx_failed");
  });

  it("정상 → 200 + reassignedTripCount + 쿠키 삭제 호출", async () => {
    mockVerifyToken.mockResolvedValue({ sub: "user-42", type: "access" });
    mockAnonymize.mockResolvedValue({
      ok: true,
      reassignedTripCount: 3,
      removedMemberships: 2,
    });
    const { DELETE } = await import("@/app/api/auth/account/route");
    const resp = await DELETE(
      makeReq({ body: { confirm: "계정 삭제" }, accessToken: "ok" }) as never,
    );
    expect(resp.status).toBe(200);
    const json = await resp.json();
    expect(json.ok).toBe(true);
    expect(json.reassignedTripCount).toBe(3);
    expect(json.removedMemberships).toBe(2);
    expect(mockAnonymize).toHaveBeenCalledWith("user-42");
  });

  it("정상 응답에 Set-Cookie 헤더로 access/refresh 쿠키 삭제 포함", async () => {
    mockVerifyToken.mockResolvedValue({ sub: "user-42", type: "access" });
    mockAnonymize.mockResolvedValue({ ok: true });
    const { DELETE } = await import("@/app/api/auth/account/route");
    const resp = await DELETE(
      makeReq({ body: { confirm: "계정 삭제" }, accessToken: "ok" }) as never,
    );
    const setCookie = resp.headers.get("set-cookie") ?? "";
    // NextResponse.cookies.delete는 Max-Age=0 또는 Expires 과거로 set
    expect(setCookie).toMatch(/access_token=/);
    expect(setCookie).toMatch(/refresh_token=/);
  });
});
