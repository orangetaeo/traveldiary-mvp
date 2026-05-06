/**
 * WeatherStrip — Stitch #2 Trip Dashboard 날씨 5일 가로 스크롤 (사이클 (Session F+1)).
 *
 * 1차는 lib/seed/weather.ts mock seed. 라이브 wiring 후속 사이클(R1 게이트).
 */

import {
  WEATHER_ICON_COLOR,
  WEATHER_ICON_LABEL,
  WEATHER_ICON_NAME,
  type WeatherDay,
} from "@/lib/seed/weather";

interface WeatherStripProps {
  forecast: WeatherDay[];
}

export function WeatherStrip({ forecast }: WeatherStripProps) {
  if (forecast.length === 0) return null;
  return (
    <section aria-label="날씨 예보" className="mt-td-lg">
      <h3 className="text-td-card-title text-ink mb-td-sm px-td-xs">
        날씨 예보
      </h3>
      <div className="flex overflow-x-auto pb-td-sm gap-td-sm hide-scrollbar -mx-td-md px-td-md">
        {forecast.map((d) => (
          <div
            key={d.day}
            className="flex flex-col items-center justify-center p-td-sm bg-surface-card border border-divider rounded-md min-w-[72px] shrink-0"
            aria-label={`Day ${d.day} ${WEATHER_ICON_LABEL[d.icon]} 섭씨 ${d.tempC}도`}
          >
            <span className="text-td-caption text-ink-mute mb-td-xxs">
              Day {d.day}
            </span>
            <span
              className={`material-symbols-outlined text-[24px] mb-td-xxs ${WEATHER_ICON_COLOR[d.icon]}`}
              aria-hidden
            >
              {WEATHER_ICON_NAME[d.icon]}
            </span>
            <span className="text-td-body font-medium tabular-nums">
              {d.tempC}°
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
