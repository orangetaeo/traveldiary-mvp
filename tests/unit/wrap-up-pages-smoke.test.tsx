/**
 * /wrap-up/[tripId] + /wrap-up/[tripId]/recap 렌더 스모크.
 *
 * Phase 7 잔여 2페이지. 두 페이지 모두 동기 server component +
 * resolveTrip() 시드 의존(DB 미터치). 실제 demo-trip-phu-quoc로 호출하면
 * mock 없이도 자연스러운 데이터로 렌더 가능 — Session I 패턴 답습.
 *
 * notFound 분기는 next/navigation mock으로 throw 단언.
 */

import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// ─── Mocks ────────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    prefetch: _prefetch,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    prefetch?: boolean;
    [key: string]: unknown;
  }) => <a href={href} {...rest}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("notFound called");
  }),
}));

// ─── Imports (mocks 정의 후) ──────────────────────────────

import WrapUpPage from "@/app/wrap-up/[tripId]/page";
import RecapPage from "@/app/wrap-up/[tripId]/recap/page";

const KNOWN_TRIP_ID = "demo-trip-phu-quoc";
const UNKNOWN_TRIP_ID = "no-such-trip-xxx";

// ─── Tests ────────────────────────────────────────────────

describe("/wrap-up/[tripId] 렌더 스모크", () => {
  it("known trip — hero + 핵심 카피", () => {
    const html = renderToStaticMarkup(
      <WrapUpPage params={{ tripId: KNOWN_TRIP_ID }} />,
    );
    expect(html).toContain("Trip Wrap-up");
    expect(html).toContain("잘 다녀오셨어요?");
    expect(html).toContain("여행 끝. 다음을 위한 작은 정리.");
  });

  it("known trip — stats 4 카드 헤더", () => {
    const html = renderToStaticMarkup(
      <WrapUpPage params={{ tripId: KNOWN_TRIP_ID }} />,
    );
    expect(html).toContain("방문 장소");
    expect(html).toContain("여행 일수");
    expect(html).toContain("카테고리");
    expect(html).toContain("동행");
  });

  it("known trip — 하이라이트 + 후기 카드 + CTA", () => {
    const html = renderToStaticMarkup(
      <WrapUpPage params={{ tripId: KNOWN_TRIP_ID }} />,
    );
    expect(html).toContain("이 순간이 좋았어요");
    expect(html).toContain("AI 추천");
    expect(html).toContain("여행 후기 남기기");
    expect(html).toContain("내 여행 보관하기");
    expect(html).toContain("통계 자세히");
  });

  it("known trip — 다음 추천 도시 (PQC 자기 자신 제외)", () => {
    const html = renderToStaticMarkup(
      <WrapUpPage params={{ tripId: KNOWN_TRIP_ID }} />,
    );
    expect(html).toContain("다음 여행은?");
    // PQC 본인은 제외, 나머지 추천 도시는 노출
    expect(html).toContain("다낭");
    expect(html).toContain("호치민");
    expect(html).toContain("나트랑");
  });

  it("known trip — 헤더 뒤로/공유 버튼 + 일정 링크", () => {
    const html = renderToStaticMarkup(
      <WrapUpPage params={{ tripId: KNOWN_TRIP_ID }} />,
    );
    expect(html).toContain('href="/itinerary/demo-trip-phu-quoc"');
    expect(html).toContain('href="/cost/demo-trip-phu-quoc"');
    expect(html).toContain('aria-label="일정으로 돌아가기"');
    expect(html).toContain('aria-label="공유"');
  });

  it("unknown trip — notFound() throw", () => {
    expect(() =>
      renderToStaticMarkup(
        <WrapUpPage params={{ tripId: UNKNOWN_TRIP_ID }} />,
      ),
    ).toThrow("notFound called");
  });
});

describe("/wrap-up/[tripId]/recap 렌더 스모크", () => {
  it("known trip — hero 타이틀 + 기간", () => {
    const html = renderToStaticMarkup(
      <RecapPage params={{ tripId: KNOWN_TRIP_ID }} />,
    );
    // tripTitle = `🇻🇳 ${city.name}의 기억`
    expect(html).toContain("의 기억");
    // dateRange = "{nights}박 {totalDays}일"
    expect(html).toMatch(/\d+박 \d+일/);
  });

  it("known trip — PostTripRecapView 핵심 섹션 (시드 데이터 기반)", () => {
    const html = renderToStaticMarkup(
      <RecapPage params={{ tripId: KNOWN_TRIP_ID }} />,
    );
    // 정적 마크업이 비어있지 않은지만 1차 단언 (시드 변경 회귀 마진)
    expect(html.length).toBeGreaterThan(500);
  });

  it("unknown trip — notFound() throw", () => {
    expect(() =>
      renderToStaticMarkup(
        <RecapPage params={{ tripId: UNKNOWN_TRIP_ID }} />,
      ),
    ).toThrow("notFound called");
  });
});
