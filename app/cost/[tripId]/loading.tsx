/**
 * 비용 관리 페이지 로딩 스켈레톤.
 */

import { BottomNav } from "@/components/ui/BottomNav";

export default function CostLoading() {
  return (
    <div className="min-h-screen bg-surface-soft pb-24">
      {/* 헤더 스켈레톤 */}
      <div className="bg-surface-card border-b border-divider px-td-md py-td-md animate-pulse">
        <div className="h-4 w-12 bg-ink/10 rounded mb-td-sm" />
        <div className="h-6 w-28 bg-ink/15 rounded" />
      </div>

      {/* 총액 카드 스켈레톤 */}
      <div className="px-td-md pt-td-md">
        <div className="bg-surface-card border border-divider rounded-xl p-td-md animate-pulse">
          <div className="h-3 w-20 bg-ink/5 rounded mb-td-xs" />
          <div className="h-7 w-32 bg-ink/15 rounded" />
        </div>
      </div>

      {/* 비용 항목 스켈레톤 */}
      <div className="px-td-md pt-td-md space-y-td-xs">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-surface-card border border-divider rounded-lg p-td-sm animate-pulse"
          >
            <div className="flex gap-td-sm items-center">
              <div className="w-8 h-8 bg-ink/5 rounded-lg" />
              <div>
                <div className="h-4 w-24 bg-ink/10 rounded mb-td-xxs" />
                <div className="h-3 w-16 bg-ink/5 rounded" />
              </div>
            </div>
            <div className="h-4 w-16 bg-ink/10 rounded" />
          </div>
        ))}
      </div>

      <BottomNav active="itinerary" />
    </div>
  );
}
