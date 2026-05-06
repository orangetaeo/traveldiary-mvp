/**
 * Replan Trigger Card — 사이클 CC (사이클 O 답습 추출).
 *
 * ItineraryView에서 사이클 X/Z/AA로 키운 M3 진입 카드를 분리.
 * 순수 presentation — useState 0개, props만 받음.
 *
 * 사용처: ItineraryView (현재 1곳). 향후 /travel 모드 + 알림 진입점에서 재사용 가능.
 */

"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { ReplanTrigger } from "@/lib/replan";
import type { ItineraryItem } from "@/lib/types";

interface ReplanTriggerCardProps {
  trigger: ReplanTrigger;
  dayItems: ItineraryItem[];
  replanOpen: boolean;
  appliedLabel: string | null;
  onTriggerChange: (next: ReplanTrigger) => void;
  onOpenReplan: () => void;
  onReset: () => void;
}

const PRESET_MINUTES = [30, 60, 90] as const;
const WEATHER_PRESETS = ["비", "태풍", "안개"] as const;
const WEATHER_CONDITION_MAX = 30;

export function ReplanTriggerCard({
  trigger,
  dayItems,
  replanOpen,
  appliedLabel,
  onTriggerChange,
  onOpenReplan,
  onReset,
}: ReplanTriggerCardProps) {
  function buildTrigger(
    type: ReplanTrigger["type"],
    itemId: string,
    minutes: number,
    weatherCondition?: string,
  ): ReplanTrigger {
    if (type === "weather") {
      const condition =
        weatherCondition ??
        (trigger.type === "weather" ? trigger.condition : "비");
      return { type: "weather", itemId, condition, minutes };
    }
    return { type, itemId, minutes };
  }

  return (
    <div className="bg-surface-card border border-divider rounded-md p-td-md">
      <div className="flex items-center justify-between gap-td-sm mb-td-xs">
        <p className="text-td-body font-semibold text-ink">
          지연 시뮬레이션 (M3)
        </p>
        {appliedLabel && <Badge tone="info">{appliedLabel} 적용됨</Badge>}
      </div>
      <p className="text-td-meta text-ink-soft mb-td-sm">
        늦어진 일정과 지연 시간을 골라 추천·안전·강행 3옵션을 비교해 보세요.
      </p>

      {/* 일정 + 사유 dropdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-td-xs mb-td-sm">
        <div className="space-y-td-xxs">
          <label
            htmlFor="replan-trigger-item"
            className="text-td-caption text-ink-mute"
          >
            어떤 일정에서?
          </label>
          <select
            id="replan-trigger-item"
            className="w-full border border-divider rounded-md px-2 py-1.5 text-td-meta bg-surface-soft"
            value={trigger.itemId}
            onChange={(e) =>
              onTriggerChange(
                buildTrigger(trigger.type, e.target.value, trigger.minutes),
              )
            }
          >
            {dayItems.map((it) => (
              <option key={it.id} value={it.id}>
                Day {it.dayIndex + 1} · {it.scheduledAt.slice(11, 16)} ·{" "}
                {it.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-td-xxs">
          <label
            htmlFor="replan-trigger-type"
            className="text-td-caption text-ink-mute"
          >
            무슨 이유로?
          </label>
          <select
            id="replan-trigger-type"
            className="w-full border border-divider rounded-md px-2 py-1.5 text-td-meta bg-surface-soft"
            value={trigger.type}
            onChange={(e) =>
              onTriggerChange(
                buildTrigger(
                  e.target.value as ReplanTrigger["type"],
                  trigger.itemId,
                  trigger.minutes,
                ),
              )
            }
          >
            <option value="delay">지연</option>
            <option value="weather">악천후</option>
            <option value="wait_time">웨이팅</option>
            <option value="manual">직접 조정</option>
          </select>
        </div>
      </div>

      {/* 사이클 EE — weather chip preset 3 + 자유 입력 (길이 30자 한도) */}
      {trigger.type === "weather" && (
        <div className="space-y-td-xxs mb-td-sm">
          <label
            htmlFor="replan-weather-condition"
            className="text-td-caption text-ink-mute"
          >
            날씨 상태는?
          </label>
          <div className="flex flex-wrap gap-td-xxs">
            {WEATHER_PRESETS.map((w) => {
              const active = trigger.condition === w;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() =>
                    onTriggerChange(
                      buildTrigger("weather", trigger.itemId, trigger.minutes, w),
                    )
                  }
                  className={`px-3 py-1 rounded-full border text-td-caption font-medium transition-colors ${
                    active
                      ? "bg-purple text-white border-purple"
                      : "border-divider text-ink-soft hover:border-purple/40"
                  }`}
                >
                  {w}
                </button>
              );
            })}
          </div>
          <input
            id="replan-weather-condition"
            type="text"
            maxLength={WEATHER_CONDITION_MAX}
            placeholder={`또는 직접 입력 (예: 폭염, 미세먼지) · 최대 ${WEATHER_CONDITION_MAX}자`}
            value={
              WEATHER_PRESETS.includes(
                trigger.condition as (typeof WEATHER_PRESETS)[number],
              )
                ? ""
                : trigger.condition
            }
            onChange={(e) => {
              const next = e.target.value.slice(0, WEATHER_CONDITION_MAX);
              onTriggerChange(
                buildTrigger(
                  "weather",
                  trigger.itemId,
                  trigger.minutes,
                  next.length > 0 ? next : "비",
                ),
              );
            }}
            className="w-full border border-divider rounded-md px-2 py-1.5 text-td-meta bg-surface-soft"
          />
        </div>
      )}

      {/* 지연 분 + 액션 버튼 */}
      <div className="flex flex-wrap gap-td-xs">
        {PRESET_MINUTES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              onTriggerChange(buildTrigger(trigger.type, trigger.itemId, m));
              onOpenReplan();
            }}
            className={`px-3 py-1.5 rounded-full border text-td-caption font-medium tabular-nums transition-colors ${
              trigger.minutes === m && replanOpen
                ? "bg-purple text-white border-purple"
                : "border-divider text-ink-soft hover:border-purple/40"
            }`}
          >
            {m}분 지연
          </button>
        ))}
        <Button variant="primary" size="sm" onClick={onOpenReplan}>
          Live Replan 열기
        </Button>
        {appliedLabel && (
          <Button variant="secondary" size="sm" onClick={onReset}>
            초기화
          </Button>
        )}
      </div>
    </div>
  );
}
