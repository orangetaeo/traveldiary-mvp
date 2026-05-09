export default function NotificationsLoading() {
  return (
    <div className="min-h-screen bg-surface-soft pb-24">
      <div className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-divider flex items-center justify-between px-4 h-14">
        <div className="w-6 h-6 bg-ink/10 rounded-full animate-pulse" />
        <div className="h-4 w-16 bg-ink/10 rounded animate-pulse" />
        <div className="w-10" />
      </div>
      <div className="px-td-md py-td-md space-y-td-xs">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-surface-card border border-divider rounded-md p-td-md animate-pulse flex gap-td-sm">
            <div className="w-10 h-10 rounded-full bg-ink/10 shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-48 bg-ink/10 rounded mb-td-xxs" />
              <div className="h-3 w-32 bg-ink/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
