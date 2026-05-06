/**
 * Geo utilities — Haversine 거리 + 좌표 검증.
 *
 * 단일 진실의 원천(SSOT)으로 mode-transition, distance-rules 등이 공유.
 */

/** 지구 반지름 (km) — Haversine 공식 표준 */
export const EARTH_RADIUS_KM = 6371;

/** 도→라디안 변환 */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Haversine 직선 거리 (km) */
export function haversineKm(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): number {
  const dLat = toRad(destination.lat - origin.lat);
  const dLng = toRad(destination.lng - origin.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(origin.lat)) *
      Math.cos(toRad(destination.lat)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/**
 * 좌표가 유효(non-zero sentinel)인지 검증.
 * 시드에서 (0,0)은 "좌표 미설정" 센티널 값.
 */
export function hasValidCoords(location: { lat: number; lng: number }): boolean {
  return location.lat !== 0 || location.lng !== 0;
}
