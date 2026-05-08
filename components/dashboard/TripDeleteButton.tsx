/**
 * Trip 삭제 버튼 + 확인 모달 — Trip Dashboard 하단.
 *
 * 2단계: 버튼 클릭 → 확인 모달 → soft-delete.
 * 성공 시 /trips로 리다이렉트.
 */

"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { deleteTrip } from "@/actions/trip";

interface TripDeleteButtonProps {
  tripId: string;
  destination: string;
}

export function TripDeleteButton({ tripId, destination }: TripDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleOpen = useCallback(() => {
    setError(null);
    setOpen(true);
  }, []);

  const handleCancel = useCallback(() => {
    if (isPending) return;
    setOpen(false);
    setError(null);
  }, [isPending]);

  const handleConfirm = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const result = await deleteTrip(tripId);
      if (result.ok) {
        setOpen(false);
        router.replace("/trips");
      } else {
        if (result.code === "forbidden") {
          setError("이 여행을 삭제할 권한이 없습니다.");
        } else if (result.code === "not_found") {
          setError("이미 삭제되었거나 존재하지 않는 여행입니다.");
        } else {
          setError("삭제에 실패했어요. 잠시 뒤 다시 시도해 주세요.");
        }
      }
    });
  }, [tripId, router]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="w-full text-center text-td-meta text-ink-mute hover:text-danger transition-colors py-td-xs"
      >
        여행 삭제
      </button>

      {/* Confirmation Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-td-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trip-delete-title"
        >
          <div className="bg-surface-card rounded-lg w-full max-w-sm p-td-lg shadow-xl">
            <div className="flex items-center gap-td-xs mb-td-sm">
              <span
                className="material-symbols-outlined text-danger text-2xl"
                aria-hidden
              >
                delete_forever
              </span>
              <h2
                id="trip-delete-title"
                className="text-td-card-title font-bold text-ink"
              >
                여행 삭제
              </h2>
            </div>

            <p className="text-td-body text-ink-soft mb-td-md">
              <strong className="text-ink">{destination}</strong> 여행을
              삭제하시겠습니까? 일정, 비용, 체크리스트, 공유 링크가 모두
              비활성화됩니다.
            </p>

            {error && (
              <p
                role="alert"
                className="text-td-meta text-danger mb-td-sm bg-danger-soft rounded-md px-td-sm py-td-xs"
              >
                {error}
              </p>
            )}

            <div className="flex gap-td-sm">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                className="flex-1 py-td-sm rounded-md border border-divider text-td-body font-medium text-ink hover:bg-surface-soft transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 py-td-sm rounded-md bg-danger text-white text-td-body font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isPending ? "삭제 중…" : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
