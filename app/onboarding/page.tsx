"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTripFromOnboarding } from "@/actions/trip";

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
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

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
      router.push(`/itinerary/creating?trip=${result.id}`);
    });
  };

  const stepTitle = { 1: "시작", 2: "목적지", 3: "기간·일행", 4: "취향" }[step];

  return (
    <main className="min-h-screen p-4 flex flex-col">
      {/* 진행률 표시 */}
      <div className="flex justify-between items-center mb-1 px-1">
        <span className="text-[11px] text-ink-soft">
          <span className="text-accent font-medium">{step}</span> / 4
        </span>
        <span className="text-[11px] text-ink-soft">{stepTitle}</span>
      </div>
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex-1 h-[3px] bg-surface-soft rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: n <= step ? "100%" : "0%" }}
            />
          </div>
        ))}
      </div>

      {/* 화면 컨테이너 */}
      <div className="bg-surface-card border border-divider rounded-lg p-5 flex-1 flex flex-col">
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
    <>
      <p className="text-[11px] font-medium text-accent tracking-widest mb-2">
        TRAVELDIARY
      </p>
      <h1 className="text-[22px] font-medium leading-tight mb-1.5">
        3분 안에
        <br />
        당신의 여행을 그려드려요
      </h1>
      <p className="text-[13px] text-ink-soft leading-relaxed mb-4">
        AI가 추천한 일정에 왜 이걸 골랐는지 근거까지.
        <br />
        여행 중에는 살아 움직여요.
      </p>

      {/* 미니 데모 */}
      <div className="bg-surface-soft rounded-md p-3.5 mb-4">
        <p className="text-[10px] font-medium text-ink-soft tracking-wider mb-2">
          예시 · 푸꾸옥 3박 4일 Day 1
        </p>
        <DemoRow time="14:00" name="호텔 체크인" tagText="휴식" tagColor="success" />
        <DemoRow time="18:30" name="즈엉동 야시장" tagText="맛집" tagColor="amber" />
        <DemoRow time="20:30" name="디아동 야경" tagText="관광" tagColor="purple" last />
      </div>

      <div className="flex-1" />

      <button
        className="bg-ink text-white py-3.5 rounded-md text-sm font-medium w-full"
        onClick={onNext}
      >
        시작하기
      </button>
      <p className="text-[10px] text-ink-mute text-center mt-2.5">
        로그인 없이 바로 일정을 만들 수 있어요
      </p>
    </>
  );
}

