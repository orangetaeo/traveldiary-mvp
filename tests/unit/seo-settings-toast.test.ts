/**
 * SEO 메타데이터 (settings, permission) + CommentSection 토스트 검증.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function readSrc(relPath: string): string {
  return fs.readFileSync(path.resolve(relPath), "utf-8");
}

/* ═══════ SEO: settings layout ═══════ */
describe("settings layout 메타데이터", () => {
  it("app/settings/layout.tsx 존재", () => {
    expect(fs.existsSync(path.resolve("app/settings/layout.tsx"))).toBe(true);
  });

  it("metadata export 존재", () => {
    const src = readSrc("app/settings/layout.tsx");
    expect(src).toContain("export const metadata");
  });

  it("title 포함", () => {
    const src = readSrc("app/settings/layout.tsx");
    expect(src).toContain("title:");
    expect(src).toContain("설정");
  });
});

/* ═══════ SEO: permission layout ═══════ */
describe("permission layout 메타데이터", () => {
  it("app/permission/layout.tsx 존재", () => {
    expect(fs.existsSync(path.resolve("app/permission/layout.tsx"))).toBe(true);
  });

  it("metadata export 존재", () => {
    const src = readSrc("app/permission/layout.tsx");
    expect(src).toContain("export const metadata");
  });

  it("title 포함", () => {
    const src = readSrc("app/permission/layout.tsx");
    expect(src).toContain("title:");
    expect(src).toContain("권한");
  });
});

/* ═══════ CommentSection 토스트 피드백 ═══════ */
describe("CommentSection 토스트 피드백", () => {
  const src = readSrc("components/share/CommentSection.tsx");

  it("useToast import 존재", () => {
    expect(src).toContain("useToast");
  });

  it("Toast 컴포넌트 import 존재", () => {
    expect(src).toContain('import { Toast }');
  });

  it("Toast 컴포넌트 렌더링", () => {
    expect(src).toContain("<Toast");
  });

  it("삭제 성공 시 토스트 표시", () => {
    expect(src).toContain('showToast("댓글 삭제됨"');
  });

  it("삭제 실패 시 토스트 표시", () => {
    expect(src).toContain('showToast("삭제 실패');
  });

  it("토스트 variant 사용 — success + danger", () => {
    expect(src).toContain('variant: "success"');
    expect(src).toContain('variant: "danger"');
  });
});
