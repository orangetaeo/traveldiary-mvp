/**
 * 갭 #1 — 로그인 사용자 본인 trip 첫 화면 노출 회귀 가드.
 *
 * 검증:
 *   1. ownedTrips Prisma 쿼리 (where ownerId = currentUserId, deletedAt: null)
 *   2. data-testid="home-owned-trips" 섹션 존재
 *   3. "내 여행 N개" 헤더 + /trips "전체 보기 →" 링크
 *   4. 카드 → /itinerary/{tripId} 진입
 *   5. ownedTrips.length > 0 조건부 렌더 (없으면 미노출 — BC)
 *   6. 기존 Hero 섹션 보존 (시각 BC)
 *   7. 새 섹션이 인계 배너 아래 + Hero 위에 배치 (정보 우선순위)
 *
 * source-grep으로 검증 (home-menu-link 패턴 답습).
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = readFileSync(
  resolve(process.cwd(), "app/page.tsx"),
  "utf-8",
);

describe("갭 #1 — 홈 본인 trip 섹션", () => {
  it("ownedTrips 상태 변수 + Prisma 쿼리 (ownerId, deletedAt)", () => {
    expect(SRC).toContain("let ownedTrips:");
    expect(SRC).toMatch(
      /prisma\.trip\.findMany\(\{[\s\S]{0,300}where:\s*\{\s*ownerId:\s*currentUserId,\s*deletedAt:\s*null/,
    );
  });

  it("orderBy startDate asc + take 3 (미리보기 제한)", () => {
    expect(SRC).toMatch(/orderBy:\s*\{\s*startDate:\s*"asc"\s*\}/);
    expect(SRC).toMatch(/take:\s*3/);
  });

  it("data-testid=\"home-owned-trips\" 섹션 식별자", () => {
    expect(SRC).toContain('data-testid="home-owned-trips"');
  });

  it("\"내 여행 N개\" 헤더 + /trips 전체 보기 링크", () => {
    expect(SRC).toContain("내 여행 {ownedTrips.length}개");
    expect(SRC).toMatch(
      /href="\/trips"[\s\S]{0,200}전체 보기/,
    );
  });

  it("카드 → /itinerary/{trip.id} 진입", () => {
    expect(SRC).toMatch(
      /ownedTrips\.map[\s\S]{0,500}href=\{`\/itinerary\/\$\{t\.id\}`\}/,
    );
  });

  it("ownedTrips.length > 0 조건부 렌더 (BC — 없을 때 미노출)", () => {
    expect(SRC).toContain("{ownedTrips.length > 0 && (");
  });

  it("기존 Hero 섹션 보존 (시각 BC)", () => {
    expect(SRC).toContain("AI가 24곳 검증 완료");
    expect(SRC).toContain("출발까지 D-");
  });

  it("새 섹션이 인계 배너 아래 + Hero 위 배치 (정보 우선순위)", () => {
    const claimBannerIdx = SRC.indexOf("TripClaimBanner");
    const ownedSectionIdx = SRC.indexOf("home-owned-trips");
    const heroIdx = SRC.indexOf("AI가 24곳 검증 완료");
    expect(claimBannerIdx).toBeGreaterThan(0);
    expect(ownedSectionIdx).toBeGreaterThan(claimBannerIdx);
    expect(heroIdx).toBeGreaterThan(ownedSectionIdx);
  });
});
