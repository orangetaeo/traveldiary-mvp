"use client";

import { Suspense, useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createTripFromOnboarding } from "@/actions/trip";
import { trackFunnelStep } from "@/lib/analytics/funnel";
import { formatStartDateKo, destinationToCode, paceLabelToCode } from "./utils";

/**
 * 온보딩 4단계
 *
 * 디자인 결정 (docs/screens/01-onboarding.md 참고):
 * 1. 회원가입 강제 X — 익명 시작, 가치 본 후 로그인 유도
 * 2. 최대 4단계 — 더 길면 이탈 급증
 * 3. 선택지 우선 — 키보드 입력 최소화
 * 4. Step 4 (취향)는 건너뛰기 가능 — 나중에 채울 수 있음
 * 5. "일정 만들기" → 즉시 일정 생성 화면 (회원가입 없음)
 */

type Step = 1 | 2 | 3 | 4;

const DESTINATIONS = [
  { flag: "🇻🇳", name: "푸꾸옥", support: "완전 지원" },
  { flag: "🇻🇳", name: "다낭", support: "완전 지원" },
  { flag: "🇻🇳", name: "호치민", support: "완전 지원" },
  { flag: "🇻🇳", name: "하노이", support: "완전 지원" },
  { flag: "🇻🇳", name: "나트랑", support: "완전 지원" },
  { flag: "🇻🇳", name: "달랏", support: "완전 지원" },
];

const COMPANIONS = [
  { id: "solo", name: "혼자", desc: "자유로운 페이스" },
  { id: "friends", name: "친구·연인", desc: "2~4명, 비슷한 취향" },
  { id: "family", name: "가족", desc: "아이·부모님 포함" },
  { id: "group", name: "단체", desc: "5명 이상" },
] as const;

const VIBES = ["맛집 위주", "관광지", "사진 명소", "쇼핑", "자연·힐링", "현지인 핫플"];
const PACES = ["여유롭게", "균형있게", "최대한 많이"];
const EXCLUDES = ["새우 알레르기", "매운 거 못 먹음", "비건"];

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingInner />
    </Suspense>
  );
}

function OnboardingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") ?? undefined; // C2: 초대 코드 추적
  const [step, setStep] = useState<Step>(1);

  // C2: 퍼널 트래킹 — 페이지 진입 + 단계 전환
  useEffect(() => { trackFunnelStep("view", ref ? { ref } : undefined); }, [ref]);
  useEffect(() => { trackFunnelStep(`step${step}` as "step1", ref ? { ref } : undefined); }, [step, ref]);

  // Step 2: 목적지
  const [destination, setDestination] = useState("푸꾸옥");

  // Step 3: 기간·일행
  const [startDate] = useState(getDefaultStartDate);
  const [nights, setNights] = useState(4);
  const [companion, setCompanion] = useState<string>("friends");

  // Step 4: 취향
  const [vibes, setVibes] = useState<string[]>(["맛집 위주", "사진 명소"]);
  const [pace, setPace] = useState<string>("여유롭게");
  const [excludes, setExcludes] = useState<string[]>([]);

  const toggleVibe = (v: string) => {
    setVibes((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  };

  const toggleExclude = (v: string) => {
    setExcludes((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  };

  const [isPending, startTransition] = useTransition();

  const handleFinish = () => {
    trackFunnelStep("submit", { destination, companion, ...(ref ? { ref } : {}) });
    startTransition(async () => {
      const result = await createTripFromOnboarding({
        destination,
        destinationCode: destinationToCode(destination),
        nights,
        companion,
        preferences: {
          vibes,
          pace: paceLabelToCode(pace),
          excludes,
        },
        startDate,
      });
      trackFunnelStep("complete", { destination, tripId: result.id, ...(ref ? { ref } : {}) });
      router.replace(`/itinerary/creating?trip=${result.id}&dest=${encodeURIComponent(destination)}`);
    });
  };

  return (
    <main className="min-h-screen flex flex-col px-td-md pt-td-sm pb-td-md bg-surface-soft">
      {/* 진행률 — Step 1에서는 숨김 */}
      {step > 1 && (
        <div className="flex items-center gap-td-xs mb-td-sm" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={4} aria-label={`단계 ${step}/4`}>
          <div className="flex-1 flex gap-1">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className={`h-1 flex-1 rounded-full transition-all ${
                  n <= step ? "bg-purple" : "bg-divider"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* 화면 컨테���너 — 풀 블리드 */}
      <div className="flex-1 flex flex-col">
        {step === 1 && <Step1 onNext={() => setStep(2)} />}
        {step === 2 && (
          <Step2
            destination={destination}
            onSelect={setDestination}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <Step3
            startDateLabel={formatStartDateKo(startDate)}
            nights={nights}
            setNights={setNights}
            companion={companion}
            setCompanion={setCompanion}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <Step4
            vibes={vibes}
            toggleVibe={toggleVibe}
            pace={pace}
            setPace={setPace}
            excludes={excludes}
            toggleExclude={toggleExclude}
            onBack={() => setStep(3)}
            onFinish={handleFinish}
            isPending={isPending}
          />
        )}
      </div>
    </main>
  );
}

// ─── Step 1 ──────────────────────────────────

function Step1({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex-1 flex flex-col justify-center gap-td-lg">
      <div className="flex flex-col gap-td-xs">
        <span className="text-td-caption font-bold text-purple tracking-widest">
          TRAVELDIARY
        </span>
        <h1 className="text-td-title text-ink">
          3분 안에 당신의 여행을
          <br />
          그려드려요
        </h1>
        <p className="text-td-body text-ink-soft mt-td-xxs">
          AI가 추천한 일정에 왜 이걸 골랐는지 근거까지.
          <br />
          여행 중에는 살아 움직여요.
        </p>
      </div>

      {/* 미니 데모 카드 — 세로 타임라인 */}
      <div className="bg-surface-card border border-divider rounded-md p-td-md shadow-sm">
        <div className="flex items-center gap-td-xs mb-td-sm">
          <span
            className="material-symbols-outlined text-purple text-[20px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            calendar_today
          </span>
          <span className="text-td-card-title font-medium text-ink">
            푸꾸옥 Day 1
          </span>
        </div>
        <div className="flex flex-col gap-td-sm relative pl-td-md before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-divider">
          <TimelineItem name="킹콩마트" tag="가성비" tagColor="text-purple" />
          <TimelineItem name="즈엉동 야시장" tag="로컬맛집" tagColor="text-accent" />
          <TimelineItem name="빈펄 사파리" tag="아이동반" tagColor="text-purple" />
        </div>
      </div>

      <div className="flex flex-col gap-td-sm mt-td-sm">
        <button
          className="w-full h-[52px] bg-purple text-white text-td-card-title rounded-md active:scale-[0.98] transition-transform"
          onClick={onNext}
        >
          시작하기
        </button>
        <p className="text-td-caption text-ink-mute text-center">
          로그인 없이 바로 일정을 만들 수 있어요
        </p>
      </div>
    </div>
  );
}

function TimelineItem({
  name,
  tag,
  tagColor,
}: {
  name: string;
  tag: string;
  tagColor: string;
}) {
  return (
    <div className="relative">
      <div className="absolute left-[-19px] top-1.5 w-2 h-2 rounded-full bg-purple ring-4 ring-surface-card" />
      <div className="flex flex-col">
        <span className="text-td-body font-medium text-ink">{name}</span>
        <span
          className={`inline-block mt-td-xxs bg-surface-soft px-td-xs py-[2px] rounded text-[10px] font-medium w-fit ${tagColor}`}
        >
          {tag}
        </span>
      </div>
    </div>
  );
}


// ─── Step 2 ──────────────────────────────────

function Step2({
  destination,
  onSelect,
  onBack,
  onNext,
}: {
  destination: string;
  onSelect: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <button className="flex items-center text-td-body text-ink-soft mb-td-sm" onClick={onBack}>
        <span className="material-symbols-outlined text-[20px] mr-0.5">chevron_left</span> 뒤로
      </button>
      <h2 className="text-td-title mb-td-xxs">어디로 떠나세요?</h2>
      <p className="text-td-body text-ink-soft mb-td-lg">
        베트남 6개 도시 완전 지원
      </p>

      <div className="grid grid-cols-3 gap-td-sm flex-1">
        {DESTINATIONS.map((d) => (
          <button
            key={d.name}
            className={`aspect-square flex flex-col items-center justify-center rounded-md p-td-xs transition-all relative ${
              destination === d.name
                ? "border-2 border-purple bg-surface-card shadow-sm scale-[1.02]"
                : "border border-divider bg-surface-card active:bg-surface-soft active:scale-[0.97]"
            }`}
            onClick={() => onSelect(d.name)}
          >
            <span className="text-2xl mb-td-xxs">{d.flag}</span>
            <span className="text-td-body font-medium">{d.name}</span>
            {destination === d.name && (
              <span className="text-td-caption text-purple mt-0.5">{d.support}</span>
            )}
            {destination === d.name && (
              <span className="material-symbols-outlined text-purple text-sm absolute top-1 right-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            )}
          </button>
        ))}
      </div>

      <button
        className="w-full h-[52px] bg-purple text-white text-td-card-title rounded-md mt-td-lg active:scale-[0.98] transition-transform"
        onClick={onNext}
      >
        다음
      </button>
    </>
  );
}

// ─── Step 3 ──────────────────────────────────

function Step3({
  startDateLabel,
  nights,
  setNights,
  companion,
  setCompanion,
  onBack,
  onNext,
}: {
  startDateLabel: string;
  nights: number;
  setNights: (n: number) => void;
  companion: string;
  setCompanion: (c: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <button className="flex items-center text-td-body text-ink-soft mb-td-sm" onClick={onBack}>
        <span className="material-symbols-outlined text-[20px] mr-0.5">chevron_left</span> 뒤로
      </button>
      <h2 className="text-td-title mb-td-lg">언제, 누구와?</h2>

      <div className="space-y-td-lg flex-1">
        {/* 기간 */}
        <div className="flex gap-td-sm">
          <div className="flex-1 bg-surface-soft border border-divider rounded-md p-td-sm">
            <p className="text-td-meta text-ink-soft mb-td-xxs">출발일</p>
            <p className="text-td-card-title">{startDateLabel}</p>
          </div>
          <div className="flex-1 bg-surface-soft border border-divider rounded-md p-td-sm flex flex-col justify-between">
            <p className="text-td-meta text-ink-soft mb-td-xxs">숙박</p>
            <div className="flex items-center justify-between">
              <button
                className="material-symbols-outlined text-ink-soft text-lg"
                onClick={() => setNights(Math.max(1, nights - 1))}
              >
                remove
              </button>
              <span className="text-td-card-title">{nights}박</span>
              <button
                className="material-symbols-outlined text-accent text-lg"
                onClick={() => setNights(Math.min(30, nights + 1))}
              >
                add
              </button>
            </div>
          </div>
        </div>

        {/* 동행 */}
        <div className="grid grid-cols-2 gap-td-xs">
          {COMPANIONS.map((c) => (
            <button
              key={c.id}
              className={`h-14 flex items-center justify-center rounded-md text-td-body transition-all ${
                companion === c.id
                  ? "bg-purple text-white font-medium border border-purple"
                  : "bg-surface-card border border-divider"
              }`}
              onClick={() => setCompanion(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <button
        className="w-full h-[52px] bg-purple text-white text-td-card-title rounded-md mt-td-lg active:scale-[0.98] transition-transform"
        onClick={onNext}
      >
        다음
      </button>
    </>
  );
}

// ─── Step 4 ──────────────────────────────────

function Step4({
  vibes,
  toggleVibe,
  pace,
  setPace,
  excludes,
  toggleExclude,
  onBack,
  onFinish,
  isPending,
}: {
  vibes: string[];
  toggleVibe: (v: string) => void;
  pace: string;
  setPace: (p: string) => void;
  excludes: string[];
  toggleExclude: (e: string) => void;
  onBack: () => void;
  onFinish: () => void;
  isPending: boolean;
}) {
  return (
    <>
      <button className="flex items-center text-td-body text-ink-soft mb-td-sm" onClick={onBack}>
        <span className="material-symbols-outlined text-[20px] mr-0.5">chevron_left</span> 뒤로
      </button>
      <h2 className="text-td-title mb-td-lg">취향을 알려주세요</h2>

      <div className="space-y-td-lg flex-1 overflow-y-auto">
        {/* 분위기 */}
        <div>
          <h3 className="text-td-body font-semibold mb-td-sm">여행의 분위기</h3>
          <div className="flex flex-wrap gap-td-xs">
            {VIBES.map((v) => (
              <Chip key={v} active={vibes.includes(v)} onClick={() => toggleVibe(v)}>
                {v}
              </Chip>
            ))}
          </div>
        </div>

        {/* 페이스 */}
        <div>
          <h3 className="text-td-body font-semibold mb-td-sm">일정의 강도</h3>
          <div className="flex flex-wrap gap-td-xs">
            {PACES.map((p) => (
              <Chip key={p} active={pace === p} onClick={() => setPace(p)}>
                {p}
              </Chip>
            ))}
          </div>
        </div>

        {/* 기피 항목 */}
        <div>
          <h3 className="text-td-body font-semibold mb-td-sm text-danger flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">warning</span> 기피 항목
          </h3>
          <div className="flex flex-wrap gap-td-xs">
            {EXCLUDES.map((e) => (
              <Chip
                key={e}
                active={excludes.includes(e)}
                danger
                onClick={() => toggleExclude(e)}
              >
                {e}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-td-sm mt-td-lg">
        <button
          className="flex-1 h-[52px] text-ink-soft text-td-body underline"
          onClick={onFinish}
          disabled={isPending}
        >
          건너뛰기
        </button>
        <button
          className="flex-[2] h-[52px] bg-purple text-white text-td-card-title rounded-md flex items-center justify-center gap-1 disabled:opacity-60 active:scale-[0.98] transition-transform"
          onClick={onFinish}
          disabled={isPending}
        >
          {isPending ? "일정 만드는 중…" : (
            <>일정 만들기 <span className="material-symbols-outlined text-lg">arrow_forward</span></>
          )}
        </button>
      </div>
    </>
  );
}

/** 출발일 기본값 — 오늘로부터 7일 후 */
function getDefaultStartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}


function Chip({
  active,
  danger,
  onClick,
  children,
}: {
  active: boolean;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  let style = "";
  if (active && danger) {
    style = "bg-danger-soft text-danger border border-danger font-medium";
  } else if (active) {
    style = "bg-purple text-white border border-purple";
  } else {
    style = "bg-surface-soft border border-divider text-ink-soft";
  }

  return (
    <button
      className={`text-td-body px-td-sm py-td-xs rounded-full whitespace-nowrap transition-colors ${style}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
