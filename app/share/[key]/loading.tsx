/**
 * 공유 일정 로딩 스켈레톤.
 */

export default function ShareLoading() {
  return (
    <div className="min-h-screen bg-surface-soft pb-24">
      {/* 헤더 */}
      <div className="bg-surface-card border-b border-divider px-td-md py-td-md animate-pulse">
        <div className="h-4 w-20 bg-ink/10 rounded mb-td-sm" />
        <div className="h-6 w-40 bg-ink/15 rounded" />
      </div>

      {/* 일정 카드 스켈레톤 */}
      <div className="px-td-md py-td-sm space-y-td-xs">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface-card border border-divider rounded-lg p-td-sm animate-pulse"
          >
            <div className="h-4 w-32 bg-ink/10 rounded mb-td-xs" />
            <div className="h-3 w-full bg-ink/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
