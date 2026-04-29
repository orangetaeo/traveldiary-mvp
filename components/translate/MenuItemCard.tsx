import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { AllergenMatch } from "@/lib/allergens";
import type { MenuItem } from "@/lib/seed/menu-phu-quoc";

interface MenuItemCardProps {
  item: MenuItem;
  matches: AllergenMatch[];
}

/**
 * 메뉴 항목 카드 (M4) — 원문 + 음운 + 번역 + 알레르기 경고.
 *
 * 룰 (T17 / S-08):
 *   - critical 매치 → 빨간 카드 + 경고 아이콘
 *   - preference 매치 → 앰버 태그
 *   - 한국인 인기도 ≥ 80 → "한국인 BEST" 앰버 배지 (사회적 증거)
 */
export function MenuItemCard({ item, matches }: MenuItemCardProps) {
  const critical = matches.some((m) => m.severity === "critical");
  const preference = matches.some((m) => m.severity === "preference");

  return (
    <Card variant={critical ? "raised" : "raised"} className={critical ? "border-danger" : ""}>
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {critical && <Badge tone="danger">⚠️ 위험</Badge>}
          {!critical && preference && <Badge tone="amber">제외 식이 포함</Badge>}
          {item.koreanPopularity != null && item.koreanPopularity >= 80 && (
            <Badge tone="amber">한국인 BEST</Badge>
          )}
        </div>
        <span className="text-[12px] tabular-nums text-ink-soft shrink-0">
          {item.price.krw.toLocaleString()}원
        </span>
      </div>

      <p className="text-[16px] font-medium text-ink leading-tight mb-0.5">
        {item.original}
      </p>
      <p className="text-[11px] text-ink-mute mb-1.5">{item.phonetic}</p>
      <p className="text-[14px] text-ink mb-2">{item.translated}</p>

      {item.culturalNote && (
        <p className="text-[12px] text-ink-soft leading-relaxed mb-2">
          {item.culturalNote}
        </p>
      )}

      <div className="flex items-center gap-1.5 flex-wrap">
        {item.ingredients.slice(0, 5).map((ing) => {
          const matched = matches.some((m) =>
            ing.toLowerCase().includes(m.keyword.toLowerCase()) ||
            m.keyword.toLowerCase().includes(ing.toLowerCase()),
          );
          return (
            <span
              key={ing}
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                matched
                  ? "bg-danger-soft text-danger-deep border border-danger/30"
                  : "bg-surface-soft text-ink-soft"
              }`}
            >
              {ing}
            </span>
          );
        })}
      </div>

      {matches.length > 0 && (
        <div className={`mt-2.5 pt-2 border-t border-divider text-[11px] ${
          critical ? "text-danger-deep" : "text-amber-deep"
        }`}>
          {matches.map((m, i) => (
            <p key={i}>
              {m.severity === "critical" ? "⚠️ " : "· "}
              <span className="font-medium">{m.category}</span>
              <span className="text-ink-mute"> — &ldquo;{m.keyword}&rdquo; 발견</span>
            </p>
          ))}
        </div>
      )}
    </Card>
  );
}
