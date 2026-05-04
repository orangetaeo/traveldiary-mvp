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

interface LookupItem {
  key: string;
  found: boolean;
  status: "active" | "revoked" | "expired" | "not_found";
  destination?: string;
  nights?: number;
  startDate?: string;
  expiresAt?: string;
}

type ViewState =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "error"; message: string }
  | { kind: "list"; items: Array<LookupItem & { addedAt: number }> };

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
        const data = (await res.json()) as { items: LookupItem[] };
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
    <main className="bg-bg min-h-dvh pb-24" aria-label="받은 여행 목록">
      <BottomNav active="trips" />
      <header className="sticky top-0 z-10 bg-surface-card border-b border-divider">
        <div className="max-w-[420px] mx-auto px-4 h-12 flex items-center justify-between">
          <Link
            href="/trips"
            className="text-ink-mute text-sm hover:text-purple"
            aria-label="Trips으로"
          >
            ← 뒤로
          </Link>
          <h1 className="text-base font-semibold text-ink">받은 여행</h1>
          <span className="w-12" aria-hidden />
        </div>
      </header>

      <div className="max-w-[420px] mx-auto px-4 py-4">
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
            {/* 사이클 KK — 검색 input */}
            <div className="mb-3">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value.slice(0, 50))}
                placeholder="도시명 검색 (예: 다낭)"
                className="w-full px-3 py-2 border border-divider rounded-lg text-sm bg-surface-soft focus:outline focus:outline-purple"
                aria-label="도시명 검색"
              />
            </div>

            {/* 사이클 KK — 상태 필터 + 정렬 (둘 다 select로 일관성) */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <label className="flex items-center gap-2 text-xs text-ink-mute">
                상태
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as ReceivedStatusFilter)
                  }
                  className="border border-divider rounded-md px-2 py-1 text-xs bg-surface-soft"
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
              </label>
              <label className="flex items-center gap-2 text-xs text-ink-mute">
                정렬
                <select
                  value={sortMode}
                  onChange={(e) =>
                    setSortMode(e.target.value as ReceivedSortMode)
                  }
                  className="border border-divider rounded-md px-2 py-1 text-xs bg-surface-soft"
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
              </label>
            </div>

            <p className="text-xs text-ink-mute tabular-nums mb-3">
              {visibleItems.length === state.items.length
                ? `${state.items.length}개`
                : `${visibleItems.length}개 / ${state.items.length}개 중`}
            </p>

            {visibleItems.length === 0 ? (
              <p className="text-sm text-ink-mute text-center py-8 bg-surface-card border border-divider rounded-xl">
                조건에 맞는 여행이 없어요.
              </p>
            ) : (
            <ul className="flex flex-col gap-3">
              {visibleItems.map((it) => (
              <li
                key={it.key}
                className="bg-surface-card rounded-xl border border-divider overflow-hidden"
              >
                {it.status === "active" ? (
                  <Link
                    href={`/share/${it.key}`}
                    className="block p-4 hover:bg-surface-hover"
                  >
                    <ActiveCard item={it} />
                  </Link>
                ) : (
                  <div className="p-4 opacity-60">
                    <InactiveCard item={it} />
                  </div>
                )}
                <div className="border-t border-divider px-4 py-2 flex justify-end">
                  <button
                    type="button"
                    className="text-xs text-ink-mute hover:text-red-600"
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

function EmptyGuide() {
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

function ActiveCard({
  item,
}: {
  item: LookupItem & { addedAt: number };
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-base font-semibold text-ink">
          {item.destination ?? "여행"}
          {typeof item.nights === "number" && (
            <span className="text-sm font-normal text-ink-mute ml-2">
              {item.nights}박 {item.nights + 1}일
            </span>
          )}
        </p>
        {item.startDate && (
          <p className="text-xs text-ink-mute mt-1">
            출발 {item.startDate.slice(0, 10)}
          </p>
        )}
        <p className="text-xs text-ink-mute mt-1">
          받은 날 {new Date(item.addedAt).toLocaleDateString("ko-KR")}
        </p>
      </div>
      <span className="text-purple text-xl" aria-hidden>
        →
      </span>
    </div>
  );
}

function InactiveCard({ item }: { item: LookupItem & { addedAt: number } }) {
  const label =
    item.status === "revoked"
      ? "공유 취소됨"
      : item.status === "expired"
        ? "만료됨"
        : "더 이상 찾을 수 없음";
  return (
    <div>
      <p className="text-base font-semibold text-ink">
        {item.destination ?? "여행"}
      </p>
      <p className="text-xs text-amber-700 mt-1">{label}</p>
    </div>
  );
}
