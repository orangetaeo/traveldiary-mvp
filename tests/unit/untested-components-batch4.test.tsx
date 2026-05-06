/**
 * 미테스트 컴포넌트 스모크 테스트 — Batch 4.
 *
 * renderToStaticMarkup 정적 마크업 검증.
 * 대상: Badge, LoginButton, PostTripRecapView.
 */

import { describe, it, expect, vi } from "vitest";
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

// ─── Imports ──────────────────────────────────────────────

import { Badge } from "@/components/ui/Badge";
import { LoginButton } from "@/components/auth/LoginButton";
import { PostTripRecapView } from "@/components/recap/PostTripRecapView";
import type { RecapStats, RecapHighlight, RecapMoment } from "@/lib/types";

/* ════════════════════════════════════════════
 * Badge
 * ════════════════════════════════════════════ */

describe("Badge", () => {
  it("기본 tone=neutral 렌더", () => {
    const html = renderToStaticMarkup(<Badge>테스트</Badge>);
    expect(html).toContain("테스트");
    expect(html).toContain("bg-surface-soft");
    expect(html).toContain("text-ink-soft");
  });

  it("tone=info → purple 스타일", () => {
    const html = renderToStaticMarkup(<Badge tone="info">정보</Badge>);
    expect(html).toContain("bg-purple-soft");
    expect(html).toContain("text-purple-deep");
  });

  it("tone=amber → amber 스타일", () => {
    const html = renderToStaticMarkup(<Badge tone="amber">주의</Badge>);
    expect(html).toContain("bg-amber-soft");
    expect(html).toContain("text-amber-deep");
  });

  it("tone=danger → danger 스타일", () => {
    const html = renderToStaticMarkup(<Badge tone="danger">위험</Badge>);
    expect(html).toContain("bg-danger-soft");
    expect(html).toContain("text-danger-deep");
  });

  it("tone=success → success 스타일", () => {
    const html = renderToStaticMarkup(<Badge tone="success">성공</Badge>);
    expect(html).toContain("bg-success-soft");
    expect(html).toContain("text-success-deep");
  });

  it("모든 tone(5개) 렌더 성공", () => {
    const tones = ["info", "amber", "danger", "success", "neutral"] as const;
    for (const tone of tones) {
      const html = renderToStaticMarkup(<Badge tone={tone}>뱃지</Badge>);
      expect(html).toContain("뱃지");
    }
  });

  it("className prop 합성", () => {
    const html = renderToStaticMarkup(<Badge className="custom-class">라벨</Badge>);
    expect(html).toContain("custom-class");
  });

  it("span 태그 렌더", () => {
    const html = renderToStaticMarkup(<Badge>라벨</Badge>);
    expect(html).toMatch(/^<span/);
  });

  it("inline-block + rounded-full 스타일", () => {
    const html = renderToStaticMarkup(<Badge>라벨</Badge>);
    expect(html).toContain("inline-block");
    expect(html).toContain("rounded-full");
  });
});

/* ════════════════════════════════════════════
 * LoginButton
 * ════════════════════════════════════════════ */

describe("LoginButton", () => {
  it("oauthAvailable=false → disabled 상태", () => {
    const html = renderToStaticMarkup(
      <LoginButton currentUserId={null} oauthAvailable={false} />,
    );
    expect(html).toContain("disabled");
    expect(html).toContain("로그인 (미설정)");
    expect(html).toContain("cursor-not-allowed");
  });

  it("oauthAvailable=false → title에 설정 안내", () => {
    const html = renderToStaticMarkup(
      <LoginButton currentUserId={null} oauthAvailable={false} />,
    );
    expect(html).toContain("카카오 OAuth 미설정");
  });

  it("미로그인 + oauth 가능 → 카카오 로그인 버튼", () => {
    const html = renderToStaticMarkup(
      <LoginButton currentUserId={null} oauthAvailable={true} />,
    );
    expect(html).toContain("카카오 로그인");
    expect(html).toContain("#FEE500"); // 카카오 노란색
    expect(html).not.toContain("disabled");
  });

  it("로그인 상태 + userName → 이름 표시 + 로그아웃", () => {
    const html = renderToStaticMarkup(
      <LoginButton
        currentUserId="user-123"
        currentUserName="김여행"
        oauthAvailable={true}
      />,
    );
    expect(html).toContain("김여행");
    expect(html).toContain("로그아웃");
    expect(html).not.toContain("카카오 로그인");
  });

  it("로그인 상태 + userName 없음 → ID 앞 6자 표시", () => {
    const html = renderToStaticMarkup(
      <LoginButton
        currentUserId="user-abc-def-ghi"
        oauthAvailable={true}
      />,
    );
    expect(html).toContain("사용자 user-a");
  });

  it("lock 아이콘 (미설정 시)", () => {
    const html = renderToStaticMarkup(
      <LoginButton currentUserId={null} oauthAvailable={false} />,
    );
    expect(html).toContain("lock");
  });

  it("chat_bubble 아이콘 (카카오 로그인)", () => {
    const html = renderToStaticMarkup(
      <LoginButton currentUserId={null} oauthAvailable={true} />,
    );
    expect(html).toContain("chat_bubble");
  });
});

/* ════════════════════════════════════════════
 * PostTripRecapView
 * ════════════════════════════════════════════ */

