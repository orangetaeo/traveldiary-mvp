/**
 * Wrap-up 페이지 로딩 스켈레톤.
 */

export default function WrapUpLoading() {
  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      {/* 헤더 스켈레톤 */}
      <header className="bg-surface-card/90 border-b border-divider sticky top-0 z-40 flex items-center w-full px-td-md h-14">
        <div className="w-8 h-8 bg-ink/5 rounded-full animate-pulse" />
        <div className="h-5 w-32 bg-ink/10 rounded ml-td-sm animate-pulse" />
      </header>

      <main className="max-w-xl mx-auto px-td-md py-td-lg space-y-td-lg">
        {/* 요약 카드 스켈레톤 */}
        <div className="bg-surface-card border border-divider rounded-md p-td-md animate-pulse">
          <div className="h-5 w-40 bg-ink/10 rounded mb-td-sm" />
          <div className="h-3 w-full bg-ink/5 rounded mb-td-xs" />
          <div className="h-3 w-3/4 bg-ink/5 rounded" />
        </div>

        {/* 리뷰/비용/사진 섹션 스켈레톤 */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface-card border border-divider rounded-md p-td-md animate-pulse">
            <div className="h-4 w-28 bg-ink/10 rounded mb-td-sm" />
            <div className="space-y-td-xs">
              <div className="h-3 w-full bg-ink/5 rounded" />
              <div className="h-3 w-2/3 bg-ink/5 rounded" />
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
