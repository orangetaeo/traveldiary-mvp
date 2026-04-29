import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <p className="text-[11px] font-medium text-accent tracking-widest mb-3">
        TRAVELDIARY
      </p>
      <h1 className="text-[28px] font-medium leading-tight mb-2">
        자유여행자를 위한
        <br />
        <span className="text-accent">AI 여행 동반자</span>
      </h1>
      <p className="text-sm text-ink-soft mb-12 leading-relaxed">
        일정을 짜고, 살아 움직이게 하고,
        <br />
        함께 만들어 가다.
      </p>

      <Link
        href="/onboarding"
        className="bg-ink text-white px-10 py-3.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
      >
        시작하기
      </Link>

      <p className="text-[11px] text-ink-mute mt-3">
        로그인 없이 바로 일정을 만들 수 있어요
      </p>
    </main>
  );
}
