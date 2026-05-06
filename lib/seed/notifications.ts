/**
 * 알림 데모 시드 — DB 미구현 단계에서 UI 데모용.
 */

import type { AppNotification } from "@/lib/types";

/** 현재 시각 기준 N시간 전 ISO 문자열 */
function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600000).toISOString();
}

/** 현재 시각 기준 N일 전 ISO 문자열 */
function daysAgo(d: number): string {
  return new Date(Date.now() - d * 86400000).toISOString();
}

export const DEMO_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    title: "D-7 여행 준비 리마인더",
    body: "푸꾸옥 여행까지 7일! 체크리스트를 확인하세요.",
    category: "travel",
    icon: "flight_takeoff",
    iconColor: "purple",
    href: "/checklist/demo-trip-phu-quoc",
    read: false,
    createdAt: hoursAgo(2),
  },
  {
    id: "notif-2",
    title: "동행이 일정을 수정했어요",
    body: "민수님이 Day 2 저녁을 변경했습니다.",
    category: "companion",
    icon: "edit_calendar",
    iconColor: "coral",
    href: "/itinerary/demo-trip-phu-quoc",
    read: false,
    createdAt: hoursAgo(5),
  },
  {
    id: "notif-3",
    title: "OTA 가격 변동",
    body: "빈펄 사파리 입장권 ₫280,000 → ₫250,000 (-11%)",
    category: "travel",
    icon: "payments",
    iconColor: "amber",
    href: "/itinerary/demo-trip-phu-quoc",
    read: true,
    createdAt: daysAgo(1),
  },
  {
    id: "notif-4",
    title: "AI 일정 생성 완료",
    body: "다낭 3박 4일 일정이 준비됐어요!",
    category: "travel",
    icon: "auto_awesome",
    iconColor: "purple",
    href: "/itinerary/demo-trip-da-nang",
    read: true,
    createdAt: daysAgo(1),
  },
  {
    id: "notif-5",
    title: "투표가 생성됐어요",
    body: "지영님이 '둘째날 저녁 어디로?' 투표를 만들었어요.",
    category: "companion",
    icon: "how_to_vote",
    iconColor: "coral",
    href: "/vote/demo-trip-phu-quoc",
    read: true,
    createdAt: daysAgo(3),
  },
  {
    id: "notif-6",
    title: "환영합니다!",
    body: "TravelDiary에 가입해주셔서 감사해요. 첫 여행을 만들어보세요.",
    category: "system",
    icon: "waving_hand",
    iconColor: "gray",
    href: "/onboarding",
    read: true,
    createdAt: daysAgo(5),
  },
];
