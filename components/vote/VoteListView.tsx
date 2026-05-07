"use client";

/**
 * VoteListView — C4 일행 투표 (사이클 E).
 * 투표 리스트 + 새 투표 생성 폼 + 옵션 토글.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/lib/hooks/useToast";
import { Toast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import { castVote, createVote } from "@/actions/vote";
import type { Trip, Vote } from "@/lib/types";

interface Props {
  trip: Trip;
  initialVotes: Vote[];
  currentUserId: string | null;
}

export function VoteListView({ trip, initialVotes, currentUserId }: Props) {
  const router = useRouter();
  const [votes, setVotes] = useState<Vote[]>(initialVotes);
  const [isPending, startTransition] = useTransition();
  const { toast, show: showToast } = useToast();
  const [draftQuestion, setDraftQuestion] = useState("");
  const [draftOptions, setDraftOptions] = useState<string[]>(["", ""]);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const labels = draftOptions
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (!draftQuestion.trim() || labels.length < 2) {
      showToast("질문 + 옵션 2개 이상 입력해주세요.", { variant: "warning" });
      return;
    }
    startTransition(async () => {
      const result = await createVote({
        tripId: trip.id,
        question: draftQuestion,
        optionLabels: labels,
      });
      if (!result.ok) {
        showToast(`생성 실패: ${result.code}`, { variant: "danger" });
        return;
      }
      if (result.demo) {
        showToast("데모 모드 — 실 저장 X", { variant: "info" });
      } else {
        setVotes((prev) => [result.data, ...prev]);
        showToast("투표 생성됨", { variant: "success" });
        router.refresh();
      }
      setDraftQuestion("");
      setDraftOptions(["", ""]);
    });
  }

  function handleCast(voteId: string, optionIndex: number) {
    if (!currentUserId) {
      showToast("로그인이 필요해요.", { variant: "warning" });
      return;
    }
    startTransition(async () => {
      const result = await castVote({
        voteId,
        tripId: trip.id,
        optionIndex,
      });
      if (!result.ok) {
        showToast(`투표 실패: ${result.code}`, { variant: "danger" });
        return;
      }
      if (!result.demo) {
        setVotes((prev) =>
          prev.map((v) => (v.id === voteId ? result.data : v)),
        );
        router.refresh();
      } else {
        showToast("데모 모드 시뮬", { variant: "info" });
      }
    });
  }

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      <header className="bg-surface-card/90 backdrop-blur-md border-b border-divider sticky top-0 z-40 flex justify-between items-center w-full px-td-md h-14">
        <div className="flex items-center gap-td-sm">
          <Link
            href={`/itinerary/${trip.id}`}
            aria-label="뒤로"
            className="p-2 rounded-full hover:bg-surface-soft"
          >
            <span className="material-symbols-outlined text-ink">arrow_back</span>
          </Link>
          <h1 className="text-lg font-bold text-ink tracking-tight">일행 투표</h1>
        </div>
        <Link
          href={`/trips/${trip.id}?focus=vote`}
          aria-label="여행 대시보드 — 투표 카드 강조"
          className="p-2 rounded-full text-ink-soft hover:text-ink hover:bg-surface-soft transition-colors"
        >
          <span className="material-symbols-outlined" aria-hidden>dashboard</span>
        </Link>
      </header>

      <main className="max-w-xl mx-auto px-td-md py-td-lg space-y-td-lg">
        {/* 새 투표 생성 */}
        <section className="bg-surface-card border border-divider rounded-md p-td-md">
          <h2 className="text-td-card-title text-ink mb-td-sm">새 투표</h2>
          <form onSubmit={handleCreate} className="space-y-td-sm">
            <input
              type="text"
              placeholder="질문 (예: 둘째날 저녁은 어디로?)"
              value={draftQuestion}
              onChange={(e) => setDraftQuestion(e.target.value)}
              maxLength={120}
              className="w-full px-td-sm py-2 border border-divider rounded-md text-td-body bg-surface-soft focus:outline focus:outline-purple"
            />
            {draftOptions.map((opt, i) => (
              <input
                key={i}
                type="text"
                placeholder={`옵션 ${i + 1}`}
                value={opt}
                onChange={(e) => {
                  const next = [...draftOptions];
                  next[i] = e.target.value;
                  setDraftOptions(next);
                }}
                maxLength={80}
                className="w-full px-td-sm py-2 border border-divider rounded-md text-td-body bg-surface-soft"
              />
            ))}
            <div className="flex gap-td-sm">
              <button
                type="button"
                onClick={() => setDraftOptions((prev) => [...prev, ""])}
                className="text-td-meta text-purple font-semibold"
              >
                + 옵션 추가
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="ml-auto px-td-md py-2 bg-purple text-white rounded-md text-td-meta font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {isPending ? "생성 중…" : "투표 생성"}
              </button>
            </div>
          </form>
        </section>

        {/* 투표 리스트 */}
        <section>
          <h2 className="text-td-card-title text-ink mb-td-sm">진행 중 투표</h2>
          {votes.length === 0 ? (
            <EmptyState
              icon="how_to_vote"
              title="아직 진행 중인 투표가 없어요"
              description="위 폼에서 첫 투표를 만들어 친구들과 결정해 보세요."
              className="bg-surface-card border border-divider rounded-md"
            />
          ) : (
            <ul className="space-y-td-md">
              {votes.map((vote) => (
                <li
                  key={vote.id}
                  className="bg-surface-card border border-divider rounded-md p-td-md"
                >
                  <h3 className="text-td-card-title text-ink mb-td-sm">
                    {vote.question}
                  </h3>
                  <ul className="space-y-td-xs">
                    {vote.options.map((opt, i) => {
                      const totalVoters = vote.options.reduce(
                        (s, o) => s + o.voters.length,
                        0,
                      );
                      const pct =
                        totalVoters === 0
                          ? 0
                          : Math.round(
                              (opt.voters.length / totalVoters) * 100,
                            );
                      const myVote =
                        currentUserId !== null &&
                        opt.voters.includes(currentUserId);
                      return (
                        <li key={i}>
                          <button
                            type="button"
                            onClick={() => handleCast(vote.id, i)}
                            disabled={isPending}
                            className={`w-full text-left p-td-sm rounded-md border transition-colors ${
                              myVote
                                ? "bg-purple-soft border-purple"
                                : "bg-surface-soft border-divider hover:border-purple/40"
                            } disabled:opacity-60`}
                          >
                            <div className="flex justify-between items-center mb-td-xxs">
                              <span
                                className={`text-td-body ${
                                  myVote
                                    ? "text-purple-deep font-bold"
                                    : "text-ink"
                                }`}
                              >
                                {myVote && "✓ "}
                                {opt.label}
                              </span>
                              <span className="text-td-caption text-ink-soft tabular-nums">
                                {opt.voters.length}표 · {pct}%
                              </span>
                            </div>
                            <div className="w-full bg-surface-card rounded-full h-1 overflow-hidden">
                              <div
                                className="bg-purple h-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <Toast toast={toast} />
    </div>
  );
}
