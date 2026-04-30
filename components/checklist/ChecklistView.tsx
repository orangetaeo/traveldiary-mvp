"use client";

/**
 * Checklist 클라이언트 뷰 — M6 사이클 9.
 *
 * 데모 trip(DEMO_TRIP_ID): demo:true 응답 → 클라이언트 상태로만 시뮬 (M3 Replan 패턴 답습)
 * DB trip: Server Action 결과로 router.refresh
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  addChecklistItem,
  addFromTemplate,
  deleteChecklist,
  toggleChecklist,
} from "@/actions/checklist";
import { DEFAULT_CHECKLIST_TEMPLATE } from "@/lib/seed/checklist-template";
import type {
  ChecklistCategory,
  ChecklistItem,
  DDayBucket,
  Trip,
} from "@/lib/types";

interface Props {
  trip: Trip;
  initialItems: ChecklistItem[];
  cityName?: string;
}

const BUCKET_ORDER: DDayBucket[] = [
  "D-30",
  "D-14",
  "D-7",
  "D-1",
  "during",
  "after",
];

const BUCKET_LABEL: Record<DDayBucket, string> = {
  "D-30": "D-30 · 사전 준비",
  "D-14": "D-14 · 예약 마감",
  "D-7": "D-7 · 짐 준비",
  "D-1": "D-1 · 출발 직전",
  during: "여행 중",
  after: "귀국 후",
};

const CATEGORY_LABEL: Record<ChecklistCategory, string> = {
  documents: "서류",
  clothing: "의류",
  electronics: "전자",
  forbidden: "반입 금지",
  declarable: "신고 대상",
  custom: "기타",
};

const CATEGORY_TONE: Record<ChecklistCategory, string> = {
  documents: "bg-purple-soft text-purple-deep",
  clothing: "bg-success-soft text-success-deep",
  electronics: "bg-amber-soft text-amber-deep",
  forbidden: "bg-danger-soft text-danger-deep",
  declarable: "bg-accent-soft text-accent-deep",
  custom: "bg-surface-soft text-ink-soft",
};

export function ChecklistView({ trip, initialItems, cityName }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [draftCategory, setDraftCategory] =
    useState<ChecklistCategory>("custom");
  const [draftBucket, setDraftBucket] = useState<DDayBucket>("D-7");
  const [draftText, setDraftText] = useState("");

  const total = items.length;
  const done = items.filter((it) => it.done).length;
  const progressPercent = total === 0 ? 0 : Math.round((done / total) * 100);
  const progressBucket = nearestProgressBucket(progressPercent);

  function showToast(msg: string, ms = 3500) {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  }

  function handleToggle(item: ChecklistItem) {
    // optimistic
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, done: !it.done } : it)),
    );
    startTransition(async () => {
      const result = await toggleChecklist({
        itemId: item.id,
        tripId: trip.id,
      });
      if (!result.ok) {
        // 롤백
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, done: item.done } : it,
          ),
        );
        showToast(`토글 실패: ${result.code}`);
        return;
      }
      if (!result.demo) router.refresh();
    });
  }

  function handleAddTemplate() {
    if (items.length > 0) {
      if (!confirm("기존 항목 위에 기본 템플릿을 추가합니다. 계속할까요?")) {
        return;
      }
    }

    startTransition(async () => {
      const result = await addFromTemplate({ tripId: trip.id });
      if (!result.ok) {
        showToast(`템플릿 추가 실패: ${result.code}`);
        return;
      }
      if (result.demo) {
        // 데모: 클라이언트 시뮬 — 템플릿을 즉석 ID로 매핑
        const now = new Date().toISOString();
        const simulated: ChecklistItem[] = DEFAULT_CHECKLIST_TEMPLATE.map(
          (t, i) => ({
            id: `demo-${Date.now()}-${i}`,
            tripId: trip.id,
            category: t.category,
            text: t.text,
            dDayBucket: t.dDayBucket,
            cityNote: t.cityNote,
            done: false,
            sortOrder: i,
            createdAt: now,
            updatedAt: now,
          }),
        );
        setItems((prev) => [...prev, ...simulated]);
        showToast(`기본 템플릿 ${simulated.length}건 추가 (데모 시뮬)`);
      } else {
        showToast(`기본 템플릿 ${result.data.length}건 추가됨 (DB 영속화)`);
        router.refresh();
      }
    });
  }

  function handleAddCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!draftText.trim()) return;

    const text = draftText.trim();
    const category = draftCategory;
    const bucket = draftBucket;

    startTransition(async () => {
      const result = await addChecklistItem({
        tripId: trip.id,
        category,
        text,
        dDayBucket: bucket,
      });
      if (!result.ok) {
        showToast(`추가 실패: ${result.code}`);
        return;
      }
      if (result.demo) {
        const now = new Date().toISOString();
        setItems((prev) => [
          ...prev,
          {
            id: `demo-${Date.now()}`,
            tripId: trip.id,
            category,
            text,
            dDayBucket: bucket,
            done: false,
            sortOrder: prev.length,
            createdAt: now,
            updatedAt: now,
          },
        ]);
        showToast("항목 추가 (데모 시뮬)");
      } else {
        showToast("항목 추가됨 (DB 영속화)");
        router.refresh();
      }
      setDraftText("");
    });
  }

  function handleDelete(item: ChecklistItem) {
    if (!confirm(`"${item.text}" 항목을 삭제할까요?`)) return;

    setItems((prev) => prev.filter((it) => it.id !== item.id));

    startTransition(async () => {
      const result = await deleteChecklist({
        itemId: item.id,
        tripId: trip.id,
      });
      if (!result.ok) {
        // 롤백
        setItems((prev) => [...prev, item]);
        showToast(`삭제 실패: ${result.code}`);
        return;
      }
      if (!result.demo) {
        showToast("삭제됨 (DB 영속화)");
        router.refresh();
      } else {
        showToast("삭제 (데모 시뮬)");
      }
    });
  }

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-32">
      {/* TopAppBar */}
      <header className="bg-surface-card border-b border-divider sticky top-0 z-40 flex justify-between items-center w-full px-td-md h-16">
        <div className="flex items-center gap-td-sm">
          <Link
            href={`/itinerary/${trip.id}`}
            aria-label="뒤로"
            className="p-2 rounded-full hover:bg-surface-soft transition-colors"
          >
            <span className="material-symbols-outlined text-ink">arrow_back</span>
          </Link>
          <h1 className="text-lg font-bold text-ink tracking-tight">
            D-Day 체크리스트
          </h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-td-md">
        {/* Header */}
        <section className="py-td-lg">
          <p className="text-td-meta text-ink-soft mb-td-xxs">
            {trip.destination}
            {cityName && cityName !== trip.destination && ` · ${cityName}`} · {trip.nights}박{" "}
            {trip.nights + 1}일
          </p>
          <h2 className="text-td-title text-ink">
            준비 {done}/{total}
            {total > 0 && (
              <span className="text-td-body text-ink-soft ml-td-xs">
                ({progressPercent}%)
              </span>
            )}
          </h2>
          {total > 0 && (
            <div className="w-full bg-surface-card rounded-full h-1.5 mt-td-sm overflow-hidden border border-divider">
              <div
                className="bg-purple h-full transition-all duration-500 progress-bar"
                data-progress={progressBucket}
              />
            </div>
          )}
        </section>

        {/* Empty state */}
        {total === 0 && (
          <section className="bg-surface-card border border-divider rounded-xl p-td-md text-center">
            <p className="text-td-body text-ink mb-td-xs">
              아직 체크리스트가 비어있어요.
            </p>
            <p className="text-td-meta text-ink-soft mb-td-md">
              {DEFAULT_CHECKLIST_TEMPLATE.length}건의 기본 템플릿(서류·짐·반입금지·신고)을 한
              번에 추가할 수 있습니다.
            </p>
            <button
              type="button"
              onClick={handleAddTemplate}
              disabled={isPending}
              className="bg-purple text-white py-2 px-td-md rounded-lg text-td-body font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {isPending ? "추가 중…" : "기본 템플릿 추가"}
            </button>
          </section>
        )}

        {/* Buckets */}
        {total > 0 && (
          <section className="space-y-td-md">
            {BUCKET_ORDER.map((bucket) => {
              const bucketItems = items.filter((it) => it.dDayBucket === bucket);
              if (bucketItems.length === 0) return null;
              const bucketDone = bucketItems.filter((it) => it.done).length;
              return (
                <article
                  key={bucket}
                  className="bg-surface-card border border-divider rounded-xl overflow-hidden"
                >
                  <header className="px-td-md py-td-sm flex justify-between items-center bg-surface-soft border-b border-divider">
                    <h3 className="text-td-card-title text-ink">
                      {BUCKET_LABEL[bucket]}
                    </h3>
                    <span className="text-td-meta text-ink-soft tabular-nums">
                      {bucketDone}/{bucketItems.length}
                    </span>
                  </header>
                  <ul>
                    {bucketItems.map((item) => (
                      <li
                        key={item.id}
                        className="px-td-md py-td-sm border-b border-divider last:border-b-0 flex items-start gap-td-sm group"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggle(item)}
                          aria-label={item.done ? "체크 해제" : "체크"}
                          className="mt-0.5 flex-shrink-0"
                        >
                          <span
                            className={`material-symbols-outlined ${
                              item.done
                                ? "filled text-purple"
                                : "text-ink-mute"
                            }`}
                          >
                            {item.done ? "check_circle" : "radio_button_unchecked"}
                          </span>
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-td-xs flex-wrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-td-caption font-bold ${
                                CATEGORY_TONE[item.category]
                              }`}
                            >
                              {CATEGORY_LABEL[item.category]}
                            </span>
                            <p
                              className={`text-td-body ${
                                item.done
                                  ? "line-through text-ink-mute"
                                  : "text-ink"
                              }`}
                            >
                              {item.text}
                            </p>
                          </div>
                          {item.cityNote && (
                            <p className="text-td-caption text-ink-mute mt-td-xxs">
                              💡 {item.cityNote}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          aria-label="삭제"
                          className="opacity-0 group-hover:opacity-100 text-ink-mute hover:text-danger transition-opacity flex-shrink-0"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            close
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </section>
        )}

        {/* Add custom item */}
        <section className="mt-td-lg bg-surface-card border border-divider rounded-xl p-td-md">
          <h3 className="text-td-card-title text-ink mb-td-sm">항목 추가</h3>
          <form onSubmit={handleAddCustom} className="space-y-td-sm">
            <input
              type="text"
              placeholder="예: 우산, 약, 한국 컵라면"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              className="w-full px-td-sm py-2 border border-divider rounded-lg text-td-body bg-surface-soft focus:outline focus:outline-purple"
              maxLength={100}
            />
            <div className="grid grid-cols-2 gap-td-sm">
              <select
                value={draftCategory}
                onChange={(e) =>
                  setDraftCategory(e.target.value as ChecklistCategory)
                }
                className="px-td-sm py-2 border border-divider rounded-lg text-td-body bg-surface-soft"
              >
                {(Object.keys(CATEGORY_LABEL) as ChecklistCategory[]).map(
                  (c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </option>
                  ),
                )}
              </select>
              <select
                value={draftBucket}
                onChange={(e) => setDraftBucket(e.target.value as DDayBucket)}
                className="px-td-sm py-2 border border-divider rounded-lg text-td-body bg-surface-soft"
              >
                {BUCKET_ORDER.map((b) => (
                  <option key={b} value={b}>
                    {BUCKET_LABEL[b]}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={isPending || !draftText.trim()}
              className="w-full py-2 bg-purple text-white rounded-lg text-td-body font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {isPending ? "추가 중…" : "추가"}
            </button>
          </form>
        </section>
      </main>

      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-ink text-white text-td-meta px-4 py-2.5 rounded-full shadow-lg max-w-[90vw] text-center"
          role="status"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

/** progress-bar data-progress 슬롯에 가까운 값으로 정규화 */
function nearestProgressBucket(p: number): number {
  const buckets = [0, 10, 20, 25, 30, 40, 50, 60, 67, 70, 75, 80, 90, 100];
  return buckets.reduce((closest, b) =>
    Math.abs(b - p) < Math.abs(closest - p) ? b : closest,
  );
}
