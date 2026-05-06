"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

interface SpeedDialFabProps {
  children: ReactNode;
  bottomClassName?: string;
  zIndex?: "z-40" | "z-50";
  ariaLabel?: string;
}

export function SpeedDialFab({
  children,
  bottomClassName = "bottom-24",
  zIndex = "z-40",
  ariaLabel = "빠른 메뉴",
}: SpeedDialFabProps) {
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const actionsId = `speed-dial-actions-${reactId}`;

  useEffect(() => {
    if (!expanded) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setExpanded(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  return (
    <div
      className={`fixed ${bottomClassName} left-1/2 -translate-x-1/2 w-full max-w-[420px] ${zIndex} pointer-events-none`}
    >
      <div
        ref={containerRef}
        className="ml-auto pr-td-md w-fit pointer-events-auto"
        onClickCapture={(e) => {
          if (
            expanded &&
            (e.target as HTMLElement).closest('[data-speed-dial-action="true"]')
          ) {
            setExpanded(false);
          }
        }}
      >
        <div
          id={actionsId}
          aria-label="빠른 액션"
          aria-hidden={expanded ? "false" : "true"}
          className={`flex flex-col items-end gap-td-xs mb-td-xs origin-bottom-right transition-all duration-200 ease-out motion-reduce:transition-none ${
            expanded
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
              : "opacity-0 scale-95 translate-y-2 pointer-events-none"
          }`}
        >
          {children}
        </div>
        <button
          type="button"
          aria-label={ariaLabel}
          aria-expanded={expanded ? "true" : "false"}
          aria-controls={actionsId}
          onClick={() => setExpanded((v) => !v)}
          className="ml-auto w-14 h-14 rounded-full bg-purple text-white shadow-xl flex items-center justify-center active:scale-95 transition-transform"
        >
          <span
            className={`material-symbols-outlined transition-transform duration-200 motion-reduce:transition-none ${
              expanded ? "rotate-45" : ""
            }`}
            aria-hidden="true"
          >
            add
          </span>
        </button>
      </div>
    </div>
  );
}
