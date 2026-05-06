/**
 * 온보딩 로딩 스켈레톤.
 */

export default function OnboardingLoading() {
  return (
    <div className="min-h-screen bg-surface-soft flex flex-col items-center justify-center px-td-md">
      <div className="animate-pulse flex flex-col items-center gap-td-sm w-full max-w-sm">
        <div className="w-12 h-12 rounded-full bg-purple/20" />
        <div className="h-5 w-36 bg-ink/15 rounded" />
        <div className="h-3 w-48 bg-ink/5 rounded" />
        <div className="mt-td-lg w-full space-y-td-sm">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-ink/5 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
