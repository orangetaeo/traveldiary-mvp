"use client";

/**
 * ItineraryMapWithDirections — Embed directions 모드 + Geolocation (사이클 7.5+).
 *
 * 사용자가 "내 위치에서 길찾기" 클릭 → Geolocation 권한 → directions URL.
 * 좌표 보존 X (ADR-017 답습). 자동 트리거 X.
 *
 * NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY 미설정 → 직접 렌더 안 함 (server ItineraryMap에 위임).
 */

import { useState, useTransition } from "react";
import { getCurrentLocation } from "@/lib/services/geolocation";

interface Props {
  lat: number;
  lng: number;
  placeName?: string;
  apiKey: string;
  height?: number;
}

export function ItineraryMapWithDirections({
  lat,
  lng,
  placeName,
  apiKey,
  height = 240,
}: Props) {
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleStart() {
    setError(null);
    startTransition(async () => {
      const loc = await getCurrentLocation();
      if (loc.mode === "ok") {
        setOrigin({ lat: loc.lat, lng: loc.lng });
      } else if (loc.mode === "denied") {
        setError("위치 권한이 거부됐어요.");
      } else if (loc.mode === "unsupported") {
        setError("이 기기에서 위치 기능을 지원하지 않아요.");
      } else if (loc.mode === "timeout") {
        setError("시간 초과 — 다시 시도해주세요.");
      } else {
        setError("위치를 가져올 수 없어요.");
      }
    });
  }

  // directions 모드 URL — origin이 있을 때만
  const params = new URLSearchParams({
    key: apiKey,
    destination: `${lat},${lng}`,
    mode: "driving",
  });
  if (origin) {
    params.set("origin", `${origin.lat},${origin.lng}`);
  }
  // origin 없으면 단순 place 모드로 fallback
  const baseUrl = origin
    ? "https://www.google.com/maps/embed/v1/directions"
    : "https://www.google.com/maps/embed/v1/place";
  if (!origin) {
    params.delete("destination");
    params.delete("mode");
    params.set("q", `${lat},${lng}`);
    params.set("zoom", "15");
  }
  const src = `${baseUrl}?${params.toString()}`;

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
      <div className="mt-td-xs flex items-center justify-between gap-td-xs">
        <button
          type="button"
          onClick={handleStart}
          disabled={isPending}
          className="inline-flex items-center gap-1 px-td-sm py-1.5 text-td-meta font-semibold text-purple border border-purple/40 rounded-md hover:bg-purple-soft disabled:opacity-60 transition-colors"
        >
          <span className="material-symbols-outlined text-td-icon-md" aria-hidden>
            my_location
          </span>
          {isPending
            ? "위치 확인 중…"
            : origin
            ? "내 위치 갱신"
            : "내 위치에서 길찾기"}
        </button>
        {origin && (
          <span className="text-td-caption text-success-deep">
            ✓ 길찾기 모드
          </span>
        )}
        {error && (
          <span className="text-td-caption text-danger-deep">{error}</span>
        )}
      </div>
      <p className="text-td-caption text-ink-mute mt-td-xxs">
        💡 좌표는 지도 표시에만 사용 — 서버에 전송되지 않습니다 (ADR-017).
      </p>
    </section>
  );
}
