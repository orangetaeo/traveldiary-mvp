/**
 * DirectionsGrid + GoogleVerificationBadge + ReplanConflictModal + OtaInterstitialModal
 * 렌더 스모크 테스트.
 *
 * renderToStaticMarkup 정적 마크업 검증 (testing-library 미도입 정책).
 */

import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// ─── Mocks ────────────────────────────────────────────────

// server-only 우회 (place-verification.ts 의존)
vi.mock("server-only", () => ({}));

// DirectionsGrid가 사용하는 deeplinks — 실 함수 사용 (순수 함수)
// GoogleVerificationBadge — VerifyPlaceResult 타입만 필요

// ─── Imports ──────────────────────────────────────────────

import { DirectionsGrid } from "@/components/itinerary/DirectionsGrid";
import { GoogleVerificationBadge } from "@/components/itinerary/GoogleVerificationBadge";
import ReplanConflictModal from "@/components/modals/ReplanConflictModal";
import OtaInterstitialModal from "@/components/modals/OtaInterstitialModal";
import type { VerifyPlaceResult } from "@/lib/services/place-verification";

// ─── Fixtures ─────────────────────────────────────────────

const LOCATION = { lat: 16.0544, lng: 108.2022 };
const PLACE_NAME = "미케비치";

const CONFLICT_A = {
  id: "a1",
  name: "한시장",
  time: "12:00 - 13:30",
  category: "맛집",
  icon: "restaurant",
};

const CONFLICT_B = {
  id: "b1",
  name: "마블산",
  time: "12:30 - 14:00",
  category: "관광",
  icon: "landscape",
};

// ═══════════════════════════════════════════════════════════
// DirectionsGrid
// ═══════════════════════════════════════════════════════════

describe("DirectionsGrid", () => {
  it("렌더 성공 + 4개 서비스 라벨", () => {
    const html = renderToStaticMarkup(
      <DirectionsGrid location={LOCATION} placeName={PLACE_NAME} />,
    );
    expect(html).toContain("길찾기");
    expect(html).toContain("Google");
    expect(html).toContain("카카오맵");
    expect(html).toContain("Uber");
    expect(html).toContain("Grab");
  });

  it("Google Maps 링크 포함", () => {
    const html = renderToStaticMarkup(
      <DirectionsGrid location={LOCATION} placeName={PLACE_NAME} />,
    );
    expect(html).toContain("google.com/maps");
  });

  it("4개 외부 링크 (target=_blank)", () => {
    const html = renderToStaticMarkup(
      <DirectionsGrid location={LOCATION} placeName={PLACE_NAME} />,
    );
    const matches = html.match(/target="_blank"/g);
    expect(matches).toHaveLength(4);
  });

  it("noopener noreferrer 보안 속성", () => {
    const html = renderToStaticMarkup(
      <DirectionsGrid location={LOCATION} placeName={PLACE_NAME} />,
    );
    const matches = html.match(/noopener noreferrer/g);
    expect(matches).toHaveLength(4);
  });
});

// ═══════════════════════════════════════════════════════════
// GoogleVerificationBadge
// ═══════════════════════════════════════════════════════════

