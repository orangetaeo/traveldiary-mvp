/**
 * 여행 사진 앨범 페이지 — /wrap-up/[tripId]/album
 *
 * E3: 여행 사진 자동 앨범 (위치·날짜).
 * - ItineraryItem.photos[] 자동 수집 (일정별 사진)
 * - TripPhoto DB 사진 (사용자 추가)
 * - 날짜별 그룹핑 + masonry grid
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveTrip } from "@/lib/services/resolved-trip";
import { getPhotos } from "@/actions/photo";
import { PhotoAlbumView } from "@/components/album/PhotoAlbumView";
import type { TripPhoto } from "@/lib/types";

export const metadata = {
  title: "사진 앨범 — TravelDiary",
  description: "여행 사진을 날짜·장소별로 모아보세요.",
};

export default async function AlbumPage({
  params,
}: {
  params: { tripId: string };
}) {
  const resolved = resolveTrip(params.tripId);
  if (!resolved) notFound();

  const { trip, city, items } = resolved;
  const totalDays = trip.nights + 1;

  // DB 사진 로드
  const dbPhotos = await getPhotos(trip.id);

  // ItineraryItem.photos[] 자동 수집 → TripPhoto 형태로 변환
  const itineraryPhotos: TripPhoto[] = items.flatMap((item) =>
    (item.photos ?? []).map((url, idx) => ({
      id: `item-${item.id}-${idx}`,
      tripId: trip.id,
      actorId: null,
      url,
      caption: item.name,
      dayIndex: item.dayIndex,
      sortOrder: idx,
      createdAt: item.scheduledAt,
    })),
  );

  // 합치기: DB 사진 + ItineraryItem 사진 (중복 URL 제거)
  const seenUrls = new Set(dbPhotos.map((p) => p.url));
  const autoPhotos = itineraryPhotos.filter((p) => !seenUrls.has(p.url));
  const allPhotos = [...dbPhotos, ...autoPhotos];

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-divider flex items-center justify-between px-4 h-14">
        <Link
          href={`/wrap-up/${trip.id}`}
          className="p-2 rounded-full hover:bg-surface-soft transition-colors"
          aria-label="마무리 페이지로 돌아가기"
        >
          <span className="material-symbols-outlined text-ink">arrow_back</span>
        </Link>
        <h1 className="text-sm font-semibold tracking-tight text-ink">사진 앨범</h1>
        <Link
          href="/notifications"
          className="p-2 rounded-full hover:bg-surface-soft transition-colors"
          aria-label="알림"
        >
          <span className="material-symbols-outlined text-ink">notifications</span>
        </Link>
      </header>

      {/* Hero */}
      <section className="px-td-md py-td-md bg-gradient-to-b from-surface-soft to-purple-soft/30">
        <span className="text-td-caption text-ink-soft block mb-td-xxs">
          {city.name} {trip.nights}박 {totalDays}일
        </span>
        <h1 className="text-td-title text-ink mb-td-xxs">여행 사진 앨범</h1>
        <p className="text-td-body text-ink-soft">
          {allPhotos.length > 0
            ? `${allPhotos.length}장의 추억`
            : "사진을 추가해보세요"}
        </p>
      </section>

      {/* Album Grid */}
      <PhotoAlbumView
        tripId={trip.id}
        photos={allPhotos}
        totalDays={totalDays}
      />
    </div>
  );
}
