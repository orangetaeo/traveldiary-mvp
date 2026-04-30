/**
 * 카카오 OAuth 헬퍼 — 사이클 11b (ADR-026).
 *
 * server-only. Token exchange + user info fetch.
 */

import "server-only";

const KAKAO_AUTHORIZE_URL = "https://kauth.kakao.com/oauth/authorize";
const KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";
const KAKAO_USER_URL = "https://kapi.kakao.com/v2/user/me";

export interface KakaoConfig {
  clientId: string;
  clientSecret?: string; // 옵션 — 카카오 콘솔에서 활성한 경우만
  redirectUri: string;
}

export function getKakaoConfig(): KakaoConfig | null {
  const clientId = process.env.KAKAO_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!clientId || !appUrl) return null;

  return {
    clientId,
    clientSecret: process.env.KAKAO_CLIENT_SECRET,
    redirectUri: `${appUrl.replace(/\/$/, "")}/api/auth/kakao/callback`,
  };
}

export const kakaoAvailable = (): boolean => getKakaoConfig() !== null;

/** 카카오 동의 페이지 URL */
export function buildAuthorizeUrl(state: string): string | null {
  const cfg = getKakaoConfig();
  if (!cfg) return null;
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    state,
  });
  return `${KAKAO_AUTHORIZE_URL}?${params.toString()}`;
}

export interface KakaoUserInfo {
  kakaoId: string;
  nickname?: string;
  profileImageUrl?: string;
}

export type ExchangeOutcome =
  | { ok: true; user: KakaoUserInfo }
  | { ok: false; code: "no_config" | "token_exchange" | "user_fetch" | "network"; message?: string };

/** code → access_token 교환 + user info 조회 */
export async function exchangeCodeForUser(
  code: string,
): Promise<ExchangeOutcome> {
  const cfg = getKakaoConfig();
  if (!cfg) return { ok: false, code: "no_config" };

  try {
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: cfg.clientId,
      redirect_uri: cfg.redirectUri,
      code,
    });
    if (cfg.clientSecret) tokenParams.set("client_secret", cfg.clientSecret);

    const tokenResp = await fetch(KAKAO_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString(),
      cache: "no-store",
    });

    if (!tokenResp.ok) {
      const text = await tokenResp.text().catch(() => "");
      return {
        ok: false,
        code: "token_exchange",
        message: `${tokenResp.status} ${text}`,
      };
    }

    const tokenJson = (await tokenResp.json()) as {
      access_token?: string;
      error?: string;
    };
    if (!tokenJson.access_token) {
      return { ok: false, code: "token_exchange", message: tokenJson.error };
    }

    const userResp = await fetch(KAKAO_USER_URL, {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      cache: "no-store",
    });
    if (!userResp.ok) {
      return { ok: false, code: "user_fetch", message: `HTTP ${userResp.status}` };
    }

    const userJson = (await userResp.json()) as {
      id?: number;
      properties?: { nickname?: string; profile_image?: string };
      kakao_account?: { profile?: { nickname?: string; profile_image_url?: string } };
    };

    if (!userJson.id) {
      return { ok: false, code: "user_fetch", message: "id missing" };
    }

    return {
      ok: true,
      user: {
        kakaoId: String(userJson.id),
        nickname:
          userJson.kakao_account?.profile?.nickname ??
          userJson.properties?.nickname,
        profileImageUrl:
          userJson.kakao_account?.profile?.profile_image_url ??
          userJson.properties?.profile_image,
      },
    };
  } catch (err) {
    return {
      ok: false,
      code: "network",
      message: err instanceof Error ? err.message : "unknown",
    };
  }
}
