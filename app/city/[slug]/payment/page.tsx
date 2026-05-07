/**
 * 도시 결제 가이드 풀 페이지 — A4 디자인 갭 자율 발견.
 *
 * `/city/[slug]/payment` — `/city/[slug]/emergency`(ADR-035) 답습 패턴.
 *
 * 구조:
 *   1. TopAppBar (뒤로 + 환율 강조)
 *   2. Hero (도시명 + 통화·환율)
 *   3. 환전 환산 카드 (1만원 기준 자주 쓰는 단위)
 *   4. 결제 수단 4 카드 (현금·카드·QR·그룹) + 추천 상황 + 주의사항
 *   5. 베트남 결제 팁 5건 (ATM/환전/위조/팁/DCC)
 *   6. 결제 정체성 (TravelDiary 내 SettlementCard 연결)
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { resolveCity, isVietnamCity } from "@/lib/seed/cities";
import {
  VN_PAYMENT_METHODS,
  VN_EXCHANGE_TIPS,
  EXCHANGE_KRW_SAMPLES,
} from "@/lib/constants/koreanPaymentGuide";
import { BottomNav } from "@/components/ui/BottomNav";
import { listDemoTrips } from "@/lib/seed";
import { findActiveTripByCity } from "@/lib/services/payment-trip-link";

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const city = resolveCity(params.slug);
  if (!city) return { title: "결제 가이드" };
  return {
    title: `${city.name} 결제 가이드 — 환전·카드·QR·팁`,
    description: `${city.country} ${city.name} 자유여행자를 위한 결제 가이드. 현금·카드·VietQR·그룹 더치페이 + 위조지폐·DCC·팁 주의사항.`,
  };
}

const TONE_CLASS_MAP: Record<string, { border: string; soft: string; text: string }> = {
  danger: {
    border: "border-danger/40",
    soft: "bg-danger-soft",
    text: "text-danger-deep",
  },
  success: {
    border: "border-success/40",
    soft: "bg-success-soft",
    text: "text-success-deep",
  },
  purple: {
    border: "border-purple/40",
    soft: "bg-purple-soft",
    text: "text-purple-deep",
  },
  amber: {
    border: "border-amber/40",
    soft: "bg-amber-soft",
    text: "text-amber-deep",
  },
};

export default function CityPaymentPage({
  params,
}: {
  params: { slug: string };
}) {
  const city = resolveCity(params.slug);
  if (!city) notFound();
  if (!isVietnamCity(city)) notFound();

  const symbol = city.payment.currencySymbol;
  const rate = city.payment.approxKrwRate;
  const krw100 = (100 / rate).toFixed(2);

  const activeTrip = findActiveTripByCity(params.slug, listDemoTrips());

  return (
    <div className="min-h-screen bg-surface text-ink pb-24">
      {/* TopAppBar */}
      <header className="bg-surface-card/90 backdrop-blur-md border-b border-divider sticky top-0 z-40 flex justify-between items-center w-full px-4 h-16">
        <div className="flex items-center gap-3">
          <Link
            href={`/city/${city.slug}`}
            aria-label="도시 가이드로 돌아가기"
            className="text-purple transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <p className="text-td-caption text-ink-mute">{city.name}</p>
            <h1 className="text-td-card-title text-purple-deep font-bold">
              결제 가이드
            </h1>
          </div>
        </div>
        <span
          className="material-symbols-outlined text-purple text-[28px]"
          aria-hidden
        >
          payments
        </span>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <section className="space-y-1">
          <h2 className="text-td-title text-ink">
            현금 · 카드 · QR · 더치페이 한눈에
          </h2>
          <p className="text-td-body text-ink-soft">
            {city.country} {city.name} · 통화 {city.payment.currency} ({symbol}) ·
            100{symbol} ≈ <span className="tabular-nums">{krw100}</span>원
          </p>
        </section>

        {/* 환전 환산 카드 */}
        <section
          aria-labelledby="exchange-calc-heading"
          className="bg-purple-soft border-l-4 border-purple p-4 rounded-lg shadow-sm"
        >
          <h3
            id="exchange-calc-heading"
            className="text-td-body font-semibold text-purple-deep mb-3"
          >
            <span
              className="material-symbols-outlined text-[18px] mr-1 align-middle"
              aria-hidden
            >
              currency_exchange
            </span>
            한국 원화 → {city.payment.currency} 환산
          </h3>
          <ul className="space-y-1.5">
            {EXCHANGE_KRW_SAMPLES.map((krw) => {
              const local = Math.round(krw * rate);
              return (
                <li
                  key={krw}
                  className="flex justify-between items-center text-td-body"
                >
                  <span className="text-ink-soft tabular-nums">
                    {krw.toLocaleString()}원
                  </span>
                  <span className="text-ink font-semibold tabular-nums">
                    ≈ {local.toLocaleString()}
                    <span className="text-td-meta text-ink-soft ml-1">
                      {symbol}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="text-td-caption text-ink-mute mt-3">
            * 환율 변동·환전 마진 미반영 — 출국 직전 시중은행 환율 확인 권장
          </p>
        </section>

        {/* 결제 수단 4 카드 */}
        <section
          aria-labelledby="methods-heading"
          className="space-y-3"
        >
          <h3
            id="methods-heading"
            className="text-td-card-title text-ink font-semibold"
          >
            결제 수단 비교
          </h3>
          <div className="space-y-3">
            {VN_PAYMENT_METHODS.map((m) => {
              const tone = TONE_CLASS_MAP[m.toneClass];
              return (
                <article
                  key={m.method}
                  data-payment-method={m.method}
                  className={`bg-surface-card border ${tone.border} rounded-md p-4 shadow-sm`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`material-symbols-outlined text-[24px] ${tone.text}`}
                      aria-hidden
                    >
                      {m.iconName}
                    </span>
                    <h4 className={`text-td-card-title font-bold ${tone.text}`}>
                      <span className="mr-1">{m.emoji}</span>
                      {m.title}
                    </h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-td-caption text-ink-mute font-semibold uppercase mb-1">
                        추천 상황
                      </p>
                      <ul className="space-y-1">
                        {m.bestFor.map((s, i) => (
                          <li
                            key={i}
                            className="text-td-meta text-ink flex gap-2"
                          >
                            <span
                              className="material-symbols-outlined text-success-deep text-td-icon-sm mt-0.5 flex-shrink-0"
                              aria-hidden
                            >
                              check_circle
                            </span>
                            <span className="flex-1">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-td-caption text-ink-mute font-semibold uppercase mb-1">
                        주의사항
                      </p>
                      <ul className="space-y-1">
                        {m.cautions.map((s, i) => (
                          <li
                            key={i}
                            className="text-td-meta text-ink flex gap-2"
                          >
                            <span
                              className="material-symbols-outlined text-danger text-td-icon-sm mt-0.5 flex-shrink-0"
                              aria-hidden
                            >
                              warning
                            </span>
                            <span className="flex-1">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* 베트남 결제 팁 */}
        <section
          aria-labelledby="tips-heading"
          className="space-y-3"
        >
          <h3
            id="tips-heading"
            className="text-td-card-title text-ink font-semibold"
          >
            베트남 결제 팁
          </h3>
          <ul className="bg-surface-card border border-divider rounded-md p-4 space-y-3">
            {VN_EXCHANGE_TIPS.map((t, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[18px] flex-shrink-0" aria-hidden>
                  {t.emoji}
                </span>
                <div className="flex-1">
                  <p className="text-td-body text-ink font-semibold">
                    {t.title}
                  </p>
                  <p className="text-td-meta text-ink-soft mt-0.5">{t.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* TravelDiary 정산 연결 */}
        <section
          aria-labelledby="settlement-heading"
          data-trip-aware={activeTrip ? "true" : "false"}
          className="bg-surface-card border border-divider rounded-md p-4"
        >
          <h3
            id="settlement-heading"
            className="text-td-body font-semibold text-ink mb-2"
          >
            <span
              className="material-symbols-outlined text-[18px] mr-1 align-middle text-purple"
              aria-hidden
            >
              groups
            </span>
            그룹 더치페이는 TravelDiary 정산 카드로
          </h3>
          <p className="text-td-meta text-ink-soft mb-3">
            {activeTrip
              ? `${activeTrip.destination} 여행 중 비용을 추가하면 일행과 자동 N분의 1 분담 — 한국 귀국 후 토스·카카오페이로 송금하면 끝.`
              : "여행 중 비용을 추가하면 일행과 자동으로 N분의 1 분담 — 한국 귀국 후 토스·카카오페이로 송금하면 끝."}
          </p>
          <Link
            href={activeTrip ? `/trips/${activeTrip.tripId}` : "/trips"}
            className="inline-flex items-center gap-1 text-td-meta text-purple-deep hover:underline"
          >
            {activeTrip
              ? `${activeTrip.destination} 여행 정산 보기`
              : "내 여행 정산 보기"}
            <span
              className="material-symbols-outlined text-td-icon-sm"
              aria-hidden
            >
              chevron_right
            </span>
          </Link>
        </section>

        <p className="text-td-caption text-ink-mute text-center opacity-60">
          외부 환율 API 미연동 — approxKrwRate seed 기반 대략치 (R1 게이트
          후 라이브 환율)
        </p>
      </main>

      <BottomNav active="trips" />
    </div>
  );
}
