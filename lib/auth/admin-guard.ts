/**
 * Admin 페이지 접근 가드 — PRD BLOCKER 3.
 *
 * 인증 경로:
 *   ADMIN_SECRET_KEY env + searchParams.key timing-safe 일치 → 허용
 *   그 외 → notFound() (404)
 *
 * fail-closed: env 미설정 시 admin 페이지 자체가 404.
 * 사이클 BLOCKER3 도입.
 */

import "server-only";

import { notFound } from "next/navigation";
import { timingSafeEqual } from "node:crypto";

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function assertAdminAccess(searchParams: { key?: string }): void {
  const envKey = process.env.ADMIN_SECRET_KEY;
  const provided = searchParams.key;
  if (!envKey || !provided || !safeCompare(envKey, provided)) {
    notFound();
  }
}
