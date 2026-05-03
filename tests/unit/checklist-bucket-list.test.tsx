/**
 * 사이클 QQ — ChecklistBucketList 단위 테스트.
 *
 * 답습: 사이클 LL/NN.
 *
 * 검증:
 *  - 빈 items → 빈 출력 (BUCKET_ORDER 모두 0건)
 *  - 버킷 그룹 라벨 (D-30 / 여행 중 / 귀국 후 등)
 *  - 카테고리 라벨 한국어 6종
 *  - done=true → line-through + check_circle
 *  - done=false → radio_button_unchecked + 체크 라벨
 *  - cityNote 노출 (💡)
 *  - bucketDone/total 카운트
 *  - aria-label (체크 / 체크 해제 / 삭제)
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ChecklistBucketList } from "@/components/checklist/ChecklistBucketList";
import type {
  ChecklistCategory,
  ChecklistItem,
  DDayBucket,
} from "@/lib/types";

const NOW = "2026-05-03T00:00:00Z";
const NOOP = () => {};

function item(
  id: string,
  overrides: Partial<ChecklistItem> = {},
): ChecklistItem {
  return {
    id,
    tripId: "t1",
    category: "documents",
    text: `item-${id}`,
    dDayBucket: "D-30",
    done: false,
    sortOrder: 0,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe("사이클 QQ — ChecklistBucketList", () => {
  it("빈 items → 버킷 article 출력 0", () => {
    const html = renderToStaticMarkup(
      <ChecklistBucketList items={[]} onToggle={NOOP} onDelete={NOOP} />,
    );
    expect(html).not.toContain("D-30");
    expect(html).not.toContain("여행 중");
  });

  it("D-30 + during 버킷 라벨 노출", () => {
    const html = renderToStaticMarkup(
      <ChecklistBucketList
        items={[
          item("a", { dDayBucket: "D-30" }),
          item("b", { dDayBucket: "during" }),
        ]}
        onToggle={NOOP}
        onDelete={NOOP}
      />,
    );
    expect(html).toContain("D-30 · 사전 준비");
    expect(html).toContain("여행 중");
  });

  it("카테고리 라벨 6종", () => {
    const cats: ChecklistCategory[] = [
      "documents",
      "clothing",
      "electronics",
      "forbidden",
      "declarable",
      "custom",
    ];
    const html = renderToStaticMarkup(
      <ChecklistBucketList
        items={cats.map((c, i) => item(String(i), { category: c }))}
        onToggle={NOOP}
        onDelete={NOOP}
      />,
    );
    expect(html).toContain("서류");
    expect(html).toContain("의류");
    expect(html).toContain("전자");
    expect(html).toContain("반입 금지");
    expect(html).toContain("신고 대상");
    expect(html).toContain("기타");
  });

  it("done=true → check_circle + line-through + '체크 해제' aria", () => {
    const html = renderToStaticMarkup(
      <ChecklistBucketList
        items={[item("a", { done: true })]}
        onToggle={NOOP}
        onDelete={NOOP}
      />,
    );
    expect(html).toContain("check_circle");
    expect(html).toContain("line-through");
    expect(html).toContain('aria-label="체크 해제"');
  });

  it("done=false → radio_button_unchecked + '체크' aria", () => {
    const html = renderToStaticMarkup(
      <ChecklistBucketList
        items={[item("a", { done: false })]}
        onToggle={NOOP}
        onDelete={NOOP}
      />,
    );
    expect(html).toContain("radio_button_unchecked");
    expect(html).toContain('aria-label="체크"');
  });

  it("cityNote 노출 (💡 이모지 포함)", () => {
    const html = renderToStaticMarkup(
      <ChecklistBucketList
        items={[item("a", { cityNote: "베트남 5일 무비자" })]}
        onToggle={NOOP}
        onDelete={NOOP}
      />,
    );
    expect(html).toContain("💡");
    expect(html).toContain("베트남 5일 무비자");
  });

  it("bucketDone/total 카운트 — 2건 중 1건 done", () => {
    const html = renderToStaticMarkup(
      <ChecklistBucketList
        items={[
          item("a", { dDayBucket: "D-7", done: true }),
          item("b", { dDayBucket: "D-7", done: false }),
        ]}
        onToggle={NOOP}
        onDelete={NOOP}
      />,
    );
    expect(html).toContain("1/2");
  });

  it("삭제 aria-label 노출", () => {
    const html = renderToStaticMarkup(
      <ChecklistBucketList
        items={[item("a")]}
        onToggle={NOOP}
        onDelete={NOOP}
      />,
    );
    expect(html).toContain('aria-label="삭제"');
  });

  it("BUCKET_ORDER 정렬 — D-30이 D-1보다 먼저 노출 (HTML 인덱스)", () => {
    const html = renderToStaticMarkup(
      <ChecklistBucketList
        items={[
          item("a", { dDayBucket: "D-1" }),
          item("b", { dDayBucket: "D-30" }),
        ]}
        onToggle={NOOP}
        onDelete={NOOP}
      />,
    );
    const idx30 = html.indexOf("D-30 · 사전 준비");
    const idx1 = html.indexOf("D-1 · 출발 직전");
    expect(idx30).toBeGreaterThanOrEqual(0);
    expect(idx1).toBeGreaterThanOrEqual(0);
    expect(idx30).toBeLessThan(idx1);
  });
});
