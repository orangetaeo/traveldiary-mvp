/**
 * 자율 진행 (2026-05-08) — ShareModal handleCopy 클립보드 하드닝.
 *
 * PR #384 PhraseCard CopyState 패턴 답습 — `navigator.clipboard?.writeText`
 * undefined 가드 + try/catch 격리 + 자동 idle 복귀 + button 수준 error 시각 피드백.
 *
 * 기존 `setError(...)` 배너에 의존하던 fallback을 button 자체 상태로 일관화.
 *
 * source-grep으로 검증.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = readFileSync(
  resolve(process.cwd(), "components/share/ShareModal.tsx"),
  "utf-8",
);

describe("ShareModal — clipboard 하드닝 (CopyState 상태 머신)", () => {
  it("CopyState type union (idle | copied | error)", () => {
    expect(SRC).toMatch(/type CopyState\s*=\s*"idle"\s*\|\s*"copied"\s*\|\s*"error"/);
  });

  it("copyState useState<CopyState> 초기값 'idle'", () => {
    expect(SRC).toMatch(/useState<CopyState>\("idle"\)/);
  });

  it("clipboard 미지원 환경 → error 상태로 graceful degrade", () => {
    expect(SRC).toMatch(/!navigator\.clipboard\?\.writeText/);
  });

  it("typeof window 가드 (SSR 안전)", () => {
    expect(SRC).toMatch(/typeof window === "undefined" \|\| !navigator\.clipboard/);
  });

  it("handleCopy async/await + try/catch 패턴", () => {
    expect(SRC).toMatch(/async function handleCopy/);
    expect(SRC).toMatch(/try\s*\{[\s\S]*await navigator\.clipboard\.writeText\(shareUrl\)[\s\S]*\}\s*catch/);
  });

  it("성공/실패 모두 2500ms 자동 idle 복귀 (3 setTimeout)", () => {
    const matches = SRC.match(/setTimeout\(\(\)\s*=>\s*setCopyState\("idle"\),\s*2500\)/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(3); // unsupported / success / catch
  });
});

describe("ShareModal — copy button 시각 피드백 (idle/copied/error 분기)", () => {
  it("button '✅ 복사됨' 라벨 (성공)", () => {
    expect(SRC).toContain('"✅ 복사됨"');
  });

  it("button '❌ 복사 실패 — 다시 시도' 라벨 (실패)", () => {
    expect(SRC).toContain("❌ 복사 실패 — 다시 시도");
  });

  it("button 'URL 복사' 라벨 (idle)", () => {
    expect(SRC).toContain('"URL 복사"');
  });

  it("error 분기 bg-danger 톤 명시", () => {
    expect(SRC).toMatch(/copyState\s*===\s*"error"[\s\S]{0,80}bg-danger/);
  });

  it("aria-live='polite' 추가 (스크린 리더 상태 변경 안내)", () => {
    expect(SRC).toContain('aria-live="polite"');
  });
});

describe("ShareModal — 기존 기능 BC 100% 보존", () => {
  it("regenerate에서 setCopyState('idle')로 갱신 (이전 setCopied(false) 대체)", () => {
    // regenerate 함수에서 idle 복귀
    const regenIdx = SRC.indexOf("function regenerate");
    const block = SRC.slice(regenIdx, regenIdx + 400);
    expect(block).toContain('setCopyState("idle")');
  });

  it("useEffect open 초기화에서 setCopyState('idle')", () => {
    const effectIdx = SRC.indexOf("useEffect(");
    const block = SRC.slice(effectIdx, effectIdx + 400);
    expect(block).toContain('setCopyState("idle")');
  });

  it("setCopied 변수/setter 완전 제거 (CopyState 단일화)", () => {
    expect(SRC).not.toContain("setCopied(");
    expect(SRC).not.toMatch(/\[copied,\s*setCopied\]/);
  });

  it("handleStoryDownload 인스타 스토리 BC 보존", () => {
    expect(SRC).toContain("handleStoryDownload");
    expect(SRC).toContain("traveldiary-story.png");
  });

  it("permission 토글 (view/edit) BC 보존", () => {
    expect(SRC).toContain('permission === "view"');
    expect(SRC).toContain('permission === "edit"');
  });

  it("createShareLinkAction import + 호출 BC 보존", () => {
    expect(SRC).toContain('from "@/actions/share"');
    expect(SRC).toContain("createShareLinkAction");
  });

  it("KakaoShareButton import BC 보존", () => {
    expect(SRC).toContain("KakaoShareButton");
  });

  it("error 배너 (링크 생성 실패) BC 보존 — copyState와 별개 유지", () => {
    expect(SRC).toContain('setError(`링크 생성 실패:');
    expect(SRC).toContain("bg-danger-soft");
  });
});
