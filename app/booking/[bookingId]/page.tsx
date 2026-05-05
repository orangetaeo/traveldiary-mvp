/**
 * 예약 완료 페이지 (Phase 7 신규 — mock).
 *
 * Stitch 시안: #33 Booking Confirmation — 예약 완료 (Klook) (e1a59aa5ba2d4033b4c9a05433361daf)
 * 용도: OTA 외부 이동 후 돌아왔을 때 보여주는 예약 확인 카드.
 * BLOCKER 7: 실 OTA 연동 전까지 mock 데이터 사용.
 */

import Link from "next/link";

interface PageProps {
  params: { bookingId: string };
}

// --- 데모 예약 데이터 (BLOCKER 7 해소 전까지 stub) ---
const DEMO_BOOKING = {
  provider: "Klook",
  providerColor: "bg-purple",
  productName: "다낭 바나힐 + 골든브릿지 1일 투어",
  date: "2026-05-20",
  guests: 2,
  totalPrice: "₩ 89,000",
  pricePerPerson: "₩ 44,500/인",
  confirmationCode: "KL-2026-DEMO-7829",
  status: "confirmed" as const,
  meetingPoint: "다낭 시내 호텔 픽업 (08:00)",
  includes: ["왕복 셔틀", "입장권", "케이블카", "점심 뷔페"],
};

export default function BookingConfirmationPage({ params }: PageProps) {
  const booking = DEMO_BOOKING; // 추후 bookingId 기반 조회로 교체

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-divider flex items-center justify-between px-4 h-14">
        <Link
          href="/"
          className="p-2 rounded-full hover:bg-surface-soft transition-colors"
          aria-label="홈으로"
        >
          <span className="material-symbols-outlined text-ink">close</span>
        </Link>
        <h1 className="text-sm font-semibold tracking-tight text-ink">예약 완료</h1>
        <div className="w-10" /> {/* spacer */}
      </header>

      <main className="max-w-md mx-auto px-td-md py-td-lg space-y-td-lg">
        {/* Success Icon */}
        <div className="flex flex-col items-center gap-td-xs">
          <div className="w-20 h-20 rounded-full bg-success-soft flex items-center justify-center">
            <span className="material-symbols-outlined text-success text-4xl">check_circle</span>
          </div>
          <h2 className="text-td-title text-ink text-center">예약이 완료되었어요!</h2>
          <p className="text-td-body text-ink-soft text-center">
            {booking.provider}에서 확인 이메일이 발송됩니다.
          </p>
        </div>

        {/* Booking Card */}
        <div className="bg-surface-card rounded-md border border-divider p-td-md space-y-td-sm shadow-sm">
          {/* Provider Badge */}
          <div className="flex items-center justify-between">
            <span className={`${booking.providerColor} text-white text-td-caption font-bold px-2 py-0.5 rounded-md`}>
              {booking.provider}
            </span>
            <span className="bg-success-soft text-success-deep text-td-caption font-bold px-2 py-0.5 rounded-full">
              확정됨
            </span>
          </div>

          {/* Product */}
          <h3 className="text-td-card-title text-ink font-medium">{booking.productName}</h3>

          {/* Details */}
          <div className="space-y-td-xxs">
            <div className="flex items-center gap-td-xs">
              <span className="material-symbols-outlined text-ink-soft text-lg">calendar_today</span>
              <span className="text-td-body text-ink">{booking.date}</span>
            </div>
            <div className="flex items-center gap-td-xs">
              <span className="material-symbols-outlined text-ink-soft text-lg">group</span>
              <span className="text-td-body text-ink">{booking.guests}명</span>
            </div>
            <div className="flex items-center gap-td-xs">
              <span className="material-symbols-outlined text-ink-soft text-lg">location_on</span>
              <span className="text-td-body text-ink">{booking.meetingPoint}</span>
            </div>
          </div>

          {/* Includes */}
          <div>
            <p className="text-td-meta text-ink-soft mb-td-xxs">포함 사항</p>
            <div className="flex flex-wrap gap-1">
              {booking.includes.map((inc) => (
                <span key={inc} className="text-td-caption text-purple-deep bg-purple-soft px-2 py-0.5 rounded-full">
                  {inc}
                </span>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="pt-td-xs border-t border-divider flex items-center justify-between">
            <div>
              <p className="text-td-meta text-ink-soft">총 결제</p>
              <p className="text-td-card-title text-ink font-bold">{booking.totalPrice}</p>
            </div>
            <span className="text-td-caption text-ink-soft">{booking.pricePerPerson}</span>
          </div>

          {/* Confirmation Code */}
          <div className="bg-surface-soft rounded-md p-td-xs text-center">
            <p className="text-td-caption text-ink-soft">예약 번호</p>
            <p className="text-td-body font-mono font-bold text-ink tracking-wider">
              {booking.confirmationCode}
            </p>
          </div>
        </div>

        {/* BLOCKER 7 Notice */}
        <div className="bg-amber-soft border border-amber/20 rounded-md p-td-sm flex items-start gap-td-xs">
          <span className="material-symbols-outlined text-amber text-lg mt-0.5">info</span>
          <div>
            <p className="text-td-body font-medium text-amber-deep">데모 예약</p>
            <p className="text-td-caption text-amber-deep/80">
              BLOCKER 7 해소 전까지 실 OTA 연동은 비활성입니다. 이 화면은 UI 미리보기입니다.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-td-xs">
          <Link
            href="/"
            className="block w-full py-td-sm rounded-md bg-ink text-white text-td-body font-bold text-center transition-opacity hover:opacity-90"
          >
            내 일정에서 확인
          </Link>
          <button className="w-full py-td-sm rounded-md border border-divider text-td-body font-semibold text-ink hover:bg-surface-soft transition-colors flex items-center justify-center gap-td-xxs">
            <span className="material-symbols-outlined text-lg">share</span>
            일행에게 공유
          </button>
        </div>
      </main>
    </div>
  );
}
