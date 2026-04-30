/**
 * 카카오 OAuth 시작 — 사이클 11b (ADR-026).
 * GET /api/auth/kakao/start → 카카오 동의 페이지로 302 redirect
 */

import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { buildAuthorizeUrl, kakaoAvailable } from "@/lib/auth/kakao";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!kakaoAvailable()) {
    return NextResponse.json(
      { error: "kakao_oauth_not_configured" },
      { status: 503 },
    );
  }

  // CSRF 방어용 state — 콜백에서 검증 (옵션, 11b는 단순)
  const state = randomBytes(16).toString("hex");
  const url = buildAuthorizeUrl(state);
  if (!url) {
    return NextResponse.json(
      { error: "kakao_oauth_not_configured" },
      { status: 503 },
    );
  }

  const resp = NextResponse.redirect(url);
  resp.cookies.set("kakao_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600, // 10분
    path: "/",
  });
  return resp;
}
