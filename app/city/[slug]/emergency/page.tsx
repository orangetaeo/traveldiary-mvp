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
import {
  KOREAN_LOSS_GUIDES,
  type LossGuide,
} from "@/lib/constants/koreanLossContacts";
import type { EmergencyContact } from "@/lib/types";
import { BottomNav } from "@/components/ui/BottomNav";

const CATEGORY_LABEL: Record<string, string> = {
  embassy: "영사관",
  police: "경찰",
  ambulance: "병원·응급",
  card_lost: "카드 분실",
  translator: "통역",
  consulate_after_hours: "영사관 야간",
};

const CATEGORY_ICON: Record<string, string> = {
  embassy: "account_balance",
  police: "local_police",
  ambulance: "local_hospital",
  card_lost: "credit_card_off",
  translator: "translate",
  consulate_after_hours: "schedule",
};

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
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      {/* TopAppBar */}
      <header className="bg-surface-card border-b border-divider sticky top-0 z-40 flex justify-between items-center w-full px-td-md h-16">
        <div className="flex items-center gap-td-sm">
          <Link
            href={`/city/${city.slug}`}
            aria-label="도시 가이드로 돌아가기"
            className="p-2 rounded-full hover:bg-surface-soft transition-colors"
          >
            <span className="material-symbols-outlined text-ink">arrow_back</span>
          </Link>
          <div>
            <p className="text-td-caption text-ink-mute">{city.name} 응급</p>
            <h1 className="text-td-card-title text-danger-deep font-bold">
              안전망
            </h1>
          </div>
        </div>
        <span
          className="material-symbols-outlined filled text-danger"
          aria-hidden
        >
          emergency
        </span>
      </header>

      <main className="max-w-xl mx-auto px-td-md">
        {/* Hero */}
        <section className="py-td-lg">
          <h2 className="text-td-title text-ink mb-td-xxs">
            응급·분실 통합 안내
          </h2>
          <p className="text-td-body text-ink-soft">
            {city.country} {city.name} · 한국어 영사 콜센터 24시간
          </p>
        </section>

        {/* 통역 콜센터 강조 카드 */}
        {translator && (
          <section className="mb-td-lg">
            <div className="bg-purple-soft border-l-4 border-purple rounded-lg shadow-sm p-td-md">
              <div className="flex items-center gap-td-xs mb-td-xs">
                <span
                  className="material-symbols-outlined text-purple-deep"
                  aria-hidden
                >
                  translate
                </span>
                <span className="text-td-caption text-purple-deep font-bold uppercase">
                  외교부 24시간 한국어 통역
                </span>
              </div>
              <p className="text-td-body text-ink mb-td-xs">{translator.label}</p>
              <p className="text-td-card-title text-purple-deep tabular-nums mb-td-xs">
                {translator.phone}
              </p>
              {translator.notes && (
                <p className="text-td-meta text-ink-soft">{translator.notes}</p>
              )}
              {translator.phone && (
                <a
                  href={`tel:${translator.phone.replace(/\s/g, "")}`}
                  className="inline-block mt-td-sm bg-purple text-white px-td-md py-td-xs rounded-full text-td-meta font-medium hover:opacity-90 transition-opacity"
                >
                  지금 연결
                </a>
              )}
            </div>
          </section>
        )}

        {/* 도시별 응급 contacts */}
        <section id="city-contacts" className="mb-td-lg">
          <h3 className="text-td-card-title text-ink mb-td-sm">
            {city.name} 현지 응급 연락처
          </h3>
          <ul className="space-y-td-sm">
            {cityContacts.map((c, i) => (
              <ContactCard key={i} contact={c} />
            ))}
          </ul>
        </section>

        {/* 분실 통합 가이드 */}
        <section id="loss-guides" className="mb-td-lg">
          <h3 className="text-td-card-title text-ink mb-td-sm">
            분실·도난 통합 가이드
          </h3>
          <p className="text-td-meta text-ink-soft mb-td-md">
            패닉 상황에서 가장 먼저 할 일을 단계별로 안내해요.
          </p>
          <div className="space-y-td-md">
            {KOREAN_LOSS_GUIDES.map((g) => (
              <LossGuideCard key={g.category} guide={g} />
            ))}
          </div>
        </section>

        {/* 출국 전 준비 체크리스트 */}
        <section id="preparation" className="mb-td-lg">
          <h3 className="text-td-card-title text-ink mb-td-sm">
            출국 전 준비
          </h3>
          <ul className="bg-surface-card border border-divider rounded-lg p-td-md space-y-td-xs">
            {KOREAN_LOSS_GUIDES.filter((g) => g.preparation).map((g) => (
              <li key={g.category} className="flex items-start gap-td-xs">
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

        <p className="text-td-caption text-ink-mute text-center pt-td-md">
          사이클 P (ADR-035) — M5 응급/실용/도시 컨텍스트 강화 ·
          출처: 외교부 영사콜센터 0404.go.kr
        </p>
      </main>

      <BottomNav active="trips" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════

function ContactCard({ contact }: { contact: EmergencyContact }) {
  const icon = CATEGORY_ICON[contact.category ?? ""] ?? "phone";
  const label = CATEGORY_LABEL[contact.category ?? ""] ?? "연락처";

  return (
    <li className="bg-surface-card border border-divider rounded-lg p-td-md shadow-sm">
      <div className="flex items-start justify-between gap-td-sm">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 mb-td-xxs">
            <span
              className="material-symbols-outlined text-danger text-[16px]"
              aria-hidden
            >
              {icon}
            </span>
            <span className="text-td-caption text-danger-deep font-bold uppercase">
              {label}
            </span>
            {contact.hours && (
              <span className="text-td-caption text-ink-mute ml-1">
                · {contact.hours}
              </span>
            )}
          </div>
          <p className="text-td-body text-ink font-medium">{contact.label}</p>
          {contact.phone && (
            <p className="text-td-card-title text-ink tabular-nums mt-td-xxs">
              {contact.phone}
            </p>
          )}
          {contact.notes && (
            <p className="text-td-meta text-ink-soft mt-td-xxs">
              {contact.notes}
            </p>
          )}
        </div>
        {contact.phone && (
          <a
            href={`tel:${contact.phone.replace(/\s/g, "")}`}
            className="bg-danger text-white px-td-sm py-td-xs rounded-full text-td-caption font-medium hover:bg-danger-deep transition-colors flex-shrink-0"
          >
            전화
          </a>
        )}
      </div>
    </li>
  );
}

function LossGuideCard({ guide }: { guide: LossGuide }) {
  return (
    <article className="bg-surface-card border border-divider rounded-xl shadow-sm overflow-hidden">
      <header className="bg-amber-soft border-b border-amber/30 px-td-md py-td-sm flex items-center gap-td-xs">
        <span className="text-[24px]" aria-hidden>
          {guide.emoji}
        </span>
        <h4 className="text-td-card-title text-amber-deep font-bold">
          {guide.title}
        </h4>
      </header>
      <div className="p-td-md space-y-td-md">
        {/* Steps */}
        <div>
          <p className="text-td-caption text-ink-mute uppercase mb-td-xs">
            단계
          </p>
          <ol className="space-y-td-xs">
            {guide.steps.map((step, i) => (
              <li
                key={i}
                className="text-td-meta text-ink leading-relaxed"
              >
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Contacts */}
        {guide.contacts.length > 0 && (
          <div>
            <p className="text-td-caption text-ink-mute uppercase mb-td-xs">
              연락·자료
            </p>
            <ul className="space-y-td-xs">
              {guide.contacts.map((c, i) => (
                <li
                  key={i}
                  className="text-td-meta text-ink-soft"
                >
                  <div className="font-medium text-ink">{c.label}</div>
                  {c.phone && (
                    <a
                      href={`tel:${c.phone.replace(/\s/g, "")}`}
                      className="block text-purple-deep tabular-nums mt-0.5 hover:underline"
                    >
                      {c.phone}
                    </a>
                  )}
                  {c.url && (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-purple-deep mt-0.5 hover:underline truncate"
                    >
                      {c.url}
                    </a>
                  )}
                  {c.notes && (
                    <p className="text-td-caption text-ink-mute mt-0.5">
                      {c.notes}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}
