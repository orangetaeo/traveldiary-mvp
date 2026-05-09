/**
 * 모닝 브리핑 로딩 스켈레톤 — Prisma trip lookup + 7-phrase 추천 처리 대기.
 */

export default function MorningLoading() {
  return (
    <div className="min-h-screen bg-surface-soft pb-24">
      <div className="bg-gradient-to-br from-amber to-amber-deep px-td-md py-td-lg animate-pulse">
        <div className="h-3 w-20 bg-white/30 rounded mb-td-sm" />
        <div className="h-7 w-56 bg-white/40 rounded mb-td-xs" />
        <div className="h-4 w-40 bg-white/30 rounded" />
      </div>

      <div className="px-td-md py-td-md space-y-td-md">
        <div className="bg-surface-card border border-divider rounded-md p-td-md animate-pulse">
          <div className="h-4 w-24 bg-ink/10 rounded mb-td-sm" />
          <div className="h-6 w-full bg-ink/5 rounded mb-td-xs" />
          <div className="h-3 w-32 bg-ink/5 rounded" />
        </div>

        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface-card border border-divider rounded-md p-td-md animate-pulse"
          >
            <div className="h-4 w-32 bg-ink/10 rounded mb-td-xs" />
            <div className="h-3 w-48 bg-ink/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
