"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DEMO_TRIP_ID } from "@/lib/seed";

/**
 * 일정 생성 중 화면 (LEVEL 1) — docs/screens/02-itinerary-creating.md
 *
 * 답해야 할 질문: "AI가 진짜 일하고 있다는 신뢰의 시작점인가?"
 *
 * 디자인 결정:
 * - 단순 스피너 X — AI 사고 단계를 4개로 시각화
 * - 단계별 약 3초 (총 ~12초) — 너무 빨라도 의심, 너무 느려도 이탈
 * - 마지막 단계 후 자동 navigation
 * - 단계 텍스트는 환각 차단 5단계 검증 명시 (우리 정체성)
 */

function getSteps(dest: string) {
  return [
    {
      title: "취향 분석",
      detail: "맛집 위주 · 사진 명소 · 균형 페이스",
    },
    {
      title: `${dest} 인기 장소 검토`,
      detail: "도보·차량 동선 후보 정렬",
    },
    {
      title: "AI 일정 생성",
      detail: "Claude AI가 최적 동선을 설계합니다",
    },
    {
      title: "5단계 환각 차단 검증",
      detail: "장소 존재 · 영업 상태 · 예약 · 거리 · 가격",
    },
  ];
}

const STEP_MS = 2800;

export default function ItineraryCreatingPage() {
  return (
    <Suspense fallback={<main className="min-h-screen p-5" />}>
      <ItineraryCreatingInner />
    </Suspense>
  );
}

function ItineraryCreatingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = searchParams.get("trip") ?? DEMO_TRIP_ID;
  const destination = searchParams.get("dest") ?? "베트남";
  const [active, setActive] = useState(0);
  const [done, setDone] = useState(false);

  const steps = getSteps(destination);

  useEffect(() => {
    if (active >= steps.length) {
      setDone(true);
      const t = setTimeout(() => {
        router.push(`/itinerary/${tripId}`);
      }, 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setActive((a) => a + 1), STEP_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, router, tripId]);

  const progress = Math.min(100, Math.round((active / steps.length) * 100));

  return (
    <main className="min-h-screen p-5 flex flex-col">
      <p className="text-[11px] font-medium text-purple tracking-widest mb-3">
        TRAVELDIARY
      </p>
      <h1 className="text-[22px] font-medium leading-tight mb-1">
        AI가 당신의
        <br />
        {destination} 여행을 그리고 있어요
      </h1>
      <p className="text-[12px] text-ink-soft mb-5">
        평균 12초 · 백그라운드에서 동작
      </p>

      <div
        className="h-[6px] bg-surface-soft rounded-full overflow-hidden mb-1"
        aria-hidden="true"
      >
        <div
          className="h-full bg-purple rounded-full transition-all duration-500"
          style={{ width: `${done ? 100 : progress}%` }}
        />
      </div>
      <p className="text-[11px] text-ink-mute mb-6 self-end" aria-live="polite">
        {done ? "100" : progress}%
      </p>

      <ul className="space-y-3">
        {steps.map((s, idx) => {
          const state =
            idx < active ? "done" : idx === active ? "active" : "pending";
          return (
            <li key={s.title} className="flex items-start gap-3">
              <StepIcon state={state} />
              <div className="flex-1 min-w-0 pt-[1px]">
                <p
                  className={`text-[14px] font-medium leading-snug ${
                    state === "pending" ? "text-ink-mute" : "text-ink"
                  }`}
                >
                  {s.title}
                  {state === "done" && (
                    <span className="text-[11px] text-success ml-2">완료</span>
                  )}
                </p>
                {state === "active" && (
                  <p className="text-[11px] text-ink-soft mt-0.5">{s.detail}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex-1" />

      {done && (
        <p className="text-[12px] text-success-deep text-center mt-6">
          일정 완성! 이동 중…
        </p>
      )}
    </main>
  );
}

function StepIcon({ state }: { state: "done" | "active" | "pending" }) {
  const base = "w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0";
  if (state === "done") {
    return <span className={`${base} bg-success text-white`} aria-label="완료">✓</span>;
  }
  if (state === "active") {
    return (
      <span
        className={`${base} bg-purple text-white animate-pulse`}
        aria-label="진행 중"
      >
        ●
      </span>
    );
  }
  return (
    <span
      className={`${base} border border-divider text-ink-mute`}
      aria-label="대기"
    >
      ○
    </span>
  );
}
