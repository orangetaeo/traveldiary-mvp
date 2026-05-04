/**
 * Bottom Nav 4슬롯 — 사이클 I (ADR-033) → 사이클 O 컴포넌트 추출.
 *
 * 두 페이지(/, /trips)에 동일 코드 60행 중복을 단일 컴포넌트로 통합.
 * 행위 보존 — 시각·ARIA·라우팅 무변경.
 *
 * Server Component 호환 — Link만 사용, useState 0개.
 *
 * 다음 페이지 추가 시 즉시 활용:
 *   <BottomNav active="city" />   // 새 슬롯 필요 시 union 확장
 */

import Link from "next/link";
import { DEMO_TRIP_ID } from "@/lib/seed";

export type BottomNavSlot = "home" | "trips" | "itinerary" | "profile";

interface BottomNavProps {
  active: BottomNavSlot;
}

interface SlotDef {
  key: BottomNavSlot;
  href: string;
  icon: string;
  label: string;
}

function buildSlots(): SlotDef[] {
  return [
    { key: "home", href: "/", icon: "home", label: "Home" },
    { key: "trips", href: "/trips", icon: "explore", label: "Trips" },
    {
      key: "itinerary",
      href: `/itinerary/${DEMO_TRIP_ID}`,
      icon: "calendar_today",
      label: "Itinerary",
    },
    { key: "profile", href: "/profile", icon: "person", label: "Profile" },
  ];
}

export function BottomNav({ active }: BottomNavProps) {
  const slots = buildSlots();
  return (
    <nav
      className="bg-surface-card border-t border-divider fixed bottom-0 left-1/2 -translate-x-1/2 max-w-[420px] w-full z-50 flex justify-around items-center h-16"
      aria-label="주요 메뉴"
    >
      {slots.map((slot) => {
        const isActive = slot.key === active;
        return (
          <Link
            key={slot.key}
            href={slot.href}
            className={`flex flex-col items-center justify-center text-[10px] font-medium ${
              isActive
                ? "text-purple"
                : "text-ink-mute hover:text-purple transition-colors"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <span
              className={`material-symbols-outlined ${isActive ? "filled" : ""}`}
            >
              {slot.icon}
            </span>
            <span>{slot.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
