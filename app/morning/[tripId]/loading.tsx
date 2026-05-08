/**
 * 모닝 브리핑 페이지 로딩 스켈레톤.
 */

export default function MorningBriefingLoading() {
  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      <div className="bg-gradient-to-br from-amber/30 to-coral/30 px-td-md py-td-lg animate-pulse">
        <div className="h-4 w-16 bg-white/20 rounded mb-td-sm" />
        <div className="h-6 w-40 bg-white/30 rounded mb-td-xs" />
        <div className="h-3 w-28 bg-white/20 rounded" />
      </div>

      <main className="max-w-xl mx-auto px-td-md py-td-lg space-y-td-md">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface-card border border-divider rounded-md p-td-md animate-pulse">
            <div className="h-4 w-32 bg-ink/10 rounded mb-td-sm" />
            <div className="space-y-td-xs">
              <div className="h-3 w-full bg-ink/5 rounded" />
              <div className="h-3 w-3/4 bg-ink/5 rounded" />
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
