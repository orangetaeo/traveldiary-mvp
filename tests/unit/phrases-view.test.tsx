/**
 * PhrasesView + /phrases 페이지 단위 테스트 (A3 디자인 갭, 사이클 W3).
 *
 * 검증:
 *  - PhrasesView: 카테고리 4 칩 + 데모 마커 + 카드 리스트 + ARIA tablist
 *  - 페이지 헤더 + 베트남어 카드 타이틀
 *  - /translate ↔ /phrases 진입 링크 양방향 매핑
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => <a href={href} {...rest}>{children}</a>,
}));

import { PhrasesView } from "@/components/phrases/PhrasesView";

describe("PhrasesView", () => {
  it("Hero 타이틀 + 14 문장 카운트", () => {
    const html = renderToStaticMarkup(<PhrasesView />);
    expect(html).toContain("베트남어 핵심 문장 14개");
  });

  it("amber 데모 마커 (정체성 투명화)", () => {
    const html = renderToStaticMarkup(<PhrasesView />);
    expect(html).toContain("🟡");
    expect(html).toContain("브라우저 음성 합성");
    expect(html).toContain("SpeechSynthesis");
    expect(html).toContain("bg-amber-soft");
  });

  it("ARIA tablist + 4 카테고리 탭", () => {
    const html = renderToStaticMarkup(<PhrasesView />);
    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-label="베트남어 문장 카테고리"');
    expect(html).toContain('role="tab"');
    expect(html).toContain('data-category="restaurant"');
    expect(html).toContain('data-category="grab"');
    expect(html).toContain('data-category="hotel"');
    expect(html).toContain('data-category="emergency"');
  });

  it("4 카테고리 라벨 (식당/그랩/호텔/응급)", () => {
    const html = renderToStaticMarkup(<PhrasesView />);
    expect(html).toContain("식당");
    expect(html).toContain("그랩");
    expect(html).toContain("호텔");
    expect(html).toContain("응급");
  });

  it("초기 활성 카테고리 = 식당 (aria-selected='true')", () => {
    const html = renderToStaticMarkup(<PhrasesView />);
    // restaurant 칩이 selected, 나머지는 false
    const trueCount = (html.match(/aria-selected="true"/g) || []).length;
    const falseCount = (html.match(/aria-selected="false"/g) || []).length;
    expect(trueCount).toBe(1);
    expect(falseCount).toBe(3);
  });

  it("초기 카드 5건 (식당 카테고리)", () => {
    const html = renderToStaticMarkup(<PhrasesView />);
    const cardCount = (html.match(/data-testid="phrase-card"/g) || []).length;
    expect(cardCount).toBe(5);
  });

  it("초기 식당 문장 5건 한국어 모두 렌더", () => {
    const html = renderToStaticMarkup(<PhrasesView />);
    expect(html).toContain("메뉴 주세요");
    expect(html).toContain("매워요");
    expect(html).toContain("안 맵게");
    expect(html).toContain("계산해");
    expect(html).toContain("맛있어요");
  });

  it("푸터 안내 — 북부 표준 발음", () => {
    const html = renderToStaticMarkup(<PhrasesView />);
    expect(html).toContain("북부");
    expect(html).toContain("호치민");
  });
});

describe("/phrases 페이지 (정적 source)", () => {
  const src = fs.readFileSync(
    path.resolve("app/phrases/page.tsx"),
    "utf-8",
  );

  it("server component (no 'use client')", () => {
    expect(src).not.toContain('"use client"');
  });

  it("metadata title + description (한국어)", () => {
    expect(src).toContain("베트남어 핵심 문장");
    expect(src).toContain("식당");
    expect(src).toContain("그랩");
    expect(src).toContain("호텔");
    expect(src).toContain("응급");
  });

  it("/translate 뒤로가기 (진입점)", () => {
    expect(src).toContain('href="/translate"');
    expect(src).toContain('aria-label="번역 화면으로 돌아가기"');
  });

  it("PhrasesView 컴포넌트 import + 렌더", () => {
    expect(src).toContain('from "@/components/phrases/PhrasesView"');
    expect(src).toContain("<PhrasesView />");
  });
});

describe("/translate ↔ /phrases 진입 링크 (사이클 W3)", () => {
  const src = fs.readFileSync(
    path.resolve("components/translate/TranslateView.tsx"),
    "utf-8",
  );

  it("TranslateView TopAppBar에 /phrases 진입점 menu_book 아이콘", () => {
    expect(src).toContain('href="/phrases"');
    expect(src).toContain('aria-label="베트남어 핵심 문장 카드"');
    expect(src).toContain("menu_book");
  });

  it("기존 카메라 권한 도움말 진입점 유지 (회귀 0)", () => {
    expect(src).toContain('href="/permission/camera"');
    expect(src).toContain('aria-label="카메라 권한 도움말"');
  });
});
