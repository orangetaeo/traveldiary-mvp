/**
 * OG Image — 사이클 F (D5 인스타 공유).
 *
 * /share/[key]의 OG 이미지를 동적 생성.
 * Next.js ImageResponse 사용 — 의존성 0.
 *
 * 호출 위치:
 *   - meta property="og:image" (share 페이지에서 자동)
 *   - 인스타 스토리 공유 시 미리보기 카드
 */

import { ImageResponse } from "next/og";
import { fetchShareLinkBySyncKey } from "@/lib/repositories/share.repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { key: string } },
) {
  const found = await fetchShareLinkBySyncKey(params.key);

  // 만료/철회/없음 — 기본 이미지
  if (!found) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
            background: "#F8FAFC",
            color: "#64748B",
          }}
        >
          TravelDiary
        </div>
      ),
      { width: 1200, height: 630 },
    );
  }

  const { trip, items } = found.bundle;
  const day1 = items.filter((it) => it.dayIndex === 0).length;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #7C3AED 0%, #F97316 100%)",
          padding: 80,
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 24,
            opacity: 0.9,
            letterSpacing: 4,
            marginBottom: 20,
            display: "flex",
          }}
        >
          TRAVELDIARY · 공유된 여행
        </div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            marginBottom: 16,
            display: "flex",
          }}
        >
          {trip.destination}
        </div>
        <div
          style={{
            fontSize: 36,
            opacity: 0.95,
            marginBottom: 60,
            display: "flex",
          }}
        >
          {trip.nights}박 {trip.nights + 1}일 · 일정 {items.length}개
        </div>
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: "auto",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.2)",
              padding: "16px 28px",
              borderRadius: 16,
              fontSize: 28,
              display: "flex",
            }}
          >
            🗓 {trip.startDate}
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.2)",
              padding: "16px 28px",
              borderRadius: 16,
              fontSize: 28,
              display: "flex",
            }}
          >
            ✨ Day 1 — {day1}곳
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