describe("GoogleVerificationBadge", () => {
  it("demo 모드 → '데모 모드' 텍스트", () => {
    const result: VerifyPlaceResult = { mode: "demo" };
    const html = renderToStaticMarkup(<GoogleVerificationBadge result={result} />);
    expect(html).toContain("데모 모드");
    expect(html).toContain("Google 검증 미실행");
  });

  it("verified + open → '운영 중' + 별점", () => {
    const result: VerifyPlaceResult = {
      mode: "verified",
      placeExists: true,
      operatingStatus: "open",
      placeId: "ChIJ123",
      rating: 4.5,
      userRatingsTotal: 1234,
      cached: false,
      fetchDurationMs: 150,
    };
    const html = renderToStaticMarkup(<GoogleVerificationBadge result={result} />);
    expect(html).toContain("운영 중");
    expect(html).toContain("4.5");
    expect(html).toContain("1,234건");
  });

  it("verified + closed → '운영 외 시간'", () => {
    const result: VerifyPlaceResult = {
      mode: "verified",
      placeExists: true,
      operatingStatus: "closed",
      placeId: "ChIJ456",
      cached: true,
      fetchDurationMs: 0,
    };
    const html = renderToStaticMarkup(<GoogleVerificationBadge result={result} />);
    expect(html).toContain("운영 외 시간");
  });

  it("verified — rating 없으면 별점 미표시", () => {
    const result: VerifyPlaceResult = {
      mode: "verified",
      placeExists: true,
      operatingStatus: "open",
      placeId: "ChIJ789",
      cached: false,
      fetchDurationMs: 100,
    };
    const html = renderToStaticMarkup(<GoogleVerificationBadge result={result} />);
    expect(html).toContain("운영 중");
    expect(html).not.toContain("★");
  });

  it("not_found → '장소를 찾지 못했어요'", () => {
    const result: VerifyPlaceResult = {
      mode: "not_found",
      placeExists: false,
      cached: false,
      fetchDurationMs: 200,
    };
    const html = renderToStaticMarkup(<GoogleVerificationBadge result={result} />);
    expect(html).toContain("장소를 찾지 못했어요");
  });

  it("error → null 렌더 (빈 문자열)", () => {
    const result: VerifyPlaceResult = {
      mode: "error",
      code: "network",
      message: "timeout",
    };
    const html = renderToStaticMarkup(<GoogleVerificationBadge result={result} />);
    expect(html).toBe("");
  });
});

// ═══════════════════════════════════════════════════════════
// ReplanConflictModal
// ═══════════════════════════════════════════════════════════

