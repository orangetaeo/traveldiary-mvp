"use client";

/**
 * 토스트 메시지 표시 컴포넌트.
 * useToast hook과 함께 사용.
 */
const DEFAULT_CLASS =
  "fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-ink text-white text-td-meta px-4 py-2.5 rounded-full shadow-lg max-w-[90vw] text-center";

export function Toast({
  message,
  className,
}: {
  message: string | null;
  className?: string;
}) {
  if (!message) return null;
  return (
    <div className={className ?? DEFAULT_CLASS} role="status">
      {message}
    </div>
  );
}
