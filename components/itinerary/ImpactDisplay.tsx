import type { ReplanImpact } from "@/lib/types";

/**
 * 변경 영향 시각화 (T17 / docs/02-magic-moments.md M3 / Stitch ImpactDisplay 시안 매칭).
 *
 * 색상 매핑:
 *   positive → success (초록) — 계획대로 가능
 *   negative → amber  (앰버)  — 주의 필요
 *   neutral  → ink-mute (회색) — 중립적 정보
 *
 * 빨강은 절대 위험에만. 우리 enum은 3종 유지(positive/negative/neutral).
 *
 * 시안 룰:
 * - 테이블 행 패턴 (행 사이 border-b)
 * - dot w-2 h-2 + key + value
 * - value는 tabular-nums (숫자 정렬)
 * - 마지막 행은 border-b 없음
 */
export function ImpactDisplay({ impacts }: { impacts: ReplanImpact[] }) {
  if (impacts.length === 0) return null;

  return (
    <div className="flex flex-col">
      {impacts.map((impact, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-td-sm py-td-sm border-b border-divider last:border-b-0"
        >
          <div className="flex items-center gap-td-sm min-w-0">
            <Dot tone={impact.tone} />
            <span className="text-td-body text-ink truncate">{impact.key}</span>
          </div>
          <span
            className={`text-td-body font-medium tabular-nums shrink-0 ${textTone(impact.tone)}`}
          >
            {impact.value}
          </span>
        </div>
      ))}
    </div>
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
      className={`w-2 h-2 rounded-full shrink-0 ${cls}`}
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
