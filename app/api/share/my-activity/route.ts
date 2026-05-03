/**
 * 본인 활동 API — 사이클 YY (/shared 본인 활동 섹션 후속).
 *
 * POST { clientUuid: string } → 본인이 남긴 ShareComment 목록 (활성/만료 모두).
 *
 * 권한 모델: anyway anonymous. clientUuid는 LocalStorage 익명 토큰이라
 * 다른 사람의 UUID를 알면 활동 노출 가능 — 사이클 R(ADR-036) 익명 협업 정책 답습.
 * IP rate limit으로 무차별 brute force 방어.
 */

import { NextResponse, type NextRequest } from "next/server";
import { isDbConnected } from "@/lib/prisma";
import { listMyActivityByClientUuid } from "@/lib/repositories/shareComment.repository";
import { checkIpRate } from "@/lib/share/lookupRateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkIpRate(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: { clientUuid?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (typeof body.clientUuid !== "string") {
    return NextResponse.json({ error: "clientUuid_required" }, { status: 400 });
  }
  if (body.clientUuid.length < 8 || body.clientUuid.length > 200) {
    return NextResponse.json({ error: "clientUuid_invalid" }, { status: 400 });
  }

  if (!isDbConnected) {
    return NextResponse.json({ items: [] });
  }

  const items = await listMyActivityByClientUuid(body.clientUuid, 50);
  return NextResponse.json({ items });
}
