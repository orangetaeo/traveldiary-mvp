/**
 * 계정 삭제 — 사이클 8 (G3, ADR-049).
 * DELETE /api/auth/account — 텍스트 confirm 재검증 → 익명화 → 쿠키 clear → 200.
 *
 * 클라이언트는 응답 후 LocalStorage `td-client-uuid` 등 정리하고 /account/deleted로 이동.
 */

import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import {
  anonymizeUserAccount,
  isValidAccountDeleteConfirm,
} from "@/lib/auth/account-delete";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid_body" },
      { status: 400 },
    );
  }

  const confirm = (body as { confirm?: unknown } | null)?.confirm;
  if (!isValidAccountDeleteConfirm(confirm)) {
    return NextResponse.json(
      { ok: false, code: "confirm_mismatch" },
      { status: 400 },
    );
  }

  const access = req.cookies.get("access_token")?.value;
  if (!access) {
    return NextResponse.json(
      { ok: false, code: "not_authenticated" },
      { status: 401 },
    );
  }

  const payload = await verifyToken(access);
  if (!payload || payload.type !== "access") {
    return NextResponse.json(
      { ok: false, code: "invalid_token" },
      { status: 401 },
    );
  }

  const result = await anonymizeUserAccount(payload.sub);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, code: result.reason ?? "unknown" },
      { status: 500 },
    );
  }

  const resp = NextResponse.json({
    ok: true,
    reassignedTripCount: result.reassignedTripCount ?? 0,
    removedMemberships: result.removedMemberships ?? 0,
  });
  resp.cookies.delete("access_token");
  resp.cookies.delete("refresh_token");
  return resp;
}
