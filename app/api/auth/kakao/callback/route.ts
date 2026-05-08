/**
 * 카카오 OAuth 콜백 — 사이클 11b (ADR-026).
 * GET /api/auth/kakao/callback?code=...&state=...
 *
 * 1. state 검증
 * 2. code → access_token 교환 → user info 조회
 * 3. prisma.user.upsert
 * 4. JWT 발급 (access + refresh) → httpOnly 쿠키 set
 * 5. AuditLog "auth.login"
 * 6. 302 redirect to /
 */

import { NextResponse, type NextRequest } from "next/server";
import { exchangeCodeForUser, kakaoAvailable } from "@/lib/auth/kakao";
import { upsertKakaoUser } from "@/lib/repositories/user.repository";
import { signToken } from "@/lib/auth/jwt";
import { writeAuditLog } from "@/lib/audit-log";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "/";

function makeRedirectError(reason: string): NextResponse {
  const url = new URL(`/?auth_error=${encodeURIComponent(reason)}`, APP_URL);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  if (!kakaoAvailable()) return makeRedirectError("not_configured");

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code) return makeRedirectError("no_code");

  // CSRF state 검증
  const stateCookie = req.cookies.get("kakao_state")?.value;
  if (!stateCookie || stateCookie !== state) {
    return makeRedirectError("state_mismatch");
  }

  // code → user info
  const exchange = await exchangeCodeForUser(code);
  if (!exchange.ok) return makeRedirectError(`exchange_${exchange.code}`);

  // user upsert
  const result = await upsertKakaoUser({
    kakaoId: exchange.user.kakaoId,
    nickname: exchange.user.nickname,
    email: exchange.user.email, // 11c: 동의 시
  });
  if (!result) return makeRedirectError("user_upsert_failed");

  const { user, isNew } = result;

  // JWT 발급
  const accessToken = await signToken(user.id, "access");
  const refreshToken = await signToken(user.id, "refresh");
  if (!accessToken || !refreshToken) return makeRedirectError("jwt_unavailable");

  // AuditLog
  await writeAuditLog({
    actorId: user.id,
    action: "auth.login",
    resource: "User",
    resourceId: user.id,
    metadata: { provider: "kakao", source: "web", isNew },
  });

  // 신규 사용자 → /welcome, 기존 사용자 → /
  const redirectPath = isNew ? "/welcome" : "/";
  const resp = NextResponse.redirect(new URL(redirectPath, APP_URL));

  resp.cookies.set("access_token", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 15 * 60, // 15min
    path: "/",
  });
  resp.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30일
    path: "/",
  });
  // state 쿠키 제거
  resp.cookies.delete("kakao_state");

  return resp;
}
