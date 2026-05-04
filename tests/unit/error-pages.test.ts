/**
 * 404 / error / loading 페이지 존재 + 구조 검증.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

describe("에러 페이지 — 404 / error / loading", () => {
  describe("not-found.tsx", () => {
    const src = fs.readFileSync(
      path.resolve("app/not-found.tsx"),
      "utf-8",
    );

    it("파일 존재", () => {
      expect(src.length).toBeGreaterThan(0);
    });

    it("홈 링크 존재", () => {
      expect(src).toContain('href="/"');
    });

    it("한국어 안내 메시지", () => {
      expect(src).toMatch(/찾을 수 없/);
    });

    it("여행 목록 링크", () => {
      expect(src).toContain('href="/trips"');
    });
  });

  describe("error.tsx", () => {
    const src = fs.readFileSync(
      path.resolve("app/error.tsx"),
      "utf-8",
    );

    it("use client 디렉티브", () => {
      expect(src).toContain('"use client"');
    });

    it("reset 콜백 사용", () => {
      expect(src).toContain("reset");
    });

    it("홈 링크 존재", () => {
      expect(src).toContain('href="/"');
    });

    it("한국어 안내 메시지", () => {
      expect(src).toMatch(/문제가 발생/);
    });
  });

  describe("loading.tsx", () => {
    const src = fs.readFileSync(
      path.resolve("app/loading.tsx"),
      "utf-8",
    );

    it("파일 존재", () => {
      expect(src.length).toBeGreaterThan(0);
    });

    it("animate-pulse 스켈레톤", () => {
      expect(src).toContain("animate-pulse");
    });
  });

  describe("guide 페이지 BottomNav", () => {
    const src = fs.readFileSync(
      path.resolve("app/guide/page.tsx"),
      "utf-8",
    );

    it("BottomNav import 존재", () => {
      expect(src).toContain("BottomNav");
    });

    it("active='trips' 설정", () => {
      expect(src).toContain('active="trips"');
    });
  });
});
