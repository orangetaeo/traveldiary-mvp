"use client";

/**
 * /trips 페이지 받은 여행 섹션 — 옵션 K (사이클 BB, 2026-05-07).
 *
 * 갭: 받은 여행은 /shared 라우트에만 가시화되어 메인 /trips에서 보이지 않음.
 *     M7 share moment 정체성(MyIdentityPanel/MyActivitySection) 보존을 위해
 *     /shared 페이지를 그대로 두고, /trips에 client island 섹션으로 받은 여행 미리보기 추가.
 *
 * 동작:
 *   - LocalStorage(td_received_share_keys)에서 받은 syncKey 읽기 (mount 후만)
 *   - /api/share/lookup 호출로 active 상태 검증
 *   - active 0개 → 섹션 hidden
 *   - active 1+개 → 최대 3개 미리보기 + "전체 보기 →" 링크
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  listReceivedKeys,
  type ReceivedKey,
} from "@/lib/share/receivedKeys";
import type { SharedLookupItem } from "@/components/share/SharedPageCards";

const MAX_PREVIEW = 3;

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; activeItems: SharedLookupItem[]; totalCount: number };

export function ReceivedTripsSection() {
  const [state, setState] = useState<State>({ kind: "idle" });

  useEffect(() => {
    const local: ReceivedKey[] = listReceivedKeys();
    if (local.length === 0) {
      setState({ kind: "idle" });
      return;
    }

    setState({ kind: "loading" });
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

        const merged: SharedLookupItem[] = data.items.map((it) => {
          const cached = meta.get(it.key);
          return {
            ...it,
            destination: it.destination ?? cached?.cachedDestination,
            nights: it.nights ?? cached?.cachedNights,
            addedAt: cached?.addedAt ?? Date.now(),
          };
        });
        const activeItems = merged.filter((it) => it.status === "active");
        setState({
          kind: "ready",
          activeItems,
          totalCount: merged.length,
        });
      } catch {
        // 조회 실패 시 섹션 숨김 — /shared 페이지에서 재시도 가능
        if (cancelled) return;
        setState({ kind: "idle" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "idle") return null;
  if (state.kind === "loading") {
    return (
      <ReceivedTripsListView
        items={[]}
        totalCount={0}
        loading
      />
    );
  }
  if (state.activeItems.length === 0) return null;

  return (
    <ReceivedTripsListView
      items={state.activeItems}
      totalCount={state.totalCount}
      loading={false}
    />
  );
}

interface ListViewProps {
  items: SharedLookupItem[];
  totalCount: number;
  loading: boolean;
}

export function ReceivedTripsListView({
  items,
  totalCount,
  loading,
}: ListViewProps) {
  const preview = items.slice(0, MAX_PREVIEW);
  const overflow = Math.max(0, items.length - MAX_PREVIEW);

  return (
    <section
      aria-label="받은 여행"
      className="px-4 pb-4"
      data-testid="received-trips-section"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span
            className="material-symbols-outlined text-purple text-td-icon"
            aria-hidden
          >
            inbox
          </span>
          <h2 className="text-td-card-title text-ink">받은 여행</h2>
          {!loading && (
            <span className="text-td-meta text-ink-mute tabular-nums">
              {items.length}개
            </span>
          )}
        </div>
        <Link
          href="/shared"
          className="text-td-caption text-purple font-medium hover:underline"
          aria-label="받은 여행 전체 보기"
        >
          전체 보기 →
        </Link>
      </div>

      {loading ? (
        <p className="text-td-caption text-ink-mute">불러오는 중…</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {preview.map((it) => (
            <li
              key={it.key}
              className="bg-surface-card rounded-md border-2 border-purple/30 overflow-hidden shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
            >
              <Link
                href={`/share/${it.key}`}
                className="flex items-center gap-3 p-3 hover:bg-surface-soft transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple"
                aria-label={`${it.destination ?? "여행"} 받은 여행 상세 보기`}
              >
                <span
                  className="material-symbols-outlined text-purple text-td-icon-lg"
                  aria-hidden
                >
                  group
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-td-body text-ink truncate font-medium">
                    {it.destination ?? "여행"}
                  </p>
                  <p className="text-td-caption text-ink-mute tabular-nums">
                    {typeof it.nights === "number" &&
                      `${it.nights}박 ${it.nights + 1}일`}
                    {it.startDate && ` · ${it.startDate.slice(0, 10)}`}
                  </p>
                </div>
                <span
                  className="material-symbols-outlined text-purple"
                  aria-hidden
                >
                  chevron_right
                </span>
              </Link>
            </li>
          ))}
          {overflow > 0 && (
            <li className="text-center">
              <Link
                href="/shared"
                className="inline-block text-td-caption text-purple-deep hover:underline px-3 py-1.5"
                aria-label={`+${overflow}개 더 보기`}
              >
                +{overflow}개 더 보기
              </Link>
            </li>
          )}
          {totalCount > items.length && (
            <li className="text-td-caption text-ink-mute tabular-nums px-1">
              만료/취소된 {totalCount - items.length}개는 /shared에서 확인
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
