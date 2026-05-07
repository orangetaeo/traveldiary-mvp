/**
 * BentoSummary — Stitch #2 Trip Dashboard 2x2 그리드 (사이클 (Session F+1)).
 *
 * 시안 매핑:
 *   - Card 1: 일정 N곳 + "AI 검증 완료" 배지 (전부 verified일 때만)
 *   - Card 2: 예산 ₩X + 1인 ₩Y (N=0이면 "기록 없음")
 *   - Card 3: 준비물 N/M + 진행 바 + 퍼센트 (M=0이면 "준비물 미설정")
 *   - Card 4: 투표 N건 + 미응답 M건 (코랄 점)
 */

import type { TripDashboardData } from "@/lib/services/trip-dashboard";
import { formatKrw } from "@/lib/utils/format-krw";

interface BentoSummaryProps {
  data: TripDashboardData;
}

export function BentoSummary({ data }: BentoSummaryProps) {
  return (
    <section
      aria-label="여행 요약"
      className="mt-td-lg grid grid-cols-2 gap-td-sm"
    >
      <ItineraryCard data={data.itinerary} />
      <BudgetCard data={data.cost} />
      <ChecklistCard data={data.checklist} />
      <VoteCard data={data.vote} />
    </section>
  );
}

function CardShell({
  children,
  ariaLabel,
}: {
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <div
      aria-label={ariaLabel}
      className="bg-surface-card p-td-md rounded-md border border-divider shadow-[0_4px_12px_rgba(15,23,42,0.03)] flex flex-col justify-between min-h-[100px]"
    >
      {children}
    </div>
  );
}

function CardHeader({
  icon,
  label,
  iconClass,
}: {
  icon: string;
  label: string;
  iconClass: string;
}) {
  return (
    <div className="flex items-center gap-td-xs text-ink-soft text-td-meta mb-td-sm">
      <span
        className={`material-symbols-outlined text-td-icon-md ${iconClass}`}
        aria-hidden
      >
        {icon}
      </span>
      <span>{label}</span>
    </div>
  );
}

function ItineraryCard({ data }: { data: TripDashboardData["itinerary"] }) {
  return (
    <CardShell ariaLabel="일정 요약">
      <CardHeader
        icon="map"
        label={data.count > 0 ? `일정 ${data.count}곳` : "일정 미설정"}
        iconClass="text-purple"
      />
      <div>
        {data.allVerified && data.count > 0 && (
          <div className="inline-flex items-center gap-td-xs px-2 py-0.5 rounded-full bg-purple-soft text-purple-deep text-td-caption font-medium">
            <span
              className="material-symbols-outlined text-td-icon-xs"
              aria-hidden
            >
              verified_user
            </span>
            AI 검증 완료
          </div>
        )}
        {!data.allVerified && data.verifiedCount > 0 && (
          <p className="text-td-caption text-ink-mute tabular-nums">
            검증 {data.verifiedCount}/{data.count}곳
          </p>
        )}
      </div>
    </CardShell>
  );
}

function BudgetCard({ data }: { data: TripDashboardData["cost"] }) {
  if (data.totalKrw === 0) {
    return (
      <CardShell ariaLabel="예산 요약">
        <CardHeader
          icon="payments"
          label="기록 없음"
          iconClass="text-amber"
        />
        <p className="text-td-caption text-ink-mute">아직 입력된 비용 없음</p>
      </CardShell>
    );
  }
  return (
    <CardShell ariaLabel="예산 요약">
      <CardHeader
        icon="payments"
        label={`예산 ${formatKrw(data.totalKrw)}`}
        iconClass="text-amber"
      />
      <p className="text-td-body font-medium text-ink tabular-nums">
        1인 {formatKrw(data.perPersonKrw)}
      </p>
    </CardShell>
  );
}

function ChecklistCard({ data }: { data: TripDashboardData["checklist"] }) {
  if (data.totalCount === 0) {
    return (
      <CardShell ariaLabel="체크리스트 요약">
        <CardHeader
          icon="checklist"
          label="준비물 미설정"
          iconClass="text-success"
        />
        <p className="text-td-caption text-ink-mute">템플릿 추가하기</p>
      </CardShell>
    );
  }
  return (
    <CardShell ariaLabel="체크리스트 요약">
      <CardHeader
        icon="checklist"
        label={`준비물 ${data.doneCount}/${data.totalCount}`}
        iconClass="text-success"
      />
      <div className="w-full">
        <div className="flex justify-between items-center mb-td-xxs">
          <span className="text-td-caption text-ink-mute tabular-nums">
            {data.percent}% 완료
          </span>
        </div>
        <div className="w-full bg-surface-soft rounded-full h-1.5">
          <div
            className="bg-success h-1.5 rounded-full"
            style={{ width: `${data.percent}%` }}
            role="progressbar"
            aria-valuenow={data.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`체크리스트 ${data.percent}%`}
          />
        </div>
      </div>
    </CardShell>
  );
}

function VoteCard({ data }: { data: TripDashboardData["vote"] }) {
  if (data.totalCount === 0) {
    return (
      <CardShell ariaLabel="투표 요약">
        <CardHeader icon="how_to_vote" label="투표 없음" iconClass="text-purple" />
        <p className="text-td-caption text-ink-mute">새 투표 만들기</p>
      </CardShell>
    );
  }
  return (
    <CardShell ariaLabel="투표 요약">
      <CardHeader
        icon="how_to_vote"
        label={`투표 ${data.totalCount}건`}
        iconClass="text-purple"
      />
      {data.pendingCount > 0 ? (
        <div className="flex items-center gap-td-xs">
          <div className="w-2 h-2 rounded-full bg-accent" aria-hidden />
          <p className="text-td-body font-medium text-ink">
            미응답 {data.pendingCount}건
          </p>
        </div>
      ) : (
        <p className="text-td-caption text-ink-mute">전부 응답 완료</p>
      )}
    </CardShell>
  );
}
