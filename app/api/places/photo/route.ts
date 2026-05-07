/**
 * Google Places Photo 프록시 — A3 관광지 이미지.
 *
 * GET /api/places/photo?ref=PHOTO_REF&w=400
 *
 * 정책:
 *   - API 키는 서버에서만 사용 (클라이언트 노출 금지).
 *   - GOOGLE_PLACES_API_KEY 미설정 시 503 반환 → UI 아이콘 fallback.
 *   - Cache-Control: 브라우저 24h + CDN 7일.
 *   - Google Places Photo API 호출 후 이미지 바이트를 그대로 스트림.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEnvKey } from "@/lib/utils/env";

export const dynamic = "force-dynamic";

const GOOGLE_PHOTO_URL =
  "https://maps.googleapis.com/maps/api/place/photo";

export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");
  const width = request.nextUrl.searchParams.get("w") || "400";

  if (!ref) {
    return NextResponse.json(
      { error: "photo_reference 필수" },
      { status: 400 },
    );
  }

  const apiKey = getEnvKey("GOOGLE_PLACES_API_KEY");
  if (!apiKey) {
    return NextResponse.json(
      { error: "Photo service unavailable" },
      { status: 503 },
    );
  }

  const googleUrl = `${GOOGLE_PHOTO_URL}?photo_reference=${encodeURIComponent(ref)}&maxwidth=${encodeURIComponent(width)}&key=${apiKey}`;

  try {
    // Google은 302 redirect → 실제 이미지 URL. follow로 최종 이미지 수신.
    const response = await fetch(googleUrl, { redirect: "follow" });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 404 },
      );
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch photo" },
      { status: 502 },
    );
  }
}
