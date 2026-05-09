/**
 * AI 추천 장소 탐색 로딩 스켈레톤 — Prisma + AI place lookup 대기.
 */

export default function DiscoverLoading() {
  return (
    <div className="min-h-screen bg-surface-soft pb-24">
      <div className="bg-purple px-td-md py-td-lg animate-pulse">
        <div className="h-3 w-16 bg-white/30 rounded mb-td-sm" />
        <div className="h-7 w-48 bg-white/40 rounded mb-td-xs" />
        <div className="h-3 w-40 bg-white/30 rounded" />
      </div>

      <div className="flex gap-td-xs px-td-md py-td-sm overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-8 w-20 bg-ink/5 rounded-full animate-pulse shrink-0"
          />
        ))}
      </div>

      <div className="px-td-md space-y-td-sm">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface-card border border-divider rounded-md p-td-md animate-pulse"
          >
            <div className="flex gap-td-sm">
              <div className="w-16 h-16 bg-ink/5 rounded-md shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-40 bg-ink/10 rounded mb-td-xs" />
                <div className="h-3 w-32 bg-ink/5 rounded mb-td-xxs" />
                <div className="h-3 w-24 bg-ink/5 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
