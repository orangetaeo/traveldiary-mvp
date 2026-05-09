export default function RecapLoading() {
  return (
    <div className="min-h-screen bg-surface-soft pb-24">
      <div className="w-full h-72 bg-gradient-to-br from-purple/30 via-purple/10 to-amber/10 animate-pulse" />
      <div className="px-td-md py-td-lg">
        <div className="flex gap-td-sm overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-24 h-20 rounded-md bg-ink/5 animate-pulse shrink-0" />
          ))}
        </div>
      </div>
      <div className="px-td-md space-y-td-sm">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface-card border border-divider rounded-md p-td-md animate-pulse">
            <div className="h-3 w-20 bg-ink/10 rounded mb-td-xs" />
            <div className="h-5 w-40 bg-ink/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
