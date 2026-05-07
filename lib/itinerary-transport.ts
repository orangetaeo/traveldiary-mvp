/**
 * itinerary-transport — 인접 ItineraryItem 사이의 이동 수단 비교 데이터 생성.
 *
 * U5 디자인 갭 #1 (project_design_gaps_2026_05_07): 일정 카드만 나열되어
 * "이동 어떻게 해요?" 질문에 답이 없음. ItineraryView에서 두 카드 사이에
 * `TransportCard`를 렌더하기 위한 단순 추정기.
 *
 * 외부 API(Google Distance Matrix 등) 미연동 — 직선거리 기반 베트남 단가 추정.
 * 정식 연동은 R1 사인오프 + 외부 API 표준(server-only/캐시/audit)에 따라 별도 ADR.
 */
import { haversineKm, hasValidCoords } from "./utils/geo";
import type { ItineraryItem } from "./types";
import type { TransportOption, TransportMode } from "@/components/itinerary/TransportCard";

export interface TransportSuggestion {
  distanceKm: number;
  options: TransportOption[];
  recommendedMode: TransportMode;
  recommendedReason: string;
}

/** 베트남 시내 단가 추정 (2026, KRW 환산 대략치) */
const GRAB_BASE_KRW = 18000; // 기본 운임
const GRAB_PER_KM_KRW = 12000;
const BUS_FARE_KRW = 800; // 시내버스 1구간

/** 도보 권장 임계 (≤0.8km는 도보 권장) */
const WALK_THRESHOLD_KM = 0.8;
/** 도보 가능한 최대 거리 (이 위로는 도보 옵션 자체를 숨김) */
const WALK_MAX_KM = 2.0;
/** 버스 권장 가능 최소 거리 (시내 단거리는 버스가 비효율) */
const BUS_MIN_KM = 1.5;

function ceilMinutes(km: number, kmPerMin: number): number {
  return Math.max(1, Math.ceil(km / kmPerMin));
}

/**
 * 두 ItineraryItem 사이 이동 수단 추정.
 *
 * 좌표가 유효하지 않거나 동일 지점(0km)이면 null — TransportCard 미렌더.
 */
export function computeTransportSuggestion(
  from: ItineraryItem,
  to: ItineraryItem,
): TransportSuggestion | null {
  if (!hasValidCoords(from.location) || !hasValidCoords(to.location)) {
    return null;
  }
  const distanceKm = haversineKm(from.location, to.location);
  if (distanceKm < 0.05) {
    // 50m 미만은 같은 지점으로 간주 (관광지 내 이동)
    return null;
  }

  const options: TransportOption[] = [];

  if (distanceKm <= WALK_MAX_KM) {
    options.push({
      mode: "walk",
      durationMin: ceilMinutes(distanceKm, 4.5 / 60), // 4.5 km/h
      priceKrw: 0,
    });
  }

  options.push({
    mode: "grab",
    durationMin: ceilMinutes(distanceKm, 18 / 60) + 2, // 18 km/h 시내 + 2분 대기
    priceKrw: Math.round((GRAB_BASE_KRW + distanceKm * GRAB_PER_KM_KRW) / 100) * 100,
  });

  if (distanceKm >= BUS_MIN_KM) {
    options.push({
      mode: "bus",
      durationMin: ceilMinutes(distanceKm, 12 / 60) + 5, // 12 km/h + 5분 배차
      priceKrw: BUS_FARE_KRW,
      note: "노선 03",
    });
  }

  let recommendedMode: TransportMode;
  let recommendedReason: string;
  if (distanceKm <= WALK_THRESHOLD_KM) {
    recommendedMode = "walk";
    recommendedReason = `도보 추천 — ${distanceKm.toFixed(1)}km, 거리 짧고 산책 겸 이동 좋아요`;
  } else if (distanceKm >= 5) {
    recommendedMode = "grab";
    recommendedReason = `그랩 추천 — ${distanceKm.toFixed(1)}km, 시간 절약 + 베트남에서 가장 안정적`;
  } else {
    // 0.8 ~ 5km — 베트남 더위/짐 고려해 그랩 추천. walk 옵션은 ≤2km까지 노출.
    recommendedMode = "grab";
    recommendedReason = `그랩 추천 — ${distanceKm.toFixed(1)}km, 더위 + 짐 고려하면 그랩이 효율적`;
  }

  return {
    distanceKm,
    options,
    recommendedMode,
    recommendedReason,
  };
}
