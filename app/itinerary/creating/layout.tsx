import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "일정 생성 중 — TravelDiary",
  description: "AI가 맞춤 여행 일정을 만들고 있어요.",
};

export default function CreatingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
