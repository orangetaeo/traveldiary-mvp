/**
 * 옵션 R (자율 발견 — Session AB cap 2) — recap dead 공유 버튼 활성화 회귀.
 *
 * 검증:
 *   1. PostTripRecapView가 ShareModal import + 사용
 *   2. "여행 공유하기" 버튼 onClick으로 ShareModal 열림 (dead button 제거)
 *   3. "마무리 페이지로" Link로 /wrap-up/[tripId] BC 진입 보존
 *   4. 기존 dead button 카피("카카오톡으로 공유" / "인스타 스토리로 내보내기") 제거
 *
 * source-grep으로 검증 (Session N 박제 답습).
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = readFileSync(
  resolve(process.cwd(), "components/recap/PostTripRecapView.tsx"),
  "utf-8",
);

describe("옵션 R — recap 공유 버튼 ShareModal 진입", () => {
  it("ShareModal import + 사용", () => {
    expect(SRC).toContain('import { ShareModal } from "@/components/share/ShareModal"');
    expect(SRC).toMatch(/<ShareModal[\s\S]*?tripId=\{tripId\}[\s\S]*?\/>/);
  });

  it("shareOpen state 관리 (useState)", () => {
    expect(SRC).toContain("useState");
    expect(SRC).toMatch(/setShareOpen\(true\)/);
    expect(SRC).toMatch(/setShareOpen\(false\)/);
  });

  it("primary 공유 버튼 onClick 핸들러 + aria-label", () => {
    expect(SRC).toContain('aria-label="여행 공유 — 카카오톡·인스타 스토리·URL 복사"');
    expect(SRC).toContain("여행 공유하기");
    expect(SRC).toMatch(/onClick=\{?\(?\)?\s*=>\s*setShareOpen\(true\)/);
  });

  it("secondary Link → /wrap-up/[tripId] (마무리 페이지로 BC 진입)", () => {
    expect(SRC).toContain("/wrap-up/${tripId}");
    expect(SRC).toContain("마무리 페이지로");
  });

  it("dead button 카피 제거 — 카카오톡 직접 + 인스타 스토리 직접 버튼 부재", () => {
    expect(SRC).not.toContain("카카오톡으로 공유");
    expect(SRC).not.toContain("인스타 스토리로 내보내기");
  });

  it("기존 hero/stats/highlights/moments 4 섹션 BC 보존", () => {
    expect(SRC).toContain("Hero Section");
    expect(SRC).toContain("Stats Horizontal Scroll");
    expect(SRC).toContain("Moments");
    expect(SRC).toMatch(/export function PostTripRecapView\(\{/);
  });
});

describe("옵션 R — ShareModal 인프라 답습 검증", () => {
  it("ShareModal Props 시그니처 보존 (open + tripId + onClose)", () => {
    const MODAL_SRC = readFileSync(
      resolve(process.cwd(), "components/share/ShareModal.tsx"),
      "utf-8",
    );
    expect(MODAL_SRC).toMatch(/interface ShareModalProps[\s\S]*?open:\s*boolean/);
    expect(MODAL_SRC).toMatch(/interface ShareModalProps[\s\S]*?tripId:\s*string/);
    expect(MODAL_SRC).toMatch(/interface ShareModalProps[\s\S]*?onClose:\s*\(/);
  });
});
