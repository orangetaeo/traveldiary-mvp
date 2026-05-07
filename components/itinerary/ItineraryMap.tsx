/**
 * ItineraryMap — Google Maps Embed iframe (사이클 7.5, ADR-028).
 *
 * NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY 미설정 → placeholder.
 * 좌표 (0,0) → 미노출 (사이클 10 사용자 추가 일정 호환).
 *
 * Server Component — 외부 데이터 없이 props만으로 렌더.
 */

interface ItineraryMapProps {
  lat: number;
  lng: number;
  placeName?: string;
  height?: number;
}

export function ItineraryMap({
  lat,
  lng,
  placeName,
  height = 240,
}: ItineraryMapProps) {
  // 사용자 추가 일정의 placeholder 좌표
  if (lat === 0 && lng === 0) return null;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;

  if (!apiKey) {
    const encodedName = encodeURIComponent(placeName ?? `${lat},${lng}`);
    const googleUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    const naverUrl = `https://map.naver.com/v5/search/${encodedName}`;
    const kakaoUrl = `https://map.kakao.com/?q=${encodedName}`;

    return (
      <section className="px-td-md py-td-sm">
        <div
          className="bg-surface-soft border border-divider rounded-md flex flex-col items-center justify-center text-center p-td-md"
          style={{ minHeight: `${height}px` }}
        >
          <span
            className="material-symbols-outlined text-ink-mute text-[36px] mb-td-xs"
            aria-hidden
          >
            map
          </span>
          <p className="text-td-body text-ink font-medium mb-td-xxs">
            {placeName ?? "위치"}
          </p>
          <p className="text-td-caption text-ink-mute tabular-nums mb-td-sm">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </p>
          <div className="flex gap-td-xs flex-wrap justify-center">
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-card border border-divider rounded-full text-td-caption font-medium text-ink hover:border-purple/40 transition-colors"
            >
              <span className="material-symbols-outlined text-td-icon-sm" aria-hidden>open_in_new</span>
              Google 지도
            </a>
            <a
              href={naverUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-card border border-divider rounded-full text-td-caption font-medium text-ink hover:border-purple/40 transition-colors"
            >
              <span className="material-symbols-outlined text-td-icon-sm" aria-hidden>open_in_new</span>
              네이버 지도
            </a>
            <a
              href={kakaoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-card border border-divider rounded-full text-td-caption font-medium text-ink hover:border-purple/40 transition-colors"
            >
              <span className="material-symbols-outlined text-td-icon-sm" aria-hidden>open_in_new</span>
              카카오맵
            </a>
          </div>
        </div>
      </section>
    );
  }

  const params = new URLSearchParams({
    key: apiKey,
    q: `${lat},${lng}`,
    zoom: "15",
    maptype: "roadmap",
  });
  const src = `https://www.google.com/maps/embed/v1/place?${params.toString()}`;

  return (
    <section className="px-td-md py-td-sm">
      <iframe
        src={src}
        title={placeName ? `${placeName} 지도` : "지도"}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className="w-full rounded-md border border-divider"
        style={{ height: `${height}px` }}
      />
    </section>
  );
}
