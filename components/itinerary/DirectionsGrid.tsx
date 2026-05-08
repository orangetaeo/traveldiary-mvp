/**
 * 길찾기 deeplink 그리드 (사이클 7 D1·D2 + G 카카오맵).
 * Google Maps / 카카오맵 / Uber / Grab 4개 링크.
 */

import {
  googleMapsUrl,
  uberUrl,
  grabUrl,
  kakaoMapUrl,
} from "@/lib/utils/deeplinks";

interface DirectionsGridProps {
  location: { lat: number; lng: number };
  placeName: string;
}

export function DirectionsGrid({ location, placeName }: DirectionsGridProps) {
  return (
    <section className="px-td-md py-td-sm">
      <h3 className="text-td-card-title text-ink mb-td-sm">길찾기</h3>
      <div className="grid grid-cols-4 gap-td-xs">
        <a
          href={googleMapsUrl(location, placeName)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Google Maps에서 ${placeName} 경로 보기`}
          className="flex flex-col items-center gap-1 p-td-sm bg-surface-card border border-divider rounded-md hover:border-purple/40 transition-colors"
        >
          <span
            className="material-symbols-outlined text-purple text-td-icon-xl"
            aria-hidden
          >
            map
          </span>
          <span className="text-td-caption text-ink font-semibold">
            Google
          </span>
        </a>
        <a
          href={kakaoMapUrl(location, placeName)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`카카오맵에서 ${placeName} 경로 보기`}
          className="flex flex-col items-center gap-1 p-td-sm bg-surface-card border border-divider rounded-md hover:border-amber/40 transition-colors"
        >
          <span
            className="material-symbols-outlined text-amber-deep text-td-icon-xl"
            aria-hidden
          >
            pin_drop
          </span>
          <span className="text-td-caption text-ink font-semibold">
            카카오맵
          </span>
        </a>
        <a
          href={uberUrl(location, placeName)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Uber로 ${placeName} 이동`}
          className="flex flex-col items-center gap-1 p-td-sm bg-surface-card border border-divider rounded-md hover:border-ink/30 transition-colors"
        >
          <span
            className="material-symbols-outlined text-ink text-td-icon-xl"
            aria-hidden
          >
            local_taxi
          </span>
          <span className="text-td-caption text-ink font-semibold">
            Uber
          </span>
        </a>
        <a
          href={grabUrl(location, placeName)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Grab으로 ${placeName} 이동`}
          className="flex flex-col items-center gap-1 p-td-sm bg-surface-card border border-divider rounded-md hover:border-success/40 transition-colors"
        >
          <span
            className="material-symbols-outlined text-success text-td-icon-xl"
            aria-hidden
          >
            directions_car
          </span>
          <span className="text-td-caption text-ink font-semibold">
            Grab
          </span>
        </a>
      </div>
    </section>
  );
}
