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
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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

/* ════════════════════════════════════════════
 * 복사 버튼 (clipboard.writeText) — 음성 미지원 환경 fallback
 * ════════════════════════════════════════════ */

describe("PhraseCard — 복사 버튼 (clipboard)", () => {
  it("복사 버튼 + aria-label에 베트남어 문장 포함", () => {
    const html = renderToStaticMarkup(<PhraseCard phrase={PHRASE} />);
    expect(html).toContain('aria-label="Cho tôi xem thực đơn 베트남어 복사"');
    expect(html).toContain("복사");
  });

  it("초기 상태 content_copy 아이콘 + '복사' 라벨", () => {
    const html = renderToStaticMarkup(<PhraseCard phrase={PHRASE} />);
    expect(html).toContain("content_copy");
  });

  it("aria-live='polite' 추가 (스크린 리더 상태 변경 안내)", () => {
    const html = renderToStaticMarkup(<PhraseCard phrase={PHRASE} />);
    expect(html).toContain('aria-live="polite"');
  });

  it("발음 듣기 버튼과 같은 컨테이너 (gap-td-xs flex)", () => {
    const html = renderToStaticMarkup(<PhraseCard phrase={PHRASE} />);
    expect(html).toContain("justify-end");
    expect(html).toContain("gap-td-xs");
  });

  it("두 버튼 모두 type='button' (form submit 차단)", () => {
    const html = renderToStaticMarkup(<PhraseCard phrase={PHRASE} />);
    const matches = html.match(/type="button"/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });
});

/* ════════════════════════════════════════════
 * 소스 단언 — 클라이언트 로직 (clipboard state machine)
 * ════════════════════════════════════════════ */

describe("PhraseCard 소스 — clipboard wiring", () => {
  const SRC = readFileSync(
    resolve(process.cwd(), "components/phrases/PhraseCard.tsx"),
    "utf-8",
  );

  it("navigator.clipboard.writeText로 베트남어 복사", () => {
    expect(SRC).toContain("navigator.clipboard");
    expect(SRC).toContain("writeText(phrase.vi)");
  });

  it("CopyState type union (idle | copied | error)", () => {
    expect(SRC).toMatch(/type CopyState\s*=\s*"idle"\s*\|\s*"copied"\s*\|\s*"error"/);
  });

  it("clipboard 미지원 환경 → error 상태로 graceful degrade", () => {
    expect(SRC).toMatch(/!navigator\.clipboard\?\.writeText/);
  });

  it("성공/실패 후 1500ms 자동 idle 복귀", () => {
    const matches = SRC.match(/setTimeout\(\(\)\s*=>\s*setCopyState\("idle"\),\s*1500\)/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it("try/catch로 clipboard write 실패 격리", () => {
    expect(SRC).toMatch(/try\s*\{[\s\S]*navigator\.clipboard[\s\S]*\}\s*catch/);
  });

  it("발음 듣기 button BC 보존 (handleSpeak + SpeechSynthesisUtterance)", () => {
    expect(SRC).toContain("handleSpeak");
    expect(SRC).toContain("SpeechSynthesisUtterance");
    expect(SRC).toContain('utterance.lang = "vi-VN"');
  });
});
