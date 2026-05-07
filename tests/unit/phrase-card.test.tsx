/**
 * PhraseCard 단위 테스트 (A3 디자인 갭, 사이클 W3).
 *
 * 검증:
 *  - 한국어 + 베트남어 + 발음 + 음성 재생 버튼 렌더
 *  - aria-label 동적 (ko + 발음 재생)
 *  - aria-pressed string ternary 박제 답습
 *  - data-phrase-id 식별자
 *  - context 메모 렌더 (선택 필드)
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PhraseCard } from "@/components/phrases/PhraseCard";
import type { Phrase } from "@/lib/vietnamese-phrases";

const PHRASE: Phrase = {
  id: "rest-1",
  category: "restaurant",
  ko: "메뉴 주세요",
  vi: "Cho tôi xem thực đơn",
  pronunciation: "쩌 또이 쌤 특 던",
  context: "주문 시작",
};

describe("PhraseCard", () => {
  it("한국어 + 베트남어 + 발음 모두 렌더", () => {
    const html = renderToStaticMarkup(<PhraseCard phrase={PHRASE} />);
    expect(html).toContain("메뉴 주세요");
    expect(html).toContain("Cho tôi xem thực đơn");
    expect(html).toContain("쩌 또이 쌤 특 던");
  });

  it("음성 재생 버튼 + aria-label에 한국어 문장 포함", () => {
    const html = renderToStaticMarkup(<PhraseCard phrase={PHRASE} />);
    expect(html).toContain('aria-label="메뉴 주세요 베트남어 발음 재생"');
    expect(html).toContain("발음 듣기");
    expect(html).toContain("volume_up");
  });

  it("aria-pressed string ternary 박제 답습 (초기 false)", () => {
    const html = renderToStaticMarkup(<PhraseCard phrase={PHRASE} />);
    expect(html).toContain('aria-pressed="false"');
  });

  it("data-phrase-id 식별자", () => {
    const html = renderToStaticMarkup(<PhraseCard phrase={PHRASE} />);
    expect(html).toContain('data-phrase-id="rest-1"');
    expect(html).toContain('data-testid="phrase-card"');
  });

  it("context 메모 렌더 (있을 때)", () => {
    const html = renderToStaticMarkup(<PhraseCard phrase={PHRASE} />);
    expect(html).toContain("💬 주문 시작");
  });

  it("context 메모 없을 때 미렌더", () => {
    const noContext: Phrase = { ...PHRASE, context: undefined };
    const html = renderToStaticMarkup(<PhraseCard phrase={noContext} />);
    expect(html).not.toContain("💬");
  });

  it("발음 prefix '발음' 라벨 포함", () => {
    const html = renderToStaticMarkup(<PhraseCard phrase={PHRASE} />);
    expect(html).toContain("발음");
  });

  it("초기 button 활성 상태 (disabled 없음)", () => {
    const html = renderToStaticMarkup(<PhraseCard phrase={PHRASE} />);
    // SSR 시점에는 SpeechSynthesis 미지원 분기 안 탐 — 활성 상태로 렌더
    expect(html).not.toContain("disabled=");
  });
});
