/**
 * 미테스트 컴포넌트 스모크 테스트 — Batch 9.
 *
 * renderToStaticMarkup 정적 마크업 검증.
 * 대상: Button, Card (기반 UI 컴포넌트).
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/* ════════════════════════════════════════════
 * Button
 * ════════════════════════════════════════════ */

describe("Button", () => {
  it("기본 렌더 — <button> 태그", () => {
    const html = renderToStaticMarkup(<Button>확인</Button>);
    expect(html).toMatch(/^<button/);
    expect(html).toContain("확인");
  });

  // ─── variant ──────────────────────────────────────────────

  it("secondary (기본) — bg-transparent + border-divider", () => {
    const html = renderToStaticMarkup(<Button>취소</Button>);
    expect(html).toContain("bg-transparent");
    expect(html).toContain("border-divider");
  });

  it("primary — bg-purple-soft + text-purple-deep", () => {
    const html = renderToStaticMarkup(<Button variant="primary">예약</Button>);
    expect(html).toContain("bg-purple-soft");
    expect(html).toContain("text-purple-deep");
  });

  it("decisive — bg-ink + text-white", () => {
    const html = renderToStaticMarkup(
      <Button variant="decisive">적용</Button>,
    );
    expect(html).toContain("bg-ink");
    expect(html).toContain("text-white");
  });

  // ─── size ─────────────────────────────────────────────────

  it("sm 사이즈 — text-xs + px-3", () => {
    const html = renderToStaticMarkup(<Button size="sm">작은</Button>);
    expect(html).toContain("text-xs");
    expect(html).toContain("px-3");
  });

  it("md (기본) 사이즈 — text-sm + px-4", () => {
    const html = renderToStaticMarkup(<Button>중간</Button>);
    expect(html).toContain("text-sm");
    expect(html).toContain("px-4");
    expect(html).toContain("py-2.5");
  });

  it("lg 사이즈 — font-medium + py-3", () => {
    const html = renderToStaticMarkup(<Button size="lg">큰</Button>);
    expect(html).toContain("font-medium");
    expect(html).toContain("py-3");
  });

  // ─── fullWidth ────────────────────────────────────────────

  it("fullWidth=true → w-full 클래스", () => {
    const html = renderToStaticMarkup(
      <Button fullWidth>전체 너비</Button>,
    );
    expect(html).toContain("w-full");
  });

  it("fullWidth 미지정 → w-full 없음", () => {
    const html = renderToStaticMarkup(<Button>기본</Button>);
    // w-full이 className에 포함되지 않아야 함
    // 빈 문자열이 들어가지만 " w-full "은 없어야 함
    expect(html).not.toContain(" w-full ");
  });

  // ─── className + HTML 속성 ────────────────────────────────

  it("className 전달", () => {
    const html = renderToStaticMarkup(
      <Button className="my-custom">커스텀</Button>,
    );
    expect(html).toContain("my-custom");
  });

  it("disabled 속성 전달", () => {
    const html = renderToStaticMarkup(
      <Button disabled>비활성</Button>,
    );
    expect(html).toContain("disabled");
  });

  it("type 속성 전달", () => {
    const html = renderToStaticMarkup(
      <Button type="submit">제출</Button>,
    );
    expect(html).toContain('type="submit"');
  });

  it("rounded-md + transition-all 기본", () => {
    const html = renderToStaticMarkup(<Button>기본</Button>);
    expect(html).toContain("rounded-md");
    expect(html).toContain("transition-all");
  });

  it("active:scale-[0.98] (모든 variant)", () => {
    const secondary = renderToStaticMarkup(<Button>a</Button>);
    const primary = renderToStaticMarkup(<Button variant="primary">b</Button>);
    const decisive = renderToStaticMarkup(<Button variant="decisive">c</Button>);
    for (const html of [secondary, primary, decisive]) {
      expect(html).toContain("active:scale-[0.98]");
    }
  });
});

/* ════════════════════════════════════════════
 * Card
 * ════════════════════════════════════════════ */

describe("Card", () => {
  it("기본 렌더 — <div> 태그 + children", () => {
    const html = renderToStaticMarkup(<Card>내용</Card>);
    expect(html).toMatch(/^<div/);
    expect(html).toContain("내용");
  });

  // ─── variant ──────────────────────────────────────────────

  it("raised (기본) — bg-surface-card + border-divider", () => {
    const html = renderToStaticMarkup(<Card>기본</Card>);
    expect(html).toContain("bg-surface-card");
    expect(html).toContain("border-divider");
  });

  it("plain — bg-surface-soft (테두리 없음)", () => {
    const html = renderToStaticMarkup(<Card variant="plain">플레인</Card>);
    expect(html).toContain("bg-surface-soft");
    expect(html).not.toContain("border-divider");
  });

  it("featured — border-2 border-purple", () => {
    const html = renderToStaticMarkup(<Card variant="featured">AI 1순위</Card>);
    expect(html).toContain("border-2");
    expect(html).toContain("border-purple");
  });

  // ─── 공통 스타일 ──────────────────────────────────────────

  it("rounded-lg + p-4 기본", () => {
    const html = renderToStaticMarkup(<Card>기본</Card>);
    expect(html).toContain("rounded-lg");
    expect(html).toContain("p-4");
  });

  it("transition-colors 기본", () => {
    const html = renderToStaticMarkup(<Card>기본</Card>);
    expect(html).toContain("transition-colors");
  });

  // ─── onClick (interactive) ────────────────────────────────

  it("onClick 있으면 cursor-pointer", () => {
    const html = renderToStaticMarkup(
      <Card onClick={() => {}}>클릭 가능</Card>,
    );
    expect(html).toContain("cursor-pointer");
    expect(html).toContain("hover:border-ink-mute");
  });

  it("onClick 없으면 cursor-pointer 없음", () => {
    const html = renderToStaticMarkup(<Card>비클릭</Card>);
    expect(html).not.toContain("cursor-pointer");
  });

  // ─── className ────────────────────────────────────────────

  it("className 전달", () => {
    const html = renderToStaticMarkup(
      <Card className="my-card">커스텀</Card>,
    );
    expect(html).toContain("my-card");
  });
});
