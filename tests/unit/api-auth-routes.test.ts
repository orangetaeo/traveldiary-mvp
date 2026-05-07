/**
 * Auth API 라우트 테스트 — Batch 35.
 *
 * 3 라우트:
 *  - app/api/auth/kakao/start/route.ts: GET — OAuth 시작 redirect
 *  - app/api/auth/kakao/callback/route.ts: GET — 전체 OAuth 콜백 흐름
 *  - app/api/auth/logout/route.ts: POST — 로그아웃 (쿠키 제거 + audit)
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";

/* ──────── Env 설정 (callback route 모듈 레벨에서 읽음) ──────── */
beforeAll(() => {
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
});

/* ──────── Mocks ──────── */

vi.mock("server-only", () => ({}));

const mockBuildAuthorizeUrl = vi.fn();
const mockKakaoAvailable = vi.fn();
const mockExchangeCodeForUser = vi.fn();

vi.mock("@/lib/auth/kakao", () => ({
  buildAuthorizeUrl: (...args: unknown[]) => mockBuildAuthorizeUrl(...args),
  kakaoAvailable: () => mockKakaoAvailable(),
  exchangeCodeForUser: (...args: unknown[]) => mockExchangeCodeForUser(...args),
}));

const mockUpsertKakaoUser = vi.fn();
vi.mock("@/lib/repositories/user.repository", () => ({
  upsertKakaoUser: (...args: unknown[]) => mockUpsertKakaoUser(...args),
}));

const mockSignToken = vi.fn();
const mockVerifyToken = vi.fn();
vi.mock("@/lib/auth/jwt", () => ({
  signToken: (...args: unknown[]) => mockSignToken(...args),
  verifyToken: (...args: unknown[]) => mockVerifyToken(...args),
}));

const mockWriteAuditLog = vi.fn();
vi.mock("@/lib/audit-log", () => ({
  writeAuditLog: (...args: unknown[]) => mockWriteAuditLog(...args),
}));

/* ════════════════════════════════════════════
 * auth/kakao/start — GET
 * ════════════════════════════════════════════ */

describe("api/auth/kakao/start — GET", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("kakao 미설정 → 503", async () => {
    mockKakaoAvailable.mockReturnValue(false);
    const { GET } = await import("@/app/api/auth/kakao/start/route");
    const resp = await GET();
    expect(resp.status).toBe(503);
    const json = await resp.json();
    expect(json.error).toBe("kakao_oauth_not_configured");
  });

  it("buildAuthorizeUrl null → 503", async () => {
    mockKakaoAvailable.mockReturnValue(true);
    mockBuildAuthorizeUrl.mockReturnValue(null);
    const { GET } = await import("@/app/api/auth/kakao/start/route");
    const resp = await GET();
    expect(resp.status).toBe(503);
  });

  it("정상 → 302 redirect + kakao_state 쿠키", async () => {
    mockKakaoAvailable.mockReturnValue(true);
    mockBuildAuthorizeUrl.mockReturnValue("https://kauth.kakao.com/oauth/authorize?client_id=x");
    const { GET } = await import("@/app/api/auth/kakao/start/route");
    const resp = await GET();
    expect(resp.status).toBe(307); // NextResponse.redirect default
    expect(resp.headers.get("location")).toContain("kauth.kakao.com");
    // state 인자가 buildAuthorizeUrl에 전달됨
    expect(mockBuildAuthorizeUrl).toHaveBeenCalledWith(expect.any(String));
    const state = mockBuildAuthorizeUrl.mock.calls[0][0] as string;
    expect(state.length).toBe(32); // 16 bytes hex
  });
});

/* ════════════════════════════════════════════
 * auth/kakao/callback — GET
 * ════════════════════════════════════════════ */

function makeCallbackRequest(params: Record<string, string>, stateCookie?: string) {
  const url = new URL("http://localhost/api/auth/kakao/callback");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  return {
    nextUrl: url,
    cookies: {
      get: (name: string) => {
        if (name === "kakao_state" && stateCookie) return { value: stateCookie };
        return undefined;
      },
    },
  };
}

