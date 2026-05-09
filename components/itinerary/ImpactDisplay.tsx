import type { ReplanImpact } from "@/lib/types";

/**
 * 변경 영향 시각화 (T17 / docs/02-magic-moments.md M3 / Stitch ImpactDisplay 시안 매칭).
 *
 * Stitch screen: 3ab6bad319854d6483bc148cd01bb0fc
 *
 * 톤 색상 매핑 (4종):
 *   positive → success (초록) — 계획대로 가능
 *   negative → amber  (앰버)  — 주의 필요 (지연, 타이트한 스케줄)
 *   danger   → danger (빨강)  — 불가, 폐점, 치명적 충돌
 *   neutral  → ink-mute (회색) — 중립적 정보
 *
 * 빨강은 절대 위험에만. 우리 enum은 4종 유지.
 *
 * 시안 구조:
 *   Variant A (Full Detail) — 헤더("예상 변경 요약" + "Live Replan" 배지) + 행 + CTA
 *   Variant B (Compact)     — "영향 N건 확인" 요약 한 줄
 *   기본 (헤더 없음)         — 기존 호출처 BC (ReplanModal 카드 안)
 *
 * 시안 룰:
 * - 테이블 행 패턴 (행 사이 border-b)
 * - dot w-2 h-2 + key + value
 * - value는 tabular-nums (숫자 정렬)
 * - 마지막 행은 border-b 없음
 */

interface ImpactDisplayProps {
  impacts: ReplanImpact[];
  /** 헤더 표시 ("예상 변경 요약" + "Live Replan" 배지) */
  showHeader?: boolean;
  /** compact 변형 — "영향 N건 확인" 한 줄 요약 */
  compact?: boolean;
  /** CTA 버튼 라벨 (showHeader 모드에서만 표시) */
  ctaLabel?: string;
  /** CTA 클릭 핸들러 */
  onCtaClick?: () => void;
}

export function ImpactDisplay({
  impacts,
  showHeader = false,
  compact = false,
  ctaLabel,
  onCtaClick,
}: ImpactDisplayProps) {
  if (impacts.length === 0) return null;

  if (compact) {
    return (
      <div className="flex items-center justify-between py-td-xs px-td-sm">
        <span className="text-td-meta text-ink-soft">
          영향 {impacts.length}건 확인
        </span>
        <span className="text-td-meta text-purple-deep font-medium">
          상세보기
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {showHeader && (
        <div className="flex items-center justify-between mb-td-sm">
          <span className="text-td-body font-medium text-ink">
            예상 변경 요약
          </span>
          <span className="px-2 py-0.5 rounded-full bg-accent-soft text-accent-deep text-td-caption font-bold">
            Live Replan
          </span>
        </div>
      )}

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

      {showHeader && ctaLabel && onCtaClick && (
        <button
          type="button"
          onClick={onCtaClick}
          className="mt-td-sm w-full py-td-sm bg-ink text-white font-medium rounded-md active:scale-[0.98] transition-transform text-td-body"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}

function Dot({ tone }: { tone: ReplanImpact["tone"] }) {
  const cls = (() => {
    switch (tone) {
      case "positive": return "bg-success";
      case "negative": return "bg-amber";
      case "danger":   return "bg-danger";
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
    case "danger":   return "text-danger-deep";
    default:         return "text-ink";
  }
}
