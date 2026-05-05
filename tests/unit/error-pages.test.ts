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

  describe("라우트별 error.tsx — 15개 에러 바운더리", () => {
    const errorRoutes: { name: string; file: string; backHref: string }[] = [
      { name: "관리자", file: "app/admin/error.tsx", backHref: "/admin" },
      { name: "체크리스트", file: "app/checklist/[tripId]/error.tsx", backHref: "/trips" },
      { name: "도시", file: "app/city/error.tsx", backHref: "/" },
      { name: "비용", file: "app/cost/[tripId]/error.tsx", backHref: "/trips" },
      { name: "가이드", file: "app/guide/error.tsx", backHref: "/" },
      { name: "초대", file: "app/invite/[code]/error.tsx", backHref: "/" },
      { name: "일정", file: "app/itinerary/error.tsx", backHref: "/trips" },
      { name: "온보딩", file: "app/onboarding/error.tsx", backHref: "/" },
      { name: "프로필", file: "app/profile/error.tsx", backHref: "/" },
      { name: "공유 일정", file: "app/share/[key]/error.tsx", backHref: "/" },
      { name: "받은 일정", file: "app/shared/error.tsx", backHref: "/" },
      { name: "번역", file: "app/translate/error.tsx", backHref: "/" },
      { name: "여행 상세", file: "app/travel/[id]/error.tsx", backHref: "/trips" },
      { name: "여행 목록", file: "app/trips/error.tsx", backHref: "/" },
      { name: "투표", file: "app/vote/[tripId]/error.tsx", backHref: "/trips" },
    ];

    errorRoutes.forEach(({ name, file, backHref }) => {
      describe(name, () => {
        const src = fs.readFileSync(path.resolve(file), "utf-8");

        it("use client 디렉티브", () => {
          expect(src).toContain('"use client"');
        });

        it("reset 콜백 사용", () => {
          expect(src).toContain("reset");
        });

        it("한국어 안내 메시지", () => {
          expect(src).toMatch(/오류|불러올 수 없/);
        });

        it(`복귀 링크 ${backHref}`, () => {
          expect(src).toContain(`href="${backHref}"`);
        });
      });
    });
  });
});
