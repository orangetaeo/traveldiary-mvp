/**
 * PlaceDiscoveryView 재설계 단위 테스트 (디자인 갭 #1 U2, 사이클 2 매핑).
 *
 * Stitch screenId 8c4d688f50fd481e932c4501edaf8d6f 매핑 결과 검증.
 *
 * 검증:
 *  - 카테고리 그리드 6 카드 (전체 + 음식/관광/쇼핑/자연/카페)
 *  - 필터 칩 5개 (거리/가격/평점/한국후기/알레르기)
 *  - Context Bar: "{destination} · {N}곳 검증 완료"
 *  - 풍부 카드: enrichment 적용 시 한국 후기 인용 + AI 이유 + 한식 OK 뱃지 노출
 *  - 풍부 정보가 없는 시드는 graceful degradation (빈 카드 X)
 */

import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PlaceDiscoveryView } from "@/components/itinerary/PlaceDiscoveryView";
import type { DiscoverPlace } from "@/lib/types";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/hooks/useToast", () => ({
  useToast: () => ({ visible: false, message: "", show: vi.fn() }),
}));

const RICH_PLACE: DiscoverPlace = {
  id: "rich-1",
  name: "까미아 레스토랑",
  category: "food",
  rating: 4.7,
  reviewCount: 2308,
  distance: "도보 5분",
  badge: "ai",
  destination: "푸꾸옥",
  priceLevel: 2,
  koreanReviewQuote: {
    text: "한국인 입맛에 잘 맞아요",
    author: "김민수",
  },
  koreanReviewCount: 87,
  aiReason: "한국인 후기 4.6 + 알레르기 표기",
  koreanFoodFriendly: true,
};

const PLAIN_PLACE: DiscoverPlace = {
  id: "plain-1",
  name: "이름 없는 식당",
  category: "spot",
  rating: 4.2,
  reviewCount: 50,
  distance: "차량 10분",
  destination: "푸꾸옥",
};

