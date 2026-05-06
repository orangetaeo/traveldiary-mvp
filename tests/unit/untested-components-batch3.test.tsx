/**
 * 미테스트 컴포넌트 스모크 테스트 — Batch 3.
 *
 * renderToStaticMarkup 정적 마크업 검증 (testing-library 미도입 정책).
 * 대상: JsonLd, TimeWindowFilter, ReceivedTripBanner,
 *       ReplanConflictModal, NotificationListView, OtaCompareSection, ProfileStats.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// ─── Mocks ────────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("@/lib/share/receivedKeys", () => ({
  listReceivedKeys: () => [{ key: "abc", addedAt: new Date().toISOString() }],
}));

vi.mock("@/lib/share/clientId", () => ({
  getOrCreateClientUuid: () => "test-uuid-1234-5678-9abc",
  getStoredNickname: () => "테스트 닉네임",
  setStoredNickname: vi.fn(),
}));

vi.mock("@/actions/affiliate", () => ({
  trackAffiliateClick: vi.fn(),
}));

// ─── Imports ──────────────────────────────────────────────

import {
  OrganizationJsonLd,
  WebAppJsonLd,
  BreadcrumbJsonLd,
} from "@/components/seo/JsonLd";
import { TimeWindowFilter } from "@/components/admin/TimeWindowFilter";
import { ReceivedTripBanner } from "@/components/share/ReceivedTripBanner";
import ReplanConflictModal from "@/components/modals/ReplanConflictModal";
import { NotificationListView } from "@/components/notifications/NotificationListView";
import { OtaCompareSection } from "@/components/itinerary/OtaCompareSection";
import { ProfileStats } from "@/components/profile/ProfileStats";
import type { AppNotification, OtaOffer } from "@/lib/types";

/* ════════════════════════════════════════════
 * JsonLd — 구조화 데이터 3종
 * ════════════════════════════════════════════ */

describe("JsonLd", () => {
  it("OrganizationJsonLd — schema.org Organization 마크업", () => {
    const html = renderToStaticMarkup(
      <OrganizationJsonLd
        name="TravelDiary"
        url="https://example.com"
        description="AI 여행 동반자"
        logo="https://example.com/logo.png"
      />,
    );
    expect(html).toContain("application/ld+json");
    const jsonMatch = html.match(/>(.+?)</s);
    expect(jsonMatch).not.toBeNull();
    const data = JSON.parse(jsonMatch![1]);
    expect(data["@type"]).toBe("Organization");
    expect(data.name).toBe("TravelDiary");
    expect(data.url).toBe("https://example.com");
  });

  it("WebAppJsonLd — schema.org WebApplication 마크업", () => {
    const html = renderToStaticMarkup(
      <WebAppJsonLd
        name="TravelDiary"
        url="https://example.com"
        description="AI 여행 동반자"
        applicationCategory="TravelApplication"
        operatingSystem="Web"
      />,
    );
    const jsonMatch = html.match(/>(.+?)</s);
    const data = JSON.parse(jsonMatch![1]);
    expect(data["@type"]).toBe("WebApplication");
    expect(data.offers.price).toBe("0");
    expect(data.inLanguage).toBe("ko");
  });

  it("BreadcrumbJsonLd — BreadcrumbList position 1-based", () => {
    const html = renderToStaticMarkup(
      <BreadcrumbJsonLd
        items={[
          { name: "홈", url: "https://example.com" },
          { name: "도시 가이드", url: "https://example.com/city" },
          { name: "다낭", url: "https://example.com/city/da-nang" },
        ]}
      />,
    );
    const jsonMatch = html.match(/>(.+?)</s);
    const data = JSON.parse(jsonMatch![1]);
    expect(data["@type"]).toBe("BreadcrumbList");
    expect(data.itemListElement).toHaveLength(3);
    expect(data.itemListElement[0].position).toBe(1);
    expect(data.itemListElement[2].position).toBe(3);
    expect(data.itemListElement[2].name).toBe("다낭");
  });

  it("빈 breadcrumb → 빈 itemListElement", () => {
    const html = renderToStaticMarkup(<BreadcrumbJsonLd items={[]} />);
    const jsonMatch = html.match(/>(.+?)</s);
    const data = JSON.parse(jsonMatch![1]);
    expect(data.itemListElement).toHaveLength(0);
  });
});

/* ════════════════════════════════════════════
 * TimeWindowFilter
 * ════════════════════════════════════════════ */

