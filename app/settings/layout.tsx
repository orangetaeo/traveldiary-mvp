import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "설정 — TravelDiary",
  description: "계정, 알림, 위치, 데이터 설정을 관리합니다.",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
