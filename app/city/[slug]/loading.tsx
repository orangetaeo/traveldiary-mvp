/**
 * 도시 페이지 로딩 스켈레톤.
 */

import { BottomNav } from "@/components/ui/BottomNav";

export default function CityLoading() {
  return (
    <div className="min-h-screen bg-surface-soft pb-24">
      {/* 히어로 스켈레톤 */}
      <div className="bg-gradient-to-br from-purple to-purple-deep px-td-md py-td-xl animate-pulse">
        <div className="h-4 w-12 bg-white/20 rounded mb-td-sm" />
        <div className="h-7 w-40 bg-white/30 rounded mb-td-xs" />
        <div className="h-4 w-56 bg-white/20 rounded" />
      </div>

      {/* 응급 카드 스켈레톤 */}
      <div className="px-td-md pt-td-md">
        <div className="h-16 bg-danger/5 border border-danger/20 rounded-xl animate-pulse" />
      </div>

      {/* 섹션 스켈레톤 */}
      <div className="px-td-md pt-td-lg space-y-td-lg">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-5 w-28 bg-ink/10 rounded mb-td-sm" />
            <div className="space-y-td-xs">
              <div className="h-3 w-full bg-ink/5 rounded" />
              <div className="h-3 w-4/5 bg-ink/5 rounded" />
              <div className="h-3 w-3/5 bg-ink/5 rounded" />
            </div>
          </div>
        ))}
      </div>

      <BottomNav active="trips" />
    </div>
  );
}
