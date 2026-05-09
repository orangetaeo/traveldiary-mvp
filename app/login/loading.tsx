export default function LoginLoading() {
  return (
    <div className="min-h-screen bg-surface-soft flex flex-col items-center justify-center px-td-md">
      {/* Logo area */}
      <div className="w-20 h-20 bg-purple/20 rounded-2xl animate-pulse mb-td-lg" />
      <div className="h-6 w-40 bg-ink/10 rounded animate-pulse mb-td-xs" />
      <div className="h-3 w-56 bg-ink/5 rounded animate-pulse mb-td-xl" />
      {/* CTA buttons */}
      <div className="w-full max-w-xs space-y-td-sm">
        <div className="h-12 bg-[#FEE500]/40 rounded-md animate-pulse" />
        <div className="h-12 bg-ink/5 rounded-md animate-pulse" />
      </div>
    </div>
  );
}
