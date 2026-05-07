/**
 * TransportCard 단위 테스트 (U5, 사이클 디자인 갭 #1).
 *
 * renderToStaticMarkup 정적 마크업 검증 (testing-library 미도입 정책).
 * 검증:
 *  - 헤더(출발→도착) + 거리 뱃지
 *  - 3 옵션 (도보/그랩/버스) 가격/시간 표기 + 도보 ₩0 명시 + 천 단위 콤마
 *  - recommendedMode별 기본 선택(aria-checked=true) + 액션 버튼 라벨 변화
 *  - AI 추천 띠 + 이유 노출 + sr-only "AI 추천"
 *  - radiogroup ARIA
 *  - distanceKm 미지정 시 거리 뱃지 숨김
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  TransportCard,
  type TransportOption,
} from "@/components/itinerary/TransportCard";

const baseOptions: TransportOption[] = [
  { mode: "walk", durationMin: 15, priceKrw: 0 },
  { mode: "grab", durationMin: 5, priceKrw: 4500 },
  { mode: "bus", durationMin: 20, priceKrw: 900, note: "노선 03" },
];

describe("TransportCard", () => {
  it("헤더에 출발지와 도착지를 표시한다", () => {
    const html = renderToStaticMarkup(
      <TransportCard
        from="벤탄 야시장"
        to="사이공 강 디너크루즈"
        distanceKm={1.2}
        options={baseOptions}
        recommendedMode="walk"
        recommendedReason="강변 산책로 좋고 야경 명소 통과"
      />,
    );
    expect(html).toContain("벤탄 야시장");
    expect(html).toContain("사이공 강 디너크루즈");
  });

  it("거리 뱃지를 표시한다 (distanceKm 있을 때)", () => {
    const html = renderToStaticMarkup(
      <TransportCard
        from="A"
        to="B"
        distanceKm={1.2}
        options={baseOptions}
        recommendedMode="walk"
        recommendedReason="r"
      />,
    );
    expect(html).toContain('data-testid="transport-distance-badge"');
    expect(html).toContain("1.2km");
  });

  it("distanceKm 미지정 시 거리 뱃지를 숨긴다", () => {
    const html = renderToStaticMarkup(
      <TransportCard
        from="A"
        to="B"
        options={baseOptions}
        recommendedMode="walk"
        recommendedReason="r"
      />,
    );
    expect(html).not.toContain('data-testid="transport-distance-badge"');
  });

  it("3 옵션 모두 렌더된다 (도보/그랩/버스)", () => {
    const html = renderToStaticMarkup(
      <TransportCard
        from="A"
        to="B"
        options={baseOptions}
        recommendedMode="walk"
        recommendedReason="r"
      />,
    );
    expect(html).toContain('data-testid="transport-option-walk"');
    expect(html).toContain('data-testid="transport-option-grab"');
    expect(html).toContain('data-testid="transport-option-bus"');
    expect(html).toContain("15분");
    expect(html).toContain("5분");
    expect(html).toContain("20분");
  });

  it("도보 ₩0이 명시 표기된다", () => {
    const html = renderToStaticMarkup(
      <TransportCard
        from="A"
        to="B"
        options={baseOptions}
        recommendedMode="walk"
        recommendedReason="r"
      />,
    );
    expect(html).toContain("₩0");
  });

  it("그랩 가격이 천 단위 콤마로 포맷된다", () => {
    const html = renderToStaticMarkup(
      <TransportCard
        from="A"
        to="B"
        options={[
          { mode: "walk", durationMin: 15, priceKrw: 0 },
          { mode: "grab", durationMin: 5, priceKrw: 12500 },
          { mode: "bus", durationMin: 20, priceKrw: 900 },
        ]}
        recommendedMode="walk"
        recommendedReason="r"
      />,
    );
    expect(html).toContain("₩12,500");
  });

  it("버스 note(노선 03)가 표시된다", () => {
    const html = renderToStaticMarkup(
      <TransportCard
        from="A"
        to="B"
        options={baseOptions}
        recommendedMode="walk"
        recommendedReason="r"
      />,
    );
    expect(html).toContain("노선 03");
  });

  it("recommendedMode=walk 시 도보가 기본 선택 + 액션 버튼 라벨 '지도에서 동선 보기'", () => {
    const html = renderToStaticMarkup(
      <TransportCard
        from="A"
        to="B"
        options={baseOptions}
        recommendedMode="walk"
        recommendedReason="r"
      />,
    );
    // 정규식: 같은 button 안에 walk testid와 aria-checked="true" 공존
    expect(html).toMatch(
      /aria-checked="true"[^>]*data-testid="transport-option-walk"|data-testid="transport-option-walk"[^>]*aria-checked="true"/,
    );
    expect(html).toContain("지도에서 동선 보기");
  });

  it("recommendedMode=grab 시 그랩이 기본 선택 + 액션 버튼 라벨 '그랩 앱으로 호출하기'", () => {
    const html = renderToStaticMarkup(
      <TransportCard
        from="A"
        to="B"
        options={baseOptions}
        recommendedMode="grab"
        recommendedReason="r"
      />,
    );
    expect(html).toMatch(
      /aria-checked="true"[^>]*data-testid="transport-option-grab"|data-testid="transport-option-grab"[^>]*aria-checked="true"/,
    );
    expect(html).toContain("그랩 앱으로 호출하기");
  });

  it("recommendedMode=bus 시 버스가 기본 선택 + 액션 버튼 라벨 '버스 노선 보기'", () => {
    const html = renderToStaticMarkup(
      <TransportCard
        from="A"
        to="B"
        options={baseOptions}
        recommendedMode="bus"
        recommendedReason="r"
      />,
    );
    expect(html).toMatch(
      /aria-checked="true"[^>]*data-testid="transport-option-bus"|data-testid="transport-option-bus"[^>]*aria-checked="true"/,
    );
    expect(html).toContain("버스 노선 보기");
  });

  it("AI 추천 띠와 이유를 표시한다", () => {
    const html = renderToStaticMarkup(
      <TransportCard
        from="A"
        to="B"
        options={baseOptions}
        recommendedMode="walk"
        recommendedReason="강변 산책로 좋고 야경 명소 통과"
      />,
    );
    expect(html).toContain('data-testid="transport-recommendation"');
    expect(html).toContain("AI 추천");
    expect(html).toContain("강변 산책로 좋고 야경 명소 통과");
  });

  it("radiogroup ARIA 라벨이 있다", () => {
    const html = renderToStaticMarkup(
      <TransportCard
        from="A"
        to="B"
        options={baseOptions}
        recommendedMode="walk"
        recommendedReason="r"
      />,
    );
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-label="이동 수단 선택"');
  });

  it("추천 옵션 카드에 sr-only 'AI 추천' 라벨이 있다", () => {
    const html = renderToStaticMarkup(
      <TransportCard
        from="A"
        to="B"
        options={baseOptions}
        recommendedMode="grab"
        recommendedReason="r"
      />,
    );
    // recommendedMode=grab → grab 카드 안에 sr-only "AI 추천"
    // 띠의 "AI 추천"과 별개로 추가 출현 확인
    const occurrences = (html.match(/AI 추천/g) || []).length;
    expect(occurrences).toBeGreaterThanOrEqual(2);
  });

  it("가격 미지정(undefined) 시 '—' 표기", () => {
    const html = renderToStaticMarkup(
      <TransportCard
        from="A"
        to="B"
        options={[
          { mode: "walk", durationMin: 15, priceKrw: 0 },
          { mode: "grab", durationMin: 5 }, // priceKrw 미지정
          { mode: "bus", durationMin: 20, priceKrw: 900 },
        ]}
        recommendedMode="walk"
        recommendedReason="r"
      />,
    );
    expect(html).toContain("—");
  });

  it("메타 풋터 '* 가격은 기준 시간/거리 기반 예상치' 표기", () => {
    const html = renderToStaticMarkup(
      <TransportCard
        from="A"
        to="B"
        options={baseOptions}
        recommendedMode="walk"
        recommendedReason="r"
      />,
    );
    expect(html).toContain("가격은 기준 시간/거리 기반 예상치");
  });
});
