/**
 * C2 — PWA manifest + OG 메타태그 구조 검증.
 *
 * 시나리오 C Phase C2: 베타 사용자 유입 인프라.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

describe("C2 — PWA manifest", () => {
  it("app/manifest.ts 존재", () => {
    expect(fs.existsSync(path.resolve("app/manifest.ts"))).toBe(true);
  });

  it("manifest에 name + short_name + start_url + display", async () => {
    const mod = await import("../../app/manifest");
    const m = mod.default();
    expect(m.name).toContain("TRAVELDIARY");
    expect(m.short_name).toBe("TravelDiary");
    expect(m.start_url).toBe("/");
    expect(m.display).toBe("standalone");
  });

  it("manifest icons 192 + 512", async () => {
    const mod = await import("../../app/manifest");
    const m = mod.default();
    const sizes = (m.icons as Array<{ sizes: string }>).map((i) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
  });

  it("public/icon-192.png 존재", () => {
    expect(fs.existsSync(path.resolve("public/icon-192.png"))).toBe(true);
  });

  it("public/icon-512.png 존재", () => {
    expect(fs.existsSync(path.resolve("public/icon-512.png"))).toBe(true);
  });

  it("public/sw.js 서비스 워커 존재", () => {
    const sw = fs.readFileSync(path.resolve("public/sw.js"), "utf-8");
    expect(sw).toContain("install");
    expect(sw).toContain("activate");
    expect(sw).toContain("fetch");
  });
});

describe("C2 — OG 메타태그 (layout.tsx)", () => {
  const src = fs.readFileSync(path.resolve("app/layout.tsx"), "utf-8");

  it("openGraph 설정 존재", () => {
    expect(src).toContain("openGraph");
  });

  it("twitter card 설정 존재", () => {
    expect(src).toContain("twitter");
  });

  it("metadataBase 설정", () => {
    expect(src).toContain("metadataBase");
  });

  it("title template 패턴", () => {
    expect(src).toContain("template");
    expect(src).toContain("TRAVELDIARY");
  });

  it("appleWebApp 설정", () => {
    expect(src).toContain("appleWebApp");
  });

  it("서비스 워커 등록 스크립���", () => {
    expect(src).toContain("serviceWorker");
    expect(src).toContain("/sw.js");
  });

  it("locale ko_KR", () => {
    expect(src).toContain("ko_KR");
  });
});
