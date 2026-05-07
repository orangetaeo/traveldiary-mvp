/**
 * City Guide 페이지 — Stitch #20 매핑 (사이클 8 M5).
 *
 * Stitch screen: projects/4681512633268080895/screens/287ff902a0f34684969746e04bf5df45
 * 데이터: lib/seed/cities/{slug}.ts (시드만, DB 영속화는 사이클 8.5+).
 *
 * MVP 필드만 노출: 응급/결제/교통/상황별 문장 + 시그니처 가이드.
 * visa/utilities/weather는 city 시드에 채워지면 노출, 없으면 섹션 생략.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { resolveCity, isVietnamCity } from "@/lib/seed/cities";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { resolveTripsByCityCode } from "@/lib/services/resolved-trip";
import { EmergencyHeaderButton } from "@/components/city/EmergencyHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { CityTripCTA } from "@/components/city/CityTripCTA";
import { ComingSoonCity } from "@/components/city/ComingSoonCity";
import { EmergencyRow, PhraseCard, CuratedGuideCard } from "@/components/city/CityGuideCards";

interface ChipDef {
  id: string;
  label: string;
  danger?: boolean;
}

const CHIPS: ChipDef[] = [
  { id: "emergency", label: "응급", danger: true },
  { id: "payment", label: "결제" },
  { id: "transport", label: "교통" },
  { id: "visa", label: "비자" },
  { id: "utilities", label: "준비물" },
  { id: "weather", label: "날씨" },
  { id: "phrases", label: "상황별 문장" },
  { id: "guides", label: "시그니처" },
];

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://traveldiary-mvp-production.up.railway.app";

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const city = resolveCity(params.slug);
  if (!city) return { title: "도시 가이드" };
  const title = `${city.name} 여행 가이드 — 응급·결제·교통·시그니처`;
  const description = `${city.country} ${city.name} 자유여행 완전 가이드. 응급 연락처, 결제·교통 정보, 상황별 베트남어 문장, 시그니처 코스.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${BASE}/city/${params.slug}`,
    },
  };
}

export default function CityPage({ params }: { params: { slug: string } }) {
  // 사이클 H (ADR-032): resolveCity로 country 정규화 데이터 merge
  const city = resolveCity(params.slug);
  if (!city) notFound();

  // 사이클 F (V3): 베트남 우선 출시 — 비-베트남 도시는 "준비 중" 배너로 graceful 처리
  if (!isVietnamCity(city)) {
    return <ComingSoonCity city={city} />;
  }

  // 사이클 J (ADR-034): city → trip 역방향 CTA. 도시당 trip 0~N개 (현 시드는 0 또는 1)
  const trips = resolveTripsByCityCode(city.code);

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-32">
      <BreadcrumbJsonLd items={[
        { name: "홈", url: BASE },
        { name: "여행", url: `${BASE}/trips` },
        { name: city.name, url: `${BASE}/city/${params.slug}` },
      ]} />
      {/* TopAppBar */}
      <header className="bg-surface-card/90 backdrop-blur-md border-b border-divider sticky top-0 z-40 flex justify-between items-center w-full px-td-md h-16">
        <div className="flex items-center gap-td-sm">
          <Link
            href="/"
            aria-label="뒤로"
            className="p-2 rounded-full hover:bg-surface-soft transition-colors"
          >
            <span className="material-symbols-outlined text-ink">arrow_back</span>
          </Link>
          <h1 className="text-lg font-bold text-ink tracking-tight">TravelDiary</h1>
        </div>
        <div className="flex items-center gap-td-xs">
          {/* 사이클 P (ADR-035) — 응급 빠른 액세스 */}
          <EmergencyHeaderButton citySlug={city.slug} />
          <span
            className="material-symbols-outlined text-ink-soft"
            aria-hidden
          >
            account_circle
          </span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-td-md">
        {/* Hero */}
        <section className="py-td-lg">
          <h2 className="text-td-title text-ink mb-td-xxs">
            {city.name} <span className="text-ink-soft text-td-body font-normal">(M5 City Guide)</span>
          </h2>
          <p className="text-td-body text-ink-soft">
            {city.country} · {city.code} · 한국인 자유여행자 큐레이션
          </p>
        </section>

        {/* C5 — 응급 페이지 진입 카드 (본문 상단 명시 노출) */}
        <Link
          href={`/city/${city.slug}/emergency`}
          className="block mb-td-md bg-danger-soft border border-danger/30 rounded-md p-td-md hover:bg-danger/10 transition-colors"
        >
          <div className="flex items-center gap-td-sm">
            <span className="material-symbols-outlined text-danger text-[24px]" aria-hidden>
              emergency
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-td-body font-bold text-danger-deep">
                긴급 상황 시 필요한 정보
              </p>
              <p className="text-td-caption text-ink-soft mt-td-xxs">
                병원 · 경찰 · 대사관 · 분실 가이드
              </p>
            </div>
            <span className="material-symbols-outlined text-danger text-[18px]" aria-hidden>
              chevron_right
            </span>
          </div>
        </Link>

        {/* 사이클 J (ADR-034) — city→trip 역방향 CTA */}
        <CityTripCTA trips={trips} cityName={city.name} />

        {/* Sticky chip row */}
        <nav
          aria-label="섹션 이동"
          className="sticky top-16 z-30 bg-surface-soft/90 backdrop-blur-sm py-td-xs flex gap-td-xs overflow-x-auto hide-scrollbar -mx-td-md px-td-md mb-td-lg"
        >
          {CHIPS.map((chip) => (
            <a
              key={chip.id}
              href={`#${chip.id}`}
              className={`flex-none px-td-sm py-td-xxs rounded-full border text-td-caption font-medium ${
                chip.danger
                  ? "border-danger text-danger"
                  : "border-divider text-ink-soft hover:border-purple/40"
              }`}
            >
              {chip.label}
            </a>
          ))}
        </nav>

        {/* Section 1: Emergency */}
        <section id="emergency" className="mb-td-lg scroll-mt-24">
          <div className="bg-surface-card border-l-4 border-danger rounded-lg shadow-sm p-td-md">
            <div className="flex items-center justify-between mb-td-md">
              <span className="bg-danger-soft text-danger-deep px-td-xs py-1 rounded-full text-td-caption font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]" aria-hidden>warning</span>
                긴급 상황
              </span>
              {/* 사이클 P (ADR-035) — 응급 풀 페이지로 이동 */}
              <Link
                href={`/city/${city.slug}/emergency`}
                className="text-td-caption text-purple-deep hover:underline"
              >
                전체 보기 + 분실 가이드 →
              </Link>
            </div>
            <ul className="space-y-td-sm">
              {city.emergencyContacts.map((c, i) => (
                <EmergencyRow key={i} contact={c} />
              ))}
            </ul>
          </div>
        </section>

        {/* Section 2: Payment */}
        <section id="payment" className="mb-td-lg scroll-mt-24">
          <h3 className="text-td-card-title text-ink mb-td-sm">결제 정보</h3>
          <div className="grid grid-cols-2 gap-td-sm mb-td-sm">
            <div className="bg-surface-card border border-divider rounded-lg p-td-sm">
              <p className="text-td-meta text-ink-soft">현재 환율 (대략)</p>
              <p className="text-td-card-title text-purple tabular-nums mt-td-xxs">
                100{city.payment.currencySymbol} ={" "}
                {(100 / city.payment.approxKrwRate).toFixed(2)} KRW
              </p>
            </div>
            <div className="bg-surface-card border border-divider rounded-lg p-td-sm">
              <p className="text-td-meta text-ink-soft">ATM·카드 사용성</p>
              <div className="flex items-center gap-1 mt-td-xxs">
                <div
                  className={`w-3 h-3 rounded-full ${
                    city.payment.cardAcceptance === "high"
                      ? "bg-success"
                      : city.payment.cardAcceptance === "medium"
                      ? "bg-amber"
                      : "bg-danger"
                  }`}
                  aria-hidden
                />
                <p className="text-td-card-title text-ink">
                  {city.payment.cardAcceptance === "high"
                    ? "높음"
                    : city.payment.cardAcceptance === "medium"
                    ? "중간"
                    : "낮음"}
                </p>
              </div>
            </div>
          </div>
          {city.payment.cardNotes && (
            <p className="text-td-meta text-ink-soft mb-td-xs">
              💡 {city.payment.cardNotes}
            </p>
          )}
          {city.payment.tipNotes && (
            <p className="text-td-meta text-ink-soft">
              🪙 팁: {city.payment.tipNotes}
            </p>
          )}
        </section>

        {/* Section 3: Transport */}
        <section id="transport" className="mb-td-lg scroll-mt-24">
          <h3 className="text-td-card-title text-ink mb-td-sm">교통수단</h3>
          <div className="bg-surface-card border border-divider rounded-lg p-td-md flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-td-sm">
              <span className="material-symbols-outlined text-purple text-[32px]" aria-hidden>
                local_taxi
              </span>
              <div>
                <p className="text-td-card-title text-ink uppercase">
                  {city.transport.primary}
                </p>
                <p className="text-td-meta text-ink-soft">
                  {city.transport.primaryNotes}
                </p>
              </div>
            </div>
          </div>
          {city.transport.airportToCity && (
            <div className="mt-td-sm bg-surface-card border border-divider rounded-lg p-td-sm">
              <p className="text-td-caption text-ink-mute mb-td-xxs uppercase">
                공항 → 시내
              </p>
              <p className="text-td-body text-ink">
                {city.transport.airportToCity.method} · 약{" "}
                {city.transport.airportToCity.durationMin}분
                {city.transport.airportToCity.priceKrw && (
                  <>
                    {" "}· 약 {city.transport.airportToCity.priceKrw.toLocaleString()}원
                  </>
                )}
              </p>
            </div>
          )}
        </section>

        {/* Section 4: Visa */}
        {city.visa && (
          <section id="visa" className="mb-td-lg scroll-mt-24">
            <h3 className="text-td-card-title text-ink mb-td-sm">비자·입국</h3>
            <div className="bg-surface-card border border-divider rounded-md p-td-md space-y-td-xs">
              {city.visa.visaFreeDays != null && (
                <div className="flex items-center gap-td-xs">
                  <span className="material-symbols-outlined text-success-deep text-[18px]" aria-hidden>check_circle</span>
                  <p className="text-td-body text-ink">
                    한국 여권 무비자 <span className="font-bold text-success-deep">{city.visa.visaFreeDays}일</span>
                  </p>
                </div>
              )}
              <div className="flex items-center gap-td-xs">
                <span className={`material-symbols-outlined text-[18px] ${city.visa.eVisaRequired ? "text-amber-deep" : "text-success-deep"}`} aria-hidden>
                  {city.visa.eVisaRequired ? "warning" : "check_circle"}
                </span>
                <p className="text-td-body text-ink">
                  e-Visa {city.visa.eVisaRequired ? "필요" : "불필요"}
                </p>
              </div>
              {city.visa.notes && (
                <p className="text-td-meta text-ink-soft">{city.visa.notes}</p>
              )}
            </div>
          </section>
        )}

        {/* Section 5: Utilities */}
        {city.utilities && (
          <section id="utilities" className="mb-td-lg scroll-mt-24">
            <h3 className="text-td-card-title text-ink mb-td-sm">준비물·전기·통신</h3>
            <div className="bg-surface-card border border-divider rounded-md p-td-md">
              <div className="grid grid-cols-3 gap-td-sm text-center">
                <div>
                  <span className="material-symbols-outlined text-ink-soft text-[20px]" aria-hidden>electrical_services</span>
                  <p className="text-td-caption text-ink-soft">전압</p>
                  <p className="text-td-body text-ink font-medium">{city.utilities.voltage}</p>
                </div>
                <div>
                  <span className="material-symbols-outlined text-ink-soft text-[20px]" aria-hidden>power</span>
                  <p className="text-td-caption text-ink-soft">플러그</p>
                  <p className="text-td-body text-ink font-medium">{city.utilities.plugType}</p>
                </div>
                <div>
                  <span className="material-symbols-outlined text-ink-soft text-[20px]" aria-hidden>sim_card</span>
                  <p className="text-td-caption text-ink-soft">현지 SIM</p>
                  <p className="text-td-body text-ink font-medium">{city.utilities.simAvailable ? "구매 가능" : "어려움"}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Section 6: Weather */}
        {city.weather && (
          <section id="weather" className="mb-td-lg scroll-mt-24">
            <h3 className="text-td-card-title text-ink mb-td-sm">날씨·기후</h3>
            <div className="bg-surface-card border border-divider rounded-md p-td-md space-y-td-xs">
              <div className="flex items-center gap-td-xs">
                <span className="material-symbols-outlined text-amber-deep text-[18px]" aria-hidden>thermostat</span>
                <p className="text-td-body text-ink">{city.weather.season}</p>
              </div>
              {city.weather.avgTempC && (
                <p className="text-td-meta text-ink-soft">
                  평균 기온 {city.weather.avgTempC.min}°C ~ {city.weather.avgTempC.max}°C
                </p>
              )}
              {city.weather.notes && (
                <p className="text-td-meta text-ink-soft">{city.weather.notes}</p>
              )}
            </div>
          </section>
        )}

        {/* Section 7: Phrase Book */}
        <section id="phrases" className="mb-td-lg scroll-mt-24">
          <h3 className="text-td-card-title text-ink mb-td-sm">상황별 문장</h3>
          <div className="space-y-td-sm">
            {city.phrases.map((p, i) => (
              <PhraseCard key={i} phrase={p} />
            ))}
          </div>
        </section>

        {/* Section 5: Curated Guides */}
        {city.curatedGuides.length > 0 && (
          <section id="guides" className="mb-td-lg scroll-mt-24">
            <h3 className="text-td-card-title text-ink mb-td-sm">시그니처 가이드</h3>
            <div className="space-y-td-md">
              {city.curatedGuides.map((g) => (
                <CuratedGuideCard key={g.id} guide={g} />
              ))}
            </div>
          </section>
        )}

        {/* Footer note */}
        <p className="text-td-caption text-ink-mute text-center pt-td-md">
          v2 비전 §4 City 모델 — 응급·결제·교통·비자·준비물·날씨·문장·시그니처
        </p>
      </main>

      <BottomNav active="trips" />
    </div>
  );
}
