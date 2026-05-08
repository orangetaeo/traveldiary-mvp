/**
 * 홈 (/) 두 모드 분기 + 4축 매직 모먼트 캐러셀 — 재설계 회귀 가드 (2026-05-08).
 *
 * 검증:
 *   1. app/page.tsx — Welcome/Dashboard 분기 패턴 (`isDashboardMode` 변수 + 조건부 렌더)
 *   2. WelcomeHero/DashboardHero/MagicMomentsCarousel/buildMomentCards 모두 wired
 *   3. 본인 trip 조회 (ownerId: currentUserId, deletedAt: null, orderBy startDate asc, take 5)
 *   4. 데모 푸꾸옥 메인 타임라인 노출 패턴 부재 (PR #356 supersede 보장)
 *   5. 헤더(메뉴/로그인) + BottomNav + 다른 도시 + 가이드 CTA 보존
 *   6. MagicMomentsData — M1~M4 4축 모두 정의
 *   7. MagicMomentsCarousel — touch-pan-x + snap-x 답습 (PR #346/#352 회귀 가드)
 *   8. ARIA — aria-roledescription="carousel" + role="tablist" + aria-selected string 답습
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PAGE = readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf-8");
const WELCOME = readFileSync(
  resolve(process.cwd(), "components/home/WelcomeHero.tsx"),
  "utf-8",
);
const DASHBOARD = readFileSync(
  resolve(process.cwd(), "components/home/DashboardHero.tsx"),
  "utf-8",
);
const CAROUSEL = readFileSync(
  resolve(process.cwd(), "components/home/MagicMomentsCarousel.tsx"),
  "utf-8",
);
const DATA = readFileSync(
  resolve(process.cwd(), "components/home/MagicMomentsData.ts"),
  "utf-8",
);

describe("홈 두 모드 분기 — app/page.tsx", () => {
  it("ownedTrips 조회 — ownerId: currentUserId + deletedAt: null + orderBy startDate asc + take 5", () => {
    expect(PAGE).toContain("ownerId: currentUserId");
    expect(PAGE).toContain("deletedAt: null");
    expect(PAGE).toMatch(/orderBy:\s*\{\s*startDate:\s*"asc"\s*\}/);
    expect(PAGE).toMatch(/take:\s*5/);
  });

  it("isDashboardMode = ownedTrips.length > 0 분기", () => {
    expect(PAGE).toContain("ownedTrips.length > 0");
    expect(PAGE).toMatch(/isDashboardMode\s+&&\s+primaryTrip\s*\?/);
  });

  it("Mode B (Dashboard) 분기 시 — DashboardHero + OwnedTripsChips + MagicMomentsCarousel 모두 렌더", () => {
    // 분기 truthy 블록 안에 세 컴포넌트 모두 등장
    const dashboardBranch = PAGE.match(
      /isDashboardMode\s+&&\s+primaryTrip\s*\?\s*\(([\s\S]+?)\)\s*:\s*\(/,
    );
    expect(dashboardBranch).toBeTruthy();
    expect(dashboardBranch![1]).toContain("<DashboardHero");
    expect(dashboardBranch![1]).toContain("<OwnedTripsChips");
    expect(dashboardBranch![1]).toContain("<MagicMomentsCarousel");
  });

  it("Mode A (Welcome) 분기 시 — WelcomeHero + MagicMomentsCarousel 렌더", () => {
    const welcomeBranch = PAGE.match(
      /isDashboardMode\s+&&\s+primaryTrip[\s\S]+?\)\s*:\s*\(([\s\S]+?)\)\s*\}/,
    );
    expect(welcomeBranch).toBeTruthy();
    expect(welcomeBranch![1]).toContain("<WelcomeHero");
    expect(welcomeBranch![1]).toContain("<MagicMomentsCarousel");
  });

  it("PR #356 supersede — 데모 푸꾸옥 Hero 타임라인 메인 노출 부재", () => {
    // 데모 trip의 day1Items.map 메인 타임라인 부재 (Mode A에서도 데모 둘러보기는 보조 CTA)
    expect(PAGE).not.toContain("day1Items.map");
    expect(PAGE).not.toContain("phuQuocItinerary");
    // featuredId/evidenceCardId 더 이상 page.tsx에 없음
    expect(PAGE).not.toContain('featuredId = "pq-item-1"');
    expect(PAGE).not.toContain("evidenceCardId");
  });

  it("기존 보존 — 헤더 메뉴/로그인 + BottomNav + SpeedDialFab + 다른 도시 + 가이드 CTA", () => {
    expect(PAGE).toContain('aria-label="메뉴 — 설정"');
    expect(PAGE).toContain("<LoginButton");
    expect(PAGE).toContain('<BottomNav active="home" />');
    expect(PAGE).toContain("<SpeedDialFab");
    expect(PAGE).toContain("다른 도시 둘러보기");
    expect(PAGE).toContain('href="/guide"');
    expect(PAGE).toContain("베트남 여행 가이드");
  });

  it("claimableTrips 인계 배너 보존 (system-owner-pqc + TripClaimBanner)", () => {
    expect(PAGE).toContain('"system-owner-pqc"');
    expect(PAGE).toContain("<TripClaimBanner");
  });

  it("WelcomeHero/DashboardHero/MagicMomentsCarousel/buildMomentCards import", () => {
    expect(PAGE).toContain("@/components/home/WelcomeHero");
    expect(PAGE).toContain("@/components/home/DashboardHero");
    expect(PAGE).toContain("@/components/home/MagicMomentsCarousel");
    expect(PAGE).toContain("@/components/home/MagicMomentsData");
  });
});

describe("WelcomeHero — 비로그인/0건 사용자 가치 제안", () => {
  it("베트남 일몰 그라디언트 (purple-deep → accent → amber)", () => {
    expect(WELCOME).toContain("from-purple-deep");
    expect(WELCOME).toContain("via-accent");
    expect(WELCOME).toContain("to-amber");
  });

  it("primary CTA 분기 (cap 3) — isLoggedIn 변수로 LoginButton vs 새 여행 만들기 분기", () => {
    expect(WELCOME).toContain("const isLoggedIn = currentUserId !== null");
    // 비로그인 분기: LoginButton 노출 (BC)
    expect(WELCOME).toContain("<LoginButton");
    // 로그인 분기: /onboarding "새 여행 만들기" 강조 CTA
    expect(WELCOME).toContain('href="/onboarding"');
    expect(WELCOME).toContain("새 여행 만들기");
    expect(WELCOME).toContain('aria-label="새 여행 만들기 — 온보딩"');
    expect(WELCOME).toContain("add_circle");
  });

  it("로그인 사용자 인사말 분기 (currentUserName 부착)", () => {
    expect(WELCOME).toContain("isLoggedIn && currentUserName");
    expect(WELCOME).toContain("베트남 첫 여행을 시작해요");
  });

  it("secondary 데모 둘러보기 CTA — 두 분기 모두 노출 (DEMO_TRIP_ID)", () => {
    expect(WELCOME).toMatch(/href=\{`\/itinerary\/\$\{DEMO_TRIP_ID\}`\}/);
    expect(WELCOME).toContain("데모로 둘러보기");
    expect(WELCOME).toContain("play_circle");
  });

  it("핵심 가치 카피 (살아 움직이게 + 함께 만들어요)", () => {
    expect(WELCOME).toContain("살아 움직이게");
    expect(WELCOME).toContain("함께 만들어요");
  });
});

describe("DashboardHero — 로그인 + trip 사용자 D-Day 카운트다운", () => {
  it("OwnedTripSummary 인터페이스 — id/destination/destinationCode/nights/startDate/itemCount/currentMode", () => {
    expect(DASHBOARD).toContain("export interface OwnedTripSummary");
    expect(DASHBOARD).toMatch(/id:\s*string/);
    expect(DASHBOARD).toMatch(/destination:\s*string/);
    expect(DASHBOARD).toMatch(/nights:\s*number/);
    expect(DASHBOARD).toMatch(/startDate:\s*string/);
    expect(DASHBOARD).toMatch(/itemCount:\s*number/);
    expect(DASHBOARD).toMatch(/currentMode:\s*string\s*\|\s*null/);
  });

  it("D-Day 분기 라벨 (D-N / 출발 당일 / D+N)", () => {
    expect(DASHBOARD).toContain("D-${dDayNum}");
    expect(DASHBOARD).toContain("출발 당일");
    expect(DASHBOARD).toContain("D+${-dDayNum}");
  });

  it("isInTravel 분기 — primaryHref가 /travel/[id] 또는 /itinerary/[id]", () => {
    expect(DASHBOARD).toContain('trip.currentMode === "in-travel"');
    expect(DASHBOARD).toMatch(/`\/travel\/\$\{trip\.id\}`/);
    expect(DASHBOARD).toMatch(/`\/itinerary\/\$\{trip\.id\}`/);
  });

  it("대시보드 보조 진입 (/trips/{tripId}) + dashboard 아이콘", () => {
    expect(DASHBOARD).toMatch(/href=\{`\/trips\/\$\{trip\.id\}`\}/);
    expect(DASHBOARD).toContain("dashboard");
  });

  it("OwnedTripsChips — 다중 trip 시만 노출 (length <= 1 → null)", () => {
    expect(DASHBOARD).toContain("trips.length <= 1");
    expect(DASHBOARD).toContain("return null");
    // touch-pan-x 답습 (PR #346/#352 회귀 가드)
    expect(DASHBOARD).toContain("touch-pan-x");
    expect(DASHBOARD).toContain("overscroll-x-contain");
  });

  it("Badge 톤 union — info | amber | success (warning 부재)", () => {
    expect(DASHBOARD).toMatch(/"info"\s*\|\s*"amber"\s*\|\s*"success"/);
    expect(DASHBOARD).not.toContain('"warning"');
  });
});

describe("MagicMomentsCarousel — 4축 가로 캐러셀 (ORANGE TOUR 패턴)", () => {
  it('"use client" + IntersectionObserver dot 추적', () => {
    expect(CAROUSEL).toMatch(/^["']use client["']/);
    expect(CAROUSEL).toContain("IntersectionObserver");
    expect(CAROUSEL).toContain("setActiveIndex");
  });

  it("snap-x snap-mandatory + touch-pan-x + overscroll-x-contain 답습", () => {
    expect(CAROUSEL).toContain("snap-x");
    expect(CAROUSEL).toContain("snap-mandatory");
    expect(CAROUSEL).toContain("touch-pan-x");
    expect(CAROUSEL).toContain("overscroll-x-contain");
    expect(CAROUSEL).toContain("snap-start");
  });

  it("카드 너비 80% — 다음 카드 peek", () => {
    expect(CAROUSEL).toContain("w-[80%]");
  });

  it("ARIA — aria-roledescription=carousel + slide + tablist + aria-selected string", () => {
    expect(CAROUSEL).toContain('aria-roledescription="carousel"');
    expect(CAROUSEL).toContain('aria-roledescription="slide"');
    expect(CAROUSEL).toContain('role="tablist"');
    expect(CAROUSEL).toContain('role="tab"');
    // aria-selected 는 string ternary 답습 (boolean 직접 사용 금지 — 박제)
    expect(CAROUSEL).toMatch(/aria-selected=\{isActive\s*\?\s*"true"\s*:\s*"false"\}/);
  });

  it("dot pagination — 활성 시 width 확장 (w-6) / 비활성 (w-1.5)", () => {
    expect(CAROUSEL).toContain("bg-purple w-6");
    expect(CAROUSEL).toContain("bg-divider w-1.5");
  });

  it("scrollToIndex 클릭 핸들러 — scrollIntoView smooth + inline start", () => {
    expect(CAROUSEL).toContain("scrollIntoView");
    expect(CAROUSEL).toContain('behavior: "smooth"');
    expect(CAROUSEL).toContain('inline: "start"');
  });
});

describe("MagicMomentsData — M1~M4 4축 정의", () => {
  it("4 카드 — id m1/m2/m3/m4 모두 정의", () => {
    expect(DATA).toContain('id: "m1"');
    expect(DATA).toContain('id: "m2"');
    expect(DATA).toContain('id: "m3"');
    expect(DATA).toContain('id: "m4"');
  });

  it("M1 추천 근거 — purple 그라디언트 + 데모 일정 진입", () => {
    expect(DATA).toMatch(/M1\s*—\s*추천 근거/);
    expect(DATA).toMatch(/from-purple\s+to-purple-deep/);
  });

  it("M2 D-Day 모드 전환 — accent 코랄 + /travel 진입", () => {
    expect(DATA).toMatch(/M2\s*—\s*D-Day 모드 전환/);
    expect(DATA).toContain("from-accent to-accent-deep");
    // context-aware (2026-05-08): targetTripId 사용 — DEMO_TRIP_ID는 fallback
    expect(DATA).toMatch(/href:\s*`\/travel\/\$\{targetTripId\}`/);
  });

  it("M3 Live Replan — purple-deep 그라디언트", () => {
    expect(DATA).toMatch(/M3\s*—\s*Live Replan/);
    expect(DATA).toContain("from-purple-deep to-purple");
  });

  it("M4 카메라 번역 — amber 그라디언트 + /translate 진입", () => {
    expect(DATA).toMatch(/M4\s*—\s*카메라 번역/);
    expect(DATA).toContain("from-amber to-amber-deep");
    // context-aware: own trip 시 ?trip= 쿼리 파라미터 부착, 데모 시 /translate 단순
    expect(DATA).toMatch(/href:\s*isOwnTrip\s*\?\s*`\/translate\?trip=\$\{targetTripId\}`\s*:\s*"\/translate"/);
  });

  it("buildMomentCards 함수 export + MomentCard 타입", () => {
    expect(DATA).toContain("export function buildMomentCards");
    expect(DATA).toContain("MomentCard");
  });
});

// ═════════════════════════════════════════════════════════════
// Context-aware 동작 검증 (2026-05-08) — buildMomentCards 직접 호출
// ═════════════════════════════════════════════════════════════

import { buildMomentCards } from "@/components/home/MagicMomentsData";
import { DEMO_TRIP_ID } from "@/lib/seed";

describe("buildMomentCards — context-aware 동작", () => {
  describe("Mode A (tripId 미지정) — 데모 trip으로 진입", () => {
    const cards = buildMomentCards();

    it("M1 추천 근거 — /itinerary/{DEMO_TRIP_ID}", () => {
      expect(cards[0].href).toBe(`/itinerary/${DEMO_TRIP_ID}`);
      expect(cards[0].hrefLabel).toBe("데모 일정 보기");
    });

    it("M2 D-Day 모드 — /travel/{DEMO_TRIP_ID}", () => {
      expect(cards[1].href).toBe(`/travel/${DEMO_TRIP_ID}`);
      expect(cards[1].hrefLabel).toBe("여행 중 모드 보기");
    });

    it("M3 Live Replan — /itinerary/{DEMO_TRIP_ID}", () => {
      expect(cards[2].href).toBe(`/itinerary/${DEMO_TRIP_ID}`);
      expect(cards[2].hrefLabel).toBe("재계획 시연 보기");
    });

    it("M4 카메라 번역 — /translate (쿼리 없음)", () => {
      expect(cards[3].href).toBe("/translate");
      expect(cards[3].hrefLabel).toBe("카메라 번역 열기");
    });
  });

  describe("Mode B (tripId 지정) — 본인 trip으로 진입", () => {
    const ownTripId = "trip-clxyz1234abcdef";
    const cards = buildMomentCards({ tripId: ownTripId });

    it("M1 추천 근거 — /itinerary/{ownTripId} + 본인 라벨", () => {
      expect(cards[0].href).toBe(`/itinerary/${ownTripId}`);
      expect(cards[0].hrefLabel).toBe("내 일정 추천 근거 보기");
    });

    it("M2 D-Day 모드 — /travel/{ownTripId} + 본인 라벨", () => {
      expect(cards[1].href).toBe(`/travel/${ownTripId}`);
      expect(cards[1].hrefLabel).toBe("내 여행 중 홈 열기");
    });

    it("M3 Live Replan — /itinerary/{ownTripId} + 본인 라벨", () => {
      expect(cards[2].href).toBe(`/itinerary/${ownTripId}`);
      expect(cards[2].hrefLabel).toBe("내 일정에서 재계획");
    });

    it("M4 카메라 번역 — /translate?trip={ownTripId} 쿼리 부착", () => {
      expect(cards[3].href).toBe(`/translate?trip=${ownTripId}`);
      // M4 라벨은 두 모드 동일 (카메라 번역 자체가 trip 무관)
      expect(cards[3].hrefLabel).toBe("카메라 번역 열기");
    });
  });

  describe("불변성 — 카드 4개 순서 + id 보존", () => {
    const cardsA = buildMomentCards();
    const cardsB = buildMomentCards({ tripId: "any" });

    it("Mode A/B 모두 카드 4개 + id 순서 m1→m2→m3→m4 동일", () => {
      expect(cardsA.map((c) => c.id)).toEqual(["m1", "m2", "m3", "m4"]);
      expect(cardsB.map((c) => c.id)).toEqual(["m1", "m2", "m3", "m4"]);
    });

    it("Mode A/B 모두 4 카드 — 그라디언트/아이콘/배지 동일", () => {
      for (let i = 0; i < 4; i++) {
        expect(cardsA[i].gradient).toBe(cardsB[i].gradient);
        expect(cardsA[i].icon).toBe(cardsB[i].icon);
        expect(cardsA[i].badge).toBe(cardsB[i].badge);
        expect(cardsA[i].title).toBe(cardsB[i].title);
        expect(cardsA[i].description).toBe(cardsB[i].description);
      }
    });
  });
});

describe("app/page.tsx — context-aware momentCards 전달", () => {
  it("Mode B 분기 시 buildMomentCards에 primaryTrip.id 전달", () => {
    expect(PAGE).toMatch(
      /buildMomentCards\s*\(\s*\n?\s*isDashboardMode\s+&&\s+primaryTrip\s*\?\s*\{\s*tripId:\s*primaryTrip\.id\s*\}\s*:\s*\{\}\s*,?\s*\n?\s*\)/,
    );
  });
});