describe("ReplanConflictModal", () => {
  it("open=false → null 렌더", () => {
    const html = renderToStaticMarkup(
      <ReplanConflictModal
        open={false}
        onClose={vi.fn()}
        conflictA={CONFLICT_A}
        conflictB={CONFLICT_B}
        onKeepA={vi.fn()}
        onKeepB={vi.fn()}
        onKeepBoth={vi.fn()}
      />,
    );
    expect(html).toBe("");
  });

  it("open=true → 충돌 제목 + 두 아이템 렌더", () => {
    const html = renderToStaticMarkup(
      <ReplanConflictModal
        open={true}
        onClose={vi.fn()}
        conflictA={CONFLICT_A}
        conflictB={CONFLICT_B}
        onKeepA={vi.fn()}
        onKeepB={vi.fn()}
        onKeepBoth={vi.fn()}
      />,
    );
    expect(html).toContain("시간대 충돌");
    expect(html).toContain("한시장");
    expect(html).toContain("마블산");
    expect(html).toContain("VS");
  });

  it("3가지 해결 옵션 렌더", () => {
    const html = renderToStaticMarkup(
      <ReplanConflictModal
        open={true}
        onClose={vi.fn()}
        conflictA={CONFLICT_A}
        conflictB={CONFLICT_B}
        onKeepA={vi.fn()}
        onKeepB={vi.fn()}
        onKeepBoth={vi.fn()}
      />,
    );
    expect(html).toContain("한시장");
    expect(html).toContain("마블산");
    expect(html).toContain("둘 다 유지");
  });

  it("시간 정보 렌더", () => {
    const html = renderToStaticMarkup(
      <ReplanConflictModal
        open={true}
        onClose={vi.fn()}
        conflictA={CONFLICT_A}
        conflictB={CONFLICT_B}
        onKeepA={vi.fn()}
        onKeepB={vi.fn()}
        onKeepBoth={vi.fn()}
      />,
    );
    expect(html).toContain("12:00 - 13:30");
    expect(html).toContain("12:30 - 14:00");
  });

  it("카테고리 뱃지 렌더", () => {
    const html = renderToStaticMarkup(
      <ReplanConflictModal
        open={true}
        onClose={vi.fn()}
        conflictA={CONFLICT_A}
        conflictB={CONFLICT_B}
        onKeepA={vi.fn()}
        onKeepB={vi.fn()}
        onKeepBoth={vi.fn()}
      />,
    );
    expect(html).toContain("맛집");
    expect(html).toContain("관광");
  });

  it("닫기 버튼 렌더", () => {
    const html = renderToStaticMarkup(
      <ReplanConflictModal
        open={true}
        onClose={vi.fn()}
        conflictA={CONFLICT_A}
        conflictB={CONFLICT_B}
        onKeepA={vi.fn()}
        onKeepB={vi.fn()}
        onKeepBoth={vi.fn()}
      />,
    );
    expect(html).toContain("닫기");
  });

  it("aria-modal + role=dialog 접근성", () => {
    const html = renderToStaticMarkup(
      <ReplanConflictModal
        open={true}
        onClose={vi.fn()}
        conflictA={CONFLICT_A}
        conflictB={CONFLICT_B}
        onKeepA={vi.fn()}
        onKeepB={vi.fn()}
        onKeepBoth={vi.fn()}
      />,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
  });
});

// ═══════════════════════════════════════════════════════════
// OtaInterstitialModal
// ═══════════════════════════════════════════════════════════

describe("OtaInterstitialModal", () => {
  it("open=false → null 렌더", () => {
    const html = renderToStaticMarkup(
      <OtaInterstitialModal
        open={false}
        onClose={vi.fn()}
        provider="Klook"
        productName="다낭 선셋 디너 크루즈"
        price="₩45,000"
        affiliateUrl="https://klook.com/test"
      />,
    );
    expect(html).toBe("");
  });

  it("open=true → provider + 상품명 + 가격 렌더", () => {
    const html = renderToStaticMarkup(
      <OtaInterstitialModal
        open={true}
        onClose={vi.fn()}
        provider="Klook"
        productName="다낭 선셋 디너 크루즈"
        price="₩45,000"
        affiliateUrl="https://klook.com/test"
      />,
    );
    expect(html).toContain("Klook");
    expect(html).toContain("다낭 선셋 디너 크루즈");
    expect(html).toContain("₩45,000");
  });

  it("할인 라벨 렌더", () => {
    const html = renderToStaticMarkup(
      <OtaInterstitialModal
        open={true}
        onClose={vi.fn()}
        provider="KKday"
        productName="시내 투어"
        price="₩30,000"
        discountLabel="20% OFF"
        affiliateUrl="https://kkday.com/test"
      />,
    );
    expect(html).toContain("20% OFF");
  });

  it("할인 라벨 없으면 미표시", () => {
    const html = renderToStaticMarkup(
      <OtaInterstitialModal
        open={true}
        onClose={vi.fn()}
        provider="Klook"
        productName="투어"
        price="₩50,000"
        affiliateUrl="https://klook.com"
      />,
    );
    expect(html).not.toContain("OFF");
  });

  it("제휴 고지 텍스트 렌더", () => {
    const html = renderToStaticMarkup(
      <OtaInterstitialModal
        open={true}
        onClose={vi.fn()}
        provider="Klook"
        productName="투어"
        price="₩50,000"
        affiliateUrl="https://klook.com"
      />,
    );
    expect(html).toContain("TravelDiary에 소정의 수수료");
    expect(html).toContain("추가 비용은 없습니다");
  });

  it("예약 CTA + 돌아가기 버튼 렌더", () => {
    const html = renderToStaticMarkup(
      <OtaInterstitialModal
        open={true}
        onClose={vi.fn()}
        provider="Klook"
        productName="투어"
        price="₩50,000"
        affiliateUrl="https://klook.com"
      />,
    );
    expect(html).toContain("Klook에서 예약하기");
    expect(html).toContain("돌아가기");
  });

  it("혜택 항목 3개 렌더", () => {
    const html = renderToStaticMarkup(
      <OtaInterstitialModal
        open={true}
        onClose={vi.fn()}
        provider="Agoda"
        productName="호텔"
        price="₩80,000"
        affiliateUrl="https://agoda.com"
      />,
    );
    expect(html).toContain("무료 취소 가능");
    expect(html).toContain("모바일 바우처 즉시 발급");
    expect(html).toContain("한국어 고객 지원");
  });

  it("aria-modal + role=dialog 접근성", () => {
    const html = renderToStaticMarkup(
      <OtaInterstitialModal
        open={true}
        onClose={vi.fn()}
        provider="Klook"
        productName="투어"
        price="₩50,000"
        affiliateUrl="https://klook.com"
      />,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
  });
});
