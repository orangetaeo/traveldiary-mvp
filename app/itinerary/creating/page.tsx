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
        router.replace(`/itinerary/${tripId}`);
      }, 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setActive((a) => a + 1), STEP_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, router, tripId]);

  const progress = Math.min(100, Math.round((active / steps.length) * 100));

  return (
    <main className="min-h-screen flex flex-col bg-surface px-4 py-6 max-w-md mx-auto w-full">
      {/* Eyebrow + Hero */}
      <div className="space-y-2 mb-6">
        <span className="text-td-caption font-medium text-purple tracking-[0.2em] block">
          TRAVELDIARY
        </span>
        <h1 className="text-td-title whitespace-pre-line">
          AI가 당신의{"\n"}{destination} 여행을 그리고 있어요
        </h1>
        <p className="text-td-meta text-ink-mute">
          평균 12초 · 백그라운드에서 동작
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div
          className="w-full bg-surface-soft h-[6px] rounded-full overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="h-full bg-purple rounded-full transition-all duration-500"
            style={{ width: `${done ? 100 : progress}%` }}
          />
        </div>
        <div className="flex justify-end mt-1">
          <span className="text-td-caption font-medium text-purple" aria-live="polite">
            {done ? "100" : progress}%
          </span>
        </div>
      </div>

      {/* Bento-style step card */}
      <div className="bg-surface-card border border-divider rounded-md p-4 space-y-3">
        {steps.map((s, idx) => {
          const state =
            idx < active ? "done" : idx === active ? "active" : "pending";
          return (
            <div key={s.title} className="flex items-start gap-3">
              <StepIcon state={state} />
              <div className="flex-1 min-w-0">
                {state === "done" ? (
                  <div className="flex justify-between items-center">
                    <span className="text-td-body font-medium">{s.title}</span>
                    <span className="px-2 py-[2px] bg-success-soft text-success text-td-caption rounded-md">
                      완료
                    </span>
                  </div>
                ) : state === "active" ? (
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-td-body font-medium text-purple">
                        {s.title}
                      </span>
                      <div className="flex gap-1 items-center pt-1">
                        <span className="w-1.5 h-1.5 bg-purple rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-purple rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-purple rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                    <p className="text-td-caption text-ink-mute mt-1">{s.detail}</p>
                  </div>
                ) : (
                  <span className="text-td-body font-medium text-ink-mute">
                    {s.title}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex-1" />

      {done && (
        <p className="text-td-meta text-success text-center mt-6 font-medium">
          일정 완성! 이동 중…
        </p>
      )}
    </main>
  );
}

function StepIcon({ state }: { state: "done" | "active" | "pending" }) {
  const base = "w-6 h-6 rounded-full flex items-center justify-center shrink-0";
  if (state === "done") {
    return (
      <span className={`${base} bg-success`} aria-label="완료">
        <span className="material-symbols-outlined text-white text-[16px] font-bold">
          check
        </span>
      </span>
    );
  }
  if (state === "active") {
    return (
      <span
        className={`${base} bg-purple shadow-[0_0_0_0_rgba(124,58,237,0.4)] animate-pulse`}
        aria-label="진행 중"
      >
        <span className="w-2 h-2 bg-white rounded-full" />
      </span>
    );
  }
  return (
    <span
      className={`${base} border border-ink-mute`}
      aria-label="대기"
    />
  );
}