describe("TimeWindowFilter", () => {
  it("3개 필터 옵션 렌더링", () => {
    const html = renderToStaticMarkup(
      <TimeWindowFilter current={undefined} basePath="/admin/test" />,
    );
    expect(html).toContain("전체");
    expect(html).toContain("최근 7일");
    expect(html).toContain("최근 30일");
  });

  it("radiogroup 역할 + aria-label", () => {
    const html = renderToStaticMarkup(
      <TimeWindowFilter current={undefined} basePath="/admin/test" />,
    );
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-label="시간 윈도우"');
  });

  it("current=undefined → 전체 active", () => {
    const html = renderToStaticMarkup(
      <TimeWindowFilter current={undefined} basePath="/admin/test" />,
    );
    // 전체 링크에 aria-checked="true"
    expect(html).toMatch(/href="\/admin\/test"[^>]*aria-checked="true"/);
  });

  it("current=7 → 7일 active", () => {
    const html = renderToStaticMarkup(
      <TimeWindowFilter current={7} basePath="/admin/test" />,
    );
    expect(html).toMatch(/href="\/admin\/test\?window=7"[^>]*aria-checked="true"/);
  });

  it("current=30 → 30일 active", () => {
    const html = renderToStaticMarkup(
      <TimeWindowFilter current={30} basePath="/admin/test" />,
    );
    expect(html).toMatch(/href="\/admin\/test\?window=30"[^>]*aria-checked="true"/);
  });

  it("basePath가 href에 반영", () => {
    const html = renderToStaticMarkup(
      <TimeWindowFilter current={undefined} basePath="/admin/affiliate" />,
    );
    expect(html).toContain('href="/admin/affiliate"');
    expect(html).toContain('href="/admin/affiliate?window=7"');
    expect(html).toContain('href="/admin/affiliate?window=30"');
  });
});

/* ════════════════════════════════════════════
 * ReceivedTripBanner
 * ════════════════════════════════════════════ */

describe("ReceivedTripBanner", () => {
  it("destination 있으면 '{destination} 여행을' 표시", () => {
    const html = renderToStaticMarkup(
      <ReceivedTripBanner destination="다낭" onDismiss={() => {}} />,
    );
    expect(html).toContain("다낭 여행을");
    expect(html).toContain("받은 여행 목록에서 다시 볼 수 있어요");
  });

  it("destination 없으면 '이 여행을' fallback", () => {
    const html = renderToStaticMarkup(
      <ReceivedTripBanner onDismiss={() => {}} />,
    );
    expect(html).toContain("이 여행을");
  });

  it("role=status + aria-live=polite", () => {
    const html = renderToStaticMarkup(
      <ReceivedTripBanner destination="다낭" onDismiss={() => {}} />,
    );
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });

  it("/shared 링크 존재", () => {
    const html = renderToStaticMarkup(
      <ReceivedTripBanner destination="다낭" onDismiss={() => {}} />,
    );
    expect(html).toContain('href="/shared"');
    expect(html).toContain("받은 여행 →");
  });

  it("닫기 버튼 aria-label", () => {
    const html = renderToStaticMarkup(
      <ReceivedTripBanner destination="다낭" onDismiss={() => {}} />,
    );
    expect(html).toContain('aria-label="배너 닫기"');
  });
});

/* ════════════════════════════════════════════
 * ReplanConflictModal
 * ════════════════════════════════════════════ */

