/**
 * 알림 센터 — /notifications
 *
 * DB 미구현 단계: 데모 시드 기반. 추후 Notification 모델 도입 시 repository로 교체.
 * Stitch 디자인: screenId c9a5c835 (Notification Center — 알림 센터).
 */

import { NotificationListView } from "@/components/notifications/NotificationListView";
import { DEMO_NOTIFICATIONS } from "@/lib/seed/notifications";
import { BottomNav } from "@/components/ui/BottomNav";

export const metadata = {
  title: "알림 — TravelDiary",
  description: "여행 준비 리마인더, 동행 활동, 가격 변동 알림을 확인하세요.",
};

export default function NotificationsPage() {
  return (
    <>
      <NotificationListView notifications={DEMO_NOTIFICATIONS} />
      <BottomNav active="profile" />
    </>
  );
}
