export default function ScanLoading() {
  return (
    <div className="min-h-screen bg-surface-soft pb-24">
      <div className="sticky top-0 z-10 bg-surface-card border-b border-divider px-td-md py-td-sm flex items-center gap-td-sm h-14">
        <div className="w-6 h-6 bg-ink/10 rounded-full animate-pulse" />
        <div className="h-4 w-24 bg-ink/10 rounded animate-pulse" />
      </div>
      <div className="flex flex-col items-center justify-center px-td-md mt-24">
        <div className="w-64 h-48 rounded-xl border-2 border-dashed border-purple/20 bg-purple-soft/10 animate-pulse" />
        <div className="h-4 w-48 bg-ink/10 rounded mt-td-md animate-pulse" />
        <div className="flex gap-td-sm mt-td-lg w-full max-w-xs">
          <div className="flex-1 h-10 bg-ink/5 rounded-md animate-pulse" />
          <div className="flex-1 h-10 bg-purple/20 rounded-md animate-pulse" />
        </div>
      </div>
    </div>
  );
}