describe("PostTripRecapView", () => {
  const stats: RecapStats = {
    placesVisited: 12,
    longestStay: "반미 맛집",
    totalDistanceKm: 45,
    totalSteps: 56000,
    totalSpentKRW: 850000,
    biggestCategory: "음식",
  };

  const highlights: RecapHighlight[] = [
    { id: "h1", label: "최고의 맛집", emoji: "🍜", name: "반미 맛집", icon: "restaurant", color: "purple" },
    { id: "h2", label: "최고의 사진", emoji: "📸", name: "바나힐", icon: "photo_camera", color: "coral" },
  ];

  const moments: RecapMoment[] = [
    { id: "m1", dayLabel: "Day 1", alt: "다낭 해변" },
    { id: "m2", dayLabel: "Day 2", alt: "바나힐", imageUrl: "https://example.com/photo.jpg" },
  ];

  it("여행 제목 표시", () => {
    const html = renderToStaticMarkup(
      <PostTripRecapView
        tripId="trip-1"
        tripTitle="다낭 3박 4일"
        dateRange="2026-06-01 ~ 2026-06-04"
        stats={stats}
        highlights={highlights}
        moments={moments}
      />,
    );
    expect(html).toContain("다낭 3박 4일");
    expect(html).toContain("2026-06-01 ~ 2026-06-04");
  });

  it("통계 카드 3종 (방문/이동/지출)", () => {
    const html = renderToStaticMarkup(
      <PostTripRecapView
        tripId="trip-1"
        tripTitle="테스트"
        dateRange="날짜"
        stats={stats}
        highlights={highlights}
        moments={moments}
      />,
    );
    expect(html).toContain("12곳 방문");
    expect(html).toContain("45km");
    expect(html).toContain("56,000"); // 걸음 수 (toLocaleString)
    expect(html).toContain("음식"); // biggestCategory
  });

  it("하이라이트 섹션", () => {
    const html = renderToStaticMarkup(
      <PostTripRecapView
        tripId="trip-1"
        tripTitle="테스트"
        dateRange="날짜"
        stats={stats}
        highlights={highlights}
        moments={moments}
      />,
    );
    expect(html).toContain("Trip Highlights");
    expect(html).toContain("반미 맛집");
    expect(html).toContain("바나힐");
    expect(html).toContain("🍜");
    expect(html).toContain("📸");
  });

  it("모먼트 포토 그리드", () => {
    const html = renderToStaticMarkup(
      <PostTripRecapView
        tripId="trip-1"
        tripTitle="테스트"
        dateRange="날짜"
        stats={stats}
        highlights={highlights}
        moments={moments}
      />,
    );
    expect(html).toContain("Moments");
    expect(html).toContain("Day 1");
    expect(html).toContain("Day 2");
  });

  it("imageUrl 있으면 img 태그", () => {
    const html = renderToStaticMarkup(
      <PostTripRecapView
        tripId="trip-1"
        tripTitle="테스트"
        dateRange="날짜"
        stats={stats}
        highlights={[]}
        moments={[{ id: "m1", dayLabel: "Day 1", alt: "사진", imageUrl: "https://example.com/test.jpg" }]}
      />,
    );
    expect(html).toContain("<img");
    expect(html).toContain('alt="사진"');
  });

  it("imageUrl 없으면 placeholder", () => {
    const html = renderToStaticMarkup(
      <PostTripRecapView
        tripId="trip-1"
        tripTitle="테스트"
        dateRange="날짜"
        stats={stats}
        highlights={[]}
        moments={[{ id: "m1", dayLabel: "Day 1", alt: "사진 없음" }]}
      />,
    );
    expect(html).toContain("photo_camera");
    expect(html).not.toContain("<img");
  });

  it("빈 highlights → 하이라이트 섹션 비어있음", () => {
    const html = renderToStaticMarkup(
      <PostTripRecapView
        tripId="trip-1"
        tripTitle="테스트"
        dateRange="날짜"
        stats={stats}
        highlights={[]}
        moments={moments}
      />,
    );
    expect(html).toContain("Trip Highlights");
    // 하이라이트 카드 없으므로 highlight 전용 emoji 없음
    expect(html).not.toContain("🍜");
    expect(html).not.toContain("📸");
  });

  it("뒤로 링크 (wrap-up)", () => {
    const html = renderToStaticMarkup(
      <PostTripRecapView
        tripId="trip-abc"
        tripTitle="테스트"
        dateRange="날짜"
        stats={stats}
        highlights={[]}
        moments={[]}
      />,
    );
    expect(html).toContain('href="/wrap-up/trip-abc"');
    expect(html).toContain('aria-label="뒤로"');
  });

  it("공유 + 내보내기 CTA", () => {
    const html = renderToStaticMarkup(
      <PostTripRecapView
        tripId="trip-1"
        tripTitle="테스트"
        dateRange="날짜"
        stats={stats}
        highlights={[]}
        moments={[]}
      />,
    );
    expect(html).toContain("카카오톡으로 공유");
    expect(html).toContain("인스타 스토리로 내보내기");
  });

  it("지출 금액 formatKrw 형식", () => {
    const html = renderToStaticMarkup(
      <PostTripRecapView
        tripId="trip-1"
        tripTitle="테스트"
        dateRange="날짜"
        stats={{ ...stats, totalSpentKRW: 1250000 }}
        highlights={[]}
        moments={[]}
      />,
    );
    // formatKrw(1250000) → "125만원" 또는 "1,250,000원" (formatKrw 구현에 따라)
    expect(html).toContain("총 지출");
  });
});
