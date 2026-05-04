/**
 * Share Link view-only 페이지 — 사이클 11a (ADR-024).
 *
 * 권한: view만. 편집 X. 만료/철회 시 404.
 * 사이클 F: og:image 동적 생성 (인스타·카카오톡 미리보기).
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchShareLinkBySyncKey } from "@/lib/repositories/share.repository";
import { listCommentsByShareLinkId } from "@/lib/repositories/shareComment.repository";
import { EvidencePanel } from "@/components/ui/EvidencePanel";
import { CommentSection } from "@/components/share/CommentSection";
import { ReceivedKeyTracker } from "@/components/share/ReceivedKeyTracker";
import { BottomNav } from "@/components/ui/BottomNav";

export async function generateMetadata({
  params,
}: {
  params: { key: string };
}): Promise<Metadata> {
  const found = await fetchShareLinkBySyncKey(params.key);
  if (!found) {
    return { title: "TravelDiary — 공유 받은 여행" };
  }
  const { trip } = found.bundle;
  const title = `${trip.destination} ${trip.nights}박 ${trip.nights + 1}일 — TravelDiary`;
  const description = `${trip.startDate} 출발 · 일정 ${found.bundle.items.length}개`;
  const ogImage = `/api/og/share/${params.key}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function SharedTripPage({
  params,
}: {
  params: { key: string };
}) {
  const found = await fetchShareLinkBySyncKey(params.key);
  if (!found) notFound();

  const { link, bundle } = found;
  const { trip, items } = bundle;

  // 사이클 R (ADR-036) — 익명 댓글/리액션
  const comments = await listCommentsByShareLinkId(link.id);
  const isExpired = !!link.expiresAt && new Date(link.expiresAt) < new Date();
  const isRevoked = !!link.revokedAt;
  const commentsDisabled = isExpired || isRevoked;
  const disabledReason = isRevoked
    ? "이 링크는 더 이상 사용할 수 없어요."
    : isExpired
      ? "이 링크는 만료됐어요."
      : undefined;

  // Day별 그룹
  const days: typeof items[] = Array.from(
    { length: trip.nights + 1 },
    () => [],
  );
  for (const it of items) {
    if (days[it.dayIndex]) days[it.dayIndex].push(it);
  }
  for (const list of days) {
    list.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      <ReceivedKeyTracker
        shareKey={params.key}
        destination={trip.destination}
        nights={trip.nights}
      />
      <header className="bg-surface-card border-b border-divider sticky top-0 z-40 flex justify-between items-center w-full px-td-md h-16">
        <div className="flex items-center gap-td-sm">
          <Link
            href="/"
            aria-label="홈"
            className="p-2 rounded-full hover:bg-surface-soft transition-colors"
          >
            <span className="material-symbols-outlined text-ink">home</span>
          </Link>
          <h1 className="text-lg font-bold text-ink tracking-tight">
            공유 받은 여행
          </h1>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-td-caption font-bold bg-gray-200 text-gray-600">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          {link.permission === "view" ? "보기 전용" : "편집 가능"}
        </span>
      </header>

      <main className="max-w-xl mx-auto px-td-md">
        {/* C3 — 보기 전용 배너 (회색 배지 + disabled 시각 차단) */}
        <div className="bg-gray-100 border border-gray-300 rounded-lg px-td-md py-td-sm mt-td-sm flex items-center gap-td-sm">
          <span className="material-symbols-outlined text-gray-500 text-[20px]" aria-hidden>
            lock
          </span>
          <p className="text-td-meta text-gray-600">
            <span className="font-bold">보기 전용</span> — 일정 수정은 불가합니다.{" "}
            <Link href="/onboarding" className="underline font-medium text-purple-deep">
              내 여행 만들기
            </Link>
          </p>
        </div>

        <section className="py-td-lg">
          <p className="text-td-meta text-ink-soft mb-td-xxs">
            {trip.destination} · {trip.nights}박 {trip.nights + 1}일 · {trip.startDate}
          </p>
          <h2 className="text-td-title text-ink">{trip.destination} 여행</h2>
          {link.expiresAt && (
            <p className="text-td-caption text-ink-mute mt-td-xs">
              ⏰ {new Date(link.expiresAt).toLocaleDateString("ko-KR")} 까지 열람 가능
            </p>
          )}
        </section>

        {days.map((dayItems, dayIdx) => (
          dayItems.length > 0 && (
            <section key={dayIdx} className="mb-td-lg">
              <h3 className="text-td-card-title text-ink mb-td-sm">
                Day {dayIdx + 1}
              </h3>
              <div className="space-y-td-sm">
                {dayItems.map((item) => {
                  const time = formatTime(item.scheduledAt);
                  return (
                    <article
                      key={item.id}
                      className="bg-surface-card border border-divider rounded-xl p-td-md relative"
                    >
                      <div className="flex items-start gap-td-sm">
                        {item.photos?.[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.photos[0]}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-td-caption text-ink-mute tabular-nums">
                            {time}
                          </p>
                          <h4 className="text-td-card-title text-ink truncate">
                            {item.name}
                          </h4>
                          <p className="text-td-caption text-ink-soft mt-td-xxs">
                            {item.location.address || "위치 미상"}
                          </p>
                        </div>
                      </div>
                      {item.evidence?.reasons.length > 0 && (
                        <div className="mt-td-sm">
                          <EvidencePanel evidence={item.evidence} />
                        </div>
                      )}
                      {/* C3 — 보기 전용 시각 차단: 각 카드에 회색 배지 */}
                      <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-500 font-bold">
                        보기 전용
                      </span>
                    </article>
                  );
                })}
              </div>
            </section>
          )
        ))}

        {/* 사이클 R (ADR-036) — 익명 댓글/리액션 */}
        <CommentSection
          syncKey={params.key}
          initialComments={comments}
          disabled={commentsDisabled}
          disabledReason={disabledReason}
        />
      </main>

      <BottomNav active="trips" />
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(
    d.getUTCMinutes()
  ).padStart(2, "0")}`;
}
