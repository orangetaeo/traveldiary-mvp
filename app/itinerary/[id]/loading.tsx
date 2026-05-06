/**
 * 일정 페이지 로딩 스켈레톤.
 */

import { BottomNav } from "@/components/ui/BottomNav";

export default function ItineraryLoading() {
  return (
    <div className="min-h-screen bg-surface-soft pb-24">
      {/* 헤더 스켈레톤 */}
      <div className="bg-purple px-td-md py-td-lg animate-pulse">
        <div className="h-4 w-16 bg-white/20 rounded mb-td-sm" />
        <div className="h-6 w-48 bg-white/30 rounded mb-td-xs" />
        <div className="h-3 w-32 bg-white/20 rounded" />
      </div>

      {/* Day 탭 스켈레톤 */}
      <div className="flex gap-td-sm px-td-md py-td-sm overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-16 bg-ink/5 rounded-full animate-pulse" />
        ))}
      </div>

      {/* 일정 카드 스켈레톤 */}
      <div className="px-td-md space-y-td-sm">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface-card border border-divider rounded-md p-td-md animate-pulse"
          >
            <div className="flex gap-td-sm">
              <div className="w-10 h-10 bg-ink/5 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-ink/10 rounded mb-td-xs" />
                <div className="h-3 w-24 bg-ink/5 rounded" />
              </div>
              <div className="h-5 w-12 bg-ink/5 rounded" />
            </div>
          </div>
        ))}
      </div>

      <BottomNav active="itinerary" />
    </div>
  );
}
