/**
 * 받은 일정 목록 로딩 스켈레톤.
 */

import { BottomNav } from "@/components/ui/BottomNav";

export default function SharedLoading() {
  return (
    <div className="min-h-screen bg-surface-soft pb-24">
      {/* 헤더 */}
      <div className="bg-surface-card border-b border-divider px-td-md py-td-md animate-pulse">
        <div className="h-6 w-28 bg-ink/15 rounded" />
      </div>

      {/* 받은 일정 카드 스켈레톤 */}
      <div className="px-td-md py-td-sm space-y-td-sm">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface-card border border-divider rounded-md p-td-md animate-pulse"
          >
            <div className="h-4 w-28 bg-ink/10 rounded mb-td-xs" />
            <div className="h-3 w-full bg-ink/5 rounded mb-td-xs" />
            <div className="h-3 w-20 bg-ink/5 rounded" />
          </div>
        ))}
      </div>

      <BottomNav active="trips" />
    </div>
  );
}
