import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "받은 여행",
  description: "공유받은 여행 일정 목록",
};

export default function SharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
