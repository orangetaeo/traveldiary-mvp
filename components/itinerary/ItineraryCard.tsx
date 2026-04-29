import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CategoryBadge } from "./CategoryBadge";
import type { ItineraryItem } from "@/lib/types";

interface ItineraryCardProps {
  item: ItineraryItem;
  /** 카드 클릭 시 이동할 URL 베이스. 없으면 표시만. */
  hrefBase?: string;
}

/**
 * 일정 카드 — 일정 전체 화면(Day 탭)의 단위 행.
 *
 * 룰 (T17 / 03-style-system.md):
 * - variant="raised" — 주요 단위
 * - 시간 + 이름 + 카테고리 배지
 * - 근거 첫 줄 미리보기 (사용자가 패널을 열기 전에도 가치 노출)
 * - flexibility="booked" → 우상단 "예약 완료" 초록 배지
 */
export function ItineraryCard({ item, hrefBase }: ItineraryCardProps) {
  const time = formatTime(item.scheduledAt);
  const firstReason = item.evidence.reasons[0];

  const body = (
    <Card variant="raised">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-[13px] font-medium text-ink tabular-nums">
            {time}
          </span>
          <span className="text-[11px] text-ink-mute">
            {item.durationMinutes}분
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {item.flexibility === "booked" && (
            <Badge tone="success">예약 완료</Badge>
          )}
          <CategoryBadge category={item.category} />
        </div>
      </div>

      <h3 className="text-[15px] font-medium leading-tight mb-1 truncate">
        {item.name}
      </h3>

      {firstReason && (
        <p className="text-[11px] text-purple-deep line-clamp-1">
          ▾ {firstReason}
        </p>
      )}
    </Card>
  );

  if (!hrefBase) return body;

  return (
    <Link
      href={`${hrefBase}/item/${item.id}`}
      className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple rounded-lg"
    >
      {body}
    </Link>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}
