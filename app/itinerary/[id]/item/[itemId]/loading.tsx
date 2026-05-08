/**
 * 일정 상세 페이지 로딩 스켈레톤.
 *
 * Google Places + Naver + OTA 3개 외부 API 호출 대기 중 빈 화면 방지.
 */

export default function ItemDetailLoading() {
  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-32">
      {/* TopAppBar 스켈레톤 */}
      <header className="bg-surface-card/90 border-b border-divider sticky top-0 z-40 flex items-center w-full px-td-md h-16">
        <div className="w-8 h-8 bg-ink/5 rounded-full animate-pulse" />
        <div className="h-5 w-28 bg-ink/10 rounded ml-td-sm animate-pulse" />
      </header>

      {/* Hero 스켈레톤 */}
      <div className="h-56 w-full bg-gradient-to-br from-purple/30 to-purple-deep/30 animate-pulse relative">
        <div className="absolute bottom-0 left-0 w-full p-td-md">
          <div className="h-4 w-20 bg-white/20 rounded mb-td-xs" />
          <div className="h-6 w-48 bg-white/30 rounded mb-td-xxs" />
          <div className="h-3 w-32 bg-white/20 rounded" />
        </div>
      </div>

      <main className="max-w-xl mx-auto">
        {/* 검증 뱃지 스켈레톤 */}
        <section className="px-td-md py-td-sm space-y-td-xs">
          <div className="h-10 bg-success-soft/50 rounded-md animate-pulse" />
          <div className="h-10 bg-ink/5 rounded-md animate-pulse" />
        </section>

        {/* Evidence 패널 스켈레톤 */}
        <section className="px-td-md py-td-sm">
          <div className="border border-divider rounded-md p-td-md animate-pulse">
            <div className="h-4 w-32 bg-ink/10 rounded mb-td-sm" />
            <div className="space-y-td-xs">
              <div className="h-3 w-full bg-ink/5 rounded" />
              <div className="h-3 w-3/4 bg-ink/5 rounded" />
              <div className="h-3 w-1/2 bg-ink/5 rounded" />
            </div>
          </div>
        </section>

        {/* Details Grid 스켈레톤 */}
        <section className="px-td-md py-td-sm grid grid-cols-2 gap-td-sm">
          {[1, 2].map((i) => (
            <div key={i} className="p-td-sm border border-divider rounded-md bg-surface-card animate-pulse">
              <div className="h-3 w-16 bg-ink/5 rounded mb-td-xs" />
              <div className="h-4 w-20 bg-ink/10 rounded" />
            </div>
          ))}
          <div className="col-span-2 p-td-sm border border-divider rounded-md bg-surface-card animate-pulse">
            <div className="h-3 w-12 bg-ink/5 rounded mb-td-xs" />
            <div className="h-4 w-48 bg-ink/10 rounded" />
          </div>
        </section>
      </main>

      {/* Bottom Action Bar 스켈레톤 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-[420px] w-full p-td-md bg-surface-card/90 border-t border-divider z-50 flex gap-td-sm">
        <div className="flex-1 h-12 bg-ink/5 rounded-md animate-pulse" />
        <div className="flex-[2] h-12 bg-purple/30 rounded-md animate-pulse" />
      </div>
    </div>
  );
}
