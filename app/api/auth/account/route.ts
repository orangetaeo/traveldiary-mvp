/**
 * 계정 삭제 — 사이클 8 (G3, ADR-049) + 사이클 9 deferred Minor 보강.
 * DELETE /api/auth/account — CSRF 체크 → confirm 재검증 → JWT 인증 → rate limit
 *   → 익명화 → 쿠키 clear → 200.
 *
 * 클라이언트는 응답 후 LocalStorage `td-client-uuid` 등 정리하고 /account/deleted로 이동.
 *
 * 사이클 9 보강:
 *   - CSRF: Origin 우선 + Referer fallback. host header와 일치해야 통과.
 *   - Rate limit: userId 기반 5분 1회. 초과 시 429.
 *   - Reason 매핑: 내부 reason은 외부 화이트리스트로 매핑 (정보 누설 회피).
 */

import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import {
  anonymizeUserAccount,
  isValidAccountDeleteConfirm,
} from "@/lib/auth/account-delete";
import { checkAccountDeleteRate } from "@/lib/auth/accountDeleteRateLimit";
import { writeAuditLog } from "@/lib/audit-log";

export const dynamic = "force-dynamic";

/**
 * Origin/Referer가 같은 호스트(host header)에서 온 것인지 검증.
 * - Origin 헤더 우선. null/undefined 시 Referer fallback.
 * - 둘 다 없으면 reject (브라우저는 cross-origin DELETE에 대해 최소 하나는 항상 전송).
 * - 비교는 host (port 포함). protocol/path 무시.
 */
function isSameOriginRequest(req: NextRequest): boolean {
  const host = req.headers.get("host");
  if (!host) return false;

  const candidate = req.headers.get("origin") ?? req.headers.get("referer");
  if (!candidate) return false;

  try {
    const url = new URL(candidate);
    return url.host === host;
  } catch {
    return false;
  }
}

/**
 * 내부 reason → 외부 노출 코드 화이트리스트 매핑.
 * `db_unavailable` / `tx_failed` / `user_not_found` / `unknown` 등은 모두
 * `internal_error`로 통일 (정보 누설 회피). raw reason은 server log/audit에서만 추적.
 */
function mapAccountDeleteReason(_reason: string | undefined): string {
  return "internal_error";
}

export async function DELETE(req: NextRequest) {
  // 1. CSRF Origin/Referer 검증 (T16 권고)
  if (!isSameOriginRequest(req)) {
    await writeAuditLog({
      action: "auth.account_delete_origin_blocked",
      resource: "User",
      resourceId: "unknown",
      metadata: {
        origin: req.headers.get("origin") ?? null,
        referer: req.headers.get("referer") ?? null,
        host: req.headers.get("host") ?? null,
      },
    });
    return NextResponse.json(
      { ok: false, code: "forbidden_origin" },
      { status: 403 },
    );
  }

  // 2. Body parse
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid_body" },
      { status: 400 },
    );
  }

  // 3. Confirm phrase 재검증
  const confirm = (body as { confirm?: unknown } | null)?.confirm;
  if (!isValidAccountDeleteConfirm(confirm)) {
    return NextResponse.json(
      { ok: false, code: "confirm_mismatch" },
      { status: 400 },
    );
  }

  // 4. JWT 인증
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

  // 5. Rate limit (인증 후 — userId 기반)
  if (!checkAccountDeleteRate(payload.sub)) {
    await writeAuditLog({
      actorId: payload.sub,
      action: "auth.account_delete_rate_limited",
      resource: "User",
      resourceId: payload.sub,
    });
    return NextResponse.json(
      { ok: false, code: "rate_limited" },
      { status: 429 },
    );
  }

  // 6. 익명화 트랜잭션
  const result = await anonymizeUserAccount(payload.sub);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, code: mapAccountDeleteReason(result.reason) },
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
