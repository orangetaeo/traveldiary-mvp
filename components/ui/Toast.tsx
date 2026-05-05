"use client";

/**
 * 토스트 메시지 표시 컴포넌트.
 * useToast hook과 함께 사용.
 */
export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-ink text-white text-td-meta px-4 py-2.5 rounded-full shadow-lg max-w-[90vw] text-center"
      role="status"
    >
      {message}
    </div>
  );
}
