/**
 * 체크리스트 페이지 로딩 스켈레톤.
 */

import { BottomNav } from "@/components/ui/BottomNav";

export default function ChecklistLoading() {
  return (
    <div className="min-h-screen bg-surface-soft pb-24">
      {/* 헤더 스켈레톤 */}
      <div className="bg-surface-card border-b border-divider px-td-md py-td-md animate-pulse">
        <div className="h-4 w-12 bg-ink/10 rounded mb-td-sm" />
        <div className="h-6 w-36 bg-ink/15 rounded" />
      </div>

      {/* 필터 스켈레톤 */}
      <div className="flex gap-td-xs px-td-md py-td-sm">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-7 w-20 bg-ink/5 rounded-full animate-pulse" />
        ))}
      </div>

      {/* 체크 아이템 스켈레톤 */}
      <div className="px-td-md space-y-td-xs">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-td-sm bg-surface-card border border-divider rounded-lg p-td-sm animate-pulse"
          >
            <div className="w-5 h-5 bg-ink/10 rounded" />
            <div className="h-4 flex-1 bg-ink/5 rounded" />
          </div>
        ))}
      </div>

      <BottomNav active="itinerary" />
    </div>
  );
}
