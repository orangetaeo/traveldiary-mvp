/**
 * 추천 장소(Discover) 페이지 로딩 스켈레톤.
 */

export default function DiscoverLoading() {
  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      <header className="bg-surface-card/90 border-b border-divider sticky top-0 z-40 flex items-center w-full px-td-md h-14">
        <div className="w-8 h-8 bg-ink/5 rounded-full animate-pulse" />
        <div className="h-5 w-32 bg-ink/10 rounded ml-td-sm animate-pulse" />
      </header>

      <main className="max-w-xl mx-auto px-td-md py-td-lg space-y-td-md">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface-card border border-divider rounded-md p-td-md animate-pulse">
            <div className="flex gap-td-sm">
              <div className="w-16 h-16 bg-ink/5 rounded-lg shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-ink/10 rounded mb-td-xs" />
                <div className="h-3 w-24 bg-ink/5 rounded mb-td-xs" />
                <div className="h-3 w-16 bg-ink/5 rounded" />
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
