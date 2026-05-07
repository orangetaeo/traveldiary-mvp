/**
 * ItineraryItem[] → RouteStop[] 변환 유틸리티 — A1 동선 지도.
 *
 * DayRouteMiniMap의 computePins 로직 + 거리/이동 수단 계산을 결합.
 * DayRouteMapView (풀스크린)와 향후 다른 지도 뷰에서 공유.
 */

import type { ItineraryItem, RouteStop } from "@/lib/types";
import { haversineKm, hasValidCoords } from "./geo";

const PADDING = 12;
const EPSILON = 1e-6;

/** 도보/차량 분기 기준 (km) */
const WALK_THRESHOLD_KM = 1.0;
/** 도보 평균 속도 (km/h) — 우회 계수 1.4 포함 */
const WALK_SPEED_KMH = 4 / 1.4;
/** 차량 평균 속도 (km/h) — 시내 기준 + 우회 계수 1.4 */
const DRIVE_SPEED_KMH = 30 / 1.4;

const CATEGORY_ICON: Record<string, string> = {
  food: "restaurant",
  spot: "place",
  shopping: "shopping_bag",
  rest: "hotel",
  nature: "park",
  cafe: "local_cafe",
};

const CATEGORY_LABEL: Record<string, string> = {
  food: "맛집",
  spot: "관광",
  shopping: "쇼핑",
  rest: "숙소",
  nature: "자연",
  cafe: "카페",
};

/** HH:MM 포맷 (UTC 기준, 시드 데이터 호환) */
function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** 거리 → 이동 수단 텍스트 */
function transitLabel(distKm: number): string {
  if (distKm < WALK_THRESHOLD_KM) {
    const mins = Math.max(1, Math.round((distKm / WALK_SPEED_KMH) * 60));
    return `도보 ${mins}분`;
  }
  const mins = Math.max(1, Math.round((distKm / DRIVE_SPEED_KMH) * 60));
  return `차량 ${mins}분`;
}

interface RouteResult {
  stops: RouteStop[];
  walkingKm: number;
  drivingKm: number;
}

/**
 * 특정 Day의 ItineraryItem[] → RouteStop[] + 총 거리 계산.
 *
 * @param items 해당 Day의 아이템 (scheduledAt 정렬 전제)
 * @param activeItemId 현재 활성 아이템 ID (여행 중 모드에서 사용)
 */
export function buildRouteStops(
  items: ItineraryItem[],
  activeItemId?: string,
): RouteResult {
  if (items.length === 0) return { stops: [], walkingKm: 0, drivingKm: 0 };

  // scheduledAt 정렬
  const sorted = [...items].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  // 유효 좌표만 사용하여 bounding box 계산
  const validItems = sorted.filter((it) => hasValidCoords(it.location));

  const pins = computePins(sorted, validItems);

  // 연속 구간 거리 계산
  let walkingKm = 0;
  let drivingKm = 0;
  const segmentDistances: number[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i].location;
    const b = sorted[i + 1].location;
    if (hasValidCoords(a) && hasValidCoords(b)) {
      const dist = haversineKm(a, b);
      segmentDistances.push(dist);
      if (dist < WALK_THRESHOLD_KM) {
        walkingKm += dist;
      } else {
        drivingKm += dist;
      }
    } else {
      segmentDistances.push(0);
    }
  }

  const stops: RouteStop[] = sorted.map((item, idx) => ({
    id: item.id,
    order: idx + 1,
    name: item.name,
    time: formatTime(item.scheduledAt),
    category: CATEGORY_LABEL[item.category] ?? item.category,
    categoryIcon: CATEGORY_ICON[item.category] ?? "place",
    isActive: activeItemId ? item.id === activeItemId : undefined,
    pinX: pins[idx].x,
    lat: hasValidCoords(item.location) ? item.location.lat : undefined,
    lng: hasValidCoords(item.location) ? item.location.lng : undefined,
    pinY: pins[idx].y,
    nextTransit:
      idx < segmentDistances.length && segmentDistances[idx] > 0
        ? transitLabel(segmentDistances[idx])
        : undefined,
  }));

  return {
    stops,
    walkingKm: Math.round(walkingKm * 10) / 10,
    drivingKm: Math.round(drivingKm * 10) / 10,
  };
}

// ── Pin 정규화 (DayRouteMiniMap 로직 공유) ──────────────────

function computePins(
  sorted: ItineraryItem[],
  validItems: ItineraryItem[],
): Array<{ x: number; y: number }> {
  if (sorted.length === 1) return [{ x: 50, y: 50 }];

  // 유효 좌표가 없으면 대각선 균등 분포
  if (validItems.length === 0) {
    return sorted.map((_, idx) => {
      const t = idx / (sorted.length - 1);
      return {
        x: PADDING + t * (100 - 2 * PADDING),
        y: PADDING + t * (100 - 2 * PADDING),
      };
    });
  }

  const lats = validItems.map((it) => it.location.lat);
  const lngs = validItems.map((it) => it.location.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const dLat = maxLat - minLat;
  const dLng = maxLng - minLng;

  // 모두 동일 좌표 → 대각선 균등 분포
  if (dLat < EPSILON && dLng < EPSILON) {
    return sorted.map((_, idx) => {
      const t = idx / (sorted.length - 1);
      return {
        x: PADDING + t * (100 - 2 * PADDING),
        y: PADDING + t * (100 - 2 * PADDING),
      };
    });
  }

  return sorted.map((it) => {
    if (!hasValidCoords(it.location)) {
      // 좌표 미설정 아이템 → 중앙
      return { x: 50, y: 50 };
    }
    const tX = dLng < EPSILON ? 0.5 : (it.location.lng - minLng) / dLng;
    const tY = dLat < EPSILON ? 0.5 : 1 - (it.location.lat - minLat) / dLat;
    return {
      x: PADDING + tX * (100 - 2 * PADDING),
      y: PADDING + tY * (100 - 2 * PADDING),
    };
  });
}
