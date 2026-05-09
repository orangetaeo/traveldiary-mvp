export default function PhrasesLoading() {
  return (
    <div className="min-h-screen bg-surface-soft pb-24">
      <div className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-divider flex items-center px-4 h-14">
        <div className="w-6 h-6 bg-ink/10 rounded-full animate-pulse" />
        <div className="h-5 w-36 bg-ink/10 rounded ml-td-xs animate-pulse" />
      </div>
      <div className="px-td-md py-td-md space-y-td-sm">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-surface-card border border-divider rounded-md p-td-md animate-pulse">
            <div className="h-3 w-24 bg-ink/10 rounded mb-td-xs" />
            <div className="h-5 w-48 bg-ink/5 rounded mb-td-xxs" />
            <div className="h-3 w-36 bg-ink/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
