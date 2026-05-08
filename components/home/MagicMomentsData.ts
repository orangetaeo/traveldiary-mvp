/**
 * 매직 모먼트 4축 카드 데이터 (M1~M4).
 *
 * docs/02-magic-moments.md 정의 답습:
 * - M1 추천 근거 패널 (purple)
 * - M2 D-Day 자동 모드 전환 (accent 코랄)
 * - M3 Live Replan (purple-deep)
 * - M4 카메라 번역 (amber)
 *
 * Server Component에서 import 가능 — 순수 정적 데이터.
 */

import type { MomentCard } from "./MagicMomentsCarousel";
import { DEMO_TRIP_ID } from "@/lib/seed";

export function buildMomentCards(): MomentCard[] {
  return [
    {
      id: "m1",
      badge: "M1 — 추천 근거",
      title: "왜 이걸 골랐는지 보여줘요",
      description:
        "AI 추천 옆에 한국어 후기 + 거리 + 검증 출처를 함께 표시. 결과만 보여주는 다른 앱과 결정적 차이.",
      icon: "fact_check",
      gradient: "bg-gradient-to-br from-purple to-purple-deep",
      href: `/itinerary/${DEMO_TRIP_ID}`,
      hrefLabel: "데모 일정 보기",
    },
    {
      id: "m2",
      badge: "M2 — D-Day 모드 전환",
      title: "여행 시작하면 앱이 알아서 바뀌어요",
      description:
        "출발 당일 GPS로 자동 인식. 헤더는 'DAY 2 · 13:42', 강조 색은 코랄로. 누른 적 없는 변신이 락인을 만듭니다.",
      icon: "auto_awesome",
      gradient: "bg-gradient-to-br from-accent to-accent-deep",
      href: `/travel/${DEMO_TRIP_ID}`,
      hrefLabel: "여행 중 모드 보기",
    },
    {
      id: "m3",
      badge: "M3 — Live Replan",
      title: "지각해도 괜찮아요, 실시간으로 바꿔요",
      description:
        "지연·악천후·웨이팅 시 3가지 옵션 제시(추천·안전·강행). AI가 강제 안 함 — 통제권은 당신에게.",
      icon: "swap_horiz",
      gradient: "bg-gradient-to-br from-purple-deep to-purple",
      href: `/itinerary/${DEMO_TRIP_ID}`,
      hrefLabel: "재계획 시연 보기",
    },
    {
      id: "m4",
      badge: "M4 — 카메라 번역",
      title: "메뉴판을 비추면 바로 한국어로",
      description:
        "Vision OCR + Claude로 메뉴를 즉시 한국어 번역. 알레르기 필터까지 — 새우 표시도 자동 강조.",
      icon: "photo_camera",
      gradient: "bg-gradient-to-br from-amber to-amber-deep",
      href: "/translate",
      hrefLabel: "카메라 번역 열기",
    },
  ];
}
