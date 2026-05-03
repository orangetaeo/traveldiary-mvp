/**
 * Translate diag endpoint — 사이클 Y (M4 검증 도구).
 *
 * GET → Vision/Claude 키 활성 여부 + 마스킹된 식별자.
 * 키 자체는 노출 X (마지막 4자만). 인증 없음(활성 boolean은 공개 가능 정보).
 *
 * 사용처: Vision/Claude 키 발급 후 라이브에서 "정말 인식됐나" 1회 확인.
 * docs/12-user-actions.md §C에 절차 안내.
 */

import { NextResponse } from "next/server";
import { visionAvailable } from "@/lib/services/google-vision";
import { claudeAvailable } from "@/lib/services/anthropic-claude";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function maskKey(value: string | undefined | null): string | null {
  if (!value || value.length === 0) return null;
  if (value.length <= 4) return "****";
  return `****${value.slice(-4)}`;
}

export function GET() {
  const visionKey = process.env.GOOGLE_VISION_API_KEY;
  const claudeKey = process.env.ANTHROPIC_API_KEY;

  return NextResponse.json({
    feature: "M4 Camera Translate",
    services: {
      vision: {
        available: visionAvailable(),
        keyMask: maskKey(visionKey),
      },
      claude: {
        available: claudeAvailable(),
        keyMask: maskKey(claudeKey),
      },
    },
    fallback: {
      mode: "demo",
      description:
        "둘 중 하나라도 미설정이면 정적 메뉴 시드(lib/seed/menu-phu-quoc) 폴백. UX는 동일하나 실제 OCR/번역은 비활성.",
    },
    timestamp: new Date().toISOString(),
  });
}
