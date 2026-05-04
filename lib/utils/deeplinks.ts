/**
 * Deeplink 헬퍼 — 사이클 7 (ADR-023, D1·D2·D3·D4).
 *
 * 모든 함수 순수 — server/client 양쪽 사용 가능.
 * 순서: googleMaps (D1) → uber (D2) → grab (D2) → phone/email (D3·D4).
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Google Maps 검색 URL — 모바일/PC 자동 분기 (Universal Link).
 * D1: 모든 위치에 길찾기 deeplink.
 */
export function googleMapsUrl(loc: LatLng, name?: string): string {
  if (name) {
    const q = encodeURIComponent(`${name} ${loc.lat},${loc.lng}`);
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;
}

/**
 * Uber Universal Deeplink — 앱 설치 시 앱 열기, 미설치 시 웹 fallback.
 * D2: 우버 호출.
 */
export function uberUrl(dropoff: LatLng, dropoffName?: string): string {
  const params = new URLSearchParams({
    action: "setPickup",
    "pickup": "my_location",
    "dropoff[latitude]": String(dropoff.lat),
    "dropoff[longitude]": String(dropoff.lng),
  });
  if (dropoffName) params.set("dropoff[nickname]", dropoffName);
  return `https://m.uber.com/ul/?${params.toString()}`;
}

/**
 * Grab Universal Deeplink — 동남아 주력 (베트남·태국·말련·인도네시아).
 * D2: 그랩 호출. 앱 미설치 시 앱스토어 redirect.
 */
export function grabUrl(dropoff: LatLng, dropoffName?: string): string {
  const params = new URLSearchParams({
    sourceLatitude: "0",
    sourceLongitude: "0",
    dropOffLatitude: String(dropoff.lat),
    dropOffLongitude: String(dropoff.lng),
  });
  if (dropoffName) params.set("dropOffAddress", dropoffName);
  // Grab 공식 universal link: https://grab.onelink.me/2695613898
  return `https://grab.onelink.me/2695613898?${params.toString()}`;
}

/**
 * 카카오맵 — D7. 한국인 사용자 친숙. 모바일 카카오맵 앱 또는 웹.
 * Universal link: https://map.kakao.com/link/map/<name>,<lat>,<lng>
 */
export function kakaoMapUrl(loc: LatLng, name?: string): string {
  const safe = name ? encodeURIComponent(name.replace(/,/g, " ")) : "장소";
  return `https://map.kakao.com/link/map/${safe},${loc.lat},${loc.lng}`;
}

