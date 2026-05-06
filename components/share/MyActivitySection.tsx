"use client";

/**
 * 사이클 YY — /shared 본인 활동 섹션 (M7 후속).
 *
 * clientUuid로 본인이 남긴 ShareComment 활동을 조회. 데이터 없으면 섹션 미노출.
 * 활성 ShareLink면 /share/[syncKey]로 이동, revoked/expired면 흐리게 표시.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOrCreateClientUuid } from "@/lib/share/clientId";
import type { MyActivityItem } from "@/lib/repositories/shareComment.repository";
import { REACTION_EMOJI } from "@/lib/constants/reaction-constants";

type ViewState =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "list"; items: MyActivityItem[] }
  | { kind: "error" };

export function MyActivitySection() {
  const [state, setState] = useState<ViewState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    const uuid = getOrCreateClientUuid();
    if (!uuid) {
      setState({ kind: "empty" });
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/share/my-activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientUuid: uuid }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { items: MyActivityItem[] };
        if (cancelled) return;
        setState(
          data.items.length === 0
            ? { kind: "empty" }
            : { kind: "list", items: data.items },
        );
      } catch {
        if (cancelled) return;
        setState({ kind: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "loading" || state.kind === "empty") return null;

  if (state.kind === "error") {
    return (
      <section
        aria-label="내 활동"
        className="bg-amber-soft border border-amber/40 rounded-xl p-4 mb-4"
      >
        <p className="text-xs text-amber-deep">
          내 활동을 불러올 수 없어요. 잠시 후 다시 시도해주세요.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="내가 남긴 메모"
      className="bg-surface-card border border-divider rounded-xl p-4 mb-4"
    >
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-ink">내가 남긴 메모</h2>
        <span className="text-[11px] text-ink-mute tabular-nums">
          {state.items.length}건
        </span>
      </header>

      <ul className="flex flex-col gap-2">
        {state.items.slice(0, 8).map((it) => (
          <li
            key={it.commentId}
            className="border border-divider rounded-lg overflow-hidden"
          >
            {it.isShareLinkActive ? (
              <Link
                href={`/share/${it.syncKey}`}
                className="block px-3 py-2 hover:bg-surface-hover"
              >
                <ActivityCardBody item={it} />
              </Link>
            ) : (
              <div className="px-3 py-2 opacity-60">
                <ActivityCardBody item={it} inactive />
              </div>
            )}
          </li>
        ))}
      </ul>

      {state.items.length > 8 && (
        <p className="text-[11px] text-ink-mute mt-2 text-right tabular-nums">
          최근 8건만 표시 — 전체 {state.items.length}건
        </p>
      )}
    </section>
  );
}

function ActivityCardBody({
  item,
  inactive = false,
}: {
  item: MyActivityItem;
  inactive?: boolean;
}) {
  const reactionEmoji = item.reaction ? REACTION_EMOJI[item.reaction] : null;
  const dateLabel = new Date(item.createdAt).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs text-ink-mute">
          <span className="font-medium text-ink">
            {item.destination ?? "여행"}
          </span>
          {reactionEmoji && (
            <span aria-label={`반응: ${item.reaction}`}>{reactionEmoji}</span>
          )}
          {inactive && (
            <span className="text-[10px] text-amber-deep">· 만료</span>
          )}
        </div>
        <p className="text-xs text-ink-soft mt-0.5 truncate">
          {decodeBody(item.body)}
        </p>
      </div>
      <span className="text-[11px] text-ink-mute tabular-nums flex-none">
        {dateLabel}
      </span>
    </div>
  );
}

/** 저장 시 escapeHtml 처리됐으므로 화면에 그대로 노출 — 추가 escape 불필요 */
function decodeBody(escaped: string): string {
  return escaped
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}
