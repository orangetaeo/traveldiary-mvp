import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "권한 요청 — TravelDiary",
  description: "여행 기능 활성화를 위한 권한 요청.",
};

export default function PermissionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
