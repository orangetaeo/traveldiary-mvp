/**
 * 리마인더 시간 placeholder 페이지 — 사이클 U-deadlinks (2026-05-07).
 *
 * settings 데드 링크 청소 박제 답습. 정식 리마인더 설정은
 * (1) Web Push 알림 권한 (Service Worker 도입 후), (2) 사용자별
 * 발송 시간대 저장, (3) timezone 처리 — 모두 R1 사인오프 + ADR
 * 필요. 본 사이클은 placeholder shell만.
 *
 * server component (정적 마크업).
 */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "리마인더 시간 — TRAVELDIARY",
  description: "TravelDiary 일정 리마인더 발송 시간 설정 (정식 출시 시점 활성).",
};

const PRESETS = [
  { label: "출발 30분 전", description: "기본값. 가까운 일정 알림에 적합." },
  { label: "출발 1시간 전", description: "이동 거리가 멀거나 준비 시간이 필요한 일정." },
  { label: "출발 2시간 전", description: "공항·기차 등 사전 체크인 필요한 일정." },
  { label: "당일 아침 8시", description: "오늘 전체 일정 모닝 브리핑." },
];

export default function SettingsReminderPage() {
  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      <header className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-divider flex items-center px-4 h-14">
        <Link
          href="/settings"
          aria-label="설정으로 돌아가기"
          className="p-2 rounded-full hover:bg-surface-soft transition-colors"
        >
          <span className="material-symbols-outlined text-ink">arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold tracking-tight text-ink ml-td-xs">
          리마인더 시간
        </h1>
      </header>

      <main className="max-w-md mx-auto px-td-md py-td-lg">
        <div className="flex flex-col items-center mb-td-md">
          <div className="w-16 h-16 rounded-full bg-purple-soft flex items-center justify-center mb-td-sm">
            <span
              className="material-symbols-outlined text-purple-deep text-3xl"
              aria-hidden
            >
              schedule
            </span>
          </div>
          <h2 className="text-td-title text-ink text-center mb-td-xxs">
            언제 알려드릴까요?
          </h2>
          <p className="text-td-body text-ink-soft text-center">
            일정마다 알림 시간을 미리 정해두면 편해요.
          </p>
        </div>

        <section
          aria-labelledby="reminder-presets-heading"
          className="bg-surface-card rounded-md border border-divider p-td-md mb-td-md"
        >
          <h3
            id="reminder-presets-heading"
            className="text-td-meta text-ink-soft font-bold uppercase tracking-wider mb-td-xs"
          >
            프리셋
          </h3>
          <ul className="space-y-td-sm">
            {PRESETS.map((preset, i) => (
              <li
                key={i}
                className="flex items-start gap-td-sm border-b border-divider last:border-b-0 pb-td-xs last:pb-0"
              >
                <span
                  className="material-symbols-outlined text-purple-deep text-[20px] mt-0.5 shrink-0"
                  aria-hidden
                >
                  alarm
                </span>
                <div className="flex-1">
                  <p className="text-td-body font-bold text-ink">
                    {preset.label}
                  </p>
                  <p className="text-td-caption text-ink-soft">
                    {preset.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section
          role="note"
          aria-live="polite"
          className="bg-amber-soft border border-amber/30 rounded-md p-td-sm mb-td-md"
        >
          <div className="flex items-start gap-td-xs">
            <span
              className="material-symbols-outlined text-amber-deep text-lg shrink-0 mt-0.5"
              aria-hidden
            >
              info
            </span>
            <div>
              <p className="text-td-body font-bold text-amber-deep mb-td-xxs">
                준비 중
              </p>
              <p className="text-td-caption text-amber-deep/85">
                Web Push 알림 권한 + Service Worker 도입 + R1 사인오프 후
                활성됩니다. 그 전까지 기본값(출발 30분 전)으로 일정 상세
                화면에서 안내드립니다.
              </p>
            </div>
          </div>
        </section>

        <Link
          href="/permission/notification"
          className="block w-full rounded-md bg-purple text-surface-card font-bold py-td-sm text-center hover:bg-purple-deep transition-colors"
        >
          알림 권한 먼저 허용하기
        </Link>

        <Link
          href="/settings"
          className="mt-td-md block text-td-meta text-ink-soft hover:underline text-center"
        >
          ← 설정으로
        </Link>
      </main>
    </div>
  );
}
