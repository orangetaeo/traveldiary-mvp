/**
 * Google Places 사진 참조 → 앱 내부 프록시 URL 변환.
 *
 * 클라이언트에서 안전하게 사용 가능 — API 키 노출 없음.
 * 프록시 경로: /api/places/photo?ref=PHOTO_REF&w=WIDTH
 */

/**
 * Google Places photo reference를 앱 내부 프록시 URL로 변환.
 * @param photoRef Google Places API photo_reference 토큰
 * @param maxWidth 최대 폭 (px). 기본 400.
 */
export function getPlacePhotoUrl(photoRef: string, maxWidth = 400): string {
  return `/api/places/photo?ref=${encodeURIComponent(photoRef)}&w=${maxWidth}`;
}
