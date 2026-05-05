/**
 * Auth 모듈 통합 테스트 — Batch 33.
 *
 * 3 모듈:
 *  - lib/auth/kakao.ts: getKakaoConfig, kakaoAvailable, buildAuthorizeUrl, exchangeCodeForUser
 *  - lib/auth/authorize.ts: canWriteTrip, canWriteTripResource
 *  - lib/auth/session.ts: getCurrentUserId, getActorId, getOwnerId, SYSTEM_OWNER_ID
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/* ════════════════════════════════════════════
 * kakao.ts — server-only + fetch mock
 * ════════════════════════════════════════════ */

vi.mock("server-only", () => ({}));

const mockFetch = vi.fn();
// @ts-expect-error mock
globalThis.fetch = mockFetch;

describe("auth/kakao — getKakaoConfig", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("KAKAO_CLIENT_ID + APP_URL 존재 → config 반환", async () => {
    process.env.KAKAO_CLIENT_ID = "test-client-id";
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com/";
    process.env.KAKAO_CLIENT_SECRET = "test-secret";
    const { getKakaoConfig } = await import("@/lib/auth/kakao");
    const cfg = getKakaoConfig();
    expect(cfg).not.toBeNull();
    expect(cfg!.clientId).toBe("test-client-id");
    expect(cfg!.clientSecret).toBe("test-secret");
    expect(cfg!.redirectUri).toBe("https://example.com/api/auth/kakao/callback");
  });

  it("trailing slash 제거", async () => {
    process.env.KAKAO_CLIENT_ID = "cid";
    process.env.NEXT_PUBLIC_APP_URL = "https://a.com/";
    const { getKakaoConfig } = await import("@/lib/auth/kakao");
    const cfg = getKakaoConfig();
    expect(cfg!.redirectUri).not.toContain("//api");
  });

  it("KAKAO_CLIENT_ID 미설정 → null", async () => {
    delete process.env.KAKAO_CLIENT_ID;
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
    const { getKakaoConfig } = await import("@/lib/auth/kakao");
    expect(getKakaoConfig()).toBeNull();
  });

  it("APP_URL 미설정 → null", async () => {
    process.env.KAKAO_CLIENT_ID = "cid";
    delete process.env.NEXT_PUBLIC_APP_URL;
    const { getKakaoConfig } = await import("@/lib/auth/kakao");
    expect(getKakaoConfig()).toBeNull();
  });

  it("kakaoAvailable — config 유무에 따라 boolean", async () => {
    process.env.KAKAO_CLIENT_ID = "cid";
    process.env.NEXT_PUBLIC_APP_URL = "https://a.com";
    const { kakaoAvailable } = await import("@/lib/auth/kakao");
    expect(kakaoAvailable()).toBe(true);
  });

  it("kakaoAvailable — 미설정 시 false", async () => {
    delete process.env.KAKAO_CLIENT_ID;
    delete process.env.NEXT_PUBLIC_APP_URL;
    const { kakaoAvailable } = await import("@/lib/auth/kakao");
    expect(kakaoAvailable()).toBe(false);
  });
});

describe("auth/kakao — buildAuthorizeUrl", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("config 있으면 URL 반환 (state 포함)", async () => {
    process.env.KAKAO_CLIENT_ID = "my-cid";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.com";
    const { buildAuthorizeUrl } = await import("@/lib/auth/kakao");
    const url = buildAuthorizeUrl("csrf-state-123");
    expect(url).not.toBeNull();
    expect(url).toContain("kauth.kakao.com/oauth/authorize");
    expect(url).toContain("client_id=my-cid");
    expect(url).toContain("state=csrf-state-123");
    expect(url).toContain("response_type=code");
    expect(url).toContain("redirect_uri=");
  });

  it("config 없으면 null", async () => {
    delete process.env.KAKAO_CLIENT_ID;
    const { buildAuthorizeUrl } = await import("@/lib/auth/kakao");
    expect(buildAuthorizeUrl("state")).toBeNull();
  });
});