function DemoRow({
  time,
  name,
  tagText,
  tagColor,
  last,
}: {
  time: string;
  name: string;
  tagText: string;
  tagColor: "purple" | "amber" | "success";
  last?: boolean;
}) {
  const tagStyle = {
    purple: "bg-purple-soft text-purple-deep",
    amber: "bg-amber-soft text-amber-deep",
    success: "bg-success-soft text-success-deep",
  }[tagColor];

  return (
    <div
      className={`flex justify-between items-center py-1.5 text-xs ${
        !last ? "border-b border-black/[0.06]" : ""
      }`}
    >
      <span className="text-ink-soft min-w-[40px]">{time}</span>
      <span className="flex-1 px-2">{name}</span>
      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${tagStyle}`}>
        {tagText}
      </span>
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
      <button className="text-[13px] text-ink-soft self-start mb-2" onClick={onBack}>
        ‹ 뒤로
      </button>
      <h2 className="text-xl font-medium mb-1.5">어디로 떠나세요?</h2>
      <p className="text-[13px] text-ink-soft mb-4">
        베트남 6개 도시 완전 지원 — AI 일정 + 실시간 도우미
      </p>

      <input
        className="w-full px-3 py-2.5 text-sm border border-divider rounded-md bg-surface-soft mb-3"
        placeholder="도시 또는 국가 검색"
      />

      <p className="text-[10px] font-medium text-ink-soft tracking-wider mb-2">
        한국인이 자주 가는 곳
      </p>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {DESTINATIONS.map((d) => (
          <button
            key={d.name}
            className={`p-3 rounded-md text-left transition-all ${
              destination === d.name
                ? "border-2 border-accent bg-accent-soft"
                : "border border-divider"
            }`}
            onClick={() => onSelect(d.name)}
          >
            <span className="text-lg">{d.flag}</span>
            <p className="text-[13px] font-medium mt-1">{d.name}</p>
            <p className="text-[10px] text-ink-soft">{d.support}</p>
          </button>
        ))}
      </div>

      <div className="flex-1" />

      <button
        className="bg-ink text-white py-3.5 rounded-md text-sm font-medium w-full"
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
      <button className="text-[13px] text-ink-soft self-start mb-2" onClick={onBack}>
        ‹ 뒤로
      </button>
      <h2 className="text-xl font-medium mb-1.5">언제, 누구와?</h2>
      <p className="text-[13px] text-ink-soft mb-4">
        대략적으로만 알려주세요. 나중에 바꿀 수 있어요.
      </p>

      <p className="text-[10px] font-medium text-ink-soft tracking-wider mb-2">
        기간
      </p>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div className="bg-surface-soft rounded-md p-3">
          <p className="text-[10px] text-ink-soft mb-1">출발일</p>
          <p className="text-sm font-medium">{startDateLabel}</p>
        </div>
        <div className="bg-surface-soft rounded-md p-3">
          <p className="text-[10px] text-ink-soft mb-1">박수</p>
          <div className="flex items-center gap-2.5 mt-0.5">
            <button
              className="w-6 h-6 rounded-full border border-divider bg-white text-sm"
              onClick={() => setNights(Math.max(1, nights - 1))}
            >
              −
            </button>
            <span className="text-[13px] font-medium min-w-[16px] text-center">
              {nights}
            </span>
            <button
              className="w-6 h-6 rounded-full border border-divider bg-white text-sm"
              onClick={() => setNights(Math.min(30, nights + 1))}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <p className="text-[10px] font-medium text-ink-soft tracking-wider mb-2">
        동행
      </p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {COMPANIONS.map((c) => (
          <button
            key={c.id}
            className={`p-2.5 rounded-md text-center transition-all ${
              companion === c.id
                ? "border-2 border-accent bg-accent-soft"
                : "border border-divider"
            }`}
            onClick={() => setCompanion(c.id)}
          >
            <p className="text-xs font-medium mb-0.5">{c.name}</p>
            <p className="text-[10px] text-ink-soft">{c.desc}</p>
          </button>
        ))}
      </div>

      <div className="flex-1" />

      <button
        className="bg-ink text-white py-3.5 rounded-md text-sm font-medium w-full"
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
      <button className="text-[13px] text-ink-soft self-start mb-2" onClick={onBack}>
        ‹ 뒤로
      </button>
      <h2 className="text-xl font-medium mb-1.5">취향을 알려주세요</h2>
      <p className="text-[13px] text-ink-soft mb-4">
        선택할수록 정확해져요. 건너뛰어도 돼요.
      </p>

      <p className="text-[10px] font-medium text-ink-soft tracking-wider mb-2">
        분위기 · 1~3개 선택
      </p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {VIBES.map((v) => (
          <Chip key={v} active={vibes.includes(v)} onClick={() => toggleVibe(v)}>
            {v}
          </Chip>
        ))}
      </div>

      <p className="text-[10px] font-medium text-ink-soft tracking-wider mb-2">
        페이스
      </p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {PACES.map((p) => (
          <Chip key={p} active={pace === p} onClick={() => setPace(p)}>
            {p}
          </Chip>
        ))}
      </div>

      <p className="text-[10px] font-medium text-ink-soft tracking-wider mb-2">
        제외할 것 · 알레르기 · 건너뛰기 가능
      </p>
      <div className="flex flex-wrap gap-1.5 mb-3">
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

      <div className="flex-1" />

      <div className="flex gap-2 items-center">
        <button
          className="text-xs text-ink-soft px-3 py-3"
          onClick={onFinish}
          disabled={isPending}
        >
          건너뛰기
        </button>
        <button
          className="flex-1 bg-ink text-white py-3.5 rounded-md text-sm font-medium disabled:opacity-60"
          onClick={onFinish}
          disabled={isPending}
        >
          {isPending ? "일정 만드는 중…" : "일정 만들기 →"}
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

/** 날짜 문자열을 한국어 표시로 변환 (예: "5월 14일 (수)") */
function formatStartDateKo(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdays[d.getDay()]})`;
}

function destinationToCode(name: string): string {
  return ({
    "푸꾸옥": "PQC", "다낭": "DAD", "호치민": "SGN",
    "하노이": "HAN", "나트랑": "NHA", "달랏": "DLI",
  } as Record<string, string>)[name] ?? "PQC";
}

function paceLabelToCode(label: string): "relaxed" | "balanced" | "packed" {
  if (label === "여유롭게") return "relaxed";
  if (label === "최대한 많이") return "packed";
  return "balanced";
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
    style = "bg-danger-soft text-danger-deep border border-danger";
  } else if (active) {
    style = "bg-purple text-white border border-purple";
  } else if (danger) {
    style = "bg-transparent text-ink-soft border border-danger/40";
  } else {
    style = "bg-transparent text-ink-soft border border-divider";
  }

  return (
    <button
      className={`text-[11px] px-3 py-1.5 rounded-full whitespace-nowrap ${style}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
