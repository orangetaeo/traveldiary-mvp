/**
 * 지도 페이지 로딩 스켈레톤.
 */

export default function MapLoading() {
  return (
    <div className="min-h-screen bg-surface-soft text-ink">
      <header className="bg-surface-card/90 border-b border-divider sticky top-0 z-40 flex items-center w-full px-td-md h-14">
        <div className="w-8 h-8 bg-ink/5 rounded-full animate-pulse" />
        <div className="h-5 w-24 bg-ink/10 rounded ml-td-sm animate-pulse" />
      </header>

      {/* 지도 영역 스켈레톤 */}
      <div className="w-full h-[60vh] bg-ink/5 animate-pulse" />

      {/* 하단 장소 리스트 스켈레톤 */}
      <div className="px-td-md py-td-md space-y-td-sm">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-surface-card border border-divider rounded-md animate-pulse" />
        ))}
      </div>
    </div>
  );
}
