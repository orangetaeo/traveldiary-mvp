/**
 * City Context Strip — Stitch #19 매핑 (사이클 8 M5).
 *
 * /travel/[id] 푸터 컴포넌트. trip.currentMode === "in-travel" 시에만 노출.
 * 가로 스크롤 카드 5건:
 *   1. 응급 (emergencyContacts ambulance/embassy)
 *   2. 환전 (payment.approxKrwRate)
 *   3. 교통 (transport.primary)
 *   4. 시그니처 가이드 (curatedGuides[0])
 *   5. 도시 정보 풀 페이지 → /city/[slug]
 *
 * 색상은 globals.css의 디자인 토큰 사용 (보라 #7C3AED, 코랄 #F97316, 빨강 #BA1A1A).
 */

import Link from "next/link";
import type { ResolvedCity } from "@/lib/types";

export function CityContextStrip({ city }: { city: ResolvedCity }) {
  const ambulance = city.emergencyContacts.find((c) => c.category === "ambulance");
  const embassy = city.emergencyContacts.find((c) => c.category === "embassy");
  const krwPerLocal = (1 / city.payment.approxKrwRate).toFixed(3);

  return (
    <section
      aria-label="도시 컨텍스트 (M5)"
      className="px-td-md py-td-sm"
    >
      <div className="flex overflow-x-auto gap-td-xs hide-scrollbar -mx-td-md px-td-md">
        {/* 1. 응급 */}
        <Link
          href={`/city/${city.slug}#emergency`}
          className="flex-shrink-0 w-24 h-20 bg-surface-card border border-divider rounded-md p-2 flex flex-col justify-between shadow-sm hover:border-danger/40 transition-colors"
        >
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined filled text-danger text-td-icon" aria-hidden>
              phone_in_talk
            </span>
            <span className="text-td-caption text-danger font-bold">응급</span>
          </div>
          <div className="leading-tight">
            <p className="text-[10px] text-ink-mute">{ambulance?.phone ?? "—"}</p>
            <p className="text-[10px] text-ink font-semibold truncate">
              {embassy?.label.replace(/^주\s*[^\s]+\s+/, "") ?? "한국 영사관"}
            </p>
          </div>
        </Link>

        {/* 2. 환전 */}
        <Link
          href={`/city/${city.slug}#payment`}
          className="flex-shrink-0 w-24 h-20 bg-surface-card border border-divider rounded-md p-2 flex flex-col justify-between shadow-sm hover:border-amber/40 transition-colors"
        >
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-ink-soft text-td-icon" aria-hidden>
              currency_exchange
            </span>
            <span className="text-[9px] text-amber-deep font-bold">{city.payment.currency}</span>
          </div>
          <div className="leading-tight">
            <p className="text-[10px] text-ink-mute">1{city.payment.currencySymbol} =</p>
            <p className="text-[10px] text-ink font-semibold tabular-nums">
              {krwPerLocal}원
            </p>
          </div>
        </Link>

        {/* 3. 교통 (그랩 등) */}
        <Link
          href={`/city/${city.slug}#transport`}
          className="flex-shrink-0 w-24 h-20 bg-surface-card border border-divider rounded-md p-2 flex flex-col justify-between shadow-sm hover:border-success/40 transition-colors"
        >
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-success text-td-icon" aria-hidden>
              local_taxi
            </span>
            <span className="text-td-caption text-ink-soft font-bold uppercase">
              {city.transport.primary}
            </span>
          </div>
          <div className="leading-tight">
            <p className="text-[10px] text-ink font-semibold">택시·바이크 호출</p>
          </div>
        </Link>

        {/* 4. 시그니처 가이드 (curatedGuides[0] 있을 때) */}
        {city.curatedGuides[0] && (
          <Link
            href={`/city/${city.slug}#guide-${city.curatedGuides[0].id}`}
            className="flex-shrink-0 w-24 h-20 bg-accent-soft border border-accent/40 rounded-md p-2 flex flex-col justify-between shadow-sm hover:border-accent transition-colors"
          >
            <div className="flex justify-between items-start">
              <span className="text-td-icon" aria-hidden>
                {city.curatedGuides[0].hero?.emoji ?? "✨"}
              </span>
              <span className="text-td-caption text-accent-deep font-bold">시그니처</span>
            </div>
            <div className="leading-tight">
              <p className="text-[10px] text-accent-deep font-semibold truncate">
                {city.curatedGuides[0].title}
              </p>
            </div>
          </Link>
        )}

        {/* 5. 도시 정보 풀 페이지 (메인 CTA) */}
        <Link
          href={`/city/${city.slug}`}
          className="flex-shrink-0 w-24 h-20 bg-purple-soft border border-purple/30 rounded-md p-2 flex flex-col justify-between shadow-sm hover:border-purple transition-colors"
        >
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-purple text-td-icon" aria-hidden>
              explore
            </span>
            <span className="material-symbols-outlined text-purple text-td-icon-md" aria-hidden>
              chevron_right
            </span>
          </div>
          <div className="leading-tight">
            <p className="text-[10px] text-purple-deep/70">도시 정보</p>
            <p className="text-[10px] text-purple-deep font-bold truncate">
              {city.name} 가이드 →
            </p>
          </div>
        </Link>
      </div>
    </section>
  );
}
