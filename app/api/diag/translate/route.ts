/**
 * Translate diag endpoint — M4 검증 도구.
 *
 * GET → Claude Vision 키 활성 여부 + 마스킹된 식별자.
 * 키 자체는 노출 X (마지막 4자만). 인증 없음(활성 boolean은 공개 가능 정보).
 */

import { NextResponse } from "next/server";
import { translateAvailable } from "@/lib/services/menu-translation";
import { claudeAvailable } from "@/lib/services/anthropic-claude";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function maskKey(value: string | undefined | null): string | null {
  if (!value || value.length === 0) return null;
  if (value.length <= 4) return "****";
  return `****${value.slice(-4)}`;
}

export function GET() {
  const claudeKey = process.env.ANTHROPIC_API_KEY;

  return NextResponse.json({
    feature: "M4 Camera Translate (Claude Vision)",
    services: {
      claudeVision: {
        available: translateAvailable(),
        keyMask: maskKey(claudeKey),
      },
      claudeText: {
        available: claudeAvailable(),
        keyMask: maskKey(claudeKey),
      },
    },
    fallback: {
      mode: "demo",
      description:
        "ANTHROPIC_API_KEY 미설정 시 정적 메뉴 시드(lib/seed/menu-phu-quoc) 폴백.",
    },
    timestamp: new Date().toISOString(),
  });
}
