import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "새 여행 만들기",
  description: "베트남 자유여행 일정 — 도시·일정·취향을 선택하면 AI가 맞춤 일정을 만들어 드려요",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
