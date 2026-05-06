/**
 * 투표 페이지 로딩 스켈레톤.
 */

import { BottomNav } from "@/components/ui/BottomNav";

export default function VoteLoading() {
  return (
    <div className="min-h-screen bg-surface-soft pb-24">
      {/* 헤더 */}
      <div className="bg-surface-card border-b border-divider px-td-md py-td-md animate-pulse">
        <div className="h-4 w-12 bg-ink/10 rounded mb-td-sm" />
        <div className="h-6 w-28 bg-ink/15 rounded" />
      </div>

      {/* 투표 아이템 스켈레톤 */}
      <div className="px-td-md py-td-sm space-y-td-sm">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface-card border border-divider rounded-md p-td-md animate-pulse"
          >
            <div className="h-5 w-36 bg-ink/10 rounded mb-td-xs" />
            <div className="h-3 w-full bg-ink/5 rounded mb-td-sm" />
            <div className="flex gap-td-sm">
              <div className="h-8 w-16 bg-ink/10 rounded-full" />
              <div className="h-8 w-16 bg-ink/10 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      <BottomNav active="itinerary" />
    </div>
  );
}
