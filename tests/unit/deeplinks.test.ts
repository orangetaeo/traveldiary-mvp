/**
 * Deeplink 헬퍼 테스트 — Batch 6.
 *
 * 4 함수: googleMapsUrl, uberUrl, grabUrl, kakaoMapUrl.
 * 순수 함수 — URL 형식 + 파라미터 인코딩 검증.
 */

import { describe, it, expect } from "vitest";
import {
  googleMapsUrl,
  uberUrl,
  grabUrl,
  kakaoMapUrl,
  googleMapsDirectionsUrl,
} from "@/lib/utils/deeplinks";

const PQ_CENTER = { lat: 10.225, lng: 103.96 };

describe("deeplinks — googleMapsUrl", () => {
  it("좌표만 → query 파라미터에 lat,lng", () => {
    const url = googleMapsUrl(PQ_CENTER);
    expect(url).toContain("google.com/maps");
    expect(url).toContain("10.225");
    expect(url).toContain("103.96");
  });

  it("이름 포함 → query에 이름+좌표", () => {
    const url = googleMapsUrl(PQ_CENTER, "즈엉동 야시장");
    expect(url).toContain("google.com/maps");
    expect(url).toContain(encodeURIComponent("즈엉동 야시장"));
    expect(url).toContain("10.225");
  });

  it("https URL", () => {
    expect(googleMapsUrl(PQ_CENTER)).toMatch(/^https:\/\//);
  });
});

describe("deeplinks — uberUrl", () => {
  it("dropoff 좌표 포함", () => {
    const url = uberUrl(PQ_CENTER);
    expect(url).toContain("m.uber.com");
    expect(url).toContain("10.225");
    expect(url).toContain("103.96");
    expect(url).toContain("setPickup");
  });

  it("dropoff 이름 포함", () => {
    const url = uberUrl(PQ_CENTER, "Night Market");
    expect(url).toContain("Night+Market");
  });

  it("pickup = my_location", () => {
    expect(uberUrl(PQ_CENTER)).toContain("my_location");
  });
});

describe("deeplinks — grabUrl", () => {
  it("dropOff 좌표 포함", () => {
    const url = grabUrl(PQ_CENTER);
    expect(url).toContain("grab.onelink.me");
    expect(url).toContain("10.225");
    expect(url).toContain("103.96");
  });

  it("dropOff 이름 포함", () => {
    const url = grabUrl(PQ_CENTER, "야시장");
    expect(url).toContain(encodeURIComponent("야시장"));
  });
});

describe("deeplinks — kakaoMapUrl", () => {
  it("카카오맵 URL 형식", () => {
    const url = kakaoMapUrl(PQ_CENTER, "야시장");
    expect(url).toContain("map.kakao.com");
    expect(url).toContain("10.225");
    expect(url).toContain("103.96");
  });

  it("이름 없으면 '장소' 기본값", () => {
    const url = kakaoMapUrl(PQ_CENTER);
    expect(url).toContain("장소");
  });

  it("이름의 쉼표는 공백으로 치환", () => {
    const url = kakaoMapUrl(PQ_CENTER, "푸꾸옥, 베트남");
    expect(url).not.toContain(",베트남"); // 쉼표 제거됨
  });
});

const DA_NANG = { lat: 16.054, lng: 108.202 };

describe("deeplinks — googleMapsDirectionsUrl", () => {
  it("origin + destination 좌표 포함", () => {
    const url = googleMapsDirectionsUrl(PQ_CENTER, DA_NANG);
    expect(url).toContain("google.com/maps/dir");
    expect(url).toContain("10.225");
    expect(url).toContain("16.054");
  });

  it("기본 travelmode = driving", () => {
    const url = googleMapsDirectionsUrl(PQ_CENTER, DA_NANG);
    expect(url).toContain("travelmode=driving");
  });

  it("walking 모드", () => {
    const url = googleMapsDirectionsUrl(PQ_CENTER, DA_NANG, "walking");
    expect(url).toContain("travelmode=walking");
  });

  it("transit 모드", () => {
    const url = googleMapsDirectionsUrl(PQ_CENTER, DA_NANG, "transit");
    expect(url).toContain("travelmode=transit");
  });

  it("목적지 이름 포함", () => {
    const url = googleMapsDirectionsUrl(PQ_CENTER, DA_NANG, "driving", "다낭 대성당");
    expect(url).toContain(encodeURIComponent("다낭 대성당"));
  });
});