describe("ReplanConflictModal", () => {
  const conflictA = { id: "a", name: "반미 맛집", time: "11:00", category: "food", icon: "restaurant" };
  const conflictB = { id: "b", name: "한시장", time: "11:00", category: "spot", icon: "storefront" };
  const noop = () => {};

  it("open=false → 빈 렌더", () => {
    const html = renderToStaticMarkup(
      <ReplanConflictModal
        open={false}
        onClose={noop}
        conflictA={conflictA}
        conflictB={conflictB}
        onKeepA={noop}
        onKeepB={noop}
        onKeepBoth={noop}
      />,
    );
    expect(html).toBe("");
  });

  it("open=true → dialog 모달 렌더", () => {
    const html = renderToStaticMarkup(
      <ReplanConflictModal
        open={true}
        onClose={noop}
        conflictA={conflictA}
        conflictB={conflictB}
        onKeepA={noop}
        onKeepB={noop}
        onKeepBoth={noop}
      />,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
  });

  it("충돌 아이템 이름 표시", () => {
    const html = renderToStaticMarkup(
      <ReplanConflictModal
        open={true}
        onClose={noop}
        conflictA={conflictA}
        conflictB={conflictB}
        onKeepA={noop}
        onKeepB={noop}
        onKeepBoth={noop}
      />,
    );
    expect(html).toContain("반미 맛집");
    expect(html).toContain("한시장");
  });

  it("시간대 충돌 제목", () => {
    const html = renderToStaticMarkup(
      <ReplanConflictModal
        open={true}
        onClose={noop}
        conflictA={conflictA}
        conflictB={conflictB}
        onKeepA={noop}
        onKeepB={noop}
        onKeepBoth={noop}
      />,
    );
    expect(html).toContain("시간대 충돌");
  });

  it("3가지 해결 옵션 존재", () => {
    const html = renderToStaticMarkup(
      <ReplanConflictModal
        open={true}
        onClose={noop}
        conflictA={conflictA}
        conflictB={conflictB}
        onKeepA={noop}
        onKeepB={noop}
        onKeepBoth={noop}
      />,
    );
    // Keep A, Keep B, Keep Both
    expect(html).toContain("유지");
    expect(html).toContain("둘 다 유지");
  });

  it("VS 구분선 존재", () => {
    const html = renderToStaticMarkup(
      <ReplanConflictModal
        open={true}
        onClose={noop}
        conflictA={conflictA}
        conflictB={conflictB}
        onKeepA={noop}
        onKeepB={noop}
        onKeepBoth={noop}
      />,
    );
    expect(html).toContain("VS");
  });

  it("닫기 버튼 aria-label", () => {
    const html = renderToStaticMarkup(
      <ReplanConflictModal
        open={true}
        onClose={noop}
        conflictA={conflictA}
        conflictB={conflictB}
        onKeepA={noop}
        onKeepB={noop}
        onKeepBoth={noop}
      />,
    );
    expect(html).toContain('aria-label="닫기"');
  });
});

/* ════════════════════════════════════════════
 * NotificationListView
 * ════════════════════════════════════════════ */

describe("NotificationListView", () => {
  const makeNotification = (overrides: Partial<AppNotification> = {}): AppNotification => ({
    id: "n1",
    title: "일정이 변경되었어요",
    body: "다낭 여행 2일차가 업데이트됐어요.",
    icon: "event",
    iconColor: "purple",
    category: "travel",
    read: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  });

  it("빈 알림 → 안내 메시지", () => {
    const html = renderToStaticMarkup(
      <NotificationListView notifications={[]} />,
    );
    expect(html).toContain("아직 알림이 없어요");
  });

  it("알림 있으면 제목 표시", () => {
    const html = renderToStaticMarkup(
      <NotificationListView
        notifications={[makeNotification()]}
      />,
    );
    expect(html).toContain("일정이 변경되었어요");
    expect(html).toContain("다낭 여행 2일차가 업데이트됐어요");
  });

  it("미읽은 알림 배지 카운트", () => {
    const html = renderToStaticMarkup(
      <NotificationListView
        notifications={[
          makeNotification({ id: "n1", read: false }),
          makeNotification({ id: "n2", read: true }),
          makeNotification({ id: "n3", read: false }),
        ]}
      />,
    );
    // 미읽음 2개
    expect(html).toContain(">2<");
  });

  it("알림 헤더", () => {
    const html = renderToStaticMarkup(
      <NotificationListView notifications={[]} />,
    );
    expect(html).toContain("알림");
  });

  it("필터 탭 4개", () => {
    const html = renderToStaticMarkup(
      <NotificationListView notifications={[]} />,
    );
    expect(html).toContain("전체");
    expect(html).toContain("여행");
    expect(html).toContain("동행");
    expect(html).toContain("시스템");
  });

  it("href 있는 알림 → Link 렌더", () => {
    const html = renderToStaticMarkup(
      <NotificationListView
        notifications={[makeNotification({ href: "/trips/trip-1" })]}
      />,
    );
    expect(html).toContain('href="/trips/trip-1"');
  });

  it("href 없는 알림 → div 렌더", () => {
    const html = renderToStaticMarkup(
      <NotificationListView
        notifications={[makeNotification({ href: undefined })]}
      />,
    );
    // div가 li 안에 렌더됨 (Link 아님)
    expect(html).not.toContain('href="/trips');
  });

  it("읽은 알림 opacity 스타일", () => {
    const html = renderToStaticMarkup(
      <NotificationListView
        notifications={[makeNotification({ read: true })]}
      />,
    );
    expect(html).toContain("opacity-70");
  });
});

/* ════════════════════════════════════════════
 * OtaCompareSection
 * ════════════════════════════════════════════ */

describe("OtaCompareSection", () => {
  const makeOffer = (overrides: Partial<OtaOffer> = {}): OtaOffer => ({
    id: "offer-1",
    matchTag: "danang:activity:ba-na-hills",
    ota: "klook",
    title: "바나힐 입장권",
    priceKrw: 35000,
    url: "https://klook.com/test",
    ...overrides,
  });

  it("빈 offers → null (아무것도 렌더 안 함)", () => {
    const html = renderToStaticMarkup(
      <OtaCompareSection itemId="item-1" offers={[]} />,
    );
    expect(html).toBe("");
  });

  it("offers 있으면 섹션 렌더", () => {
    const html = renderToStaticMarkup(
      <OtaCompareSection
        itemId="item-1"
        offers={[makeOffer()]}
      />,
    );
    expect(html).toContain("예약 가격 비교");
    expect(html).toContain("바나힐 입장권");
    expect(html).toContain("35,000원");
  });

  it("최저가 배지", () => {
    const html = renderToStaticMarkup(
      <OtaCompareSection
        itemId="item-1"
        offers={[
          makeOffer({ id: "o1", priceKrw: 35000 }),
          makeOffer({ id: "o2", priceKrw: 40000, ota: "kkday" }),
        ]}
      />,
    );
    expect(html).toContain("최저가");
  });

  it("할인율 표시 (originalPriceKrw 존재 시)", () => {
    const html = renderToStaticMarkup(
      <OtaCompareSection
        itemId="item-1"
        offers={[makeOffer({ priceKrw: 30000, originalPriceKrw: 40000 })]}
      />,
    );
    // (1 - 30000/40000) * 100 = 25%
    expect(html).toContain("-25%");
    expect(html).toContain("40,000원"); // 원래 가격 표시
  });

  it("가격순 정렬", () => {
    const html = renderToStaticMarkup(
      <OtaCompareSection
        itemId="item-1"
        offers={[
          makeOffer({ id: "o1", priceKrw: 50000, title: "비싼 상품" }),
          makeOffer({ id: "o2", priceKrw: 30000, title: "저렴한 상품", ota: "kkday" }),
        ]}
      />,
    );
    const cheapIdx = html.indexOf("저렴한 상품");
    const expensiveIdx = html.indexOf("비싼 상품");
    expect(cheapIdx).toBeLessThan(expensiveIdx);
  });

  it("OTA 라벨 표시", () => {
    const html = renderToStaticMarkup(
      <OtaCompareSection
        itemId="item-1"
        offers={[makeOffer({ ota: "klook" })]}
      />,
    );
    expect(html).toContain("Klook");
  });

  it("rating + reviewCount 표시", () => {
    const html = renderToStaticMarkup(
      <OtaCompareSection
        itemId="item-1"
        offers={[makeOffer({ rating: 4.8, reviewCount: 1234 })]}
      />,
    );
    expect(html).toContain("4.8");
    expect(html).toContain("1,234");
  });
});

/* ════════════════════════════════════════════
 * ProfileStats
 * ════════════════════════════════════════════ */

describe("ProfileStats", () => {
  it("tripCount 표시", () => {
    const html = renderToStaticMarkup(
      <ProfileStats tripCount={5} isAuthenticated={false} />,
    );
    expect(html).toContain(">5<");
    expect(html).toContain("내 여행");
  });

  it("내 활동 섹션 헤더", () => {
    const html = renderToStaticMarkup(
      <ProfileStats tripCount={0} isAuthenticated={false} />,
    );
    expect(html).toContain("내 활동");
  });

  it("비인증 시 닉네임 변경 안내", () => {
    const html = renderToStaticMarkup(
      <ProfileStats tripCount={0} isAuthenticated={false} />,
    );
    expect(html).toContain("닉네임은");
    expect(html).toContain('href="/shared"');
  });

  it("인증 시 닉네임 안내 숨김", () => {
    const html = renderToStaticMarkup(
      <ProfileStats tripCount={0} isAuthenticated={true} />,
    );
    expect(html).not.toContain("닉네임은");
  });

  it("/trips + /shared 링크 존재", () => {
    const html = renderToStaticMarkup(
      <ProfileStats tripCount={3} isAuthenticated={false} />,
    );
    expect(html).toContain('href="/trips"');
    expect(html).toContain('href="/shared"');
  });

  it("받은 여행 레이블 표시", () => {
    const html = renderToStaticMarkup(
      <ProfileStats tripCount={0} isAuthenticated={false} />,
    );
    expect(html).toContain("받은 여행");
  });
});
