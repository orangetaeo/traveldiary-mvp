/**
 * 로그아웃 — 사이클 11b (ADR-026).
 * POST /api/auth/logout — 쿠키 제거 + AuditLog "auth.logout".
 */

import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { writeAuditLog } from "@/lib/audit-log";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // 액터 식별 (옵션, audit log용)
  let actorId: string | null = null;
  try {
    const access = req.cookies.get("access_token")?.value;
    if (access) {
      const payload = await verifyToken(access);
      if (payload?.type === "access") actorId = payload.sub;
    }
  } catch {
    // ignore
  }

  if (actorId) {
    await writeAuditLog({
      actorId,
      action: "auth.logout",
      resource: "User",
      resourceId: actorId,
      metadata: { source: "web" },
    });
  }

  const resp = NextResponse.json({ ok: true });
  resp.cookies.delete("access_token");
  resp.cookies.delete("refresh_token");
  return resp;
}
