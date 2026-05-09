import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "설정",
  description: "알림, 위치, 데이터, 계정 설정을 관리하세요.",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
