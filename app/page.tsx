/**
 * Home — 두 모드 분기 (2026-05-08).
 *
 * Mode A (Welcome): 비로그인 OR 본인 trip 0건
 *   - WelcomeHero (베트남 일몰 그라디언트 + 로그인 CTA + 데모 진입)
 *   - MagicMomentsCarousel (M1~M4 4축 캐러셀, ORANGE TOUR 패턴 차용)
 *   - 다른 도시 둘러보기 (베트남 6개 시드 카드)
 *   - 여행 가이드 CTA
 *
 * Mode B (Dashboard): 로그인 + 본인 trip ≥1
 *   - DashboardHero (가장 가까운 trip + D-Day 카운트다운 + 일정/대시보드 진입)
 *   - OwnedTripsChips (다중 trip 시 칩 selector)
 *   - MagicMomentsCarousel (재방문자에게도 4축 환기)
 *   - 다른 도시 둘러보기 (보조)
 *
 * PR #356(additive)을 supersede — 데모 푸꾸옥 타임라인 메인 노출 패턴 폐기.
 * 데모 진입은 WelcomeHero의 보조 CTA + 다른 도시 카드로 분산.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { listDemoTrips, DEMO_TRIP_ID } from "@/lib/seed";
import { getCityByCode, isVietnamCity } from "@/lib/seed/cities";
import { BottomNav } from "@/components/ui/BottomNav";
import { SpeedDialFab } from "@/components/ui/SpeedDialFab";
import { LoginButton } from "@/components/auth/LoginButton";
import { getCurrentUserId } from "@/lib/auth/session";
import { kakaoAvailable } from "@/lib/auth/kakao";
import { jwtAvailable } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";
import { OrganizationJsonLd, WebAppJsonLd } from "@/components/seo/JsonLd";
import { TripClaimBanner } from "@/components/auth/TripClaimBanner";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import type { ClaimableTrip } from "@/components/auth/TripClaimModal";
import { WelcomeHero } from "@/components/home/WelcomeHero";
import { MagicMomentsCarousel } from "@/components/home/MagicMomentsCarousel";
import { buildMomentCards } from "@/components/home/MagicMomentsData";
import {
  DashboardHero,
  OwnedTripsChips,
  type OwnedTripSummary,
} from "@/components/home/DashboardHero";
import { sortTripsByPriority } from "@/lib/utils/trip-priority";
import { todayISO } from "@/lib/seed/demo-date";

export const metadata: Metadata = {
  title: "TRAVELDIARY — 베트남 자유여행 AI 동반자",
  description: "AI가 추천한 일정에 근거까지. 여행 중에는 살아 움직여요.",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: { auth_error?: string };
}) {
  const oauthAvailable = kakaoAvailable() && jwtAvailable();
  const currentUserId = oauthAvailable ? await getCurrentUserId() : null;
  const currentUser =
    currentUserId && prisma
      ? await prisma.user.findUnique({
          where: { id: currentUserId },
          select: { id: true, name: true },
        })
      : null;

  let ownedTrips: OwnedTripSummary[] = [];
  let claimableTrips: ClaimableTrip[] = [];
  if (currentUserId && prisma) {
    try {
      const owned = await prisma.trip.findMany({
        where: { ownerId: currentUserId, deletedAt: null },
        include: { _count: { select: { items: true } } },
        orderBy: { startDate: "asc" },
        take: 5,
      });
      ownedTrips = owned.map((t) => ({
        id: t.id,
        destination: t.destination,
        destinationCode: t.destinationCode,
        nights: t.nights,
        startDate: t.startDate.toISOString().slice(0, 10),
        itemCount: t._count.items,
        currentMode: t.currentMode,
      }));
    } catch {
      // DB 오류 시 빈 배열 — Welcome 모드로 fallback
    }

    try {
      const systemTrips = await prisma.trip.findMany({
        where: { ownerId: "system-owner-pqc", deletedAt: null },
        include: { _count: { select: { items: true } } },
        take: 10,
      });
      claimableTrips = systemTrips.map((t) => ({
        id: t.id,
        destination: t.destination,
        nights: t.nights,
        startDate: t.startDate.toISOString().slice(0, 10),
        itemCount: t._count.items,
        companions: 1,
      }));
    } catch {
      // DB 오류 시 무시 — 인계 배너 미표시
    }
  }

  const isDashboardMode = ownedTrips.length > 0;
  // cap 6: in-travel > 다가오는 가까운 > 과거 가까운 우선순위로 정렬.
  // Prisma orderBy startDate asc는 안정 입력 보장, 메모리에서 priority 재정렬.
  const sortedOwnedTrips = sortTripsByPriority(ownedTrips, todayISO());
  const primaryTrip = sortedOwnedTrips[0];
  // Mode B: 본인 trip 컨텍스트로 카드 wiring (즉시 가치)
  // Mode A: 데모 trip으로 wiring (체험 유도)
  const momentCards = buildMomentCards(
    isDashboardMode && primaryTrip ? { tripId: primaryTrip.id } : {},
  );
  // cap 5: SpeedDialFab 진입점도 동일 컨텍스트 인식 (변수 추출로 JSX 가독성 + 회귀 테스트 슬라이스 윈도우 유지)
  const fabTripId =
    isDashboardMode && primaryTrip ? primaryTrip.id : DEMO_TRIP_ID;
  const fabDiscoverHref = `/itinerary/${fabTripId}/discover?day=0`;
  const fabTranslateHref =
    isDashboardMode && primaryTrip
      ? `/translate?trip=${primaryTrip.id}`
      : "/translate";

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      <OrganizationJsonLd
        name="TRAVELDIARY"
        url="https://traveldiary-mvp-production.up.railway.app"
        description="베트남 자유여행자를 위한 AI 여행 동반자"
        logo="https://traveldiary-mvp-production.up.railway.app/icon-512.png"
      />
      <WebAppJsonLd
        name="TRAVELDIARY"
        url="https://traveldiary-mvp-production.up.railway.app"
        description="AI가 추천한 일정에 근거까지. 베트남 6개 도시 완전 지원."
        applicationCategory="TravelApplication"
        operatingSystem="Web"
      />

      <header className="bg-surface-card/90 backdrop-blur-md border-b border-divider sticky top-0 z-40 flex justify-between items-center w-full px-td-md h-16">
        <div className="flex items-center gap-td-sm">
          <Link
            href="/settings"
            className="hover:bg-surface-soft transition-colors p-2 rounded-full"
            aria-label="메뉴 — 설정"
          >
            <span className="material-symbols-outlined text-ink">menu</span>
          </Link>
          <h1 className="text-lg font-bold text-ink tracking-tight">TravelDiary</h1>
        </div>
        <LoginButton
          currentUserId={currentUserId}
          currentUserName={currentUser?.name}
          oauthAvailable={oauthAvailable}
        />
      </header>

      <main>
        {searchParams.auth_error && (
          <div className="px-td-md pt-td-md">
            <AuthErrorBanner errorCode={searchParams.auth_error} />
          </div>
        )}

        {claimableTrips.length > 0 && currentUser && (
          <div className="px-td-md pt-td-md">
            <TripClaimBanner
              trips={claimableTrips}
              userName={currentUser.name ?? "여행자"}
            />
          </div>
        )}

        {isDashboardMode && primaryTrip ? (
          <>
            <DashboardHero
              trip={primaryTrip}
              totalTrips={sortedOwnedTrips.length}
              userName={currentUser?.name}
            />
            <OwnedTripsChips trips={sortedOwnedTrips} activeId={primaryTrip.id} />
            <MagicMomentsCarousel cards={momentCards} />
          </>
        ) : (
          <>
            <WelcomeHero
              oauthAvailable={oauthAvailable}
              currentUserId={currentUserId}
              currentUserName={currentUser?.name}
            />
            <MagicMomentsCarousel cards={momentCards} />
          </>
        )}

        <section className="px-td-md pt-td-md pb-td-md">
          <div className="flex items-baseline justify-between mb-td-sm">
            <h2 className="text-td-card-title text-ink">다른 도시 둘러보기</h2>
            <Link
              href="/trips"
              className="text-td-caption text-purple-deep hover:underline"
            >
              전체 보기 →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-td-sm">
            {listDemoTrips()
              .filter((b) => b.trip.id !== DEMO_TRIP_ID)
              .filter((b) => isVietnamCity(getCityByCode(b.trip.destinationCode)))
              .map((b) => (
                <Link
                  key={b.trip.id}
                  href={`/itinerary/${b.trip.id}`}
                  className="block p-td-sm bg-surface-card border border-divider rounded-md hover:border-purple/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-td-meta text-ink-soft uppercase tabular-nums">
                      {b.trip.destinationCode}
                    </p>
                    <span className="text-td-micro px-1.5 py-0.5 rounded-full font-bold bg-amber-soft text-amber-deep">
                      체험
                    </span>
                  </div>
                  <p className="text-td-card-title text-ink mt-td-xxs">
                    {b.trip.destination}
                  </p>
                  <p className="text-td-caption text-ink-mute mt-td-xxs">
                    {b.trip.nights}박 {b.trip.nights + 1}일 · {b.items.length} 일정
                  </p>
                </Link>
              ))}
          </div>
        </section>

        <section className="px-td-md pb-td-lg">
          <Link
            href="/guide"
            className="block bg-gradient-to-r from-purple/10 to-accent/10 border border-purple/20 rounded-md p-td-md hover:border-purple/40 transition-colors"
          >
            <div className="flex items-center gap-td-sm">
              <span className="material-symbols-outlined text-purple text-2xl">
                menu_book
              </span>
              <div>
                <p className="text-td-card-title text-ink font-medium">
                  베트남 여행 가이드
                </p>
                <p className="text-td-caption text-ink-soft">
                  도시별 시그니처 코스 · 맛집 · 일출 명소
                </p>
              </div>
              <span className="material-symbols-outlined text-ink-mute ml-auto">
                chevron_right
              </span>
            </div>
          </Link>
        </section>
      </main>

      {/* SpeedDialFab — Mode B 시 본인 trip 컨텍스트로 wiring (cap 5).
          cap 2 buildMomentCards context-aware 답습. */}
      <SpeedDialFab bottomClassName="bottom-24" zIndex="z-40">
        <Link
          href={fabDiscoverHref}
          data-speed-dial-action="true"
          className="w-12 h-12 bg-surface-card text-ink border border-divider rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          aria-label="주변 검색"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            search
          </span>
        </Link>
        <Link
          href={fabTranslateHref}
          data-speed-dial-action="true"
          className="w-12 h-12 bg-surface-card text-ink border border-divider rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          aria-label="카메라 번역"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            photo_camera
          </span>
        </Link>
      </SpeedDialFab>

      <BottomNav active="home" />
    </div>
  );
}
