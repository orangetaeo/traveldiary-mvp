/**
 * /shared 받은 trip 정렬 — 사이클 FF.
 *
 * 순수 함수, 클라이언트 전용 로직이지만 테스트 격리를 위해 분리.
 */

export type ReceivedSortMode = "addedAtDesc" | "startDateAsc" | "destinationAsc";

export interface SortableReceivedItem {
  destination?: string;
  startDate?: string; // ISO
  addedAt: number;
}

export function sortReceived<T extends SortableReceivedItem>(
  items: T[],
  mode: ReceivedSortMode,
): T[] {
  const sorted = [...items];
  switch (mode) {
    case "addedAtDesc":
      sorted.sort((a, b) => b.addedAt - a.addedAt);
      break;
    case "startDateAsc":
      sorted.sort((a, b) => {
        // startDate 없는 건 맨 뒤로
        if (!a.startDate && !b.startDate) return b.addedAt - a.addedAt;
        if (!a.startDate) return 1;
        if (!b.startDate) return -1;
        return a.startDate.localeCompare(b.startDate);
      });
      break;
    case "destinationAsc":
      sorted.sort((a, b) => {
        const da = a.destination ?? "";
        const db = b.destination ?? "";
        return da.localeCompare(db, "ko");
      });
      break;
  }
  return sorted;
}

export const SORT_LABELS: Record<ReceivedSortMode, string> = {
  addedAtDesc: "받은 날짜 (최신순)",
  startDateAsc: "출발일 (가까운순)",
  destinationAsc: "도시명 (가나다)",
};
