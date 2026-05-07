"use client";

import { useEffect, useState } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ItineraryError({ error, reset }: ErrorPageProps) {
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setDebugMode(params.get("debug") === "1");
    // 콘솔에도 항상 dump (F12 Console 캡처 가능)
    console.error("[itinerary error.tsx]", {
      name: error.name,
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  if (debugMode) {
    return (
      <div className="min-h-screen bg-surface-soft p-4 text-ink">
        <h1 className="text-lg font-bold mb-2">[DEBUG] /itinerary error</h1>
        <p className="text-sm text-ink-soft mb-2">
          ?debug=1 — production sanitize된 정보. 진짜 stack은 Railway logs 또는
          F12 Console 참고.
        </p>
        <pre className="bg-surface-card p-3 rounded-md border border-divider whitespace-pre-wrap text-xs overflow-auto">
          <strong>name:</strong> {error.name}
          {"\n"}
          <strong>message:</strong> {error.message || "(empty)"}
          {"\n"}
          <strong>digest:</strong> {error.digest ?? "(no digest)"}
          {"\n\n"}
          <strong>stack:</strong>
          {"\n"}
          {error.stack ?? "(no stack)"}
        </pre>
        <button
          onClick={reset}
          className="mt-4 px-6 py-3 bg-purple text-white rounded-md font-semibold"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-soft flex flex-col items-center justify-center px-td-md text-center">
      <span className="text-6xl mb-td-md">📋</span>
      <h1 className="text-xl font-bold text-ink mb-td-xs">
        일정을 불러올 수 없어요
      </h1>
      <p className="text-td-body text-ink-soft max-w-xs leading-relaxed">
        일정 데이터를 가져오는 중 오류가 발생했습니다.
      </p>
      <button
        onClick={reset}
        className="mt-td-lg px-6 py-3 bg-purple text-white rounded-md text-td-body font-semibold hover:opacity-90 transition-opacity"
      >
        다시 시도
      </button>
      <a
        href="/trips"
        className="mt-td-sm text-td-caption text-purple hover:underline"
      >
        여행 목록으로
      </a>
    </div>
  );
}
