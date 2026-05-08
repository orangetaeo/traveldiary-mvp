"use client";

import { useEffect, useState } from "react";

const SPLASH_TOTAL_MS = 1500;
const SPLASH_FADE_BEFORE_MS = 300;
const STORAGE_KEY = "td-splash-shown";

export function SplashOverlay() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY) === "1") return;
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // private mode 등 sessionStorage 차단 시에도 인트로는 한 번 노출
    }
    setVisible(true);
    const fadeTimer = setTimeout(
      () => setFading(true),
      SPLASH_TOTAL_MS - SPLASH_FADE_BEFORE_MS,
    );
    const hideTimer = setTimeout(() => setVisible(false), SPLASH_TOTAL_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-purple-deep via-accent to-amber transition-opacity duration-300 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden
      role="presentation"
      data-testid="splash-overlay"
    >
      <div className="text-center px-td-lg">
        <div className="w-24 h-24 mx-auto mb-td-md rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30">
          <span
            className="material-symbols-outlined text-white"
            style={{ fontSize: "56px" }}
            aria-hidden="true"
          >
            travel_explore
          </span>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight mb-td-xs">
          TravelDiary
        </h1>
        <p className="text-td-body text-white/85">
          AI와 함께, 살아 움직이는 여행
        </p>
      </div>
    </div>
  );
}
