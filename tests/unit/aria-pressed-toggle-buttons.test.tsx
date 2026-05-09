/**
 * 회귀 가드 — toggle button aria-pressed 명시 (WCAG 2.1 SC 4.1.2 + ARIA Authoring Practices).
 *
 * "토글" UI(ON/OFF state 표시 button)에 `aria-pressed` 누락 시 스크린리더가
 * 현재 state를 인식 못함. aria-label만으로는 동작 설명만 가능, state는 부재.
 *
 * 정정 대상 2건:
 *   - components/checklist/ChecklistBucketList.tsx — done toggle (체크/해제)
 *   - components/itinerary/PlaceResultCard.tsx — isFavorite toggle (찜)
 *
 * FlashcardMode flipped는 multi-action(다음 카드/뒤집기)이라 toggle 패턴 부적합.
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ChecklistBucketList } from "@/components/checklist/ChecklistBucketList";
import { PlaceResultCard } from "@/components/itinerary/PlaceResultCard";
import type { ChecklistItem, DiscoverPlace } from "@/lib/types";

// ── ChecklistBucketList ──────────────────────────────────

const NOW = "2026-05-09T00:00:00.000Z";

const ITEM_DONE: ChecklistItem = {
  id: "i1",
  tripId: "t1",
  text: "여권",
  category: "essentials",
  dDayBucket: "D-7",
  done: true,
  sortOrder: 0,
  createdAt: NOW,
  updatedAt: NOW,
};

const ITEM_PENDING: ChecklistItem = {
  id: "i2",
  tripId: "t1",
  text: "환전",
  category: "essentials",
  dDayBucket: "D-7",
  done: false,
  sortOrder: 1,
  createdAt: NOW,
  updatedAt: NOW,
};

describe("ChecklistBucketList toggle button — aria-pressed", () => {
  it("done=true → aria-pressed=\"true\"", () => {
    const html = renderToStaticMarkup(
      <ChecklistBucketList
        items={[ITEM_DONE]}
        onToggle={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("여권 체크 해제");
  });

  it("done=false → aria-pressed=\"false\"", () => {
    const html = renderToStaticMarkup(
      <ChecklistBucketList
        items={[ITEM_PENDING]}
        onToggle={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain("환전 체크");
  });

  it("aria-label 단독 의존 회귀 차단 — aria-pressed true/false 동시 등장", () => {
    const html = renderToStaticMarkup(
      <ChecklistBucketList
        items={[ITEM_DONE, ITEM_PENDING]}
        onToggle={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-pressed="false"');
  });
});

// ── PlaceResultCard ────────────────────────────────────────

const PLACE: DiscoverPlace = {
  id: "p1",
  name: "찐 찜",
  category: "food",
  rating: 4.5,
  reviewCount: 100,
  distance: "도보 10분",
  imageUrl: "/img.jpg",
};

describe("PlaceResultCard 찜하기 button — aria-pressed", () => {
  it("isFavorite=true → aria-pressed=\"true\" + 찜 해제 라벨", () => {
    const html = renderToStaticMarkup(
      <PlaceResultCard
        place={PLACE}
        tripId="t1"
        isFavorite={true}
        isAdding={false}
        onToggleFavorite={() => {}}
        onAdd={() => {}}
      />,
    );
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-label="찜 해제"');
  });

  it("isFavorite=false → aria-pressed=\"false\" + 찜하기 라벨", () => {
    const html = renderToStaticMarkup(
      <PlaceResultCard
        place={PLACE}
        tripId="t1"
        isFavorite={false}
        isAdding={false}
        onToggleFavorite={() => {}}
        onAdd={() => {}}
      />,
    );
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('aria-label="찜하기"');
  });

  it("aria-pressed가 시각 강조(text-danger / text-ink-mute)와 페어 — state 동기화", () => {
    const htmlOn = renderToStaticMarkup(
      <PlaceResultCard
        place={PLACE}
        tripId="t1"
        isFavorite={true}
        isAdding={false}
        onToggleFavorite={() => {}}
        onAdd={() => {}}
      />,
    );
    const htmlOff = renderToStaticMarkup(
      <PlaceResultCard
        place={PLACE}
        tripId="t1"
        isFavorite={false}
        isAdding={false}
        onToggleFavorite={() => {}}
        onAdd={() => {}}
      />,
    );
    expect(htmlOn).toContain("favorite</span>");
    expect(htmlOn).toContain("text-danger");
    expect(htmlOff).toContain("favorite_border</span>");
    expect(htmlOff).toContain("text-ink-mute");
  });
});
