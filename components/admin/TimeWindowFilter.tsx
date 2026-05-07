/**
 * admin dashboard 시간 윈도우 chip — 사이클 XXX (RR 답습 추출).
 *
 * RR(M2 dashboard) 인라인 도입 → XXX(affiliate dashboard) 2번째 사용처 추출.
 * Server Component (Link 이동, 클라이언트 상태 0 — RR 동형 a11y radiogroup).
 */

import Link from "next/link";
import type { WindowOption } from "@/lib/admin/window-filter";

interface Props {
  /** 현재 적용된 windowDays (undefined = 전체) */
  current: WindowOption | undefined;
  /** dashboard 라우트 (예: "/admin/affiliate", "/admin/m2-skip-reasons") */
  basePath: string;
}

export function TimeWindowFilter({ current, basePath }: Props) {
  const baseChip =
    "shrink-0 px-3 py-1.5 rounded-full text-td-meta font-semibold border transition-colors flex items-center";
  const inactive =
    "bg-surface-card border-divider text-ink-soft hover:text-ink hover:border-ink-mute";
  const active = "bg-ink text-white border-ink";

  const options: Array<{
    label: string;
    href: string;
    isActive: boolean;
  }> = [
    {
      label: "전체",
      href: basePath,
      isActive: current === undefined,
    },
    {
      label: "최근 7일",
      href: `${basePath}?window=7`,
      isActive: current === 7,
    },
    {
      label: "최근 30일",
      href: `${basePath}?window=30`,
      isActive: current === 30,
    },
  ];

  return (
    <div
      className="flex gap-2 overflow-x-auto hide-scrollbar pb-1"
      role="radiogroup"
      aria-label="시간 윈도우"
    >
      {options.map((opt) => (
        <Link
          key={opt.label}
          href={opt.href}
          role="radio"
          aria-checked={opt.isActive ? "true" : "false"}
          prefetch={false}
          className={`${baseChip} ${opt.isActive ? active : inactive}`}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );
}
