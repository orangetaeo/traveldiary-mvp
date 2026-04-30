/**
 * Share Link view-only 페이지 — 사이클 11a (ADR-024).
 *
 * 권한: view만. 편집 X. 만료/철회 시 404.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchShareLinkBySyncKey } from "@/lib/repositories/share.repository";
import { EvidencePanel } from "@/components/ui/EvidencePanel";

export default async function SharedTripPage({
  params,
}: {
  params: { key: string };
}) {
  const found = await fetchShareLinkBySyncKey(params.key);
  if (!found) notFound();

  const { link, bundle } = found;
  const { trip, items } = bundle;

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
        <span className="inline-flex items-center gap-1 text-td-caption text-ink-mute">
          <span className="material-symbols-outlined text-[14px]">visibility</span>
          {link.permission === "view" ? "보기 전용" : "편집 가능"}
        </span>
      </header>

      <main className="max-w-xl mx-auto px-td-md">
        <section className="py-td-lg">
          <p className="text-td-meta text-ink-soft mb-td-xxs">
            {trip.destination} · {trip.nights}박 {trip.nights + 1}일 · {trip.startDate}
          </p>
          <h2 className="text-td-title text-ink">{trip.destination} 여행</h2>
          <p className="text-td-meta text-ink-mute mt-td-xs">
            💡 이 화면은 보기 전용입니다. 직접 일정을 만들고 싶다면{" "}
            <Link href="/onboarding" className="text-purple underline">
              새 여행 계획
            </Link>
            을 시작해보세요.
          </p>
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
                      className="bg-surface-card border border-divider rounded-xl p-td-md"
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
                    </article>
                  );
                })}
              </div>
            </section>
          )
        ))}
      </main>
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
