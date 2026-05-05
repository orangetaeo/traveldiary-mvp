/**
 * 프로필 페이지 로딩 스켈레톤.
 */

import { BottomNav } from "@/components/ui/BottomNav";

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-surface-soft pb-24">
      {/* 프로필 헤더 */}
      <div className="bg-surface-card border-b border-divider px-td-md py-td-lg animate-pulse">
        <div className="flex items-center gap-td-sm">
          <div className="w-14 h-14 rounded-full bg-ink/10" />
          <div>
            <div className="h-5 w-24 bg-ink/15 rounded mb-td-xs" />
            <div className="h-3 w-32 bg-ink/5 rounded" />
          </div>
        </div>
      </div>

      {/* 메뉴 스켈레톤 */}
      <div className="px-td-md py-td-sm space-y-td-xs">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-ink/5 rounded-lg animate-pulse" />
        ))}
      </div>

      <BottomNav active="profile" />
    </div>
  );
}
