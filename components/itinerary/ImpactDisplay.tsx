import type { ReplanImpact } from "@/lib/types";

/**
 * 변경 영향 시각화 (T17 / docs/02-magic-moments.md M3 / docs/03-style-system.md ImpactDisplay).
 *
 * 색상 매핑:
 *   positive → success (초록)
 *   negative → amber  (앰버)
 *   neutral  → ink-soft (회색)
 *
 * 빨강은 절대 위험에만 — 여기서는 amber로 충분.
 */
export function ImpactDisplay({ impacts }: { impacts: ReplanImpact[] }) {
  if (impacts.length === 0) return null;

  return (
    <ul className="space-y-1.5">
      {impacts.map((impact, i) => (
        <li key={i} className="flex items-start gap-2 text-[12px]">
          <Dot tone={impact.tone} />
          <span className="flex-1 min-w-0">
            <span className="text-ink-soft">{impact.key}</span>
            <span className={`ml-1 font-medium ${textTone(impact.tone)}`}>
              {impact.value}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Dot({ tone }: { tone: ReplanImpact["tone"] }) {
  const cls = (() => {
    switch (tone) {
      case "positive": return "bg-success";
      case "negative": return "bg-amber";
      default:         return "bg-ink-mute";
    }
  })();
  return (
    <span
      className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${cls}`}
      aria-hidden="true"
    />
  );
}

function textTone(tone: ReplanImpact["tone"]): string {
  switch (tone) {
    case "positive": return "text-success-deep";
    case "negative": return "text-amber-deep";
    default:         return "text-ink";
  }
}
