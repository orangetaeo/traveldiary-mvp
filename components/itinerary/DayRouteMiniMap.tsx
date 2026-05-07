"use client";

/**
 * DayRouteMiniMap — itinerary 메인 페이지 상단 임베드용 미니 동선 지도 (U3, 사이클 디자인 갭 #1).
 *
 * - 인라인 220px 카드. 핀 + dashed route line + 풀스크린 확대 링크.
 * - DayRouteMapView(풀스크린 fixed)와 별개 컴포넌트. 사용처 2곳뿐이라
 *   feedback_dry_extraction_with_reexport(3+ 영역) 트리거 미충족 → 추출하지 않음.
 * - items.location.lat/lng → pinX/pinY 정규화. bounding box 붕괴 시 균등 분포 폴백.
 */

import Link from "next/link";
import type { ItineraryItem } from "@/lib/types";

interface Props {
  tripId: string;
  dayIndex: number;
  items: ItineraryItem[];
}

const PADDING = 12;
const EPSILON = 1e-6;

function computePins(items: ItineraryItem[]): Array<{ x: number; y: number }> {
  if (items.length === 0) return [];
  if (items.length === 1) return [{ x: 50, y: 50 }];

  const lats = items.map((it) => it.location.lat);
  const lngs = items.map((it) => it.location.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const dLat = maxLat - minLat;
  const dLng = maxLng - minLng;

  // 모두 동일 좌표(또는 0/0 폴백) → 대각선 균등 분포
  if (dLat < EPSILON && dLng < EPSILON) {
    return items.map((_, idx) => {
      const t = idx / (items.length - 1);
      return {
        x: PADDING + t * (100 - 2 * PADDING),
        y: PADDING + t * (100 - 2 * PADDING),
      };
    });
  }

  return items.map((it) => {
    const tX = dLng < EPSILON ? 0.5 : (it.location.lng - minLng) / dLng;
    // lat 북쪽이 위 → Y 반전
    const tY = dLat < EPSILON ? 0.5 : 1 - (it.location.lat - minLat) / dLat;
    return {
      x: PADDING + tX * (100 - 2 * PADDING),
      y: PADDING + tY * (100 - 2 * PADDING),
    };
  });
}

export function DayRouteMiniMap({ tripId, dayIndex, items }: Props) {
  if (items.length === 0) return null;

  const pins = computePins(items);
  const mapHref = `/itinerary/${tripId}/map?day=${dayIndex}`;

  return (
    <section
      className="relative mx-td-md mb-td-md rounded-md overflow-hidden border border-divider bg-surface-card shadow-sm"
      aria-label={`Day ${dayIndex + 1} 미니 동선 지도`}
      data-testid="day-route-mini-map"
    >
      <div className="relative h-[220px] bg-gradient-to-b from-blue-50 via-green-50/40 to-surface-soft">
        {/* 격자 패턴 (가벼운 지도 텍스처) */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          aria-hidden
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0H0v40' fill='none' stroke='%23000' stroke-width='1'/%3E%3C/svg%3E")`,
          }}
        />

        {/* SVG 동선 라인 (2 핀 이상일 때만) */}
        {pins.length >= 2 && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <polyline
              points={pins.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#7C3AED"
              strokeWidth="0.5"
              strokeDasharray="1.5,1.5"
              opacity="0.7"
            />
          </svg>
        )}

        {/* 핀 (번호 원형) */}
        {pins.map((p, idx) => (
          <div
            key={items[idx].id}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full bg-purple text-white border-2 border-white shadow-md"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            aria-label={`${idx + 1}번 ${items[idx].name}`}
          >
            <span className="text-[11px] font-bold">{idx + 1}</span>
          </div>
        ))}

        {/* 우측 상단: 풀스크린 확대 */}
        <Link
          href={mapHref}
          aria-label="동선 지도 풀스크린 보기"
          className="absolute top-2 right-2 w-9 h-9 rounded-full bg-surface-card/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-surface-card transition-colors"
        >
          <span className="material-symbols-outlined text-[20px] text-ink">
            open_in_full
          </span>
        </Link>

        {/* 하단 메타 + 확대 링크 */}
        <div className="absolute bottom-0 left-0 right-0 px-td-sm py-1.5 bg-surface-card/85 backdrop-blur-sm border-t border-divider/50 flex items-center justify-between">
          <p className="text-td-meta text-ink font-medium">
            DAY {dayIndex + 1} 동선 · {items.length}곳
          </p>
          <Link
            href={mapHref}
            className="text-td-caption text-purple-deep font-medium hover:underline"
          >
            확대 보기 →
          </Link>
        </div>
      </div>
    </section>
  );
}
