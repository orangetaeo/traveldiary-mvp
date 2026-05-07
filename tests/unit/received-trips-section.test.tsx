/**
 * ReceivedTripsSection — 옵션 K (사이클 BB, 2026-05-07).
 *
 * pure presentational `ReceivedTripsListView` 직접 테스트
 * (client wrapper의 LocalStorage/fetch 흐름은 receivedKeys/lookup-rate-limit 테스트가 커버).
 */

import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    [key: string]: unknown;
  }) =>
    React.createElement("a", { href, className, ...rest }, children),
}));

import { ReceivedTripsListView } from "@/components/trips/ReceivedTripsSection";
import type { SharedLookupItem } from "@/components/share/SharedPageCards";

function makeItem(overrides: Partial<SharedLookupItem> = {}): SharedLookupItem {
  return {
    key: "abc12345",
    found: true,
    status: "active",
    destination: "다낭",
    nights: 3,
    startDate: "2026-06-01",
    addedAt: Date.now(),
    ...overrides,
  };
}

describe("ReceivedTripsListView", () => {
  it("로딩 상태 — 받은 여행 헤더 + 불러오는 중", () => {
    const html = renderToStaticMarkup(
      <ReceivedTripsListView items={[]} totalCount={0} loading />,
    );
    expect(html).toContain("받은 여행");
    expect(html).toContain("불러오는 중");
    // 로딩 중에는 개수 뱃지 미표시
    expect(html).not.toContain("0개");
  });

  it("1개 아이템 — destination, n박n+1일, /share/[key] 링크", () => {
    const items = [makeItem({ destination: "다낭", nights: 3 })];
    const html = renderToStaticMarkup(
      <ReceivedTripsListView items={items} totalCount={1} loading={false} />,
    );
    expect(html).toContain("다낭");
    expect(html).toContain("3박 4일");
    expect(html).toContain('href="/share/abc12345"');
    expect(html).toContain("1개");
  });

  it("3개까지 미리보기, 4번째부터 +N개 더 보기", () => {
    const items = [
      makeItem({ key: "k1", destination: "다낭" }),
      makeItem({ key: "k2", destination: "하노이" }),
      makeItem({ key: "k3", destination: "호치민" }),
      makeItem({ key: "k4", destination: "푸꾸옥" }),
      makeItem({ key: "k5", destination: "나트랑" }),
    ];
    const html = renderToStaticMarkup(
      <ReceivedTripsListView items={items} totalCount={5} loading={false} />,
    );
    expect(html).toContain("다낭");
    expect(html).toContain("하노이");
    expect(html).toContain("호치민");
    // 4~5번째는 미리보기에 미포함
    expect(html).not.toContain("푸꾸옥");
    expect(html).not.toContain("나트랑");
    expect(html).toContain("+2개 더 보기");
    expect(html).toContain("5개"); // 헤더 카운트 (실제 active 5개)
  });

  it("totalCount > items.length — 만료/취소 안내", () => {
    const items = [makeItem({ key: "k1", destination: "다낭" })];
    const html = renderToStaticMarkup(
      <ReceivedTripsListView items={items} totalCount={3} loading={false} />,
    );
    expect(html).toContain("만료/취소된 2개는 /shared에서 확인");
  });

  it("totalCount == items.length — 만료/취소 안내 미표시", () => {
    const items = [makeItem({ key: "k1", destination: "다낭" })];
    const html = renderToStaticMarkup(
      <ReceivedTripsListView items={items} totalCount={1} loading={false} />,
    );
    expect(html).not.toContain("만료/취소");
  });

  it("destination 없으면 '여행' fallback", () => {
    const items = [makeItem({ destination: undefined })];
    const html = renderToStaticMarkup(
      <ReceivedTripsListView items={items} totalCount={1} loading={false} />,
    );
    expect(html).toContain("여행");
  });

  it("aria-label + section data-testid", () => {
    const html = renderToStaticMarkup(
      <ReceivedTripsListView
        items={[makeItem()]}
        totalCount={1}
        loading={false}
      />,
    );
    expect(html).toContain('aria-label="받은 여행"');
    expect(html).toContain('data-testid="received-trips-section"');
    expect(html).toContain('aria-label="받은 여행 전체 보기"');
  });

  it("startDate 10자 슬라이스 (시간 부분 절단)", () => {
    const items = [
      makeItem({ startDate: "2026-06-01T09:00:00Z", nights: 2 }),
    ];
    const html = renderToStaticMarkup(
      <ReceivedTripsListView items={items} totalCount={1} loading={false} />,
    );
    expect(html).toContain("2026-06-01");
    expect(html).not.toContain("T09:00:00Z");
  });

  it("nights undefined 시 일수 라벨 미표시", () => {
    const items = [
      makeItem({ destination: "다낭", nights: undefined, startDate: undefined }),
    ];
    const html = renderToStaticMarkup(
      <ReceivedTripsListView items={items} totalCount={1} loading={false} />,
    );
    expect(html).toContain("다낭");
    expect(html).not.toMatch(/\d박\s\d일/);
  });

  it("/shared 전체 보기 링크 항상 노출 (loading 포함)", () => {
    const loadingHtml = renderToStaticMarkup(
      <ReceivedTripsListView items={[]} totalCount={0} loading />,
    );
    const readyHtml = renderToStaticMarkup(
      <ReceivedTripsListView items={[makeItem()]} totalCount={1} loading={false} />,
    );
    expect(loadingHtml).toContain('href="/shared"');
    expect(readyHtml).toContain('href="/shared"');
  });
});
