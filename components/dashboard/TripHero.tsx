/**
 * TripHero — Stitch #2 Trip Dashboard Hero (사이클 (Session F+1)).
 *
 * 시안 매핑:
 *   - 220px+ 그라데이션 배경 (도시 시드 emoji + gradient — 기존 design tokens)
 *   - 좌상: "M월 D일 (요일) 출발" + "🇻🇳 도시명 N박 (N+1)일"
 *   - 우상: D-Day (출발 전 양수, 당일 0, 출발 후 음수)
 *   - 좌하: 일행 아바타 stack + "+N명"
 */

import type { ReactNode } from "react";

interface TripHeroProps {
  destination: string;
  destinationFlag?: string; // emoji (e.g. "🇻🇳")
  nights: number;
  startDateLabel: string; // "5월 13일 (화)"
  dDayValue: number; // 양수 출발 전, 0 당일, 음수 출발 후
  partySize: number;
  /** 시각 fallback — 도시 emoji + Tailwind gradient (e.g. "from-purple to-accent").
   *  city 시드(CuratedGuide.hero)가 일부 필드만 채울 수 있으므로 양쪽 optional. */
  hero?: { emoji?: string; gradient?: string };
}

const DEFAULT_EMOJI = "✈️";
const DEFAULT_GRADIENT = "from-purple to-purple-deep";

export function TripHero({
  destination,
  destinationFlag,
  nights,
  startDateLabel,
  dDayValue,
  partySize,
  hero,
}: TripHeroProps) {
  const emoji = hero?.emoji ?? DEFAULT_EMOJI;
  const gradient = hero?.gradient ?? DEFAULT_GRADIENT;
  const days = nights + 1;
  const dDayLabel = formatDDay(dDayValue);
  const dDayTone = dDayValue >= 0 ? "text-accent" : "text-ink-mute";
  const partyExtra = Math.max(0, partySize - 1); // 본인 제외 표기용 placeholder 수

  return (
    <section
      className={`mt-td-md rounded-xl overflow-hidden relative min-h-[220px] bg-gradient-to-br ${gradient} shadow-[0_4px_12px_rgba(15,23,42,0.05)]`}
    >
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"
        aria-hidden
      />
      <div
        className="absolute right-4 bottom-4 text-[120px] leading-none opacity-25 select-none"
        aria-hidden
      >
        {emoji}
      </div>

      <div className="relative p-td-md min-h-[220px] flex flex-col justify-end text-white">
        <div className="flex justify-between items-end mb-td-sm">
          <div>
            <p className="text-td-meta text-white/80 mb-td-xxs">
              {startDateLabel} 출발
            </p>
            <h2 className="text-td-title font-bold">
              {destinationFlag && (
                <span className="mr-td-xs" aria-hidden>
                  {destinationFlag}
                </span>
              )}
              {destination} {nights}박 {days}일
            </h2>
          </div>
          <div
            className={`${dDayTone} font-bold text-[32px] leading-none tabular-nums`}
          >
            {dDayLabel}
          </div>
        </div>

        <PartyAvatars partySize={partySize} extra={partyExtra} />
      </div>
    </section>
  );
}

function PartyAvatars({
  partySize,
  extra,
}: {
  partySize: number;
  extra: number;
}): ReactNode {
  if (partySize <= 1) return null;
  const visible = Math.min(3, partySize); // 최대 3명 노출
  const remaining = Math.max(0, partySize - visible);
  return (
    <div className="flex items-center mt-td-sm" aria-label={`일행 ${extra}명`}>
      <div className="flex -space-x-2">
        {Array.from({ length: visible }).map((_, i) => (
          <div
            key={i}
            className="inline-block h-8 w-8 rounded-full ring-2 ring-black/40 bg-white/30 flex items-center justify-center text-td-caption font-bold text-white"
            aria-hidden
          >
            {String.fromCharCode(65 + i)}
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <span className="ml-td-xs text-td-meta text-white/80 tabular-nums">
          +{remaining}명
        </span>
      )}
    </div>
  );
}

/** D-Day 양수→"D-N" / 0→"D-Day" / 음수→"D+N" */
function formatDDay(d: number): string {
  if (d === 0) return "D-Day";
  if (d > 0) return `D-${d}`;
  return `D+${Math.abs(d)}`;
}
