/**
 * /shared 페이지 하위 카드 컴포넌트 3종.
 * EmptyGuide / ActiveCard / InactiveCard.
 */

import Link from "next/link";

export interface SharedLookupItem {
  key: string;
  found: boolean;
  status: "active" | "revoked" | "expired" | "not_found";
  destination?: string;
  nights?: number;
  startDate?: string;
  expiresAt?: string;
  addedAt: number;
}

export function EmptyGuide() {
  const steps = [
    {
      icon: "chat",
      title: "일행에게 링크 받기",
      desc: "카카오톡·메시지 등으로 traveldiary-mvp.../share/... 형식 링크를 받아요.",
    },
    {
      icon: "open_in_new",
      title: "링크 한 번 열기",
      desc: "받은 링크를 누르면 일정 화면이 열리고, 동시에 이 목록에 자동 등록돼요.",
    },
    {
      icon: "inbox",
      title: "여기서 다시 찾기",
      desc: "다음부터는 이 페이지에서 받은 모든 여행을 한눈에 볼 수 있어요.",
    },
  ];

  return (
    <section aria-label="공유 받기 가이드" className="py-8">
      <div className="text-center mb-6">
        <span
          className="material-symbols-outlined text-5xl text-purple-soft"
          aria-hidden
        >
          inbox
        </span>
        <h2 className="text-lg font-semibold text-ink mt-2">
          받은 여행이 없습니다
        </h2>
        <p className="text-sm text-ink-mute mt-1">
          일행과 함께 여행을 둘러볼 때 여기에 모입니다.
        </p>
      </div>

      <ol className="space-y-3" aria-label="3단계 가이드">
        {steps.map((step, idx) => (
          <li
            key={step.icon}
            className="flex gap-3 bg-surface-card border border-divider rounded-xl p-4"
          >
            <div className="flex-none w-8 h-8 rounded-full bg-purple-soft text-purple-deep flex items-center justify-center text-sm font-bold tabular-nums">
              {idx + 1}
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                <span
                  className="material-symbols-outlined text-[18px] text-purple"
                  aria-hidden
                >
                  {step.icon}
                </span>
                {step.title}
              </p>
              <p className="text-xs text-ink-mute mt-1 leading-relaxed">
                {step.desc}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 bg-surface-card border border-divider rounded-xl p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">
            내 여행을 공유하고 싶나요?
          </p>
          <p className="text-xs text-ink-mute mt-1">
            일정 화면 → 함께 보기 → 공유 링크.
          </p>
        </div>
        <Link
          href="/trips"
          className="flex-none text-purple text-sm font-medium hover:text-purple-deep"
        >
          내 여행 →
        </Link>
      </div>
    </section>
  );
}

export function ActiveCard({ item }: { item: SharedLookupItem }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <h4 className="text-td-card-title text-ink truncate">
          {item.destination ?? "여행"}
        </h4>
        <p className="text-td-meta text-ink-mute">
          {typeof item.nights === "number" && `${item.nights}박 ${item.nights + 1}일`}
          {item.startDate && ` · ${item.startDate.slice(0, 10)}`}
        </p>
        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-purple/10 text-purple text-[10px] font-bold">
          활성
        </span>
      </div>
      <span className="material-symbols-outlined text-purple" aria-hidden>
        chevron_right
      </span>
    </div>
  );
}

export function InactiveCard({ item }: { item: SharedLookupItem }) {
  const label =
    item.status === "revoked"
      ? "공유 취소됨"
      : item.status === "expired"
        ? "만료됨"
        : "더 이상 찾을 수 없음";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <h4 className="text-td-card-title text-ink truncate">
          {item.destination ?? "여행"}
        </h4>
        <div className="mt-1 inline-flex items-center gap-1 text-amber-700 text-[10px] font-bold">
          <span className="material-symbols-outlined text-[12px]">link_off</span>
          {label}
        </div>
      </div>
    </div>
  );
}
