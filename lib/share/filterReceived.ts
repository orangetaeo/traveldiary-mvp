/**
 * /shared 받은 trip 검색 + 상태 필터 — 사이클 KK (FF 답습).
 *
 * 순수 함수. UI는 filter → sort 순으로 합성.
 */

export type ReceivedStatusFilter = "all" | "active" | "inactive";

export interface FilterableReceivedItem {
  destination?: string;
  status: "active" | "revoked" | "expired" | "not_found";
}

/**
 * 도시명 부분 일치 검색.
 * 빈 query는 모두 통과. 한국어/영문 대소문자 무시.
 */
export function matchesQuery(
  item: FilterableReceivedItem,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return true;
  const dest = (item.destination ?? "").toLowerCase();
  return dest.includes(q);
}

/**
 * 상태 필터.
 * - all: 전체
 * - active: status="active"
 * - inactive: revoked / expired / not_found
 */
export function matchesStatus(
  item: FilterableReceivedItem,
  filter: ReceivedStatusFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "active") return item.status === "active";
  // inactive
  return item.status !== "active";
}

export function filterReceived<T extends FilterableReceivedItem>(
  items: T[],
  query: string,
  statusFilter: ReceivedStatusFilter,
): T[] {
  return items.filter(
    (it) => matchesQuery(it, query) && matchesStatus(it, statusFilter),
  );
}

export const STATUS_FILTER_LABELS: Record<ReceivedStatusFilter, string> = {
  all: "전체",
  active: "유효",
  inactive: "만료·취소",
};
