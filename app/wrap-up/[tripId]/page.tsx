/**
 * Trip Wrap-up — 여행 마무리 페이지 (Phase 7 신규).
 *
 * Stitch 시안: #32 Trip Wrap-up — 여행 마무리 (Pretendard) (154333c2456640819976e9279cc0e8f0)
 * 레이아웃: hero + stats 2×2 + highlight memories + review card + next trip + CTA.
 *
 * M2 모드 마지막 단계: 여행 종료 후 진입.
 * 현재: 데모 트립 시드 기반. 추후 실 사용자 데이터 연결.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveTrip } from "@/lib/services/resolved-trip";
import { WrapUpReviewCard } from "@/components/wrap-up/WrapUpReviewCard";
import { getNextCitySuggestions } from "@/lib/wrap-up/next-city-suggestions";

interface PageProps {
  params: { tripId: string };
}

// --- 데모: 하이라이트 (추후 AI 자동 선별로 교체) ---
const DEMO_HIGHLIGHTS = [
  { day: 2, title: "로컬 맛집 탐방 🍜", subtitle: "한국 관광객 잘 모르는 로컬" },
  { day: 3, title: "야경 포인트 🌃", subtitle: "시간대 완벽" },
  { day: 4, title: "일출 감상 🌅", subtitle: "새벽 알람의 보람" },
] as const;

export default function WrapUpPage({ params }: PageProps) {
  const resolved = resolveTrip(params.tripId);
  if (!resolved) notFound();

  const { trip, city, items, itemCount, verifiedCount } = resolved;

  // 지출 합계 (CostEntry는 별도 모델이므로 item에서 간이 추정)
  const totalDays = trip.nights + 1;

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-divider flex items-center justify-between px-4 h-14">
        <Link
          href={`/itinerary/${trip.id}`}
          className="p-2 rounded-full hover:bg-surface-soft transition-colors"
          aria-label="일정으로 돌아가기"
        >
          <span className="material-symbols-outlined text-ink">arrow_back</span>
        </Link>
        <h1 className="text-sm font-semibold tracking-tight text-ink">Trip Wrap-up</h1>
        <button className="p-2 rounded-full hover:bg-surface-soft transition-colors" aria-label="공유">
          <span className="material-symbols-outlined text-ink">share</span>
        </button>
      </header>

      <main>
        {/* Hero Section */}
        <section className="px-td-md py-td-lg bg-gradient-to-b from-surface-soft to-purple-soft/30">
          <span className="text-td-caption text-ink-soft block mb-td-xxs">
            {city.name} {trip.nights}박 {totalDays}일
          </span>
          <h1 className="text-td-title text-ink mb-td-xxs">잘 다녀오셨어요?</h1>
          <p className="text-td-body text-ink-soft">여행 끝. 다음을 위한 작은 정리.</p>
        </section>

        {/* Stats Grid */}
        <section className="px-td-md py-td-md grid grid-cols-2 gap-td-sm">
          <div className="bg-surface-card border border-divider p-td-sm rounded-md">
            <span className="text-td-meta text-ink-soft">방문 장소</span>
            <div className="text-td-card-title text-purple mt-td-xxs">{itemCount}곳</div>
            <div className="flex items-center gap-1 mt-td-xxs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-td-caption text-emerald-600">{verifiedCount} 검증 완료</span>
            </div>
          </div>
          <div className="bg-surface-card border border-divider p-td-sm rounded-md">
            <span className="text-td-meta text-ink-soft">여행 일수</span>
            <div className="text-td-card-title text-ink mt-td-xxs">{totalDays}일</div>
            <span className="text-td-caption text-ink-soft mt-td-xxs block">
              {trip.nights}박
            </span>
          </div>
          <div className="bg-surface-card border border-divider p-td-sm rounded-md">
            <span className="text-td-meta text-ink-soft">카테고리</span>
            <div className="text-td-card-title text-ink mt-td-xxs">
              {new Set(items.map((i) => i.category)).size}종
            </div>
            <span className="text-td-caption text-ink-soft mt-td-xxs block">
              맛집·관광·쇼핑·휴식
            </span>
          </div>
          <div className="bg-surface-card border border-divider p-td-sm rounded-md">
            <span className="text-td-meta text-ink-soft">동행</span>
            <div className="text-td-card-title text-ink mt-td-xxs capitalize">
              {trip.companion === "solo" ? "혼자" : trip.companion === "family" ? "가족" : trip.companion === "friends" ? "친구" : "그룹"}
            </div>
          </div>
        </section>

        {/* Highlight Memories */}
        <section className="py-td-md">
          <div className="flex items-center justify-between px-td-md mb-td-sm">
            <div className="flex items-center gap-2">
              <h2 className="text-td-body font-bold text-ink">이 순간이 좋았어요</h2>
              <span className="bg-purple text-white text-td-badge px-1.5 py-0.5 rounded-md font-bold">
                AI 추천
              </span>
            </div>
          </div>
          <div className="flex overflow-x-auto gap-td-sm px-td-md pb-td-xs">
            {DEMO_HIGHLIGHTS.map((h) => (
              <div key={h.day} className="flex-none w-[240px]">
                <div className="aspect-[16/10] rounded-md overflow-hidden mb-td-xxs border border-divider bg-surface-soft flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-ink-mute">photo_camera</span>
                </div>
                <h3 className="text-td-body font-bold text-ink">Day {h.day} · {h.title}</h3>
                <p className="text-td-caption text-ink-soft">{h.subtitle}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Review Card — 별점/후기 LocalStorage 임시 저장 */}
        <WrapUpReviewCard tripId={trip.id} />

        {/* Next Trip */}
        <section className="py-td-md">
          <h2 className="text-td-body font-bold text-ink px-td-md mb-td-sm">다음 여행은?</h2>
          <div className="flex overflow-x-auto gap-td-sm px-td-md pb-td-xs">
            {getNextCitySuggestions(trip.destinationCode, { limit: 5 }).map((c) => (
              <Link
                key={c.code}
                href={`/city/${c.slug}`}
                className="flex-none w-[140px]"
                aria-label={`${c.name}으로 다음 여행 추천 일정 보기`}
              >
                <div className="relative rounded-md overflow-hidden aspect-[3/4] mb-td-xxs border border-divider bg-surface-soft flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-ink-mute">landscape</span>
                  {c.badge && (
                    <div className="absolute top-2 left-2 bg-accent text-white text-td-badge font-bold px-2 py-0.5 rounded-full">
                      {c.badge}
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-td-xxs bg-gradient-to-t from-black/60 to-transparent">
                    <span className="text-white font-bold text-td-body">{c.name}</span>
                  </div>
                </div>
                <span className="text-td-caption text-purple flex items-center gap-0.5">
                  AI 추천 일정 보기
                  <span className="material-symbols-outlined text-td-icon-sm">arrow_forward</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-td-md pt-td-sm pb-td-lg flex flex-col items-center gap-td-sm">
          <Link
            href={`/itinerary/${trip.id}`}
            className="w-full bg-ink text-white font-bold py-td-sm rounded-md text-center text-td-body transition-transform active:scale-95"
          >
            내 여행 보관하기
          </Link>
          <Link
            href={`/cost/${trip.id}`}
            className="text-td-body text-purple font-bold flex items-center gap-1"
          >
            통계 자세히 →
          </Link>
        </section>
      </main>
    </div>
  );
}
