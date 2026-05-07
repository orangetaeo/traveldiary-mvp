/**
 * lib/auth/kakao.ts 단위 테스트.
 *
 * getKakaoConfig, kakaoAvailable, buildAuthorizeUrl, exchangeCodeForUser.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

const ENV_BACKUP: Record<string, string | undefined> = {};

function setEnv(key: string, value: string | undefined) {
  if (!(key in ENV_BACKUP)) ENV_BACKUP[key] = process.env[key];
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

function restoreEnv() {
  for (const [key, value] of Object.entries(ENV_BACKUP)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  // Clear backup
  for (const key of Object.keys(ENV_BACKUP)) delete ENV_BACKUP[key];
}

import {
  getKakaoConfig,
  kakaoAvailable,
  buildAuthorizeUrl,
  exchangeCodeForUser,
} from "@/lib/auth/kakao";

describe("kakao", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    restoreEnv();
  });

  // ─── getKakaoConfig ────────────────────────────────────────

  describe("getKakaoConfig", () => {
    it("env 미설정 → null", () => {
      setEnv("KAKAO_CLIENT_ID", undefined);
      setEnv("NEXT_PUBLIC_APP_URL", undefined);
      expect(getKakaoConfig()).toBeNull();
    });

    it("KAKAO_CLIENT_ID만 있고 APP_URL 없으면 → null", () => {
      setEnv("KAKAO_CLIENT_ID", "test-id");
      setEnv("NEXT_PUBLIC_APP_URL", undefined);
      expect(getKakaoConfig()).toBeNull();
    });

    it("둘 다 있으면 → config 반환", () => {
      setEnv("KAKAO_CLIENT_ID", "my-client-id");
      setEnv("NEXT_PUBLIC_APP_URL", "https://app.test");
      setEnv("KAKAO_CLIENT_SECRET", undefined);

      const cfg = getKakaoConfig();
      expect(cfg).toEqual({
        clientId: "my-client-id",
        clientSecret: undefined,
        redirectUri: "https://app.test/api/auth/kakao/callback",
      });
    });

    it("APP_URL 후행 슬래시 제거", () => {
      setEnv("KAKAO_CLIENT_ID", "id");
      setEnv("NEXT_PUBLIC_APP_URL", "https://app.test/");
      const cfg = getKakaoConfig();
      expect(cfg?.redirectUri).toBe("https://app.test/api/auth/kakao/callback");
    });

    it("clientSecret 포함", () => {
      setEnv("KAKAO_CLIENT_ID", "id");
      setEnv("NEXT_PUBLIC_APP_URL", "https://app.test");
      setEnv("KAKAO_CLIENT_SECRET", "my-secret");
      const cfg = getKakaoConfig();
      expect(cfg?.clientSecret).toBe("my-secret");
    });
  });

  // ─── kakaoAvailable ────────────────────────────────────────

  describe("kakaoAvailable", () => {
    it("env 미설정 → false", () => {
      setEnv("KAKAO_CLIENT_ID", undefined);
      setEnv("NEXT_PUBLIC_APP_URL", undefined);
      expect(kakaoAvailable()).toBe(false);
    });

    it("env 설정 → true", () => {
      setEnv("KAKAO_CLIENT_ID", "id");
      setEnv("NEXT_PUBLIC_APP_URL", "https://app.test");
      expect(kakaoAvailable()).toBe(true);
    });
  });

  // ─── buildAuthorizeUrl ─────────────────────────────────────

  describe("buildAuthorizeUrl", () => {
    it("env 미설정 → null", () => {
      setEnv("KAKAO_CLIENT_ID", undefined);
      setEnv("NEXT_PUBLIC_APP_URL", undefined);
      expect(buildAuthorizeUrl("state-123")).toBeNull();
    });

    it("URL 구조 검증", () => {
      setEnv("KAKAO_CLIENT_ID", "my-id");
      setEnv("NEXT_PUBLIC_APP_URL", "https://app.test");
      const url = buildAuthorizeUrl("state-abc");
      expect(url).not.toBeNull();
      const parsed = new URL(url!);
      expect(parsed.origin).toBe("https://kauth.kakao.com");
      expect(parsed.pathname).toBe("/oauth/authorize");
      expect(parsed.searchParams.get("client_id")).toBe("my-id");
      expect(parsed.searchParams.get("response_type")).toBe("code");
      expect(parsed.searchParams.get("state")).toBe("state-abc");
      expect(parsed.searchParams.get("redirect_uri")).toBe(
        "https://app.test/api/auth/kakao/callback",
      );
    });
  });

  // ─── exchangeCodeForUser ───────────────────────────────────

  describe("exchangeCodeForUser", () => {
    it("env 미설정 → no_config", async () => {
      setEnv("KAKAO_CLIENT_ID", undefined);
      setEnv("NEXT_PUBLIC_APP_URL", undefined);
      const r = await exchangeCodeForUser("code-1");
      expect(r).toEqual({ ok: false, code: "no_config" });
    });

    it("token exchange HTTP 오류 → token_exchange", async () => {
      setEnv("KAKAO_CLIENT_ID", "id");
      setEnv("NEXT_PUBLIC_APP_URL", "https://app.test");

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve("bad request"),
      });
      vi.stubGlobal("fetch", mockFetch);

      const r = await exchangeCodeForUser("code-1");
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.code).toBe("token_exchange");
        expect(r.message).toContain("400");
      }

      vi.unstubAllGlobals();
    });

    it("token exchange 성공 + user fetch 실패 → user_fetch", async () => {
      setEnv("KAKAO_CLIENT_ID", "id");
      setEnv("NEXT_PUBLIC_APP_URL", "https://app.test");

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: "at-123" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        });
      vi.stubGlobal("fetch", mockFetch);

      const r = await exchangeCodeForUser("code-1");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.code).toBe("user_fetch");

      vi.unstubAllGlobals();
    });

    it("전체 성공 → ok + user info", async () => {
      setEnv("KAKAO_CLIENT_ID", "id");
      setEnv("NEXT_PUBLIC_APP_URL", "https://app.test");

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: "at-123" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 12345,
              kakao_account: {
                profile: {
                  nickname: "테스터",
                  profile_image_url: "https://img.test/photo.jpg",
                },
                email: "test@example.com",
              },
            }),
        });
      vi.stubGlobal("fetch", mockFetch);

      const r = await exchangeCodeForUser("code-1");
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.user.kakaoId).toBe("12345");
        expect(r.user.nickname).toBe("테스터");
        expect(r.user.profileImageUrl).toBe("https://img.test/photo.jpg");
        expect(r.user.email).toBe("test@example.com");
      }

      vi.unstubAllGlobals();
    });

    it("user id 없음 → user_fetch", async () => {
      setEnv("KAKAO_CLIENT_ID", "id");
      setEnv("NEXT_PUBLIC_APP_URL", "https://app.test");

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: "at-123" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        });
      vi.stubGlobal("fetch", mockFetch);

      const r = await exchangeCodeForUser("code-1");
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.code).toBe("user_fetch");
        expect(r.message).toBe("id missing");
      }

      vi.unstubAllGlobals();
    });

    it("네트워크 예외 → network", async () => {
      setEnv("KAKAO_CLIENT_ID", "id");
      setEnv("NEXT_PUBLIC_APP_URL", "https://app.test");

      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

      const r = await exchangeCodeForUser("code-1");
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.code).toBe("network");
        expect(r.message).toBe("ECONNREFUSED");
      }

      vi.unstubAllGlobals();
    });

    it("access_token 없음 → token_exchange", async () => {
      setEnv("KAKAO_CLIENT_ID", "id");
      setEnv("NEXT_PUBLIC_APP_URL", "https://app.test");

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ error: "invalid_grant" }),
        }),
      );

      const r = await exchangeCodeForUser("code-1");
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.code).toBe("token_exchange");
        expect(r.message).toBe("invalid_grant");
      }

      vi.unstubAllGlobals();
    });

    it("properties fallback (kakao_account 없을 때)", async () => {
      setEnv("KAKAO_CLIENT_ID", "id");
      setEnv("NEXT_PUBLIC_APP_URL", "https://app.test");

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: "at" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 99,
              properties: {
                nickname: "레거시닉",
                profile_image: "https://legacy.test/img.jpg",
              },
            }),
        });
      vi.stubGlobal("fetch", mockFetch);

      const r = await exchangeCodeForUser("code-1");
      if (r.ok) {
        expect(r.user.nickname).toBe("레거시닉");
        expect(r.user.profileImageUrl).toBe("https://legacy.test/img.jpg");
      }

      vi.unstubAllGlobals();
    });
  });
});
