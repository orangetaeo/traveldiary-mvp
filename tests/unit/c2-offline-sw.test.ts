/**
 * C2 — 오프라인 페이지 + SW 캐시 전략 검증.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

describe("C2 — 서비스 워커 캐시 전략", () => {
  const src = fs.readFileSync(path.resolve("public/sw.js"), "utf-8");

  it("CACHE_NAME v3", () => {
    expect(src).toContain("traveldiary-v3");
  });

  it("offline.html pre-cache", () => {
    expect(src).toContain("/offline.html");
    expect(src).toContain("PRECACHE_URLS");
  });

  it("install 이벤트 — cache.addAll", () => {
    expect(src).toContain("install");
    expect(src).toContain("cache.addAll");
  });

  it("activate 이벤트 — 이전 캐시 삭제", () => {
    expect(src).toContain("activate");
    expect(src).toContain("caches.delete");
  });

  it("navigation 요청 — network-first + offline fallback", () => {
    expect(src).toContain("navigate");
    expect(src).toContain("caches.match(OFFLINE_URL)");
  });

  it("아이콘 pre-cache", () => {
    expect(src).toContain("/icon-192.png");
    expect(src).toContain("/icon-512.png");
  });
});

describe("C2 — offline.html", () => {
  const src = fs.readFileSync(path.resolve("public/offline.html"), "utf-8");

  it("한국어 오프라인 안내 메시지", () => {
    expect(src).toContain("인터넷 연결이 필요해요");
  });

  it("다시 시도 버튼", () => {
    expect(src).toContain("다시 시도");
    expect(src).toContain("location.reload()");
  });

  it("여행 팁 (SIM 카드)", () => {
    expect(src).toContain("SIM 카드");
  });

  it("Pretendard 폰트 참조", () => {
    expect(src).toContain("Pretendard");
  });
});