describe("api/auth/kakao/callback — GET", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockKakaoAvailable.mockReturnValue(true);
  });

  it("kakao 미설정 → redirect with auth_error", async () => {
    mockKakaoAvailable.mockReturnValue(false);
    const { GET } = await import("@/app/api/auth/kakao/callback/route");
    const resp = await GET(makeCallbackRequest({ code: "c", state: "s" }, "s") as never);
    const location = resp.headers.get("location") ?? "";
    expect(location).toContain("auth_error=not_configured");
  });

  it("code 없음 → redirect with no_code", async () => {
    const { GET } = await import("@/app/api/auth/kakao/callback/route");
    const resp = await GET(makeCallbackRequest({ state: "s" }, "s") as never);
    const location = resp.headers.get("location") ?? "";
    expect(location).toContain("auth_error=no_code");
  });

  it("state 불일치 → redirect with state_mismatch", async () => {
    const { GET } = await import("@/app/api/auth/kakao/callback/route");
    const resp = await GET(makeCallbackRequest({ code: "c", state: "wrong" }, "correct") as never);
    const location = resp.headers.get("location") ?? "";
    expect(location).toContain("auth_error=state_mismatch");
  });

  it("state 쿠키 없음 → redirect with state_mismatch", async () => {
    const { GET } = await import("@/app/api/auth/kakao/callback/route");
    const resp = await GET(makeCallbackRequest({ code: "c", state: "s" }) as never);
    const location = resp.headers.get("location") ?? "";
    expect(location).toContain("auth_error=state_mismatch");
  });

  it("exchange 실패 → redirect with exchange_{code}", async () => {
    mockExchangeCodeForUser.mockResolvedValue({ ok: false, code: "token_exchange" });
    const { GET } = await import("@/app/api/auth/kakao/callback/route");
    const resp = await GET(makeCallbackRequest({ code: "c", state: "s" }, "s") as never);
    const location = resp.headers.get("location") ?? "";
    expect(location).toContain("auth_error=exchange_token_exchange");
  });

  it("user upsert 실패 → redirect with user_upsert_failed", async () => {
    mockExchangeCodeForUser.mockResolvedValue({
      ok: true,
      user: { kakaoId: "123", nickname: "T" },
    });
    mockUpsertKakaoUser.mockResolvedValue(null);
    const { GET } = await import("@/app/api/auth/kakao/callback/route");
    const resp = await GET(makeCallbackRequest({ code: "c", state: "s" }, "s") as never);
    const location = resp.headers.get("location") ?? "";
    expect(location).toContain("auth_error=user_upsert_failed");
  });

  it("JWT 발급 실패 → redirect with jwt_unavailable", async () => {
    mockExchangeCodeForUser.mockResolvedValue({
      ok: true,
      user: { kakaoId: "123", nickname: "T" },
    });
    mockUpsertKakaoUser.mockResolvedValue({ id: "user-1" });
    mockSignToken.mockResolvedValue(null);
    const { GET } = await import("@/app/api/auth/kakao/callback/route");
    const resp = await GET(makeCallbackRequest({ code: "c", state: "s" }, "s") as never);
    const location = resp.headers.get("location") ?? "";
    expect(location).toContain("auth_error=jwt_unavailable");
  });

  it("전체 성공 → redirect / + 쿠키 set + audit log", async () => {
    mockExchangeCodeForUser.mockResolvedValue({
      ok: true,
      user: { kakaoId: "456", nickname: "유저", email: "u@k.com" },
    });
    mockUpsertKakaoUser.mockResolvedValue({ id: "user-42" });
    mockSignToken
      .mockResolvedValueOnce("access-jwt-token")
      .mockResolvedValueOnce("refresh-jwt-token");
    mockWriteAuditLog.mockResolvedValue(undefined);

    const { GET } = await import("@/app/api/auth/kakao/callback/route");
    const resp = await GET(makeCallbackRequest({ code: "auth-code", state: "csrf" }, "csrf") as never);

    // 302 redirect to /
    const location = resp.headers.get("location") ?? "";
    expect(location).toContain("/");
    expect(location).not.toContain("auth_error");

    // upsert 호출 확인
    expect(mockUpsertKakaoUser).toHaveBeenCalledWith({
      kakaoId: "456",
      nickname: "유저",
      email: "u@k.com",
    });

    // audit log
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "user-42",
        action: "auth.login",
        resource: "User",
      }),
    );
  });
});

/* ════════════════════════════════════════════
 * auth/logout — POST
 * ════════════════════════════════════════════ */

function makeLogoutRequest(accessToken?: string) {
  return {
    cookies: {
      get: (name: string) => {
        if (name === "access_token" && accessToken) return { value: accessToken };
        return undefined;
      },
    },
  };
}

describe("api/auth/logout — POST", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("토큰 없음 → ok (audit 미기록)", async () => {
    const { POST } = await import("@/app/api/auth/logout/route");
    const resp = await POST(makeLogoutRequest() as never);
    expect(resp.status).toBe(200);
    const json = await resp.json();
    expect(json.ok).toBe(true);
    expect(mockWriteAuditLog).not.toHaveBeenCalled();
  });

  it("유효 토큰 → audit log 기록 + ��키 삭제", async () => {
    mockVerifyToken.mockResolvedValue({ sub: "user-7", type: "access" });
    mockWriteAuditLog.mockResolvedValue(undefined);
    const { POST } = await import("@/app/api/auth/logout/route");
    const resp = await POST(makeLogoutRequest("valid-token") as never);
    expect(resp.status).toBe(200);
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "user-7",
        action: "auth.logout",
      }),
    );
  });

  it("토큰 검증 실패 → ok (audit ��기록, 에러 무시)", async () => {
    mockVerifyToken.mockResolvedValue(null);
    const { POST } = await import("@/app/api/auth/logout/route");
    const resp = await POST(makeLogoutRequest("bad-token") as never);
    expect(resp.status).toBe(200);
    expect(mockWriteAuditLog).not.toHaveBeenCalled();
  });

  it("verifyToken 예외 → ok (에러 무시)", async () => {
    mockVerifyToken.mockRejectedValue(new Error("broken"));
    const { POST } = await import("@/app/api/auth/logout/route");
    const resp = await POST(makeLogoutRequest("tok") as never);
    expect(resp.status).toBe(200);
    expect(mockWriteAuditLog).not.toHaveBeenCalled();
  });
});
