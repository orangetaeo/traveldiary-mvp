/**
 * CityTripCTA 컴포넌트 단위 테스트.
 * 사이클 J (ADR-034) — city → trip 역방향 CTA 분기.
 *
 * 추출 사이클: refactor/city-page-component-extraction
 * 위치: components/city/CityTripCTA.tsx
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CityTripCTA } from "@/components/city/CityTripCTA";
import type { ResolvedTrip } from "@/lib/services/resolved-trip";

function makeTrip(over: Partial<ResolvedTrip> = {}): ResolvedTrip {
  return {
    trip: {
      id: "t1",
      nights: 3,
      destinationCode: "PQC",
    },
    city: { code: "PQC", name: "푸꾸옥" },
    items: [],
    itemCount: 12,
    verifiedCount: 5,
    ...over,
  } as unknown as ResolvedTrip;
}

describe("CityTripCTA — trips 0", () => {
  it("amber 안내 + '다른 도시 일정' 링크 노출", () => {
    const html = renderToStaticMarkup(
      <CityTripCTA trips={[]} cityName="호이안" />,
    );
    expect(html).toContain("호이안 일정은 준비 중이에요");
    expect(html).toContain("다른 도시 일정 둘러보기");
    expect(html).toContain('href="/trips"');
    expect(html).toContain("bg-amber-soft");
  });
});

describe("CityTripCTA — trips 1+", () => {
  it("도시명 + 박/일 + itemCount 표시", () => {
    const html = renderToStaticMarkup(
      <CityTripCTA trips={[makeTrip()]} cityName="푸꾸옥" />,
    );
    expect(html).toContain("푸꾸옥 3박 4일");
    expect(html).toContain("12 일정");
  });

  it("verifiedCount > 0 → 'AI 검증 N곳' 배지", () => {
    const html = renderToStaticMarkup(
      <CityTripCTA trips={[makeTrip({ verifiedCount: 5 })]} cityName="푸꾸옥" />,
    );
    expect(html).toContain("AI 검증 5곳");
  });

  it("verifiedCount = 0 → 검증 배지 미렌더", () => {
    const html = renderToStaticMarkup(
      <CityTripCTA trips={[makeTrip({ verifiedCount: 0 })]} cityName="푸꾸옥" />,
    );
    expect(html).not.toContain("AI 검증");
  });

  it("일정 보기 링크는 /itinerary/{tripId}", () => {
    const html = renderToStaticMarkup(
      <CityTripCTA trips={[makeTrip()]} cityName="푸꾸옥" />,
    );
    expect(html).toContain('href="/itinerary/t1"');
  });

  it("trips 2+ → '이 도시 일정 N건' 보조 링크 노출", () => {
    const html = renderToStaticMarkup(
      <CityTripCTA
        trips={[makeTrip(), makeTrip({ trip: { id: "t2", nights: 2 } } as never)]}
        cityName="푸꾸옥"
      />,
    );
    expect(html).toContain("이 도시 일정 2건");
    expect(html).toContain("전체 보기");
  });
});
