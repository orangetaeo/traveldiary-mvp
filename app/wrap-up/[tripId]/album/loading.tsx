export default function AlbumLoading() {
  return (
    <div className="min-h-screen bg-surface-soft pb-24">
      <div className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-divider flex items-center justify-between px-4 h-14">
        <div className="w-6 h-6 bg-ink/10 rounded-full animate-pulse" />
        <div className="h-4 w-20 bg-ink/10 rounded animate-pulse" />
        <div className="w-10" />
      </div>
      <div className="px-td-md py-td-md bg-gradient-to-b from-surface-soft to-purple-soft/30 animate-pulse">
        <div className="h-3 w-24 bg-ink/10 rounded mb-td-xxs" />
        <div className="h-7 w-44 bg-ink/10 rounded mb-td-xxs" />
        <div className="h-4 w-28 bg-ink/5 rounded" />
      </div>
      <div className="px-td-md py-td-md grid grid-cols-2 gap-2">
        {[180, 120, 120, 160, 140, 100].map((h, i) => (
          <div key={i} className="rounded-md bg-ink/5 animate-pulse" style={{ height: h }} />
        ))}
      </div>
    </div>
  );
}