describe("auth/kakao — exchangeCodeForUser", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    mockFetch.mockReset();
    process.env = { ...ORIGINAL_ENV };
    process.env.KAKAO_CLIENT_ID = "cid";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.com";
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("no_config — 환경 미설정", async () => {
    delete process.env.KAKAO_CLIENT_ID;
    const { exchangeCodeForUser } = await import("@/lib/auth/kakao");
    const result = await exchangeCodeForUser("code123");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("no_config");
  });

  it("token_exchange — HTTP 오류", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });
    const { exchangeCodeForUser } = await import("@/lib/auth/kakao");
    const result = await exchangeCodeForUser("code123");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("token_exchange");
      expect(result.message).toContain("401");
    }
  });

  it("token_exchange — access_token 없음", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: "invalid_grant" }),
    });
    const { exchangeCodeForUser } = await import("@/lib/auth/kakao");
    const result = await exchangeCodeForUser("code123");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("token_exchange");
      expect(result.message).toBe("invalid_grant");
    }
  });

  it("user_fetch — HTTP 오류", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "tok123" }),
      })
      .mockResolvedValueOnce({ ok: false, status: 403 });
    const { exchangeCodeForUser } = await import("@/lib/auth/kakao");
    const result = await exchangeCodeForUser("code123");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("user_fetch");
  });

  it("user_fetch — id 없음", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "tok" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // id 없음
      });
    const { exchangeCodeForUser } = await import("@/lib/auth/kakao");
    const result = await exchangeCodeForUser("code123");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("user_fetch");
      expect(result.message).toBe("id missing");
    }
  });

  it("성공 — 전체 user info 추출", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "tok" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 12345,
          kakao_account: {
            profile: { nickname: "테스터", profile_image_url: "https://img.com/a.png" },
            email: "test@kakao.com",
          },
        }),
      });
    const { exchangeCodeForUser } = await import("@/lib/auth/kakao");
    const result = await exchangeCodeForUser("code123");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.kakaoId).toBe("12345");
      expect(result.user.nickname).toBe("테스터");
      expect(result.user.profileImageUrl).toBe("https://img.com/a.png");
      expect(result.user.email).toBe("test@kakao.com");
    }
  });

  it("성공 — properties fallback (kakao_account 없을 때)", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "tok" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 99,
          properties: { nickname: "레거시", profile_image: "https://old.com/b.jpg" },
        }),
      });
    const { exchangeCodeForUser } = await import("@/lib/auth/kakao");
    const result = await exchangeCodeForUser("code123");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.nickname).toBe("레거시");
      expect(result.user.profileImageUrl).toBe("https://old.com/b.jpg");
    }
  });

  it("network — fetch 예외", async () => {
    mockFetch.mockRejectedValueOnce(new Error("DNS failure"));
    const { exchangeCodeForUser } = await import("@/lib/auth/kakao");
    const result = await exchangeCodeForUser("code123");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("network");
      expect(result.message).toBe("DNS failure");
    }
  });

  it("clientSecret 존재 시 token 요청에 포함", async () => {
    process.env.KAKAO_CLIENT_SECRET = "sec123";
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "tok" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      });
    const { exchangeCodeForUser } = await import("@/lib/auth/kakao");
    await exchangeCodeForUser("code");
    const callBody = mockFetch.mock.calls[0][1].body as string;
    expect(callBody).toContain("client_secret=sec123");
  });
});

/* ════════════════════════════════════════════
 * authorize.ts — canWriteTrip
 * ════════════════════════════════════════════ */

const mockGetActorId = vi.fn<() => Promise<string | null>>();
const mockTripFindUnique = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getActorId: (...args: unknown[]) => mockGetActorId(...(args as [])),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { trip: { findUnique: (...args: unknown[]) => mockTripFindUnique(...args) } },
}));

