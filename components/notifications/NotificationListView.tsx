"use client";

/**
 * NotificationListView — 알림 센터 (Stitch 디자인 적용).
 *
 * 필터 탭 + 시간 그룹별 알림 카드 리스트.
 * DB 미구현 단계 — 데모 시드 데이터 기반.
 */

import { useState } from "react";
import Link from "next/link";
import { COLOR_BG, COLOR_TEXT } from "@/lib/utils/color-mappings";
import type { AppNotification, NotificationCategory } from "@/lib/types";

// ─── Types ─────────────────────────────────────

export type { NotificationCategory, AppNotification } from "@/lib/types";

interface Props {
  notifications: AppNotification[];
}

// ─── Filter ────────────────────────────────────

type FilterKey = "all" | NotificationCategory;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "travel", label: "여행" },
  { key: "companion", label: "동행" },
  { key: "system", label: "시스템" },
];

// ─── Helpers ───────────────────────────────────

function groupByTime(items: AppNotification[]): { label: string; items: AppNotification[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; items: AppNotification[] }[] = [
    { label: "오늘", items: [] },
    { label: "어제", items: [] },
    { label: "지난주", items: [] },
    { label: "이전", items: [] },
  ];

  for (const n of items) {
    const d = new Date(n.createdAt);
    if (d >= today) groups[0].items.push(n);
    else if (d >= yesterday) groups[1].items.push(n);
    else if (d >= weekAgo) groups[2].items.push(n);
    else groups[3].items.push(n);
  }

  return groups.filter((g) => g.items.length > 0);
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  return `${Math.floor(days / 7)}주 전`;
}


// ─── Component ─────────────────────────────────

export function NotificationListView({ notifications }: Props) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered =
    filter === "all"
      ? notifications
      : notifications.filter((n) => n.category === filter);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const groups = groupByTime(filtered);

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      {/* Header */}
      <header className="bg-surface-card/90 backdrop-blur-md border-b border-divider sticky top-0 z-40 flex items-center w-full px-td-md h-14">
        <Link
          href="/"
          aria-label="뒤로"
          className="p-2 rounded-full hover:bg-surface-soft transition-colors mr-td-sm"
        >
          <span className="material-symbols-outlined text-ink">arrow_back</span>
        </Link>
        <h1 className="text-td-title font-bold text-ink tracking-tight">알림</h1>
        {unreadCount > 0 && (
          <span className="ml-td-xs bg-purple text-white text-td-caption font-bold px-td-xs py-[1px] rounded-full min-w-[20px] text-center">
            {unreadCount}
          </span>
        )}
      </header>

      {/* Filter Tabs */}
      <div className="sticky top-14 z-30 bg-surface-card/90 backdrop-blur-sm px-td-md py-td-sm flex gap-td-xs overflow-x-auto touch-pan-x overscroll-x-contain hide-scrollbar border-b border-divider">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-td-md py-td-xs rounded-full text-td-body font-medium shrink-0 transition-colors ${
              filter === f.key
                ? "bg-purple text-white"
                : "bg-surface-soft text-ink-soft border border-divider hover:bg-surface-card"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <main className="max-w-xl mx-auto px-td-md py-td-lg">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-5xl text-ink-mute mb-td-sm">
              notifications_off
            </span>
            <p className="text-td-body text-ink-soft">아직 알림이 없어요</p>
          </div>
        ) : (
          <div className="space-y-td-lg">
            {groups.map((group) => (
              <section key={group.label}>
                <h2 className="text-td-caption text-ink-mute font-medium mb-td-sm px-td-xs">
                  {group.label}
                </h2>
                <ul className="space-y-td-sm">
                  {group.items.map((n) => (
                    <NotificationCard key={n.id} notification={n} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Card ──────────────────────────────────────

function NotificationCard({ notification: n }: { notification: AppNotification }) {
  const cardClass = `relative flex gap-td-sm p-td-sm bg-surface-card border border-divider rounded-md transition-colors hover:bg-surface-soft cursor-pointer ${
    n.read ? "opacity-70" : ""
  }`;

  const inner = (
    <>
      {/* Unread dot */}
      {!n.read && (
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-purple rounded-full" />
      )}

      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${COLOR_BG[n.iconColor]}`}
      >
        <span className={`material-symbols-outlined ${COLOR_TEXT[n.iconColor]}`}>
          {n.icon}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-td-xs mb-td-xxs">
          <h3
            className={`text-td-body truncate ${
              n.read ? "font-medium text-ink-soft" : "font-semibold text-ink"
            }`}
          >
            {n.title}
          </h3>
          <span
            className={`text-td-caption shrink-0 whitespace-nowrap ${
              n.read ? "text-ink-mute" : "text-purple"
            }`}
          >
            {formatRelativeTime(n.createdAt)}
          </span>
        </div>
        <p className="text-td-body text-ink-soft line-clamp-2">{n.body}</p>
      </div>
    </>
  );

  return (
    <li className="list-none">
      {n.href ? (
        <Link href={n.href} className={cardClass}>
          {inner}
        </Link>
      ) : (
        <div className={cardClass}>
          {inner}
        </div>
      )}
    </li>
  );
}
