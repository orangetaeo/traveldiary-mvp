/**
 * /shared — 받은 ShareLink 목록 (사이클 W, M7 미니).
 *
 * LocalStorage(td_received_share_keys)에서 받은 syncKey 목록을 읽고
 * /api/share/lookup으로 실시간 상태(active/revoked/expired) 검증.
 *
 * BottomNav 4슬롯은 변경 X (사이클 I/O 답습 위반 방지) — 헤더 뒤로가기 + /trips 링크만.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  listReceivedKeys,
  removeReceivedKey,
  type ReceivedKey,
} from "@/lib/share/receivedKeys";

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
        {state.kind === "loading" && (
          <p className="text-sm text-ink-mute">불러오는 중…</p>
        )}

        {state.kind === "empty" && (
          <div className="text-center py-12">
            <p className="text-base text-ink mb-2">받은 여행이 없습니다</p>
            <p className="text-sm text-ink-mute">
              일행이 보낸 공유 링크(/share/...)를 한 번 열면 여기에 자동으로 모입니다.
            </p>
          </div>
        )}

        {state.kind === "error" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              상태 조회 실패: {state.message}
            </p>
          </div>
        )}

        {state.kind === "list" && (
          <ul className="flex flex-col gap-3">
            {state.items.map((it) => (
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
      </div>
    </main>
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
