export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-surface-soft pb-24">
      <header className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-divider flex items-center px-4 h-14">
        <div className="w-6 h-6 bg-ink/10 rounded-full animate-pulse" />
        <div className="h-5 w-16 bg-ink/10 rounded ml-td-xs animate-pulse" />
      </header>
      <div className="px-td-md py-td-md space-y-td-lg">
        {[1, 2, 3].map((section) => (
          <div key={section}>
            <div className="h-3 w-16 bg-ink/10 rounded mb-td-sm animate-pulse" />
            <div className="bg-surface-card border border-divider rounded-md divide-y divide-divider">
              {[1, 2, 3].map((item) => (
                <div key={item} className="px-td-md py-td-sm flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-td-sm">
                    <div className="w-5 h-5 bg-ink/10 rounded" />
                    <div className="h-4 w-24 bg-ink/10 rounded" />
                  </div>
                  <div className="w-5 h-5 bg-ink/5 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
