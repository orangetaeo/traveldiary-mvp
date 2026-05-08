"use client";

/**
 * 받은 trip LocalStorage 추적 + 배너 + 토스트 가시화 — 사이클 W (silent) → 사이클 2 (G7, 2026-05-06).
 *
 * /share/[key] 진입 시:
 *  - addReceivedKey 호출 (LocalStorage 자동 추가)
 *  - 처음 추가된 key면 ReceivedTripBanner 1회 표시 + 하단 토스트 (재방문이면 표시 X)
 *  - 사용자 X 클릭 → 다음 진입까지 banner 미표시
 *
 * 사이클 W 박제 + 사이클 2 isNew 분기 추가.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addReceivedKey } from "@/lib/share/receivedKeys";
import { useToast } from "@/lib/hooks/useToast";
import { Toast } from "@/components/ui/Toast";
import { ReceivedTripBanner } from "./ReceivedTripBanner";

interface Props {
  shareKey: string;
  destination?: string;
  nights?: number;
}

export function ReceivedKeyTracker({ shareKey, destination, nights }: Props) {
  const [showBanner, setShowBanner] = useState(false);
  const { toast, show: showToast } = useToast(5000);
  const router = useRouter();

  useEffect(() => {
    const result = addReceivedKey(shareKey, { destination, nights });
    if (result.isNew) {
      setShowBanner(true);
      showToast("이 여행을 받았어요. /shared에서 다시 볼 수 있어요.", {
        variant: "success",
        action: {
          label: "받은 여행",
          onClick: () => router.push("/shared"),
        },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareKey, destination, nights]);

  return (
    <>
      {showBanner && (
        <ReceivedTripBanner
          destination={destination}
          onDismiss={() => setShowBanner(false)}
        />
      )}
      <Toast toast={toast} />
    </>
  );
}
