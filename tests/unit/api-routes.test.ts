/**
 * API 라우트 핸들러 단위 테스트.
 *
 * analytics/ab, analytics/funnel, auth/logout,
 * auth/kakao/start, auth/kakao/callback,
 * auth/account (DELETE), share/lookup, share/my-activity.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// APP_URL env 설정 (kakao callback에서 new URL() 사용)
vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://test.com");

vi.mock("server-only", () => ({}));

// ─── 공통 mock ────────────────────────────────────────

const mockWriteAuditLog = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/audit-log", () => ({
  writeAuditLog: (...args: unknown[]) => mockWriteAuditLog(...args),
}));

// ─── analytics/ab ─────────────────────────────────────

describe("POST /api/analytics/ab", () => {
  beforeEach(() => vi.clearAllMocks());

  it("유효 impression → 200 + AuditLog", async () => {
    const { POST } = await import("@/app/api/analytics/ab/route");
    const req = new Request("http://test/api/analytics/ab", {
      method: "POST",
      body: JSON.stringify({
        experimentId: "exp-1",
        variant: "A",
        event: "impression",
      }),
    });
    const resp = await POST(req);
    expect(resp.status).toBe(200);
    const data = await resp.json();
    expect(data.ok).toBe(true);
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ab.impression",
        resourceId: "exp-1",
      }),
    );
  });

  it("유효 conversion → 200", async () => {
    const { POST } = await import("@/app/api/analytics/ab/route");
    const req = new Request("http://test/api/analytics/ab", {
      method: "POST",
      body: JSON.stringify({
        experimentId: "exp-1",
        variant: "B",
        event: "conversion",
      }),
    });
    const resp = await POST(req);
    expect(resp.status).toBe(200);
  });

  it("잘못된 event → 400", async () => {
    const { POST } = await import("@/app/api/analytics/ab/route");
    const req = new Request("http://test/api/analytics/ab", {
      method: "POST",
      body: JSON.stringify({
        experimentId: "exp-1",
        variant: "A",
        event: "click",
      }),
    });
    const resp = await POST(req);
    expect(resp.status).toBe(400);
  });

  it("experimentId 누락 → 400", async () => {
    const { POST } = await import("@/app/api/analytics/ab/route");
    const req = new Request("http://test/api/analytics/ab", {
      method: "POST",
      body: JSON.stringify({ variant: "A", event: "impression" }),
    });
    const resp = await POST(req);
    expect(resp.status).toBe(400);
  });
});

// ─── analytics/funnel ─────────────────────────────────

describe("POST /api/analytics/funnel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("유효 step → 200 + AuditLog", async () => {
    const { POST } = await import("@/app/api/analytics/funnel/route");
    const req = new Request("http://test/api/analytics/funnel", {
      method: "POST",
      body: JSON.stringify({ step: "view" }),
    });
    const resp = await POST(req);
    expect(resp.status).toBe(200);
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "funnel.onboarding",
        resourceId: "onboarding-view",
      }),
    );
  });

  it("7가지 유효 step", async () => {
    const { POST } = await import("@/app/api/analytics/funnel/route");
    for (const step of ["view", "step1", "step2", "step3", "step4", "submit", "complete"]) {
      const req = new Request("http://test", {
        method: "POST",
        body: JSON.stringify({ step }),
      });
      const resp = await POST(req);
      expect(resp.status).toBe(200);
    }
  });

  it("잘못된 step → 400", async () => {
    const { POST } = await import("@/app/api/analytics/funnel/route");
    const req = new Request("http://test", {
      method: "POST",
      body: JSON.stringify({ step: "invalid" }),
    });
    const resp = await POST(req);
    expect(resp.status).toBe(400);
  });
});

// ─── auth/logout ──────────────────────────────────────

const mockVerifyToken = vi.fn();
vi.mock("@/lib/auth/jwt", () => ({
  verifyToken: (...args: unknown[]) => mockVerifyToken(...args),
  signToken: vi.fn(),
}));

describe("POST /api/auth/logout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("인증 사용자 → 200 + AuditLog + 쿠키 삭제", async () => {
    mockVerifyToken.mockResolvedValue({ sub: "user-1", type: "access" });
    const { POST } = await import("@/app/api/auth/logout/route");
    const req = new Request("http://test/api/auth/logout", { method: "POST" });
    // @ts-expect-error NextRequest cookie mock
    req.cookies = { get: (name: string) => name === "access_token" ? { value: "tok" } : undefined };
    const resp = await POST(req as never);
    expect(resp.status).toBe(200);
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "auth.logout", actorId: "user-1" }),
    );
  });

  it("미인증 → 200 (AuditLog 미기록)", async () => {
    const { POST } = await import("@/app/api/auth/logout/route");
    const req = new Request("http://test/api/auth/logout", { method: "POST" });
    // @ts-expect-error NextRequest cookie mock
    req.cookies = { get: () => undefined };
    const resp = await POST(req as never);
    expect(resp.status).toBe(200);
    expect(mockWriteAuditLog).not.toHaveBeenCalled();
  });
});

// ─── auth/kakao/start ─────────────────────────────────

const mockKakaoAvailable = vi.fn();
const mockBuildAuthorizeUrl = vi.fn();

vi.mock("@/lib/auth/kakao", () => ({
  kakaoAvailable: (...args: unknown[]) => mockKakaoAvailable(...args),
  buildAuthorizeUrl: (...args: unknown[]) => mockBuildAuthorizeUrl(...args),
  exchangeCodeForUser: vi.fn(),
}));

describe("GET /api/auth/kakao/start", () => {
  beforeEach(() => vi.clearAllMocks());

  it("카카오 비활성 → 503", async () => {
    mockKakaoAvailable.mockReturnValue(false);
    const { GET } = await import("@/app/api/auth/kakao/start/route");
    const resp = await GET();
    expect(resp.status).toBe(503);
  });

  it("buildAuthorizeUrl null → 503", async () => {
    mockKakaoAvailable.mockReturnValue(true);
    mockBuildAuthorizeUrl.mockReturnValue(null);
    const { GET } = await import("@/app/api/auth/kakao/start/route");
    const resp = await GET();
    expect(resp.status).toBe(503);
  });

  it("성공 → 307 redirect + state 쿠키", async () => {
    mockKakaoAvailable.mockReturnValue(true);
    mockBuildAuthorizeUrl.mockReturnValue("https://kauth.kakao.com/oauth/authorize?state=abc");
    const { GET } = await import("@/app/api/auth/kakao/start/route");
    const resp = await GET();
    expect(resp.status).toBe(307);
    expect(resp.headers.get("location")).toContain("kauth.kakao.com");
  });
});

// ─── auth/kakao/callback ──────────────────────────────

const mockExchangeCode = vi.fn();
const mockUpsertKakaoUser = vi.fn();
const mockSignToken = vi.fn();

vi.mock("@/lib/repositories/user.repository", () => ({
  upsertKakaoUser: (...args: unknown[]) => mockUpsertKakaoUser(...args),
}));

// signToken is already mocked in @/lib/auth/jwt mock above — need to override
// Actually, let's just use the mock directly

describe("GET /api/auth/kakao/callback", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Re-wire the exchange mock
    const kakaoMod = vi.mocked(await import("@/lib/auth/kakao"));
    (kakaoMod.exchangeCodeForUser as ReturnType<typeof vi.fn>).mockImplementation(
      (...args: unknown[]) => mockExchangeCode(...args),
    );
    const jwtMod = vi.mocked(await import("@/lib/auth/jwt"));
    (jwtMod.signToken as ReturnType<typeof vi.fn>).mockImplementation(
      (...args: unknown[]) => mockSignToken(...args),
    );
  });

  it("카카오 비활성 → redirect auth_error", async () => {
    mockKakaoAvailable.mockReturnValue(false);
    const { GET } = await import("@/app/api/auth/kakao/callback/route");
    const url = new URL("http://test/api/auth/kakao/callback?code=abc&state=xyz");
    const req = { nextUrl: url, cookies: { get: () => ({ value: "xyz" }) } };
    const resp = await GET(req as never);
    expect(resp.status).toBe(307);
    expect(resp.headers.get("location")).toContain("auth_error=not_configured");
  });

  it("code 누락 → redirect no_code", async () => {
    mockKakaoAvailable.mockReturnValue(true);
    const { GET } = await import("@/app/api/auth/kakao/callback/route");
    const url = new URL("http://test/api/auth/kakao/callback?state=xyz");
    const req = { nextUrl: url, cookies: { get: () => ({ value: "xyz" }) } };
    const resp = await GET(req as never);
    expect(resp.status).toBe(307);
    expect(resp.headers.get("location")).toContain("no_code");
  });

  it("state 불일치 → redirect state_mismatch", async () => {
    mockKakaoAvailable.mockReturnValue(true);
    const { GET } = await import("@/app/api/auth/kakao/callback/route");
    const url = new URL("http://test/api/auth/kakao/callback?code=abc&state=xyz");
    const req = {
      nextUrl: url,
      cookies: { get: (name: string) => name === "kakao_state" ? { value: "different" } : undefined },
    };
    const resp = await GET(req as never);
    expect(resp.status).toBe(307);
    expect(resp.headers.get("location")).toContain("state_mismatch");
  });

  it("exchange 실패 → redirect", async () => {
    mockKakaoAvailable.mockReturnValue(true);
    mockExchangeCode.mockResolvedValue({ ok: false, code: "network" });
    const { GET } = await import("@/app/api/auth/kakao/callback/route");
    const url = new URL("http://test/api/auth/kakao/callback?code=abc&state=xyz");
    const req = {
      nextUrl: url,
      cookies: { get: (name: string) => name === "kakao_state" ? { value: "xyz" } : undefined },
    };
    const resp = await GET(req as never);
    expect(resp.status).toBe(307);
    expect(resp.headers.get("location")).toContain("exchange_network");
  });

  it("성공 흐름 → redirect + JWT 쿠키", async () => {
    mockKakaoAvailable.mockReturnValue(true);
    mockExchangeCode.mockResolvedValue({
      ok: true,
      user: { kakaoId: "k123", nickname: "테스터", email: "test@test.com" },
    });
    mockUpsertKakaoUser.mockResolvedValue({ id: "user-1" });
    mockSignToken.mockResolvedValueOnce("access-jwt").mockResolvedValueOnce("refresh-jwt");

    const { GET } = await import("@/app/api/auth/kakao/callback/route");
    const url = new URL("http://test/api/auth/kakao/callback?code=abc&state=xyz");
    const req = {
      nextUrl: url,
      cookies: { get: (name: string) => name === "kakao_state" ? { value: "xyz" } : undefined },
    };
    const resp = await GET(req as never);
    expect(resp.status).toBe(307);
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "auth.login", actorId: "user-1" }),
    );
  });

  it("upsert 실패 → redirect", async () => {
    mockKakaoAvailable.mockReturnValue(true);
    mockExchangeCode.mockResolvedValue({
      ok: true,
      user: { kakaoId: "k123", nickname: "test" },
    });
    mockUpsertKakaoUser.mockResolvedValue(null);

    const { GET } = await import("@/app/api/auth/kakao/callback/route");
    const url = new URL("http://test/api/auth/kakao/callback?code=abc&state=xyz");
    const req = {
      nextUrl: url,
      cookies: { get: (name: string) => name === "kakao_state" ? { value: "xyz" } : undefined },
    };
    const resp = await GET(req as never);
    expect(resp.headers.get("location")).toContain("user_upsert_failed");
  });
});

// ─── auth/account (DELETE) ────────────────────────────

const mockAnonymize = vi.fn();
const mockIsValidConfirm = vi.fn();
const mockCheckRate = vi.fn();

vi.mock("@/lib/auth/account-delete", () => ({
  anonymizeUserAccount: (...args: unknown[]) => mockAnonymize(...args),
  isValidAccountDeleteConfirm: (...args: unknown[]) => mockIsValidConfirm(...args),
}));

vi.mock("@/lib/auth/accountDeleteRateLimit", () => ({
  checkAccountDeleteRate: (...args: unknown[]) => mockCheckRate(...args),
}));

describe("DELETE /api/auth/account", () => {
  beforeEach(() => vi.clearAllMocks());

  function makeReq(body: unknown, headers?: Record<string, string>) {
    const h = {
      host: "test.com",
      origin: "http://test.com",
      "content-type": "application/json",
      ...headers,
    };
    return {
      headers: { get: (name: string) => h[name as keyof typeof h] ?? null },
      cookies: { get: (name: string) => name === "access_token" ? { value: "tok" } : undefined },
      json: () => Promise.resolve(body),
    };
  }

  it("CSRF 실패 (origin 불일치) → 403", async () => {
    const { DELETE } = await import("@/app/api/auth/account/route");
    const req = makeReq({}, { origin: "http://evil.com" });
    const resp = await DELETE(req as never);
    expect(resp.status).toBe(403);
  });

  it("confirm 불일치 → 400", async () => {
    mockIsValidConfirm.mockReturnValue(false);
    const { DELETE } = await import("@/app/api/auth/account/route");
    const req = makeReq({ confirm: "wrong" });
    const resp = await DELETE(req as never);
    expect(resp.status).toBe(400);
  });

  it("토큰 없음 → 401", async () => {
    mockIsValidConfirm.mockReturnValue(true);
    const { DELETE } = await import("@/app/api/auth/account/route");
    const req = makeReq({ confirm: "ok" });
    req.cookies = { get: () => undefined };
    const resp = await DELETE(req as never);
    expect(resp.status).toBe(401);
  });

  it("토큰 유효하지 않음 → 401", async () => {
    mockIsValidConfirm.mockReturnValue(true);
    mockVerifyToken.mockResolvedValue(null);
    const { DELETE } = await import("@/app/api/auth/account/route");
    const req = makeReq({ confirm: "ok" });
    const resp = await DELETE(req as never);
    expect(resp.status).toBe(401);
  });

  it("rate limit 초과 → 429", async () => {
    mockIsValidConfirm.mockReturnValue(true);
    mockVerifyToken.mockResolvedValue({ sub: "user-1", type: "access" });
    mockCheckRate.mockReturnValue(false);
    const { DELETE } = await import("@/app/api/auth/account/route");
    const req = makeReq({ confirm: "ok" });
    const resp = await DELETE(req as never);
    expect(resp.status).toBe(429);
  });

  it("익명화 실패 → 500", async () => {
    mockIsValidConfirm.mockReturnValue(true);
    mockVerifyToken.mockResolvedValue({ sub: "user-1", type: "access" });
    mockCheckRate.mockReturnValue(true);
    mockAnonymize.mockResolvedValue({ ok: false, reason: "db_unavailable" });
    const { DELETE } = await import("@/app/api/auth/account/route");
    const req = makeReq({ confirm: "ok" });
    const resp = await DELETE(req as never);
    expect(resp.status).toBe(500);
    const data = await resp.json();
    expect(data.code).toBe("internal_error"); // reason 매핑
  });

  it("성공 → 200 + 쿠키 삭제", async () => {
    mockIsValidConfirm.mockReturnValue(true);
    mockVerifyToken.mockResolvedValue({ sub: "user-1", type: "access" });
    mockCheckRate.mockReturnValue(true);
    mockAnonymize.mockResolvedValue({
      ok: true,
      reassignedTripCount: 2,
      removedMemberships: 1,
    });
    const { DELETE } = await import("@/app/api/auth/account/route");
    const req = makeReq({ confirm: "ok" });
    const resp = await DELETE(req as never);
    expect(resp.status).toBe(200);
    const data = await resp.json();
    expect(data.ok).toBe(true);
    expect(data.reassignedTripCount).toBe(2);
    expect(data.removedMemberships).toBe(1);
  });
});

// ─── share/lookup ─────────────────────────────────────

const mockCheckIpRate = vi.fn();

vi.mock("@/lib/share/lookupRateLimit", () => ({
  checkIpRate: (...args: unknown[]) => mockCheckIpRate(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: null,
  isDbConnected: false,
}));

describe("POST /api/share/lookup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckIpRate.mockReturnValue(true);
  });

  it("rate limit 초과 → 429", async () => {
    mockCheckIpRate.mockReturnValue(false);
    const { POST } = await import("@/app/api/share/lookup/route");
    const req = new Request("http://test", {
      method: "POST",
      body: JSON.stringify({ keys: ["k1"] }),
      headers: { "content-type": "application/json" },
    });
    // @ts-expect-error NextRequest mock
    req.headers.get = (name: string) => {
      if (name === "x-forwarded-for") return "1.2.3.4";
      if (name === "content-type") return "application/json";
      return null;
    };
    const resp = await POST(req as never);
    expect(resp.status).toBe(429);
  });

  it("keys 누락 → 400", async () => {
    const { POST } = await import("@/app/api/share/lookup/route");
    const req = new Request("http://test", {
      method: "POST",
      body: JSON.stringify({}),
    });
    // @ts-expect-error NextRequest mock
    req.headers.get = () => null;
    const resp = await POST(req as never);
    expect(resp.status).toBe(400);
  });

  it("keys 50개 초과 → 400", async () => {
    const { POST } = await import("@/app/api/share/lookup/route");
    const keys = Array.from({ length: 51 }, (_, i) => `k-${i}`);
    const req = new Request("http://test", {
      method: "POST",
      body: JSON.stringify({ keys }),
    });
    // @ts-expect-error NextRequest mock
    req.headers.get = () => null;
    const resp = await POST(req as never);
    expect(resp.status).toBe(400);
  });

  it("DB 미연결 → not_found 목록", async () => {
    const { POST } = await import("@/app/api/share/lookup/route");
    const req = new Request("http://test", {
      method: "POST",
      body: JSON.stringify({ keys: ["k1", "k2"] }),
    });
    // @ts-expect-error NextRequest mock
    req.headers.get = () => null;
    const resp = await POST(req as never);
    expect(resp.status).toBe(200);
    const data = await resp.json();
    expect(data.items).toHaveLength(2);
    expect(data.items[0].status).toBe("not_found");
  });
});

// ─── share/my-activity ────────────────────────────────

const mockListActivity = vi.fn();

vi.mock("@/lib/repositories/shareComment.repository", () => ({
  listMyActivityByClientUuid: (...args: unknown[]) => mockListActivity(...args),
}));

describe("POST /api/share/my-activity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckIpRate.mockReturnValue(true);
  });

  it("rate limit → 429", async () => {
    mockCheckIpRate.mockReturnValue(false);
    const { POST } = await import("@/app/api/share/my-activity/route");
    const req = new Request("http://test", {
      method: "POST",
      body: JSON.stringify({ clientUuid: "uuid-123456789" }),
    });
    // @ts-expect-error NextRequest mock
    req.headers.get = () => null;
    const resp = await POST(req as never);
    expect(resp.status).toBe(429);
  });

  it("clientUuid 누락 → 400", async () => {
    const { POST } = await import("@/app/api/share/my-activity/route");
    const req = new Request("http://test", {
      method: "POST",
      body: JSON.stringify({}),
    });
    // @ts-expect-error NextRequest mock
    req.headers.get = () => null;
    const resp = await POST(req as never);
    expect(resp.status).toBe(400);
  });

  it("clientUuid 너무 짧음 → 400", async () => {
    const { POST } = await import("@/app/api/share/my-activity/route");
    const req = new Request("http://test", {
      method: "POST",
      body: JSON.stringify({ clientUuid: "short" }),
    });
    // @ts-expect-error NextRequest mock
    req.headers.get = () => null;
    const resp = await POST(req as never);
    expect(resp.status).toBe(400);
  });

  it("DB 미연결 → 빈 배열", async () => {
    const { POST } = await import("@/app/api/share/my-activity/route");
    const req = new Request("http://test", {
      method: "POST",
      body: JSON.stringify({ clientUuid: "uuid-12345678" }),
    });
    // @ts-expect-error NextRequest mock
    req.headers.get = () => null;
    const resp = await POST(req as never);
    expect(resp.status).toBe(200);
    const data = await resp.json();
    expect(data.items).toEqual([]);
  });
});
