/**
 * 도시 응급 풀 페이지 — 사이클 P (ADR-035).
 *
 * `/city/[slug]/emergency` — 기존 city 응급 섹션을 풀 페이지로 분리 + 분실 가이드.
 *
 * 구조:
 *   1. TopAppBar (뒤로 + 영사관 통역 강조)
 *   2. Hero (도시명 + 통역 콜센터 카드)
 *   3. 도시별 응급 contacts (영사관·경찰·병원)
 *   4. 분실 통합 가이드 4 카테고리 (여권·카드·휴대폰·도난)
 *   5. 출국 전 준비 체크리스트
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { resolveCity, isVietnamCity } from "@/lib/seed/cities";
import { KOREAN_LOSS_GUIDES } from "@/lib/constants/koreanLossContacts";
import { BottomNav } from "@/components/ui/BottomNav";
import { ContactCard, LossGuideCard } from "@/components/city/EmergencyCards";

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const city = resolveCity(params.slug);
  if (!city) return { title: "응급 정보" };
  return {
    title: `${city.name} 응급 정보 — 병원·경찰·대사관·분실 가이드`,
    description: `${city.country} ${city.name} 긴급 연락처, 영사관, 병원, 여권·카드·휴대폰 분실 대응 가이드.`,
  };
}

export default function CityEmergencyPage({
  params,
}: {
  params: { slug: string };
}) {
  const city = resolveCity(params.slug);
  if (!city) notFound();
  if (!isVietnamCity(city)) notFound(); // 베트남 우선 출시 정책 (사이클 F V3)

  // 영사관 통역 강조 — Country.GLOBAL_EMERGENCY_CONTACTS의 translator
  const translator = city.emergencyContacts.find((c) => c.category === "translator");
  // 도시별 응급 (translator 제외)
  const cityContacts = city.emergencyContacts.filter(
    (c) => c.category !== "translator",
  );

  return (
    <div className="min-h-screen bg-surface text-ink pb-24">
      {/* TopAppBar */}
      <header className="bg-surface-card/95 backdrop-blur-sm border-b border-divider sticky top-0 z-40 flex justify-between items-center w-full px-4 h-16">
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
            <h1 className="text-td-card-title text-danger-deep font-bold">
              응급 안전망
            </h1>
          </div>
        </div>
        <span
          className="material-symbols-outlined text-danger text-[28px]"
          aria-hidden
        >
          emergency
        </span>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <section className="space-y-1">
          <h2 className="text-td-title text-ink">
            응급·분실 통합 안내
          </h2>
          <p className="text-td-body text-ink-soft">
            {city.country} {city.name} · 한국어 영사 콜센터 24시간
          </p>
        </section>

        {/* 통역 콜센터 강조 카드 */}
        {translator && (
          <section className="bg-purple-soft border-l-4 border-purple p-4 rounded-lg shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-td-body font-semibold text-purple-deep mb-1">
                  {translator.label}
                </h3>
                <p className="text-td-card-title font-bold text-ink tabular-nums">
                  {translator.phone}
                </p>
              </div>
              <span className="material-symbols-outlined text-purple" aria-hidden>
                support_agent
              </span>
            </div>
            {translator.notes && (
              <p className="text-td-meta text-ink-soft mb-3">{translator.notes}</p>
            )}
            {translator.phone && (
              <a
                href={`tel:${translator.phone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-1 bg-purple text-white px-4 py-2.5 rounded-xl text-td-body font-medium hover:opacity-90 transition-opacity active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">call</span>
                전화하기
              </a>
            )}
          </section>
        )}

        {/* 도시별 응급 contacts */}
        <section id="city-contacts" className="space-y-3">
          <h3 className="text-td-card-title text-ink font-semibold">
            {city.name} 응급 연락처
          </h3>
          <div className="space-y-2">
            {cityContacts.map((c, i) => (
              <ContactCard key={i} contact={c} />
            ))}
          </div>
        </section>

        {/* 분실 통합 가이드 */}
        <section id="loss-guides" className="space-y-3">
          <h3 className="text-td-card-title text-ink font-semibold">
            상황별 대응 가이드
          </h3>
          <div className="space-y-3">
            {KOREAN_LOSS_GUIDES.map((g) => (
              <LossGuideCard key={g.category} guide={g} />
            ))}
          </div>
        </section>

        {/* 출국 전 준비 체크리스트 */}
        <section id="preparation" className="space-y-3">
          <h3 className="text-td-card-title text-ink font-semibold">
            출국 전 준비
          </h3>
          <ul className="bg-white border border-divider rounded-xl p-4 space-y-2">
            {KOREAN_LOSS_GUIDES.filter((g) => g.preparation).map((g) => (
              <li key={g.category} className="flex items-start gap-2">
                <span className="text-[16px]" aria-hidden>
                  {g.emoji}
                </span>
                <p className="text-td-meta text-ink-soft flex-1">
                  <span className="text-ink font-medium">{g.title} — </span>
                  {g.preparation}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-td-caption text-ink-mute text-center opacity-60">
          출처: 외교부 영사콜센터 0404.go.kr
        </p>
      </main>

      <BottomNav active="trips" />
    </div>
  );
}

