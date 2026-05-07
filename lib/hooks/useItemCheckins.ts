"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * 일정 카드 도착 체크인 LocalStorage hook — A2 (Session X cap 2, 2026-05-07).
 *
 * 디자인 갭 명세 #7 — 장소 도착 체크인:
 *   - 도착 전 / 도착 시(도착 버튼) / 도착 후(✓ + 시각) 3 상태
 *   - Day 헤더 진행률 바 ("오늘 N/M")
 *
 * 본 사이클은 LocalStorage 임시 저장만 — 정식 출시 시 ItineraryItem.arrivedAt
 * 컬럼 추가 + 마이그 1회 + R1 사인오프 + writeAuditLog 후 DB 영속화.
 *
 * 키: `td-checkins-${tripId}` → Record<itemId, ISO string>
 *
 * 다중 trip 격리 + LocalStorage 비활성(SSR)에 안전.
 */

const STORAGE_KEY_PREFIX = "td-checkins-";

export type CheckinMap = Record<string, string>;

export function getCheckinStorageKey(tripId: string): string {
  return `${STORAGE_KEY_PREFIX}${tripId}`;
}

function safeRead(tripId: string): CheckinMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(getCheckinStorageKey(tripId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    // 형식 가드 — string 값만 통과
    const out: CheckinMap = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof k === "string" && typeof v === "string") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function safeWrite(tripId: string, map: CheckinMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getCheckinStorageKey(tripId), JSON.stringify(map));
  } catch {
    // QuotaExceeded 등 — silent skip (메모리 input_guard 답습)
  }
}

export function useItemCheckins(tripId: string) {
  const [checkins, setCheckins] = useState<CheckinMap>({});

  // 마운트 후 1회 LocalStorage hydrate
  useEffect(() => {
    setCheckins(safeRead(tripId));
  }, [tripId]);

  const checkIn = useCallback(
    (itemId: string) => {
      setCheckins((prev) => {
        const next = { ...prev, [itemId]: new Date().toISOString() };
        safeWrite(tripId, next);
        return next;
      });
    },
    [tripId],
  );

  const undoCheckIn = useCallback(
    (itemId: string) => {
      setCheckins((prev) => {
        const next = { ...prev };
        delete next[itemId];
        safeWrite(tripId, next);
        return next;
      });
    },
    [tripId],
  );

  const clearAll = useCallback(() => {
    setCheckins({});
    safeWrite(tripId, {});
  }, [tripId]);

  return { checkins, checkIn, undoCheckIn, clearAll };
}

/**
 * 진행률 계산 — checkin 비율 (0~1) + 라벨.
 * dayItems가 0건이면 done=0, total=0, ratio=0 (UI에서 숨김 권장).
 */
export function computeDayProgress(
  dayItems: Array<{ id: string }>,
  checkins: CheckinMap,
): { done: number; total: number; ratio: number } {
  const total = dayItems.length;
  if (total === 0) return { done: 0, total: 0, ratio: 0 };
  const done = dayItems.filter((it) => Boolean(checkins[it.id])).length;
  return { done, total, ratio: done / total };
}
