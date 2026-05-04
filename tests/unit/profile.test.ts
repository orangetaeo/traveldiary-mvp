/**
 * Profile 페이지 구조 테스트 — 사이클 BLOCKER2.
 *
 * 1. app/profile/page.tsx 파일 구조 (서버 컴포넌트 패턴 검증)
 * 2. components/profile/ProfileStats.tsx 클라이언트 컴포넌트 패턴 검증
 * 3. BottomNav profile href 변경 (/onboarding → /profile) 검증
 */

import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.resolve(__dirname, "../..");

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), "utf-8");
}

describe("Profile 페이지 — 구조 검증", () => {
  const pageSrc = readSrc("app/profile/page.tsx");

  it("서버 컴포넌트 — 'use client' 없음", () => {
    expect(pageSrc).not.toContain('"use client"');
  });

  it("async 함수 — 서버 데이터 fetch 가능", () => {
    expect(pageSrc).toMatch(/async\s+function\s+ProfilePage/);
  });

  it("getCurrentUserId import + 호출", () => {
    expect(pageSrc).toContain("getCurrentUserId");
  });

  it("LoginButton 컴포넌트 포함", () => {
    expect(pageSrc).toContain("LoginButton");
  });

  it("ProfileStats 클라이언트 컴포넌트 포함", () => {
    expect(pageSrc).toContain("<ProfileStats");
    expect(pageSrc).toContain("tripCount=");
    expect(pageSrc).toContain("isAuthenticated=");
  });

  it("BottomNav active='profile' 포함", () => {
    expect(pageSrc).toContain('<BottomNav active="profile"');
  });

  it("QuickLink 4개 (trips/shared/translate/onboarding)", () => {
    expect(pageSrc).toContain('href="/trips"');
    expect(pageSrc).toContain('href="/shared"');
    expect(pageSrc).toContain('href="/translate"');
    expect(pageSrc).toContain('href="/onboarding"');
  });
});

describe("ProfileStats — 클라이언트 컴포넌트 구조", () => {
  const statsSrc = readSrc("components/profile/ProfileStats.tsx");

  it("'use client' 선언", () => {
    expect(statsSrc).toContain('"use client"');
  });

  it("useEffect + useState 사용 (LocalStorage 접근)", () => {
    expect(statsSrc).toContain("useEffect");
    expect(statsSrc).toContain("useState");
  });

  it("listReceivedKeys import — 받은 여행 수", () => {
    expect(statsSrc).toContain("listReceivedKeys");
  });

  it("getOrCreateClientUuid import — 익명 ID", () => {
    expect(statsSrc).toContain("getOrCreateClientUuid");
    expect(statsSrc).toContain("@/lib/share/clientId");
  });

  it("getStoredNickname import — 닉네임", () => {
    expect(statsSrc).toContain("getStoredNickname");
  });

  it("server-only import 없음 (클라이언트 호환)", () => {
    expect(statsSrc).not.toContain('import "server-only"');
  });
});

describe("BottomNav — profile href 변경", () => {
  const navSrc = readSrc("components/ui/BottomNav.tsx");

  it("profile 슬롯 href = /profile (not /onboarding)", () => {
    expect(navSrc).toContain('href: "/profile"');
    expect(navSrc).not.toContain('href: "/onboarding"');
  });
});
