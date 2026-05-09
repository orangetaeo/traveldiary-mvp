/**
 * Live Replan 엔진 — 순수 함수.
 *
 * 사이클 2(ADR-012): 옵션 생성 알고리즘 도입.
 * 사이클 5b-2(ADR-013): commitReplan Server Action으로 mutation·DB 영속 + 낙관적 동시성
 *   + writeAuditLog. 본 모듈은 순수 함수로 유지하고, actions/trip.ts가 wrap.
 *
 * 알고리즘 출처: S-01 dag-scheduling, S-06 live-replan-options.
 * 핵심 원칙: AI는 결정하지 않는다. 옵션을 제시하고, 사용자가 결정한다.
 */

import type {
  ItineraryItem,
  ReplanImpact,
  ReplanOption,
} from "./types";

// ═══════════════════════════════════════════════════════════════════
// 트리거
// ═══════════════════════════════════════════════════════════════════

export type ReplanTrigger =
  | { type: "delay"; itemId: string; minutes: number }
  | { type: "weather"; itemId: string; condition: string; minutes: number }
  | { type: "wait_time"; itemId: string; minutes: number }
  | { type: "manual"; itemId: string; minutes: number };

// ═══════════════════════════════════════════════════════════════════
// 영향 범위 — 같은 Day에서 트리거 이후 일정 (시간순)
// ═══════════════════════════════════════════════════════════════════

/**
 * DAG에서 itemId 이후로 연쇄 영향을 받는 노드 ID 집합을 계산한다.
 *
 * 시드 데이터의 dependencies 구조는 "같은 Day 내 시간순"이므로 BFS로
 * 후행 노드를 수집한다. 동일 Day의 시간순 후속 항목도 영향에 포함한다.
 */
export function calculateAffectedRange(
  items: ItineraryItem[],
  changedItemId: string,
): string[] {
  const trigger = items.find((it) => it.id === changedItemId);
  if (!trigger) return [];

  const sameDay = items
    .filter((it) => it.dayIndex === trigger.dayIndex)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  const triggerIdx = sameDay.findIndex((it) => it.id === changedItemId);
  if (triggerIdx < 0) return [];

  return sameDay.slice(triggerIdx + 1).map((it) => it.id);
}

// ═══════════════════════════════════════════════════════════════════
// 3옵션 생성
// ═══════════════════════════════════════════════════════════════════

export interface ReplanResult {
  option: ReplanOption;
  /** 옵션 적용 시의 새 일정 배열 (원본은 변경 안 함) */
  itemsAfter: ItineraryItem[];
  /**
   * 강행 옵션 적용 시 충돌하는 booked/fixed 항목 (booked 우선 정렬).
   * 추천/안전 옵션은 항상 빈 배열 — 충돌은 강행에서만 발생.
   * ADR-045 (#36 ReplanConflictModal wiring) — 강행 클릭 시 사용자에게 경고 + 대안 제시.
   */
  conflicts: ItineraryItem[];
}

/**
 * 트리거에 대해 추천/안전/강행 3옵션을 모두 계산한다.
 * 각 옵션은 새 일정 배열과 사용자에게 보여줄 ReplanOption(impacts 포함)을 반환.
 */
export function generateReplanOptions(
  items: ItineraryItem[],
  trigger: ReplanTrigger,
): ReplanResult[] {
  return [
    buildRecommendOption(items, trigger),
    buildSafeOption(items, trigger),
    buildForceOption(items, trigger),
  ];
}

// ── 추천 ─────────────────────────────────────────────────────────────

function buildRecommendOption(
  items: ItineraryItem[],
  trigger: ReplanTrigger,
): ReplanResult {
  const triggerItem = mustFind(items, trigger.itemId);
  const affected = calculateAffectedRange(items, trigger.itemId);

  const itemsAfter = items.map((it) => {
    if (it.id === trigger.itemId) {
      return shiftMinutes(it, trigger.minutes);
    }
    if (!affected.includes(it.id)) return it;
    if (it.flexibility === "booked" || it.flexibility === "fixed") {
      // 보호 — 시간 그대로
      return it;
    }
    // flexible — flexMinutes 한도 내에서 최소 시프트
    const limited = Math.min(trigger.minutes, Math.max(it.flexMinutes, 30));
    return shiftMinutes(it, limited);
  });

  const protectedBooked = items.filter(
    (it) => affected.includes(it.id) && (it.flexibility === "booked" || it.flexibility === "fixed"),
  );

  const impacts: ReplanImpact[] = [
    { key: triggerItem.name, value: `+${trigger.minutes}분 지연 반영`, tone: "neutral" },
  ];
  if (protectedBooked.length > 0) {
    impacts.push({
      key: "예약 항목",
      value: `${protectedBooked.length}건 시간 그대로 유지`,
      tone: "positive",
    });
  }
  const flexibleAffected = items.filter(
    (it) => affected.includes(it.id) && it.flexibility === "flexible",
  );
  if (flexibleAffected.length > 0) {
    impacts.push({
      key: "유연 항목",
      value: `${flexibleAffected.length}건 최소 시프트`,
      tone: "positive",
    });
  }

  return {
    itemsAfter,
    conflicts: [],
    option: {
      id: "option-recommend",
      label: "추천",
      title: "AI 최적 — 손실 최소화",
      description:
        "예약·고정 항목은 보호하고, 유연 항목만 최소로 시프트합니다.",
      impacts,
    },
  };
}

// ── 안전 ─────────────────────────────────────────────────────────────

