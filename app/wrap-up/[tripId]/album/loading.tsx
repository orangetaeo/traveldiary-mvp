/**
 * 사진 앨범 페이지 로딩 스켈레톤.
 */

export default function AlbumLoading() {
  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      <header className="bg-surface-card/90 border-b border-divider sticky top-0 z-40 flex items-center w-full px-td-md h-14">
        <div className="w-8 h-8 bg-ink/5 rounded-full animate-pulse" />
        <div className="h-5 w-28 bg-ink/10 rounded ml-td-sm animate-pulse" />
      </header>

      <main className="px-td-md py-td-lg">
        {/* 사진 추가 버튼 스켈레톤 */}
        <div className="w-full h-12 mb-td-md border-2 border-dashed border-ink/10 rounded-md animate-pulse" />

        {/* 그리드 스켈레톤 */}
        <div className="columns-2 gap-td-xs space-y-td-xs">
          {[140, 180, 120, 160, 140, 100].map((h, i) => (
            <div
              key={i}
              className="bg-ink/5 rounded-md animate-pulse break-inside-avoid"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
