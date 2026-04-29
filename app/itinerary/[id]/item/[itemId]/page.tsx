import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CategoryBadge } from "@/components/itinerary/CategoryBadge";
import { EvidencePanel } from "@/components/ui/EvidencePanel";
import { getDemoItem, getDemoTrip } from "@/lib/seed";
import { fetchTripFromDb } from "@/lib/repositories/trip.repository";

/**
 * 일정 상세 화면 (LEVEL 1) — M1 추천 근거 패널의 메인 시연 화면
 *
 * 사용자 흐름:
 *   /itinerary/[id] → 카드 탭 → 이 화면
 *   → "왜 이걸 골랐나" 패널 펼침 → 근거 + 출처 + 경고 확인
 *
 * 차별 포인트 (docs/02-magic-moments.md M1):
 *   트리플·Layla는 결과만 보여줌. 우리는 근거를 노출 → 통제권 → 락인.
 */
export default async function ItineraryItemPage({
  params,
}: {
  params: { id: string; itemId: string };
}) {
  const dbBundle = await fetchTripFromDb(params.id);
  const bundle = dbBundle ?? getDemoTrip(params.id);
  const item =
    bundle?.items.find((it) => it.id === params.itemId) ??
    getDemoItem(params.id, params.itemId);
  if (!item || !bundle) notFound();

  const flexibilityBadge = (() => {
    if (item.flexibility === "booked")
      return <Badge tone="success">예약 완료</Badge>;
    if (item.flexibility === "fixed")
      return <Badge tone="neutral">고정</Badge>;
    return <Badge tone="info">유연</Badge>;
  })();

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-5 pt-5 pb-3 border-b border-divider">
        <Link
          href={`/itinerary/${params.id}`}
          className="text-[12px] text-ink-soft hover:text-ink inline-block mb-2"
        >
          ‹ 일정으로
        </Link>

        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-medium tabular-nums">
              {formatTime(item.scheduledAt)}
            </span>
            <span className="text-[12px] text-ink-mute">
              {item.durationMinutes}분 · Day {item.dayIndex + 1}
            </span>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <CategoryBadge category={item.category} />
            {flexibilityBadge}
          </div>
        </div>

        <h1 className="text-[20px] font-medium leading-tight">{item.name}</h1>
      </header>

      <div className="px-4 py-4 space-y-3 flex-1">
        {/* 위치 */}
        <Card variant="raised">
          <p className="text-[10px] font-medium text-ink-soft tracking-wider mb-1">
            위치
          </p>
          <p className="text-[13px] mb-1">{item.location.address}</p>
          <p className="text-[11px] text-ink-mute tabular-nums">
            {item.location.lat.toFixed(4)}, {item.location.lng.toFixed(4)}
          </p>
        </Card>

        {/* 가격 */}
        {item.estimatedPrice && item.estimatedPrice.amount > 0 && (
          <Card variant="raised">
            <p className="text-[10px] font-medium text-ink-soft tracking-wider mb-1">
              예상 비용 (1인)
            </p>
            <p className="text-[15px] font-medium tabular-nums">
              {item.estimatedPrice.amount.toLocaleString()} {item.estimatedPrice.currency}
            </p>
          </Card>
        )}

        {/* 추천 근거 패널 — M1 핵심 */}
        <EvidencePanel evidence={item.evidence} defaultOpen />

        {/* 우선순위·유연성 */}
        <Card variant="plain">
          <p className="text-[10px] font-medium text-ink-soft tracking-wider mb-2">
            Live Replan 정보
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Mini label="우선순위" value={`${item.priority}/5`} />
            <Mini label="유연성" value={flexibilityKr(item.flexibility)} />
            <Mini
              label="이동 가능"
              value={item.flexMinutes > 0 ? `±${item.flexMinutes}분` : "—"}
            />
          </div>
        </Card>
      </div>
    </main>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-ink-mute">{label}</p>
      <p className="text-[12px] font-medium mt-0.5">{value}</p>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function flexibilityKr(f: string): string {
  switch (f) {
    case "fixed": return "고정";
    case "booked": return "예약됨";
    case "flexible": return "유연";
    default: return f;
  }
}
