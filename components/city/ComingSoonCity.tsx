/**
 * 비-베트남 도시 접근 시 "준비 중" 안내.
 * 사이클 F (V3): 베트남 우선 출시 정책.
 */

import Link from "next/link";
import { BottomNav } from "@/components/ui/BottomNav";
import type { City } from "@/lib/types";

export function ComingSoonCity({ city }: { city: City }) {
  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-32">
      <header className="bg-surface-card/90 backdrop-blur-md border-b border-divider sticky top-0 z-40 flex justify-between items-center w-full px-td-md h-14">
        <div className="flex items-center gap-td-sm">
          <Link
            href="/"
            aria-label="뒤로"
            className="p-2 rounded-full hover:bg-surface-soft transition-colors"
          >
            <span className="material-symbols-outlined text-ink">arrow_back</span>
          </Link>
          <h1 className="text-lg font-bold text-ink tracking-tight">TravelDiary</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-td-md pt-td-xl">
        <section className="bg-surface-card border border-divider rounded-2xl p-td-lg shadow-sm text-center">
          <div className="text-6xl mb-td-md" aria-hidden>
            🇻🇳
          </div>
          <span className="inline-block bg-purple-soft text-purple-deep px-td-sm py-1 rounded-full text-td-caption font-bold mb-td-sm">
            준비 중
          </span>
          <h2 className="text-td-title text-ink mb-td-xs">
            {city.name} 가이드는 곧 만나요
          </h2>
          <p className="text-td-body text-ink-soft mb-td-md">
            지금은 <strong className="text-purple-deep">베트남 우선</strong>으로
            준비하고 있어요. {city.country}({city.code}) 가이드는 다음 단계에서
            정식 공개됩니다.
          </p>

          <div className="bg-surface-soft border border-divider rounded-lg p-td-sm text-left mb-td-md">
            <p className="text-td-meta text-ink-soft mb-td-xxs">
              지금 만날 수 있는 베트남 도시
            </p>
            <div className="flex flex-wrap gap-td-xs">
              <Link
                href="/city/phu-quoc"
                className="px-td-sm py-1 bg-surface-card border border-divider rounded-full text-td-caption text-ink hover:border-purple/40"
              >
                푸꾸옥
              </Link>
              <Link
                href="/city/da-nang"
                className="px-td-sm py-1 bg-surface-card border border-divider rounded-full text-td-caption text-ink hover:border-purple/40"
              >
                다낭
              </Link>
            </div>
          </div>

          <Link
            href="/"
            className="inline-block bg-purple text-white px-td-md py-td-xs rounded-full text-td-meta font-medium hover:opacity-90 transition-opacity"
          >
            홈으로 가기
          </Link>
        </section>

        <p className="text-td-caption text-ink-mute text-center pt-td-md">
          사이클 F (V3) — 베트남 우선 노출. 비-베트남 시드는 사이클 H Country
          모델에서 재활성화됩니다.
        </p>
      </main>

      <BottomNav active="trips" />
    </div>
  );
}
