/**
 * 예약 처리 로딩 스켈레톤 — OTA 예약 확인 처리 대기.
 */

export default function BookingLoading() {
  return (
    <div className="min-h-screen bg-surface-soft pb-24">
      <div className="bg-success px-td-md py-td-lg animate-pulse">
        <div className="h-3 w-16 bg-white/30 rounded mb-td-sm" />
        <div className="h-7 w-44 bg-white/40 rounded mb-td-xs" />
        <div className="h-3 w-32 bg-white/30 rounded" />
      </div>

      <div className="px-td-md py-td-md space-y-td-md">
        <div className="bg-surface-card border border-divider rounded-md p-td-md animate-pulse">
          <div className="flex items-start gap-td-sm">
            <div className="w-12 h-12 bg-ink/5 rounded-full shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-ink/10 rounded mb-td-xs" />
              <div className="h-3 w-40 bg-ink/5 rounded mb-td-xxs" />
              <div className="h-3 w-24 bg-ink/5 rounded" />
            </div>
          </div>
        </div>

        <div className="bg-surface-card border border-divider rounded-md p-td-md animate-pulse">
          <div className="h-4 w-24 bg-ink/10 rounded mb-td-sm" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-ink/5 rounded" />
            <div className="h-3 w-3/4 bg-ink/5 rounded" />
            <div className="h-3 w-1/2 bg-ink/5 rounded" />
          </div>
        </div>

        <div className="h-12 w-full bg-ink/5 rounded-md animate-pulse" />
      </div>
    </div>
  );
}