describe("PlaceDiscoveryView 재설계 (디자인 갭 #1 U2)", () => {
  it("카테고리 그리드 6 카드 + '어떤 곳을 찾으세요?' 헤더", () => {
    const html = renderToStaticMarkup(
      <PlaceDiscoveryView
        tripId="t1"
        dayIndex={0}
        destination="푸꾸옥"
        places={[RICH_PLACE, PLAIN_PLACE]}
        verifiedCount={2}
      />,
    );
    expect(html).toContain("어떤 곳을 찾으세요?");
    expect(html).toContain("🗂️");
    expect(html).toContain("🍜");
    expect(html).toContain("🏛️");
    expect(html).toContain("🛍️");
    expect(html).toContain("🌿");
    expect(html).toContain("☕");
    expect(html).toContain("전체");
    expect(html).toContain("음식");
    expect(html).toContain("관광");
    expect(html).toContain("쇼핑");
    expect(html).toContain("자연");
    expect(html).toContain("카페");
  });

  it("필터 칩 5개 노출 (거리/가격/평점/한국후기/알레르기)", () => {
    const html = renderToStaticMarkup(
      <PlaceDiscoveryView
        tripId="t1"
        dayIndex={0}
        destination="푸꾸옥"
        places={[RICH_PLACE]}
        verifiedCount={1}
      />,
    );
    expect(html).toContain("거리 가까운 순");
    expect(html).toContain("가격 낮은 순");
    expect(html).toContain("평점 4.5+");
    expect(html).toContain("한국 후기 있음");
    expect(html).toContain("알레르기 제외");
  });

  it("Context Bar: '{destination} · N곳 검증 완료'", () => {
    const html = renderToStaticMarkup(
      <PlaceDiscoveryView
        tripId="t1"
        dayIndex={0}
        destination="푸꾸옥"
        places={[RICH_PLACE]}
        verifiedCount={42}
      />,
    );
    expect(html).toContain("푸꾸옥 · 42곳 검증 완료");
  });

  it("풍부 카드: 한국 후기 인용 + AI 이유 + 한식 OK 뱃지", () => {
    const html = renderToStaticMarkup(
      <PlaceDiscoveryView
        tripId="t1"
        dayIndex={0}
        destination="푸꾸옥"
        places={[RICH_PLACE]}
        verifiedCount={1}
      />,
    );
    // 한국 후기 인용
    expect(html).toContain("한국인 입맛에 잘 맞아요");
    expect(html).toContain("김민수");
    // AI 이유 뱃지
    expect(html).toContain("한국인 후기 4.6 + 알레르기 표기");
    // 한식 OK 뱃지 (사진 좌상단)
    expect(html).toContain("한식 OK");
    // 한국 후기 카운트
    expect(html).toContain("🇰🇷 87");
    // 가격 표시 (priceLevel=2 → ₩₩)
    expect(html).toContain("₩₩");
  });

  it("plain 카드(enrichment 없음) graceful degradation", () => {
    const html = renderToStaticMarkup(
      <PlaceDiscoveryView
        tripId="t1"
        dayIndex={0}
        destination="푸꾸옥"
        places={[PLAIN_PLACE]}
        verifiedCount={1}
      />,
    );
    // 이름은 노출
    expect(html).toContain("이름 없는 식당");
    // enrichment 없으니 한국 후기 인용 X
    expect(html).not.toContain("한국인 입맛에 잘 맞아요");
    // 한식 OK 뱃지 X
    expect(html).not.toContain("한식 OK");
    // 카드는 정상 렌더 (+ 일정에 추가 버튼 노출)
    expect(html).toContain("+ 일정에 추가");
  });

  it("TopAppBar 검색 토글 버튼 + 뒤로 링크", () => {
    const html = renderToStaticMarkup(
      <PlaceDiscoveryView
        tripId="trip-xyz"
        dayIndex={2}
        destination="푸꾸옥"
        places={[]}
        verifiedCount={0}
      />,
    );
    expect(html).toContain("AI 추천 장소");
    expect(html).toContain('aria-label="검색 토글"');
    // next/link mock이 aria-label을 propagate 안 함 → arrow_back 아이콘 + href로 단언
    expect(html).toContain("arrow_back");
    expect(html).toContain('href="/itinerary/trip-xyz?day=2"');
  });

  it("빈 결과 → '조건에 맞는 곳이 없어요'", () => {
    const html = renderToStaticMarkup(
      <PlaceDiscoveryView
        tripId="t1"
        dayIndex={0}
        destination="푸꾸옥"
        places={[]}
        verifiedCount={0}
      />,
    );
    expect(html).toContain("조건에 맞는 곳이 없어요");
    expect(html).toContain("필터를 줄여보세요");
  });
});

describe("phu-quoc-discover-enrichment 머지", () => {
  it("실제 시드와 enrichment 매핑 — 까미아 레스토랑 풍부 정보 노출", async () => {
    const { DEMO_DISCOVER_PLACES } = await import("@/lib/seed/discover-places");
    const camia = DEMO_DISCOVER_PLACES.find(
      (p) => p.id === "pq-food-까미아-레스토랑",
    );
    expect(camia).toBeDefined();
    // enrichment 머지로 koreanReviewQuote가 채워져 있어야 함
    expect(camia?.koreanReviewQuote?.text).toContain("한국인 입맛");
    expect(camia?.aiReason).toContain("한국인 후기");
    expect(camia?.priceLevel).toBe(2);
    expect(camia?.koreanFoodFriendly).toBe(true);
  });

  it("enrichment 미적용 카드는 optional 필드 undefined", async () => {
    const { DEMO_DISCOVER_PLACES } = await import("@/lib/seed/discover-places");
    // 시드 첫 카드 중 enrichment 미적용 카드 (랜덤 ID)
    const plain = DEMO_DISCOVER_PLACES.find(
      (p) => p.id === "pq-spot-coco",
    );
    if (plain) {
      expect(plain.koreanReviewQuote).toBeUndefined();
      expect(plain.aiReason).toBeUndefined();
      expect(plain.priceLevel).toBeUndefined();
    }
  });
});
