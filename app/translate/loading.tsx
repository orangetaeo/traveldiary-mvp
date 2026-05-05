/**
 * 메뉴 번역 로딩 스켈레톤.
 */

import { BottomNav } from "@/components/ui/BottomNav";

export default function TranslateLoading() {
  return (
    <div className="min-h-screen bg-surface-soft pb-24">
      {/* 헤더 */}
      <div className="bg-surface-card border-b border-divider px-td-md py-td-md animate-pulse">
        <div className="h-6 w-24 bg-ink/15 rounded" />
      </div>

      {/* 카메라 영역 스켈레톤 */}
      <div className="px-td-md py-td-md">
        <div className="aspect-[4/3] bg-ink/10 rounded-xl animate-pulse" />
      </div>

      {/* 결과 영역 스켈레톤 */}
      <div className="px-td-md space-y-td-xs">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-ink/5 rounded-lg animate-pulse" />
        ))}
      </div>

      <BottomNav active="itinerary" />
    </div>
  );
}
