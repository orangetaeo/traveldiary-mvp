/**
 * 사이클 HH — ItineraryItemCard 단위 테스트.
 *
 * 사이클 O / CC / DD 답습 — renderToStaticMarkup HTML 검증.
 * formatItineraryTime / splitItemName 헬퍼도 함께 검증.
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ItineraryItemCard,
  formatItineraryTime,
  splitItemName,
} from "@/components/itinerary/ItineraryItemCard";
import type { ItineraryItem } from "@/lib/types";

function makeItem(over: Partial<ItineraryItem> = {}): ItineraryItem {
  return {
    id: "i1",
    name: "사오비치 (Sao Beach)",
    dayIndex: 2,
    scheduledAt: "2026-05-10T14:30:00.000Z",
    durationMinutes: 120,
    flexibility: "flexible",
    priority: 4,
    flexMinutes: 30,
    dependencies: [],
    category: "spot",
    location: { lat: 0, lng: 0, address: "" },
    evidence: { reasons: [], sources: [] },
    ...over,
  } as unknown as ItineraryItem;
}

const NOOP = () => {};

const BASE_PROPS = {
  tripId: "t1",
  isFeatured: false,
  isOnTrip: false,
  showEvidence: false,
  isDragging: false,
  isDragOver: false,
  onDragStart: NOOP,
  onDragOver: NOOP,
  onDragLeave: NOOP,
  onDragEnd: NOOP,
  onDrop: NOOP,
  isFirst: false,
  isLast: false,
  onMoveUp: NOOP,
  onMoveDown: NOOP,
};

describe("formatItineraryTime", () => {
  it("HH:MM (UTC) zero-pad", () => {
    expect(formatItineraryTime("2026-05-10T09:05:00.000Z")).toBe("09:05");
    expect(formatItineraryTime("2026-05-10T14:30:00.000Z")).toBe("14:30");
  });
  it("invalid → 빈 문자열", () => {
    expect(formatItineraryTime("not-a-date")).toBe("");
  });
});

describe("splitItemName", () => {
  it("괄호 분리 — 한국어/영문", () => {
    expect(splitItemName("사오비치 (Sao Beach)")).toEqual({
      ko: "사오비치",
      en: "Sao Beach",
    });
  });
  it("괄호 없으면 ko만", () => {
    expect(splitItemName("푸꾸옥 야시장")).toEqual({
      ko: "푸꾸옥 야시장",
      en: "",
    });
  });
});

describe("사이클 HH — ItineraryItemCard", () => {
  it("기본 — 시간 + 한국어/영문 이름 + AI 추천 배지", () => {
    const html = renderToStaticMarkup(
      <ItineraryItemCard item={makeItem()} {...BASE_PROPS} />,
    );
    expect(html).toContain("14:30");
    expect(html).toContain("사오비치");
    expect(html).toContain("Sao Beach");
    expect(html).toContain("AI 추천");
    expect(html).toContain('href="/itinerary/t1/item/i1"');
  });

  it("isBooked (flexibility=booked) → 예약 완료 배지", () => {
    const html = renderToStaticMarkup(
      <ItineraryItemCard
        item={makeItem({ flexibility: "booked" })}
        {...BASE_PROPS}
      />,
    );
    expect(html).toContain("예약 완료");
    expect(html).not.toContain("AI 추천");
  });

  it("isFeatured + isOnTrip=true → '진행 중'", () => {
    const html = renderToStaticMarkup(
      <ItineraryItemCard
        item={makeItem()}
        {...BASE_PROPS}
        isFeatured={true}
        isOnTrip={true}
      />,
    );
    expect(html).toContain("진행 중");
  });

  it("isFeatured + isOnTrip=false → 'AI 추천' (featured 분기)", () => {
    const html = renderToStaticMarkup(
      <ItineraryItemCard
        item={makeItem()}
        {...BASE_PROPS}
        isFeatured={true}
        isOnTrip={false}
      />,
    );
    // featured 라벨 — featured 영역에 AI 추천 텍스트
    expect(html).toContain("AI 추천");
  });

  it("showEvidence=true 면 EvidencePanel 영역 노출 (showEvidence=false 대비 길이 더 큼)", () => {
    const item = makeItem({
      evidence: {
        reasons: [{ text: "Naver 후기 5건", source: "naver" }],
        sources: [],
      } as never,
    });
    const withEvidence = renderToStaticMarkup(
      <ItineraryItemCard item={item} {...BASE_PROPS} showEvidence={true} />,
    );
    const withoutEvidence = renderToStaticMarkup(
      <ItineraryItemCard item={item} {...BASE_PROPS} showEvidence={false} />,
    );
    expect(withEvidence.length).toBeGreaterThan(withoutEvidence.length);
  });

  it("isDragging=true → opacity-40 클래스", () => {
    const html = renderToStaticMarkup(
      <ItineraryItemCard
        item={makeItem()}
        {...BASE_PROPS}
        isDragging={true}
      />,
    );
    expect(html).toContain("opacity-40");
  });

  it("category icon 매핑 (food → restaurant)", () => {
    const html = renderToStaticMarkup(
      <ItineraryItemCard
        item={makeItem({ category: "food" as never })}
        {...BASE_PROPS}
      />,
    );
    expect(html).toContain("restaurant");
  });

  it("category 알 수 없음 → 'place' 폴백", () => {
    const html = renderToStaticMarkup(
      <ItineraryItemCard
        item={makeItem({ category: "unknown" as never })}
        {...BASE_PROPS}
      />,
    );
    expect(html).toContain("place");
  });
});

describe("Session X cap 2 (A2) — 도착 체크인 시각/뱃지", () => {
  it("기본 props만 — 도착 버튼/뱃지 둘 다 부재 (BC)", () => {
    const html = renderToStaticMarkup(
      <ItineraryItemCard item={makeItem()} {...BASE_PROPS} />,
    );
    expect(html).not.toContain("도착 14:");
    expect(html).not.toContain('aria-label="사오비치 도착 체크인"');
  });

  it("canCheckIn=true + arrivedAt=null → 도착 버튼 노출", () => {
    const html = renderToStaticMarkup(
      <ItineraryItemCard
        item={makeItem()}
        {...BASE_PROPS}
        canCheckIn={true}
        onCheckIn={NOOP}
      />,
    );
    expect(html).toContain('aria-label="사오비치 도착 체크인"');
    expect(html).toContain(">도착<");
  });

  it("canCheckIn=true 지만 onCheckIn 없으면 버튼 숨김 (방어)", () => {
    const html = renderToStaticMarkup(
      <ItineraryItemCard
        item={makeItem()}
        {...BASE_PROPS}
        canCheckIn={true}
      />,
    );
    expect(html).not.toContain('aria-label="사오비치 도착 체크인"');
  });

  it("arrivedAt 설정 → ✓ 도착 시각 + dot 색 success로 swap", () => {
    const html = renderToStaticMarkup(
      <ItineraryItemCard
        item={makeItem()}
        {...BASE_PROPS}
        arrivedAt="2026-05-10T14:35:00.000Z"
      />,
    );
    expect(html).toContain("도착 14:35");
    expect(html).toContain("check_circle");
    // dot icon이 check로 swap (기존 spot icon은 'place')
    expect(html).toContain("bg-success");
  });

  it("arrivedAt 설정 + onUndoCheckIn → 취소 버튼 노출", () => {
    const html = renderToStaticMarkup(
      <ItineraryItemCard
        item={makeItem()}
        {...BASE_PROPS}
        arrivedAt="2026-05-10T14:35:00.000Z"
        onUndoCheckIn={NOOP}
      />,
    );
    expect(html).toContain('aria-label="사오비치 도착 체크인 취소"');
  });

  it("arrivedAt 우선 — featured + arrivedAt 동시 시 success 색 우선", () => {
    const html = renderToStaticMarkup(
      <ItineraryItemCard
        item={makeItem()}
        {...BASE_PROPS}
        isFeatured={true}
        arrivedAt="2026-05-10T14:35:00.000Z"
      />,
    );
    // dot은 success (arrived 분기 우선)
    expect(html).toContain("bg-success text-white");
  });

  it("arrived 시 도착 버튼은 숨김 (둘 다 노출되지 않음)", () => {
    const html = renderToStaticMarkup(
      <ItineraryItemCard
        item={makeItem()}
        {...BASE_PROPS}
        arrivedAt="2026-05-10T14:35:00.000Z"
        canCheckIn={true}
        onCheckIn={NOOP}
        onUndoCheckIn={NOOP}
      />,
    );
    expect(html).not.toContain('aria-label="사오비치 도착 체크인"');
    expect(html).toContain('aria-label="사오비치 도착 체크인 취소"');
  });
});

describe("사이클 BLOCKER4 — 화살표 정렬 버튼", () => {
  it("기본 — 위/아래 화살표 버튼 2개 존재", () => {
    const html = renderToStaticMarkup(
      <ItineraryItemCard item={makeItem()} {...BASE_PROPS} />,
    );
    expect(html).toContain("keyboard_arrow_up");
    expect(html).toContain("keyboard_arrow_down");
    expect(html).toContain('aria-label="위로 이동"');
    expect(html).toContain('aria-label="아래로 이동"');
  });

  it("isFirst=true → 위 버튼 disabled, 아래 버튼 enabled", () => {
    const html = renderToStaticMarkup(
      <ItineraryItemCard item={makeItem()} {...BASE_PROPS} isFirst={true} isLast={false} />,
    );
    const upBtnTag = html.match(/<button[^>]*aria-label="위로 이동"[^>]*>/)?.[0] ?? "";
    const downBtnTag = html.match(/<button[^>]*aria-label="아래로 이동"[^>]*>/)?.[0] ?? "";
    // disabled="" 속성 (CSS class 'disabled:...'와 구분)
    expect(upBtnTag).toContain('disabled=""');
    expect(downBtnTag).not.toContain('disabled=""');
  });

  it("isLast=true → 아래 버튼 disabled, 위 버튼 enabled", () => {
    const html = renderToStaticMarkup(
      <ItineraryItemCard item={makeItem()} {...BASE_PROPS} isFirst={false} isLast={true} />,
    );
    const downBtnTag = html.match(/<button[^>]*aria-label="아래로 이동"[^>]*>/)?.[0] ?? "";
    const upBtnTag = html.match(/<button[^>]*aria-label="위로 이동"[^>]*>/)?.[0] ?? "";
    expect(downBtnTag).toContain('disabled=""');
    expect(upBtnTag).not.toContain('disabled=""');
  });

  it("isFirst + isLast 둘 다 true → 양쪽 모두 disabled", () => {
    const html = renderToStaticMarkup(
      <ItineraryItemCard item={makeItem()} {...BASE_PROPS} isFirst={true} isLast={true} />,
    );
    const upBtnTag = html.match(/<button[^>]*aria-label="위로 이동"[^>]*>/)?.[0] ?? "";
    const downBtnTag = html.match(/<button[^>]*aria-label="아래로 이동"[^>]*>/)?.[0] ?? "";
    expect(upBtnTag).toContain('disabled=""');
    expect(downBtnTag).toContain('disabled=""');
  });
});
