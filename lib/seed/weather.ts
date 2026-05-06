/**
 * 날씨 mock seed — Trip Dashboard 5-day forecast (Stitch #2 시안 매핑).
 *
 * 정책:
 *   - 1차는 정적 mock (외부 API 0). 라이브 wiring은 별도 사이클(R1 게이트).
 *   - 베트남 6 도시 + 미지원 destination은 generic fallback.
 *   - 시드 베이스: City.weather.avgTempC 범위 + 도시별 우기/건기 패턴.
 */

export type WeatherIcon = "sunny" | "cloudy" | "rainy" | "partly_cloudy";

export interface WeatherDay {
  /** 1-based, Day 1 = 출발 당일 */
  day: number;
  icon: WeatherIcon;
  /** 섭씨 정수 */
  tempC: number;
}

const FORECASTS: Record<string, WeatherDay[]> = {
  // 푸꾸옥(PQC) — 시안 그대로 (Stitch #2 표시 값)
  PQC: [
    { day: 1, icon: "sunny", tempC: 32 },
    { day: 2, icon: "cloudy", tempC: 30 },
    { day: 3, icon: "rainy", tempC: 28 },
    { day: 4, icon: "sunny", tempC: 31 },
    { day: 5, icon: "sunny", tempC: 33 },
  ],
  // 다낭(DNN) — 중부 해안, 5월 우기 진입 전
  DNN: [
    { day: 1, icon: "sunny", tempC: 31 },
    { day: 2, icon: "partly_cloudy", tempC: 30 },
    { day: 3, icon: "sunny", tempC: 32 },
    { day: 4, icon: "rainy", tempC: 28 },
    { day: 5, icon: "sunny", tempC: 31 },
  ],
  // 호치민(SGN) — 남부, 5월 건기 끝
  SGN: [
    { day: 1, icon: "sunny", tempC: 33 },
    { day: 2, icon: "sunny", tempC: 34 },
    { day: 3, icon: "rainy", tempC: 30 },
    { day: 4, icon: "partly_cloudy", tempC: 32 },
    { day: 5, icon: "sunny", tempC: 33 },
  ],
  // 하노이(HAN) — 북부, 5월 봄~여름 전이
  HAN: [
    { day: 1, icon: "partly_cloudy", tempC: 28 },
    { day: 2, icon: "rainy", tempC: 26 },
    { day: 3, icon: "cloudy", tempC: 27 },
    { day: 4, icon: "sunny", tempC: 30 },
    { day: 5, icon: "sunny", tempC: 31 },
  ],
  // 나트랑(NHA) — 중남부 해안
  NHA: [
    { day: 1, icon: "sunny", tempC: 30 },
    { day: 2, icon: "sunny", tempC: 31 },
    { day: 3, icon: "partly_cloudy", tempC: 29 },
    { day: 4, icon: "sunny", tempC: 30 },
    { day: 5, icon: "rainy", tempC: 27 },
  ],
  // 달랏(DLI) — 고원, 서늘
  DLI: [
    { day: 1, icon: "partly_cloudy", tempC: 22 },
    { day: 2, icon: "rainy", tempC: 20 },
    { day: 3, icon: "cloudy", tempC: 21 },
    { day: 4, icon: "sunny", tempC: 24 },
    { day: 5, icon: "sunny", tempC: 23 },
  ],
};

const FALLBACK: WeatherDay[] = [
  { day: 1, icon: "sunny", tempC: 28 },
  { day: 2, icon: "partly_cloudy", tempC: 27 },
  { day: 3, icon: "cloudy", tempC: 26 },
  { day: 4, icon: "sunny", tempC: 29 },
  { day: 5, icon: "sunny", tempC: 30 },
];

/**
 * 도시 코드(IATA/Trip.destinationCode)로 5일 forecast 조회.
 * 미지원 코드는 generic fallback (5일 sunny~partly_cloudy).
 */
export function getWeatherForecast(
  destinationCode: string,
  nights: number,
): WeatherDay[] {
  const base = FORECASTS[destinationCode] ?? FALLBACK;
  // nights+1 일수만큼 잘라서 반환 (3박 4일 → Day 1~4)
  const totalDays = nights + 1;
  return base.slice(0, totalDays);
}

export const WEATHER_ICON_LABEL: Record<WeatherIcon, string> = {
  sunny: "맑음",
  cloudy: "흐림",
  rainy: "비",
  partly_cloudy: "구름조금",
};

/** Material Symbols 아이콘 이름 매핑 */
export const WEATHER_ICON_NAME: Record<WeatherIcon, string> = {
  sunny: "sunny",
  cloudy: "cloudy",
  rainy: "rainy",
  partly_cloudy: "partly_cloudy_day",
};

/** Tailwind 색상 클래스 (icon tint) */
export const WEATHER_ICON_COLOR: Record<WeatherIcon, string> = {
  sunny: "text-amber",
  cloudy: "text-ink-mute",
  rainy: "text-blue-500",
  partly_cloudy: "text-ink-soft",
};
