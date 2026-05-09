export default function MapLoading() {
  return (
    <div className="min-h-screen bg-surface-soft pb-24">
      <div className="sticky top-0 z-10 bg-surface-card/90 backdrop-blur-md border-b border-divider flex items-center px-4 h-14">
        <div className="w-6 h-6 bg-ink/10 rounded-full animate-pulse" />
        <div className="h-4 w-20 bg-ink/10 rounded ml-td-sm animate-pulse" />
      </div>
      <div className="w-full h-80 bg-ink/5 animate-pulse" />
      <div className="flex justify-between px-td-md py-td-sm border-y border-divider">
        <div className="h-4 w-24 bg-ink/10 rounded animate-pulse" />
        <div className="h-4 w-24 bg-ink/10 rounded animate-pulse" />
      </div>
      <div className="px-td-md py-td-md space-y-td-md">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start gap-td-sm animate-pulse">
            <div className="w-8 h-8 rounded-full bg-purple/20 shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-16 bg-ink/10 rounded mb-td-xxs" />
              <div className="h-5 w-40 bg-ink/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
