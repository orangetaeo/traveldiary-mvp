/**
 * /shared — 받은 ShareLink 목록 (사이클 W, M7 미니).
 *
 * LocalStorage(td_received_share_keys)에서 받은 syncKey 목록을 읽고
 * /api/share/lookup으로 실시간 상태(active/revoked/expired) 검증.
 *
 * 사이클 BLOCKER5a: BottomNav 추가 (PRD §2 BLOCKER 5 — 9 페이지 확장).
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  listReceivedKeys,
  removeReceivedKey,
  type ReceivedKey,
} from "@/lib/share/receivedKeys";
import {
  sortReceived,
  SORT_LABELS,
  type ReceivedSortMode,
} from "@/lib/share/sortReceived";
import {
  filterReceived,
  STATUS_FILTER_LABELS,
  type ReceivedStatusFilter,
} from "@/lib/share/filterReceived";
import { MyIdentityPanel } from "@/components/share/MyIdentityPanel";
import { MyActivitySection } from "@/components/share/MyActivitySection";
import { BottomNav } from "@/components/ui/BottomNav";
import {
  EmptyGuide,
  ActiveCard,
  InactiveCard,
  type SharedLookupItem,
} from "@/components/share/SharedPageCards";

type ViewState =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "error"; message: string }
  | { kind: "list"; items: SharedLookupItem[] };

export default function SharedListPage() {
  const [state, setState] = useState<ViewState>({ kind: "loading" });
  const [sortMode, setSortMode] = useState<ReceivedSortMode>("addedAtDesc");
  // 사이클 KK — 검색 + 상태 필터
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ReceivedStatusFilter>("all");

  const visibleItems = useMemo(() => {
    if (state.kind !== "list") return [];
    const filtered = filterReceived(state.items, query, statusFilter);
    return sortReceived(filtered, sortMode);
  }, [state, sortMode, query, statusFilter]);

  useEffect(() => {
    const local: ReceivedKey[] = listReceivedKeys();
    if (local.length === 0) {
      setState({ kind: "empty" });
      return;
    }

    const keys = local.map((k) => k.key);
    const meta = new Map(local.map((k) => [k.key, k]));

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/share/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keys }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { items: SharedLookupItem[] };
        if (cancelled) return;

        const merged = data.items.map((it) => {
          const cached = meta.get(it.key);
          return {
            ...it,
            destination: it.destination ?? cached?.cachedDestination,
            nights: it.nights ?? cached?.cachedNights,
            addedAt: cached?.addedAt ?? Date.now(),
          };
        });
        setState({ kind: "list", items: merged });
      } catch (err) {
        if (cancelled) return;
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "알 수 없는 오류",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleRemove(key: string) {
    removeReceivedKey(key);
    setState((prev) => {
      if (prev.kind !== "list") return prev;
      const items = prev.items.filter((it) => it.key !== key);
      return items.length === 0 ? { kind: "empty" } : { kind: "list", items };
    });
  }

  return (
    <main className="bg-surface min-h-dvh pb-24" aria-label="받은 여행 목록">
      <BottomNav active="trips" />
      <header className="sticky top-0 z-10 bg-surface-card/95 backdrop-blur-sm border-b border-divider">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/trips"
            className="text-purple transition-colors"
            aria-label="Trips으로"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-lg font-semibold text-ink">받은 여행</h1>
          <span className="w-10" aria-hidden />
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 사이클 SS — 내 정보 (clientUuid + nickname) */}
        <MyIdentityPanel />

        {/* 사이클 YY — 본인 활동 (clientUuid 기반 ShareComment 내역) */}
        <MyActivitySection />

        {state.kind === "loading" && (
          <p className="text-sm text-ink-mute">불러오는 중…</p>
        )}

        {state.kind === "empty" && <EmptyGuide />}

        {state.kind === "error" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              상태 조회 실패: {state.message}
            </p>
          </div>
        )}

        {state.kind === "list" && (
          <>
            {/* 검색 input */}
            <div className="relative mb-3">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute text-[20px]">
                search
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value.slice(0, 50))}
                placeholder="도시명 검색"
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-divider rounded-xl text-td-body focus:ring-2 focus:ring-purple focus:border-transparent outline-none"
                aria-label="도시명 검색"
              />
            </div>

            {/* 상태 필터 + 정렬 */}
            <div className="flex gap-2 mb-3">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as ReceivedStatusFilter)
                }
                className="flex-1 bg-surface border border-divider rounded-lg px-3 py-2 text-td-meta appearance-none focus:ring-1 focus:ring-purple outline-none"
                aria-label="상태 필터"
              >
                {(
                  Object.keys(
                    STATUS_FILTER_LABELS,
                  ) as ReceivedStatusFilter[]
                ).map((f) => (
                  <option key={f} value={f}>
                    {STATUS_FILTER_LABELS[f]}
                  </option>
                ))}
              </select>
              <select
                value={sortMode}
                onChange={(e) =>
                  setSortMode(e.target.value as ReceivedSortMode)
                }
                className="flex-1 bg-surface border border-divider rounded-lg px-3 py-2 text-td-meta appearance-none focus:ring-1 focus:ring-purple outline-none"
                aria-label="정렬 기준"
              >
                {(Object.keys(SORT_LABELS) as ReceivedSortMode[]).map(
                  (mode) => (
                    <option key={mode} value={mode}>
                      {SORT_LABELS[mode]}
                    </option>
                  ),
                )}
              </select>
            </div>

            <p className="text-td-caption text-ink-mute tabular-nums mb-3">
              {visibleItems.length === state.items.length
                ? `${state.items.length}개`
                : `${visibleItems.length}개 / ${state.items.length}개 중`}
            </p>

            {visibleItems.length === 0 ? (
              <p className="text-td-body text-ink-mute text-center py-8 bg-white border border-divider rounded-xl">
                조건에 맞는 여행이 없어요.
              </p>
            ) : (
            <ul className="flex flex-col gap-3">
              {visibleItems.map((it) => (
              <li
                key={it.key}
                className={`bg-white rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(15,23,42,0.05)] ${
                  it.status === "active"
                    ? "border-2 border-purple"
                    : "border border-divider opacity-60"
                }`}
              >
                {it.status === "active" ? (
                  <Link
                    href={`/share/${it.key}`}
                    className="block p-4 hover:bg-surface-soft transition-colors"
                  >
                    <ActiveCard item={it} />
                  </Link>
                ) : (
                  <div className="p-4">
                    <InactiveCard item={it} />
                  </div>
                )}
                <div className="border-t border-divider px-4 py-2 flex justify-end">
                  <button
                    type="button"
                    className="text-td-caption text-ink-mute hover:text-red-600 transition-colors"
                    onClick={() => handleRemove(it.key)}
                  >
                    내 목록에서 삭제
                  </button>
                </div>
              </li>
              ))}
            </ul>
            )}
          </>
        )}
      </div>
    </main>
  );
}

