/**
 * 사이클 8 (G3, ADR-049) — DELETE /api/auth/account 라우트 단위 테스트.
 * 사이클 9 — CSRF Origin/Referer + rate limit + reason 매핑 보강.
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

interface MakeReqOpts {
  body?: unknown;
  accessToken?: string;
  origin?: string | null;
  referer?: string | null;
  host?: string | null;
}

const DEFAULT_HOST = "traveldiary.app";
const DEFAULT_ORIGIN = `https://${DEFAULT_HOST}`;

function makeReq(opts: MakeReqOpts) {
  const headers = new Map<string, string>();
  const host = opts.host === undefined ? DEFAULT_HOST : opts.host;
  const origin = opts.origin === undefined ? DEFAULT_ORIGIN : opts.origin;
  const referer = opts.referer === undefined ? null : opts.referer;
  if (host) headers.set("host", host);
  if (origin) headers.set("origin", origin);
  if (referer) headers.set("referer", referer);

  return {
    json: async () => opts.body,
    headers: { get: (name: string) => headers.get(name.toLowerCase()) ?? null },
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
  beforeEach(async () => {
    vi.resetAllMocks();
    const { _resetAccountDeleteRate } = await import(
      "@/lib/auth/accountDeleteRateLimit"
    );
    _resetAccountDeleteRate();
  });

  it("body 파싱 실패 → 400 invalid_body", async () => {
    const { DELETE } = await import("@/app/api/auth/account/route");
    const resp = await DELETE(
      makeReq({
        body: undefined,
      }) as never,
    );
    // body는 makeReq에서 undefined이지만 json() resolve. confirm 누락 → 400 confirm_mismatch.
    // invalid_body는 json throw일 때만 — 별도 케이스로 제공.
    expect(resp.status).toBe(400);
  });

  it("json() throw → 400 invalid_body", async () => {
    const { DELETE } = await import("@/app/api/auth/account/route");
    const headers = new Map([["host", DEFAULT_HOST], ["origin", DEFAULT_ORIGIN]]);
    const resp = await DELETE(
      {
        json: async () => {
          throw new Error("bad json");
        },
        headers: { get: (n: string) => headers.get(n.toLowerCase()) ?? null },
        cookies: { get: () => undefined },
      } as never,
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
      makeReq({
        body: { confirm: "계정 삭제" },
        accessToken: "refresh-token",
      }) as never,
    );
    expect(resp.status).toBe(401);
    expect((await resp.json()).code).toBe("invalid_token");
  });

  it("anonymize 실패 → 500 internal_error (사이클 9 reason 매핑)", async () => {
    mockVerifyToken.mockResolvedValue({ sub: "user-1", type: "access" });
    mockAnonymize.mockResolvedValue({ ok: false, reason: "tx_failed" });
    const { DELETE } = await import("@/app/api/auth/account/route");
    const resp = await DELETE(
      makeReq({ body: { confirm: "계정 삭제" }, accessToken: "ok" }) as never,
    );
    expect(resp.status).toBe(500);
    const json = await resp.json();
    expect(json.code).toBe("internal_error");
    expect(json.code).not.toBe("tx_failed");
  });

  it("anonymize 실패(db_unavailable) → 500 internal_error (정보 누설 차단)", async () => {
    mockVerifyToken.mockResolvedValue({ sub: "user-2", type: "access" });
    mockAnonymize.mockResolvedValue({ ok: false, reason: "db_unavailable" });
    const { DELETE } = await import("@/app/api/auth/account/route");
    const resp = await DELETE(
      makeReq({ body: { confirm: "계정 삭제" }, accessToken: "ok" }) as never,
    );
    expect(resp.status).toBe(500);
    expect((await resp.json()).code).toBe("internal_error");
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
    expect(setCookie).toMatch(/access_token=/);
    expect(setCookie).toMatch(/refresh_token=/);
  });

  describe("CSRF Origin/Referer 검증 (사이클 9 ADR-049 deferred Minor)", () => {
    it("Origin이 host와 일치 → 통과 (정상 흐름)", async () => {
      mockVerifyToken.mockResolvedValue({ sub: "u", type: "access" });
      mockAnonymize.mockResolvedValue({ ok: true });
      const { DELETE } = await import("@/app/api/auth/account/route");
      const resp = await DELETE(
        makeReq({
          body: { confirm: "계정 삭제" },
          accessToken: "ok",
          origin: "https://traveldiary.app",
          host: "traveldiary.app",
        }) as never,
      );
      expect(resp.status).toBe(200);
    });

    it("Origin 없고 Referer만 있고 host 일치 → 통과 (fallback)", async () => {
      mockVerifyToken.mockResolvedValue({ sub: "u", type: "access" });
      mockAnonymize.mockResolvedValue({ ok: true });
      const { DELETE } = await import("@/app/api/auth/account/route");
      const resp = await DELETE(
        makeReq({
          body: { confirm: "계정 삭제" },
          accessToken: "ok",
          origin: null,
          referer: "https://traveldiary.app/settings",
          host: "traveldiary.app",
        }) as never,
      );
      expect(resp.status).toBe(200);
    });

    it("Origin이 cross-host → 403 forbidden_origin", async () => {
      const { DELETE } = await import("@/app/api/auth/account/route");
      const resp = await DELETE(
        makeReq({
          body: { confirm: "계정 삭제" },
          accessToken: "ok",
          origin: "https://evil.example.com",
          host: "traveldiary.app",
        }) as never,
      );
      expect(resp.status).toBe(403);
      expect((await resp.json()).code).toBe("forbidden_origin");
    });

    it("Origin/Referer 둘 다 없음 → 403 forbidden_origin", async () => {
      const { DELETE } = await import("@/app/api/auth/account/route");
      const resp = await DELETE(
        makeReq({
          body: { confirm: "계정 삭제" },
          accessToken: "ok",
          origin: null,
          referer: null,
          host: "traveldiary.app",
        }) as never,
      );
      expect(resp.status).toBe(403);
      expect((await resp.json()).code).toBe("forbidden_origin");
    });

    it("host 헤더 자체가 없음 → 403 forbidden_origin", async () => {
      const { DELETE } = await import("@/app/api/auth/account/route");
      const resp = await DELETE(
        makeReq({
          body: { confirm: "계정 삭제" },
          accessToken: "ok",
          host: null,
        }) as never,
      );
      expect(resp.status).toBe(403);
    });

    it("CSRF 차단은 confirm/JWT 검증보다 우선 (인증 정보 누설 차단)", async () => {
      mockVerifyToken.mockResolvedValue({ sub: "u", type: "access" });
      const { DELETE } = await import("@/app/api/auth/account/route");
      // 잘못된 confirm + cross-origin → CSRF가 먼저 잡힘
      const resp = await DELETE(
        makeReq({
          body: { confirm: "wrong" },
          accessToken: "ok",
          origin: "https://evil.example.com",
          host: "traveldiary.app",
        }) as never,
      );
      expect(resp.status).toBe(403);
      expect((await resp.json()).code).toBe("forbidden_origin");
      expect(mockVerifyToken).not.toHaveBeenCalled();
    });
  });

  describe("Rate limit 5분 1회 (사이클 9 ADR-049 deferred Minor)", () => {
    it("같은 user 두 번째 호출 → 429 rate_limited", async () => {
      mockVerifyToken.mockResolvedValue({ sub: "user-rate", type: "access" });
      // 1번째: db_unavailable 등으로 실패 (anonymize 자체는 호출됨)
      mockAnonymize.mockResolvedValue({ ok: false, reason: "tx_failed" });
      const { DELETE } = await import("@/app/api/auth/account/route");
      const first = await DELETE(
        makeReq({
          body: { confirm: "계정 삭제" },
          accessToken: "ok",
        }) as never,
      );
      expect(first.status).toBe(500);

      // 2번째: rate limit에서 차단
      const second = await DELETE(
        makeReq({
          body: { confirm: "계정 삭제" },
          accessToken: "ok",
        }) as never,
      );
      expect(second.status).toBe(429);
      expect((await second.json()).code).toBe("rate_limited");
      // 두 번째 호출에서는 anonymize 호출 안 됨
      expect(mockAnonymize).toHaveBeenCalledTimes(1);
    });

    it("다른 user는 영향 받지 않음 (key 격리)", async () => {
      mockVerifyToken.mockImplementation(async (token: string) => ({
        sub: token === "u1" ? "user-A" : "user-B",
        type: "access",
      }));
      mockAnonymize.mockResolvedValue({ ok: true });
      const { DELETE } = await import("@/app/api/auth/account/route");
      const a = await DELETE(
        makeReq({ body: { confirm: "계정 삭제" }, accessToken: "u1" }) as never,
      );
      const b = await DELETE(
        makeReq({ body: { confirm: "계정 삭제" }, accessToken: "u2" }) as never,
      );
      expect(a.status).toBe(200);
      expect(b.status).toBe(200);
    });
  });
});