function buildSafeOption(
  items: ItineraryItem[],
  trigger: ReplanTrigger,
): ReplanResult {
  const triggerItem = mustFind(items, trigger.itemId);
  const affected = calculateAffectedRange(items, trigger.itemId);
  const buffer = 30; // 안전 옵션은 +30분 buffer 추가

  const itemsAfter = items.map((it) => {
    if (it.id === trigger.itemId) {
      return shiftMinutes(it, trigger.minutes);
    }
    if (!affected.includes(it.id)) return it;
    return shiftMinutes(it, trigger.minutes + buffer);
  });

  const bookedConflicts = items.filter(
    (it) => affected.includes(it.id) && it.flexibility === "booked",
  );

  const impacts: ReplanImpact[] = [
    { key: triggerItem.name, value: `+${trigger.minutes}분 지연 반영`, tone: "neutral" },
    {
      key: "후속 일정 전체",
      value: `+${trigger.minutes + buffer}분 시프트 (여유 ${buffer}분)`,
      tone: "negative",
    },
  ];
  if (bookedConflicts.length > 0) {
    impacts.push({
      key: "⚠️ 예약 변경",
      value: `${bookedConflicts.length}건 예약 변경 필요`,
      tone: "negative",
    });
  }

  return {
    itemsAfter,
    conflicts: [],
    option: {
      id: "option-safe",
      label: "안전",
      title: "여유 확보 — 버퍼 +30분",
      description:
        "후속 일정 전체에 여유를 둡니다. 예약은 변경이 필요할 수 있어요.",
      impacts,
    },
  };
}

// ── 강행 ─────────────────────────────────────────────────────────────

function buildForceOption(
  items: ItineraryItem[],
  trigger: ReplanTrigger,
): ReplanResult {
  const triggerItem = mustFind(items, trigger.itemId);
  const affected = calculateAffectedRange(items, trigger.itemId);

  const itemsAfter = items.map((it) => {
    if (it.id === trigger.itemId || affected.includes(it.id)) {
      return shiftMinutes(it, trigger.minutes);
    }
    return it;
  });

  const bookedConflicts = items.filter(
    (it) => affected.includes(it.id) && it.flexibility === "booked",
  );
  const fixedConflicts = items.filter(
    (it) => affected.includes(it.id) && it.flexibility === "fixed",
  );

  const impacts: ReplanImpact[] = [
    { key: triggerItem.name, value: `+${trigger.minutes}분 지연 반영`, tone: "neutral" },
    {
      key: "모든 후속 일정",
      value: `+${trigger.minutes}분 일괄 시프트`,
      tone: "neutral",
    },
  ];
  if (bookedConflicts.length > 0) {
    impacts.push({
      key: "⚠️ 예약 충돌",
      value: `${bookedConflicts.length}건 — 사용자가 직접 조정 필요`,
      tone: "negative",
    });
  }
  if (fixedConflicts.length > 0) {
    impacts.push({
      key: "⚠️ 고정 항목 충돌",
      value: `${fixedConflicts.length}건 — 일정 불가능`,
      tone: "negative",
    });
  }

  // ADR-045 — 강행은 booked > fixed 우선 정렬로 conflicts 채움.
  // ReplanModal이 onApply 시 첫 conflict 1건을 ReplanConflictModal에 매핑.
  const conflicts: ItineraryItem[] = [...bookedConflicts, ...fixedConflicts];

  return {
    itemsAfter,
    conflicts,
    option: {
      id: "option-force",
      label: "강행",
      title: "기존 형태 유지 — 일괄 시프트",
      description:
        "모든 후속을 같은 분량만큼 밀어냅니다. 예약·고정과 충돌 가능.",
      impacts,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// 헬퍼
// ═══════════════════════════════════════════════════════════════════

function shiftMinutes(item: ItineraryItem, minutes: number): ItineraryItem {
  if (minutes === 0) return item;
  const d = new Date(item.scheduledAt);
  if (isNaN(d.getTime())) return item;
  d.setUTCMinutes(d.getUTCMinutes() + minutes);
  return { ...item, scheduledAt: d.toISOString() };
}

function mustFind(items: ItineraryItem[], id: string): ItineraryItem {
  const it = items.find((x) => x.id === id);
  if (!it) {
    throw new Error(`Replan: item ${id} not found`);
  }
  return it;
}

// ═══════════════════════════════════════════════════════════════════
// DAG 무결성 (단위 검증용 — cycle/orphan 검출)
// ═══════════════════════════════════════════════════════════════════

export function validateDag(items: ItineraryItem[]): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const idSet = new Set(items.map((it) => it.id));

  for (const it of items) {
    for (const dep of it.dependencies) {
      if (!idSet.has(dep)) {
        errors.push(`item ${it.id} depends on unknown ${dep}`);
      }
    }
  }

  // cycle detection (DFS)
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();
  items.forEach((it) => color.set(it.id, WHITE));

  const adj = new Map<string, string[]>();
  items.forEach((it) => adj.set(it.id, it.dependencies));

  function dfs(id: string): boolean {
    if (color.get(id) === GRAY) return true; // cycle
    if (color.get(id) === BLACK) return false;
    color.set(id, GRAY);
    for (const next of adj.get(id) ?? []) {
      if (dfs(next)) return true;
    }
    color.set(id, BLACK);
    return false;
  }

  for (const it of items) {
    if (color.get(it.id) === WHITE && dfs(it.id)) {
      errors.push(`cycle detected involving ${it.id}`);
    }
  }

  return { ok: errors.length === 0, errors };
}
