"use client";

/**
 * AutoModeDetector — M2 자동 모드 전환 (사이클 5b-4, ADR-017).
 *
 * 흐름:
 *   1. 사용자가 "📍 내 위치로 자동 전환" 버튼 클릭
 *   2. browser navigator.geolocation 권한 prompt
 *   3. 권한 OK → getCurrentLocation()로 좌표 1회 조회
 *   4. detectMode(trip, now, location) 클라이언트 실행 (좌표 서버 미전송)
 *   5. mode 결정되면 setTripMode Server Action 호출 (mode값만, 좌표 X)
 *   6. 결과 토스트 + router.refresh()
 *
 * Privacy (ADR-017 §C):
 *   - 좌표는 이 함수 스코프에서만 사용. props/state/storage 어디에도 보존 X.
 *   - audit log metadata.trigger="geolocation"만, 좌표 X.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  calculateDDay,
  detectMode,
  isWithinBoundary,
} from "@/lib/mode-transition";
import { getCurrentLocation } from "@/lib/services/geolocation";
import { recordModeTransitionSkip, setTripMode } from "@/actions/trip";
import type { Trip } from "@/lib/types";
import { useToast } from "@/lib/hooks/useToast";
import { Toast } from "@/components/ui/Toast";

interface AutoModeDetectorProps {
  trip: Trip;
}

export function AutoModeDetector({ trip }: AutoModeDetectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { message: toast, show: showToast } = useToast(4000);
  const [denied, setDenied] = useState(false);

  function handleClick() {
    startTransition(async () => {
      const loc = await getCurrentLocation();

      // 사이클 KK — geolocation 실패 4 카테고리. 사용자 명시 클릭이라 audit 가치 큼.
      // unavailable / timeout은 R1 결정에 따라 동일 카테고리(geolocation_unavailable)로 통합.
      if (loc.mode === "unsupported") {
        await recordModeTransitionSkip({
          tripId: trip.id,
          skipReason: "geolocation_unsupported",
          currentMode: trip.currentMode ?? "pre-travel",
          trigger: "geolocation",
          context: { destinationCode: trip.destinationCode },
        });
        showToast("이 기기에서 위치 기능을 지원하지 않아요.");
        return;
      }
      if (loc.mode === "denied") {
        await recordModeTransitionSkip({
          tripId: trip.id,
          skipReason: "geolocation_denied",
          currentMode: trip.currentMode ?? "pre-travel",
          trigger: "geolocation",
          context: { destinationCode: trip.destinationCode },
        });
        setDenied(true);
        showToast("위치 권한이 거부됐어요. 수동 전환 버튼을 활용해주세요.");
        return;
      }
      if (loc.mode === "unavailable" || loc.mode === "timeout") {
        await recordModeTransitionSkip({
          tripId: trip.id,
          skipReason: "geolocation_unavailable",
          currentMode: trip.currentMode ?? "pre-travel",
          trigger: "geolocation",
          context: { destinationCode: trip.destinationCode },
        });
        showToast(
          loc.mode === "timeout"
            ? "시간 초과 — 다시 시도해주세요."
            : "현재 위치를 가져올 수 없어요. 잠시 후 다시 시도.",
        );
        return;
      }

      // mode === "ok" — detectMode 클라이언트 실행 (좌표 서버 미전송)
      const now = new Date();
      const dDay = calculateDDay(trip.startDate, now);
      const boundaryHit = isWithinBoundary(
        { lat: loc.lat, lng: loc.lng },
        trip.destinationCode,
      );
      const newMode = detectMode(trip, now, { lat: loc.lat, lng: loc.lng });

      if (newMode !== "in-travel") {
        // KK — 도시 밖(boundaryHit=false) 또는 출발 전(dDay>0) 구분해 skipReason 결정.
        const skipReason = boundaryHit ? "not_yet_started" : "not_in_destination";
        await recordModeTransitionSkip({
          tripId: trip.id,
          skipReason,
          currentMode: trip.currentMode ?? "pre-travel",
          trigger: "geolocation",
          context: { dDay, boundaryHit, destinationCode: trip.destinationCode },
        });
        showToast(
          `${trip.destination} 도시 안에 있지 않거나 출발 전이라 자동 전환 안 됨`,
        );
        return;
      }

      if (trip.currentMode === "in-travel") {
        await recordModeTransitionSkip({
          tripId: trip.id,
          skipReason: "already_in_mode",
          currentMode: "in-travel",
          trigger: "geolocation",
          context: { dDay, boundaryHit, destinationCode: trip.destinationCode },
        });
        showToast("이미 여행 중 모드로 설정돼 있어요.");
        return;
      }

      // setTripMode mutation — 좌표 절대 미전송, mode 값과 trigger + audit context만
      const result = await setTripMode({
        tripId: trip.id,
        mode: "in-travel",
        expectedTripUpdatedAt: trip.updatedAt,
        trigger: "geolocation",
        context: {
          dDay,
          boundaryHit,
          destinationCode: trip.destinationCode,
        },
      });

      if (!result.ok) {
        if (result.code === "conflict") {
          showToast("다른 탭에서 변경됐어요. 새로고침합니다.");
          router.refresh();
        } else {
          showToast(`전환 실패: ${result.code}`);
        }
        return;
      }

      if (result.demo) {
        showToast(`${trip.destination} 도착 감지 — 여행 중 모드 (데모 시뮬)`);
      } else {
        showToast(`${trip.destination} 도착 감지 — 여행 중 모드로 전환됐어요`);
        router.refresh();
      }
    });
  }

  return (
    <section className="px-td-md pb-td-sm">
      <div className="bg-surface-card border border-divider rounded-xl p-td-md">
        <div className="flex items-start gap-td-sm">
          <span
            className="material-symbols-outlined text-accent mt-0.5"
            aria-hidden
          >
            my_location
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-td-body font-semibold text-ink">
              내 위치로 자동 전환 (M2)
            </p>
            <p className="text-td-meta text-ink-soft mt-td-xxs">
              위치는 자동 모드 전환에만 사용됩니다. 좌표는 서버에 전송되지
              않아요.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending || denied}
          className="mt-td-sm w-full py-2 bg-mode-primary text-white rounded-lg text-td-meta font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending
            ? "위치 확인 중…"
            : denied
            ? "권한 거부됨 — 수동 전환 사용"
            : "📍 내 위치로 자동 전환"}
        </button>
      </div>

      <Toast
        message={toast}
        className="fixed bottom-32 left-1/2 -translate-x-1/2 z-40 bg-ink text-white text-td-meta px-4 py-2.5 rounded-full shadow-lg max-w-[90vw] text-center"
      />
    </section>
  );
}
