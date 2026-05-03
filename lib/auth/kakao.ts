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

/**
 * 카카오 동의 페이지 URL.
 * scope 미지정 — 카카오 콘솔에 등록된 동의 항목(닉네임 필수)을 자동 사용.
 *
 * 사이클 DDD(2026-05-03): scope="account_email" 제거.
 *   account_email은 비즈 앱 등록 후에만 활성 가능. 미등록 상태에서 요청하면 KOE205.
 *   향후 비즈 전환 시 ADR-026 §189에 따라 사이클 11c+에서 재도입.
 */
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
  email?: string;
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
      kakao_account?: {
        profile?: { nickname?: string; profile_image_url?: string };
        email?: string;
        is_email_valid?: boolean;
        is_email_verified?: boolean;
      };
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
        // 11c: 이메일 (사용자 동의 + 카카오 콘솔 활성 시만 응답에 포함)
        email:
          userJson.kakao_account?.email ??
          undefined,
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
