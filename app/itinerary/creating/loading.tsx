/**
 * 일정 생성 중 로딩 스켈레톤 — Suspense fallback.
 *
 * 브랜디드 진입 애니메이션: 로고 + 진행 바 스켈레톤 + 단계 카드 스켈레톤.
 */

export default function CreatingLoading() {
  return (
    <main className="min-h-screen flex flex-col bg-surface-soft px-4 py-6 max-w-md mx-auto w-full">
      {/* Header skeleton */}
      <div className="space-y-2 mb-6 animate-pulse">
        <div className="h-3 w-28 bg-purple/20 rounded" />
        <div className="h-6 w-52 bg-ink/10 rounded" />
        <div className="h-6 w-40 bg-ink/10 rounded" />
        <div className="h-3 w-36 bg-ink/5 rounded mt-1" />
      </div>

      {/* Progress bar skeleton */}
      <div className="mb-6 animate-pulse">
        <div className="w-full h-[6px] rounded-full bg-surface-soft overflow-hidden">
          <div className="h-full w-1/4 bg-purple/30 rounded-full" />
        </div>
        <div className="flex justify-end mt-1">
          <div className="h-3 w-8 bg-purple/20 rounded" />
        </div>
      </div>

      {/* Step card skeleton */}
      <div className="bg-surface-card border border-divider rounded-md p-4 space-y-4 animate-pulse">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-ink/10 shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-ink/10 rounded" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
