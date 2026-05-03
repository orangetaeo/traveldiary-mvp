"use client";

/**
 * Checklist 클라이언트 뷰 — M6 사이클 9.
 *
 * 데모 trip(DEMO_TRIP_ID): demo:true 응답 → 클라이언트 상태로만 시뮬 (M3 Replan 패턴 답습)
 * DB trip: Server Action 결과로 router.refresh
 *
 * 사이클 QQ: EmptyState / BucketList / AddForm 추출 (LL/NN 답습).
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  addChecklistItem,
  addFromTemplate,
  deleteChecklist,
  moveChecklist,
  toggleChecklist,
} from "@/actions/checklist";
import { DEFAULT_CHECKLIST_TEMPLATE } from "@/lib/seed/checklist-template";
import { swapWithinBucket } from "@/lib/checklist-reorder";
import type { ChecklistItem, Trip } from "@/lib/types";
import { ChecklistEmptyState } from "./ChecklistEmptyState";
import { ChecklistBucketList } from "./ChecklistBucketList";
import {
  AddChecklistForm,
  type AddChecklistFormSubmit,
} from "./AddChecklistForm";

interface Props {
  trip: Trip;
  initialItems: ChecklistItem[];
  cityName?: string;
}

export function ChecklistView({ trip, initialItems, cityName }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

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

  function handleAddCustom(input: AddChecklistFormSubmit) {
    startTransition(async () => {
      const result = await addChecklistItem({
        tripId: trip.id,
        category: input.category,
        text: input.text,
        dDayBucket: input.dDayBucket,
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
            category: input.category,
            text: input.text,
            dDayBucket: input.dDayBucket,
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
    });
  }

  function handleMove(item: ChecklistItem, direction: "up" | "down") {
    // 같은 버킷 안에서 인접 항목과 swap. 데모/DB 모두 옵티미스틱.
    const snapshot = items;
    setItems((prev) => swapWithinBucket(prev, item.id, direction));

    startTransition(async () => {
      const result = await moveChecklist({
        itemId: item.id,
        tripId: trip.id,
        direction,
      });
      if (!result.ok) {
        setItems(snapshot);
        showToast(`정렬 실패: ${result.code}`);
        return;
      }
      if (!result.demo) router.refresh();
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
        {/* Progress Header */}
        <section className="py-td-lg">
          <p className="text-td-meta text-ink-soft mb-td-xxs">
            {trip.destination}
            {cityName && cityName !== trip.destination && ` · ${cityName}`} ·{" "}
            {trip.nights}박 {trip.nights + 1}일
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

        {total === 0 && (
          <ChecklistEmptyState
            templateSize={DEFAULT_CHECKLIST_TEMPLATE.length}
            isPending={isPending}
            onAddTemplate={handleAddTemplate}
          />
        )}

        {total > 0 && (
          <ChecklistBucketList
            items={items}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onMove={handleMove}
          />
        )}

        <AddChecklistForm isPending={isPending} onSubmit={handleAddCustom} />
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
