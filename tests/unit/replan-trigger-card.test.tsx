/**
 * 사이클 CC — ReplanTriggerCard 단위 테스트.
 *
 * BottomNav(사이클 O), StatusBadge(사이클 E) 답습 — renderToStaticMarkup HTML 검증.
 *
 * 검증:
 *  - 일정 dropdown 4 type select 모두 렌더
 *  - weather일 때만 condition select 노출 (delay/wait_time/manual은 미노출)
 *  - 30/60/90분 chip 정확히 3개
 *  - appliedLabel 있으면 Badge + 초기화 버튼 노출
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ReplanTriggerCard } from "@/components/itinerary/ReplanTriggerCard";
import type { ReplanTrigger } from "@/lib/replan";
import type { ItineraryItem } from "@/lib/types";

function makeItem(id: string, dayIndex: number, time: string): ItineraryItem {
  return {
    id,
    name: `Item ${id}`,
    dayIndex,
    scheduledAt: `2026-05-10T${time}:00.000Z`,
    durationMinutes: 60,
    flexibility: "flexible",
    priority: 3,
    flexMinutes: 30,
    dependencies: [],
    category: "spot",
    location: { lat: 0, lng: 0, address: "" },
    evidence: { reasons: [], sources: [] },
  } as unknown as ItineraryItem;
}

const DAY_ITEMS = [
  makeItem("a", 0, "10:00"),
  makeItem("b", 0, "12:00"),
  makeItem("c", 0, "15:00"),
];

const NOOP = () => {};

describe("사이클 CC — ReplanTriggerCard", () => {
  it("delay trigger — condition select 미노출", () => {
    const trigger: ReplanTrigger = { type: "delay", itemId: "b", minutes: 60 };
    const html = renderToStaticMarkup(
      <ReplanTriggerCard
        trigger={trigger}
        dayItems={DAY_ITEMS}
        replanOpen={false}
        appliedLabel={null}
        onTriggerChange={NOOP}
        onOpenReplan={NOOP}
        onReset={NOOP}
      />,
    );
    expect(html).toContain("어떤 일정에서?");
    expect(html).toContain("무슨 이유로?");
    expect(html).not.toContain("날씨 상태는?");
    expect(html).toContain("30분 지연");
    expect(html).toContain("60분 지연");
    expect(html).toContain("90분 지연");
  });

  it("weather trigger — chip preset 3 + 자유 입력 (사이클 EE)", () => {
    const trigger: ReplanTrigger = {
      type: "weather",
      itemId: "b",
      minutes: 60,
      condition: "태풍",
    };
    const html = renderToStaticMarkup(
      <ReplanTriggerCard
        trigger={trigger}
        dayItems={DAY_ITEMS}
        replanOpen={false}
        appliedLabel={null}
        onTriggerChange={NOOP}
        onOpenReplan={NOOP}
        onReset={NOOP}
      />,
    );
    expect(html).toContain("날씨 상태는?");
    expect(html).toContain(">비<");
    expect(html).toContain(">태풍<");
    expect(html).toContain(">안개<");
    expect(html.toLowerCase()).toContain('maxlength="30"');
    expect(html).toContain("폭염");
    expect(html).toContain("미세먼지");
  });

  it("weather chip 비활성 condition (자유 입력) → input value 노출, chip 비강조", () => {
    const trigger: ReplanTrigger = {
      type: "weather",
      itemId: "b",
      minutes: 60,
      condition: "폭염",
    };
    const html = renderToStaticMarkup(
      <ReplanTriggerCard
        trigger={trigger}
        dayItems={DAY_ITEMS}
        replanOpen={false}
        appliedLabel={null}
        onTriggerChange={NOOP}
        onOpenReplan={NOOP}
        onReset={NOOP}
      />,
    );
    // 자유 입력값이 input value로 노출
    expect(html).toContain('value="폭염"');
  });

  it("weather chip 활성 condition (preset) → input value 빈 문자열", () => {
    const trigger: ReplanTrigger = {
      type: "weather",
      itemId: "b",
      minutes: 60,
      condition: "비",
    };
    const html = renderToStaticMarkup(
      <ReplanTriggerCard
        trigger={trigger}
        dayItems={DAY_ITEMS}
        replanOpen={false}
        appliedLabel={null}
        onTriggerChange={NOOP}
        onOpenReplan={NOOP}
        onReset={NOOP}
      />,
    );
    // input은 chip이 활성이면 빈 값
    expect(html).toContain('value=""');
  });

  it("appliedLabel 있으면 Badge + 초기화 버튼 노출", () => {
    const trigger: ReplanTrigger = { type: "delay", itemId: "b", minutes: 60 };
    const html = renderToStaticMarkup(
      <ReplanTriggerCard
        trigger={trigger}
        dayItems={DAY_ITEMS}
        replanOpen={false}
        appliedLabel="추천"
        onTriggerChange={NOOP}
        onOpenReplan={NOOP}
        onReset={NOOP}
      />,
    );
    expect(html).toContain("추천 적용됨");
    expect(html).toContain("초기화");
  });

  it("appliedLabel 없으면 초기화 버튼 미노출", () => {
    const trigger: ReplanTrigger = { type: "delay", itemId: "b", minutes: 60 };
    const html = renderToStaticMarkup(
      <ReplanTriggerCard
        trigger={trigger}
        dayItems={DAY_ITEMS}
        replanOpen={false}
        appliedLabel={null}
        onTriggerChange={NOOP}
        onOpenReplan={NOOP}
        onReset={NOOP}
      />,
    );
    expect(html).not.toContain("초기화");
  });

  it("4 type select 모두 노출", () => {
    const trigger: ReplanTrigger = { type: "delay", itemId: "b", minutes: 60 };
    const html = renderToStaticMarkup(
      <ReplanTriggerCard
        trigger={trigger}
        dayItems={DAY_ITEMS}
        replanOpen={false}
        appliedLabel={null}
        onTriggerChange={NOOP}
        onOpenReplan={NOOP}
        onReset={NOOP}
      />,
    );
    expect(html).toContain('value="delay"');
    expect(html).toContain('value="weather"');
    expect(html).toContain('value="wait_time"');
    expect(html).toContain('value="manual"');
  });

  it("dayItems 모두 option으로 렌더", () => {
    const trigger: ReplanTrigger = { type: "delay", itemId: "b", minutes: 60 };
    const html = renderToStaticMarkup(
      <ReplanTriggerCard
        trigger={trigger}
        dayItems={DAY_ITEMS}
        replanOpen={false}
        appliedLabel={null}
        onTriggerChange={NOOP}
        onOpenReplan={NOOP}
        onReset={NOOP}
      />,
    );
    expect(html).toContain("Item a");
    expect(html).toContain("Item b");
    expect(html).toContain("Item c");
  });
});
