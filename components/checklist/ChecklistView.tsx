"use client";

/**
 * Checklist 클라이언트 뷰 — M6 사이클 9.
 *
 * 데모 trip(DEMO_TRIP_ID): demo:true 응답 → 클라이언트 상태로만 시뮬 (M3 Replan 패턴 답습)
 * DB trip: Server Action 결과로 router.refresh
 *
 * 사이클 QQ: EmptyState / BucketList / AddForm 추출 (LL/NN 답습).
 */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  addChecklistItem,
  addFromTemplate,
  bulkDeleteChecklist,
  bulkToggleChecklist,
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
import {
  ChecklistCategoryFilter,
  applyChecklistFilters,
  type CategoryFilterValue,
  type DoneFilterValue,
} from "./ChecklistCategoryFilter";
import { ChecklistSearchInput } from "./ChecklistSearchInput";
import { ChecklistDoneFilter } from "./ChecklistDoneFilter";

interface Props {
  trip: Trip;
  initialItems: ChecklistItem[];
  cityName?: string;
  /** C4 — URL ?day= 파라미터에서 파싱된 dayIndex. 뒤로가기 링크에 전달. */
  initialDay?: number;
}

export function ChecklistView({ trip, initialItems, cityName, initialDay }: Props) {
  const dayParam = initialDay != null ? `?day=${initialDay}` : "";
  const router = useRouter();
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  // 사이클 II — 멀티 선택 모드
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 사이클 NN — 카테고리 필터 (UI only, DB 미터치)
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilterValue>("all");
  // 사이클 OO — 텍스트 검색 (UI only)
  const [searchText, setSearchText] = useState("");
  // 사이클 QQ — 완료 상태 필터 (UI only, NN→OO→QQ 헬퍼 진화 답습)
  const [doneFilter, setDoneFilter] = useState<DoneFilterValue>("all");

  const total = items.length;
  const done = items.filter((it) => it.done).length;
  const progressPercent = total === 0 ? 0 : Math.round((done / total) * 100);
  const progressBucket = nearestProgressBucket(progressPercent);

  const filteredItems = useMemo(
    () =>
      applyChecklistFilters(items, {
        category: categoryFilter,
        search: searchText,
        done: doneFilter,
      }),
    [items, categoryFilter, searchText, doneFilter],
  );

  // 사이클 OO — 검색 활성 시에도 onMove 비활성 (NN 답습)
  // 사이클 QQ — done 필터 활성 시에도 동일 게이트 적용
  const isFiltering =
    categoryFilter !== "all" ||
    searchText.trim().length > 0 ||
    doneFilter !== "all";

  const selectedCount = selectedIds.size;
  const allSelected = useMemo(
    () => total > 0 && selectedCount === total,
    [total, selectedCount],
  );

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

  // 사이클 II — 선택 모드 토글 + 항목 선택
  function toggleSelectionMode() {
    if (selectionMode) {
      setSelectedIds(new Set());
    }
    setSelectionMode((m) => !m);
  }

  function toggleItemSelection(item: ChecklistItem) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  }

  function selectAll() {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(items.map((it) => it.id)));
  }

  function handleBulkToggle(targetDone: boolean) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    // 옵티미스틱
    const snapshot = items;
    setItems((prev) =>
      prev.map((it) => (selectedIds.has(it.id) ? { ...it, done: targetDone } : it)),
    );

    startTransition(async () => {
      const result = await bulkToggleChecklist({
        tripId: trip.id,
        itemIds: ids,
        done: targetDone,
      });
      if (!result.ok) {
        setItems(snapshot);
        showToast(`일괄 변경 실패: ${result.code}`);
        return;
      }
      const label = targetDone ? "완료" : "미완료";
      if (result.demo) {
        showToast(`${ids.length}개 ${label} (데모 시뮬)`);
      } else {
        showToast(`${result.data.updatedCount}개 ${label} 처리됨`);
        router.refresh();
      }
      // 선택 해제 + 모드 종료
      setSelectedIds(new Set());
      setSelectionMode(false);
    });
  }

  // 사이클 JJ — 일괄 삭제
  function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    if (!confirm(`선택한 ${ids.length}개 항목을 삭제할까요? 되돌릴 수 없습니다.`)) {
      return;
    }

    // 옵티미스틱 — 선택된 항목 즉시 제거
    const snapshot = items;
    setItems((prev) => prev.filter((it) => !selectedIds.has(it.id)));

    startTransition(async () => {
      const result = await bulkDeleteChecklist({
        tripId: trip.id,
        itemIds: ids,
      });
      if (!result.ok) {
        setItems(snapshot);
        showToast(`일괄 삭제 실패: ${result.code}`);
        return;
      }
      if (result.demo) {
        showToast(`${ids.length}개 삭제 (데모 시뮬)`);
      } else {
        showToast(`${result.data.deletedCount}개 삭제됨 (DB 영속화)`);
        router.refresh();
      }
      setSelectedIds(new Set());
      setSelectionMode(false);
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
            href={`/itinerary/${trip.id}${dayParam}`}
            aria-label="뒤로"
            className="p-2 rounded-full hover:bg-surface-soft transition-colors"
          >
            <span className="material-symbols-outlined text-ink">arrow_back</span>
          </Link>
          <h1 className="text-lg font-bold text-ink tracking-tight">
            D-Day 체크리스트
          </h1>
        </div>
        {total > 0 && (
          <button
            type="button"
            onClick={toggleSelectionMode}
            className="text-td-meta font-semibold text-purple hover:text-purple-deep transition-colors px-2"
          >
            {selectionMode ? "취소" : "선택"}
          </button>
        )}
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
            onAddManual={() => document.getElementById("add-checklist-form")?.scrollIntoView({ behavior: "smooth" })}
          />
        )}

        {total > 0 && (
          <>
            <div className="pb-td-xs">
              <ChecklistSearchInput
                value={searchText}
                onChange={setSearchText}
              />
            </div>
            <div className="pb-td-xs">
              <ChecklistDoneFilter
                items={items}
                value={doneFilter}
                onChange={setDoneFilter}
              />
            </div>
            <div className="pb-td-sm">
              <ChecklistCategoryFilter
                items={items}
                value={categoryFilter}
                onChange={setCategoryFilter}
              />
            </div>
            {filteredItems.length === 0 ? (
              <div className="py-td-md text-center" role="status">
                <p className="text-td-meta text-ink-soft">
                  {searchText.trim().length > 0
                    ? `"${searchText.trim()}" 검색 결과가 없어요.`
                    : doneFilter === "todo"
                      ? "미완료 항목이 없어요."
                      : doneFilter === "done"
                        ? "완료한 항목이 없어요."
                        : "이 카테고리에 항목이 없어요."}
                </p>
                {isFiltering && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchText("");
                      setCategoryFilter("all");
                      setDoneFilter("all");
                    }}
                    className="mt-td-xs text-td-meta font-semibold text-purple hover:text-purple-deep"
                  >
                    필터 초기화
                  </button>
                )}
              </div>
            ) : (
              <ChecklistBucketList
                items={filteredItems}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onMove={isFiltering ? undefined : handleMove}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onSelectToggle={toggleItemSelection}
              />
            )}
          </>
        )}

        {!selectionMode && (
          <AddChecklistForm isPending={isPending} onSubmit={handleAddCustom} />
        )}
      </main>

      {selectionMode && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 bg-surface-card border-t border-divider px-td-md py-td-sm flex items-center gap-td-sm pb-[calc(env(safe-area-inset-bottom)+12px)]"
          role="toolbar"
          aria-label="멀티 선택 액션 바"
        >
          <button
            type="button"
            onClick={selectAll}
            className="text-td-meta text-ink-soft hover:text-ink whitespace-nowrap"
          >
            {allSelected ? "전체 해제" : "전체 선택"}
          </button>
          <span className="text-td-meta text-ink font-semibold tabular-nums whitespace-nowrap">
            {selectedCount}개
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => handleBulkToggle(false)}
            disabled={selectedCount === 0 || isPending}
            className="px-3 py-2 rounded-lg text-td-meta font-semibold text-ink border border-divider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-soft"
          >
            미완료
          </button>
          <button
            type="button"
            onClick={() => handleBulkToggle(true)}
            disabled={selectedCount === 0 || isPending}
            className="px-3 py-2 rounded-lg text-td-meta font-semibold text-white bg-purple disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-deep"
          >
            완료
          </button>
          <div className="w-px h-6 bg-divider mx-1" aria-hidden="true" />
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={selectedCount === 0 || isPending}
            className="px-3 py-2 rounded-lg text-td-meta font-semibold text-danger border border-danger disabled:opacity-40 disabled:cursor-not-allowed hover:bg-danger-soft"
          >
            삭제
          </button>
        </div>
      )}

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
