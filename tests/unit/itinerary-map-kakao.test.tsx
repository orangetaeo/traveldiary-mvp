/**
 * ItineraryMap + KakaoShareButton 컴포넌트 테스트 — Batch 14.
 *
 * 2 컴포넌트:
 *  - ItineraryMap: 좌표 분기 (0,0 → null, API key 없음 → placeholder, 유효 → iframe)
 *  - KakaoShareButton: 정적 렌더 (aria-label, 텍스트, disabled 미설정)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ItineraryMap } from "@/components/itinerary/ItineraryMap";
import { KakaoShareButton } from "@/components/share/KakaoShareButton";

/* ────────── ItineraryMap ────────── */

describe("ItineraryMap", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("좌표 (0,0) → null 렌더 (사용자 추가 일정 placeholder)", () => {
    const html = renderToStaticMarkup(<ItineraryMap lat={0} lng={0} />);
    expect(html).toBe("");
  });

  it("API key 미설정 → placeholder 표시", () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
    const html = renderToStaticMarkup(<ItineraryMap lat={10.225} lng={103.96} />);
    expect(html).toContain("10.2250");
    expect(html).toContain("103.9600");
    expect(html).toContain("Google 지도");
    expect(html).toContain("네이버 지도");
    expect(html).toContain("카카오맵");
    expect(html).not.toContain("<iframe");
  });

  it("API key 설정 → iframe 렌더", () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY = "test-key-123";
    const html = renderToStaticMarkup(
      <ItineraryMap lat={16.047} lng={108.206} placeName="다낭 용다리" />,
    );
    expect(html).toContain("<iframe");
    expect(html).toContain("google.com/maps/embed");
    expect(html).toContain("16.047");
    expect(html).toContain("108.206");
  });

  it("placeName → iframe title에 포함", () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY = "key";
    const html = renderToStaticMarkup(
      <ItineraryMap lat={10} lng={103} placeName="야시장" />,
    );
    expect(html).toContain("야시장 지도");
  });

  it("placeName 없으면 → title '지도'", () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY = "key";
    const html = renderToStaticMarkup(<ItineraryMap lat={10} lng={103} />);
    expect(html).toContain('title="지도"');
  });

  it("height 커스텀", () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY = "key";
    const html = renderToStaticMarkup(
      <ItineraryMap lat={10} lng={103} height={400} />,
    );
    expect(html).toContain("400px");
  });

  it("iframe — loading=lazy + allowfullscreen", () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY = "key";
    const html = renderToStaticMarkup(<ItineraryMap lat={10} lng={103} />);
    expect(html).toContain("loading=\"lazy\"");
    expect(html).toContain("allowfullscreen");
  });
});

/* ────────── KakaoShareButton ────────── */

describe("KakaoShareButton", () => {
  it("버튼 렌더 — '카카오톡 공유' 텍스트", () => {
    const html = renderToStaticMarkup(
      <KakaoShareButton url="https://example.com" text="여행 공유" />,
    );
    expect(html).toContain("카카오톡 공유");
  });

  it("aria-label 존재", () => {
    const html = renderToStaticMarkup(
      <KakaoShareButton url="https://example.com" text="test" />,
    );
    expect(html).toContain("aria-label");
    expect(html).toContain("카카오톡으로 공유");
  });

  it("button 타입", () => {
    const html = renderToStaticMarkup(
      <KakaoShareButton url="https://x.com" text="t" />,
    );
    expect(html).toContain('type="button"');
  });

  it("'공유 중...' 아닌 기본 텍스트 표시", () => {
    const html = renderToStaticMarkup(
      <KakaoShareButton url="https://x.com" text="t" />,
    );
    expect(html).not.toContain("공유 중...");
    expect(html).toContain("카카오톡 공유");
  });

  it("chat_bubble 아이콘 표시", () => {
    const html = renderToStaticMarkup(
      <KakaoShareButton url="https://x.com" text="t" />,
    );
    expect(html).toContain("chat_bubble");
  });
});
