/**
 * Story Image — D5 인스타그램 공유.
 *
 * /share/[key]의 Instagram Story 이미지를 동적 생성.
 * 세로 1080×1920 포맷. Next.js ImageResponse — 의존성 0.
 *
 * 호출 위치:
 *   - ShareModal "인스타 스토리 카드 저장" 버튼
 *   - 직접 URL 접근 (브라우저에서 이미지 다운로드)
 */

import { ImageResponse } from "next/og";
import { fetchShareLinkBySyncKey } from "@/lib/repositories/share.repository";
import type { ItineraryItem, ItemCategory } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** ADR-050: 6 카테고리 */
const CATEGORY_EMOJI: Record<ItemCategory, string> = {
  food: "🍜",
  spot: "🏛️",
  shopping: "🛍️",
  stay: "🏨",
  wellness: "💆",
  rest: "☕",
};

const CATEGORY_LABEL: Record<ItemCategory, string> = {
  food: "음식",
  spot: "관광",
  shopping: "쇼핑",
  stay: "숙소",
  wellness: "마사지",
  rest: "휴식",
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { key: string } },
) {
  const found = await fetchShareLinkBySyncKey(params.key);

  if (!found) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(180deg, #7C3AED 0%, #4C1D95 100%)",
            color: "white",
            fontSize: 48,
            fontFamily: "sans-serif",
          }}
        >
          TravelDiary
        </div>
      ),
      { width: 1080, height: 1920 },
    );
  }

  const { trip, items } = found.bundle;

  // Day 1 항목만 최대 5개 표시
  const day1Items = items
    .filter((it: ItineraryItem) => it.dayIndex === 0)
    .sort((a: ItineraryItem, b: ItineraryItem) =>
      a.scheduledAt.localeCompare(b.scheduledAt),
    )
    .slice(0, 5);

  const totalDays = trip.nights + 1;
  const totalPlaces = items.length;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(180deg, #7C3AED 0%, #5B21B6 40%, #4C1D95 100%)",
          padding: "80px 60px",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {/* 상단 브랜드 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              fontSize: 20,
              letterSpacing: 6,
              opacity: 0.8,
              display: "flex",
            }}
          >
            TRAVELDIARY
          </div>
        </div>

        {/* 도시명 */}
        <div
          style={{
            fontSize: 120,
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 16,
            display: "flex",
          }}
        >
          {trip.destination}
        </div>

        {/* 여행 기본 정보 */}
        <div
          style={{
            display: "flex",
            gap: 20,
            marginBottom: 60,
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.15)",
              padding: "12px 24px",
              borderRadius: 50,
              fontSize: 28,
              display: "flex",
            }}
          >
            🗓 {trip.nights}박 {totalDays}일
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.15)",
              padding: "12px 24px",
              borderRadius: 50,
              fontSize: 28,
              display: "flex",
            }}
          >
            📍 {totalPlaces}곳
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.15)",
              padding: "12px 24px",
              borderRadius: 50,
              fontSize: 28,
              display: "flex",
            }}
          >
            {trip.startDate}
          </div>
        </div>

        {/* Day 1 일정 카드 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              marginBottom: 8,
              opacity: 0.9,
              display: "flex",
            }}
          >
            Day 1 하이라이트
          </div>
          {day1Items.map((item: ItineraryItem, i: number) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                background: i === 0
                  ? "rgba(249,115,22,0.25)"
                  : "rgba(255,255,255,0.1)",
                borderRadius: 20,
                padding: "20px 28px",
                border: i === 0
                  ? "2px solid rgba(249,115,22,0.5)"
                  : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div
                style={{
                  fontSize: 40,
                  display: "flex",
                }}
              >
                {CATEGORY_EMOJI[item.category]}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  gap: 4,
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    display: "flex",
                  }}
                >
                  {item.name}
                </div>
                <div
                  style={{
                    fontSize: 22,
                    opacity: 0.7,
                    display: "flex",
                  }}
                >
                  {formatTime(item.scheduledAt)} · {CATEGORY_LABEL[item.category]} · {item.durationMinutes}분
                </div>
              </div>
            </div>
          ))}
          {items.filter((it: ItineraryItem) => it.dayIndex === 0).length > 5 && (
            <div
              style={{
                fontSize: 24,
                opacity: 0.6,
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
              }}
            >
              +{items.filter((it: ItineraryItem) => it.dayIndex === 0).length - 5}곳 더
            </div>
          )}
        </div>

        {/* 하단 CTA */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            marginTop: 40,
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.2)",
              padding: "16px 40px",
              borderRadius: 50,
              fontSize: 26,
              fontWeight: 700,
              display: "flex",
            }}
          >
            TravelDiary에서 일정 보기 →
          </div>
          <div
            style={{
              fontSize: 20,
              opacity: 0.5,
              display: "flex",
            }}
          >
            AI가 검증한 여행 일정
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
        "Content-Disposition": `inline; filename="traveldiary-story.png"; filename*=UTF-8''traveldiary-${encodeURIComponent(trip.destination)}.png`,
      },
    },
  );
}
