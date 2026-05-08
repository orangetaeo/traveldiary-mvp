/**
 * 여행 대시보드 로딩 스켈레톤.
 */

import { BottomNav } from "@/components/ui/BottomNav";

export default function TripDashboardLoading() {
  return (
    <div className="min-h-screen bg-surface-soft pb-24">
      {/* 헤더 스켈레톤 */}
      <div className="bg-purple px-td-md py-td-lg animate-pulse">
        <div className="h-4 w-16 bg-white/20 rounded mb-td-sm" />
        <div className="h-6 w-44 bg-white/30 rounded mb-td-xs" />
        <div className="h-3 w-28 bg-white/20 rounded" />
      </div>

      {/* 대시보드 카드 스켈레톤 */}
      <main className="max-w-xl mx-auto px-td-md py-td-lg space-y-td-md">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface-card border border-divider rounded-md p-td-md animate-pulse"
          >
            <div className="flex items-center gap-td-sm mb-td-sm">
              <div className="w-10 h-10 bg-ink/5 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 w-28 bg-ink/10 rounded mb-td-xxs" />
                <div className="h-3 w-20 bg-ink/5 rounded" />
              </div>
            </div>
            <div className="h-3 w-full bg-ink/5 rounded" />
          </div>
        ))}
      </main>

      <BottomNav active="trips" />
    </div>
  );
}
