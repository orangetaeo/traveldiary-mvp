/**
 * ChecklistTimeline 컴포넌트 단위 테스트.
 *
 * D-30 → D-14 → D-7 → D-1 → 여행 중 → 귀국 후 6단계 타임라인.
 */

import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { ChecklistItem, DDayBucket } from "@/lib/types";
import { ChecklistTimeline } from "@/components/checklist/ChecklistTimeline";

function makeItem(bucket: DDayBucket, done: boolean, id = "i"): ChecklistItem {
  return {
    id: `${id}-${bucket}-${done ? "d" : "n"}`,
    tripId: "t-1",
    category: "travel_docs",
    text: "테스트",
    dDayBucket: bucket,
    done,
    sortOrder: 0,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };
}

describe("ChecklistTimeline", () => {
  it("빈 items → null (렌더 안 함)", () => {
    const html = renderToStaticMarkup(<ChecklistTimeline items={[]} />);
    expect(html).toBe("");
  });

  it("6단계 라벨 렌더링", () => {
    const items = [makeItem("D-30", false)];
    const html = renderToStaticMarkup(<ChecklistTimeline items={items} />);
    expect(html).toContain("D-30");
    expect(html).toContain("D-14");
    expect(html).toContain("D-7");
    expect(html).toContain("D-1");
    expect(html).toContain("여행 중");
    expect(html).toContain("귀국 후");
  });

  it("완료 버킷 → check 아이콘 + bg-purple", () => {
    const items = [makeItem("D-30", true, "a"), makeItem("D-30", true, "b")];
    const html = renderToStaticMarkup(<ChecklistTimeline items={items} />);
    expect(html).toContain("check");
    expect(html).toContain("bg-purple");
  });

  it("부분 완료 → 작은 보라 도트", () => {
    const items = [makeItem("D-7", true, "a"), makeItem("D-7", false, "b")];
    const html = renderToStaticMarkup(<ChecklistTimeline items={items} />);
    expect(html).toContain("w-2 h-2 rounded-full bg-purple");
  });

  it("카운트 표시 (done/total)", () => {
    const items = [
      makeItem("D-30", true, "a"),
      makeItem("D-30", false, "b"),
      makeItem("D-30", true, "c"),
    ];
    const html = renderToStaticMarkup(<ChecklistTimeline items={items} />);
    expect(html).toContain("2/3");
  });

  it("빈 버킷 → 카운트 미표시 + bg-surface-soft", () => {
    // D-30에만 아이템, 나머지는 빈 버킷
    const items = [makeItem("D-30", false)];
    const html = renderToStaticMarkup(<ChecklistTimeline items={items} />);
    expect(html).toContain("bg-surface-soft");
    // 빈 버킷에는 카운트 미표시 (0/0이 아님)
    expect(html).not.toContain("0/0");
  });

  it("완료 버킷 라벨 → text-purple font-bold", () => {
    const items = [makeItem("D-14", true)];
    const html = renderToStaticMarkup(<ChecklistTimeline items={items} />);
    expect(html).toContain("text-purple");
    expect(html).toContain("font-bold");
  });

  it("연결선 렌더링 (첫 번째 제외)", () => {
    const items = [makeItem("D-30", true), makeItem("D-14", false)];
    const html = renderToStaticMarkup(<ChecklistTimeline items={items} />);
    // 연결선은 absolute top-[9px] 클래스
    expect(html).toContain("top-[9px]");
  });

  it("100% 완료 연결선 → bg-purple", () => {
    const items = [makeItem("D-30", true)];
    const html = renderToStaticMarkup(<ChecklistTimeline items={items} />);
    // D-30 100% → D-14로의 연결선이 bg-purple
    expect(html).toContain("bg-purple");
  });
});