vi.mock("@/lib/seed", () => ({
  DEMO_TRIP_ID: "demo-trip-pqc",
  DEMO_TRIP_IDS: ["demo-trip-pqc"],
}));

describe("auth/authorize — canWriteTrip", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("DEMO_TRIP_ID → 항상 true", async () => {
    const { canWriteTrip } = await import("@/lib/auth/authorize");
    const result = await canWriteTrip("demo-trip-pqc");
    expect(result).toBe(true);
    expect(mockGetActorId).not.toHaveBeenCalled();
  });

  it("미인증 (actorId null) → true (단일 사용자 모드)", async () => {
    mockGetActorId.mockResolvedValue(null);
    const { canWriteTrip } = await import("@/lib/auth/authorize");
    const result = await canWriteTrip("trip-123");
    expect(result).toBe(true);
  });

  it("인증 + 본인 trip → true", async () => {
    mockGetActorId.mockResolvedValue("user-1");
    mockTripFindUnique.mockResolvedValue({ ownerId: "user-1" });
    const { canWriteTrip } = await import("@/lib/auth/authorize");
    const result = await canWriteTrip("trip-abc");
    expect(result).toBe(true);
  });

  it("인증 + 타인 trip → false", async () => {
    mockGetActorId.mockResolvedValue("user-1");
    mockTripFindUnique.mockResolvedValue({ ownerId: "user-2" });
    const { canWriteTrip } = await import("@/lib/auth/authorize");
    const result = await canWriteTrip("trip-abc");
    expect(result).toBe(false);
  });

  it("인증 + trip 미존재 → false", async () => {
    mockGetActorId.mockResolvedValue("user-1");
    mockTripFindUnique.mockResolvedValue(null);
    const { canWriteTrip } = await import("@/lib/auth/authorize");
    const result = await canWriteTrip("trip-xxx");
    expect(result).toBe(false);
  });

  it("DB 에러 → false (fail-closed)", async () => {
    mockGetActorId.mockResolvedValue("user-1");
    mockTripFindUnique.mockRejectedValue(new Error("DB down"));
    const { canWriteTrip } = await import("@/lib/auth/authorize");
    const result = await canWriteTrip("trip-err");
    expect(result).toBe(false);
  });

  it("canWriteTripResource → canWriteTrip 위임", async () => {
    mockGetActorId.mockResolvedValue(null);
    const { canWriteTripResource } = await import("@/lib/auth/authorize");
    const result = await canWriteTripResource("trip-123");
    expect(result).toBe(true);
  });
});

/* ════════════════════════════════════════════
 * session.ts — getCurrentUserId + getOwnerId
 *
 * session 모듈은 authorize에서 이미 vi.mock("@/lib/auth/session")으로
 * mock 처리되었으므로, 별도 파일(auth-session.test.ts)에서 테스트.
 * 여기서는 authorize의 getActorId 위임만 검증.
 * ════════════════════════════════════════════ */

/* ════════════════════════════════════════════
 * actor-resolution.ts — resolveActorIdForTrip
 * ════════════════════════════════════════════ */

describe("auth/actor-resolution — resolveActorIdForTrip", () => {
  it("DEMO trip → null 강제", async () => {
    const { resolveActorIdForTrip } = await import("@/lib/auth/actor-resolution");
    expect(resolveActorIdForTrip("demo-trip-pqc", "user-1")).toBeNull();
  });

  it("일반 trip + actorId → actorId 유지", async () => {
    const { resolveActorIdForTrip } = await import("@/lib/auth/actor-resolution");
    expect(resolveActorIdForTrip("trip-abc", "user-1")).toBe("user-1");
  });

  it("일반 trip + null → null 유지", async () => {
    const { resolveActorIdForTrip } = await import("@/lib/auth/actor-resolution");
    expect(resolveActorIdForTrip("trip-abc", null)).toBeNull();
  });
});
