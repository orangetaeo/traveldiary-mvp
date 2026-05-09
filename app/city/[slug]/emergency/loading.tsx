export default function EmergencyLoading() {
  return (
    <div className="min-h-screen bg-surface-soft pb-24">
      <header className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-divider flex items-center px-4 h-14">
        <div className="w-6 h-6 bg-ink/10 rounded-full animate-pulse" />
        <div className="h-5 w-32 bg-ink/10 rounded ml-td-xs animate-pulse" />
      </header>
      {/* Hero */}
      <div className="bg-red-50 px-td-md py-td-lg animate-pulse">
        <div className="h-5 w-40 bg-red-200/50 rounded mb-td-xs" />
        <div className="h-3 w-56 bg-red-100/50 rounded" />
      </div>
      {/* Contact cards */}
      <div className="px-td-md py-td-md space-y-td-sm">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface-card border border-divider rounded-md p-td-md animate-pulse">
            <div className="flex items-center gap-td-sm mb-td-xs">
              <div className="w-10 h-10 bg-red-100/50 rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-28 bg-ink/10 rounded mb-td-xxs" />
                <div className="h-3 w-36 bg-ink/5 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
