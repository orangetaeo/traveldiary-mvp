/**
 * weather seed (lib/seed/weather.ts) 단위 테스트.
 *
 * 검증:
 *   - 푸꾸옥 PQC 시안 값 일치 (Stitch #2 Day 1~5)
 *   - 미지원 destinationCode → fallback (5일)
 *   - nights 매개변수로 잘림 (3박 4일 → 4 카드)
 *   - 6 도시 모두 5일 forecast 정의
 */

import { describe, it, expect } from "vitest";
import { getWeatherForecast } from "@/lib/seed/weather";

describe("weather seed", () => {
  it("푸꾸옥(PQC) 시안 값 일치 (Stitch #2 Day 1~5)", () => {
    const forecast = getWeatherForecast("PQC", 4);
    expect(forecast).toHaveLength(5);
    expect(forecast[0]).toEqual({ day: 1, icon: "sunny", tempC: 32 });
    expect(forecast[2]).toEqual({ day: 3, icon: "rainy", tempC: 28 });
    expect(forecast[4]).toEqual({ day: 5, icon: "sunny", tempC: 33 });
  });

  it("3박 4일 → Day 1~4만 잘림", () => {
    const forecast = getWeatherForecast("PQC", 3);
    expect(forecast).toHaveLength(4);
    expect(forecast[3].day).toBe(4);
  });

  it("미지원 destinationCode → fallback (5일)", () => {
    const forecast = getWeatherForecast("XYZ", 4);
    expect(forecast).toHaveLength(5);
    expect(forecast[0].day).toBe(1);
  });

  it("6 베트남 도시 모두 정의 (PQC/DNN/SGN/HAN/NHA/DLI)", () => {
    for (const code of ["PQC", "DNN", "SGN", "HAN", "NHA", "DLI"]) {
      const f = getWeatherForecast(code, 4);
      expect(f).toHaveLength(5);
      expect(f[0].day).toBe(1);
      expect(f[4].day).toBe(5);
    }
  });
});
