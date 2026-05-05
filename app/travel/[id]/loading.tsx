/**
 * 여행 상세 로딩 스켈레톤.
 */

import { BottomNav } from "@/components/ui/BottomNav";

export default function TravelLoading() {
  return (
    <div className="min-h-screen bg-surface-soft pb-24">
      {/* 히어로 스켈레톤 */}
      <div className="h-48 bg-ink/10 animate-pulse" />

      {/* 콘텐츠 스켈레톤 */}
      <div className="px-td-md py-td-sm space-y-td-sm">
        <div className="h-6 w-36 bg-ink/15 rounded animate-pulse" />
        <div className="h-4 w-full bg-ink/5 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-ink/5 rounded animate-pulse" />

        {/* 액션 카드 스켈레톤 */}
        <div className="grid grid-cols-2 gap-td-sm mt-td-md">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-surface-card border border-divider rounded-xl p-td-md animate-pulse"
            >
              <div className="h-8 w-8 bg-ink/10 rounded mb-td-xs" />
              <div className="h-4 w-16 bg-ink/10 rounded" />
            </div>
          ))}
        </div>
      </div>

      <BottomNav active="trips" />
    </div>
  );
}
