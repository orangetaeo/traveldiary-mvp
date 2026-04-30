/**
 * City Guide 페이지 — Stitch #20 매핑 (사이클 8 M5).
 *
 * Stitch screen: projects/4681512633268080895/screens/287ff902a0f34684969746e04bf5df45
 * 데이터: lib/seed/cities/{slug}.ts (시드만, DB 영속화는 사이클 8.5+).
 *
 * MVP 필드만 노출: 응급/결제/교통/상황별 문장 + 시그니처 가이드.
 * visa/utilities/weather는 city 시드에 채워지면 노출, 없으면 섹션 생략.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { getCityBySlug } from "@/lib/seed/cities";
import type {
  EmergencyContact,
  SituationalPhrase,
  CuratedGuide,
} from "@/lib/types";

interface ChipDef {
  id: string;
  label: string;
  danger?: boolean;
}

const CHIPS: ChipDef[] = [
  { id: "emergency", label: "응급", danger: true },
  { id: "payment", label: "결제" },
  { id: "transport", label: "교통" },
  { id: "phrases", label: "상황별 문장" },
  { id: "guides", label: "시그니처" },
];

const PHRASE_SITUATION_LABEL: Record<SituationalPhrase["situation"], string> = {
  greeting: "인사",
  thanks: "감사",
  checkout: "계산",
  price: "가격",
  help: "도움",
  menu: "메뉴",
  slow: "천천히",
  spicy: "맵기",
  vegetarian: "채식",
  drink: "음료",
};

export default function CityPage({ params }: { params: { slug: string } }) {
  const city = getCityBySlug(params.slug);
  if (!city) notFound();

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-32">
      {/* TopAppBar */}
      <header className="bg-surface-card border-b border-divider sticky top-0 z-40 flex justify-between items-center w-full px-td-md h-16">
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
        <span
          className="material-symbols-outlined text-ink-soft"
          aria-hidden
        >
          account_circle
        </span>
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
            <div className="flex items-center mb-td-md">
              <span className="bg-danger-soft text-danger-deep px-td-xs py-1 rounded-full text-td-caption font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]" aria-hidden>warning</span>
                긴급 상황
              </span>
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

        {/* Section 4: Phrase Book */}
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
          v2 비전 §4 신규 모델 City. MVP 필드(emergency·payment·transport·phrases)만
          노출. visa/utilities/weather는 사이클 8.5+에서 추가.
        </p>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════

function EmergencyRow({ contact }: { contact: EmergencyContact }) {
  return (
    <li className="flex items-center justify-between py-td-xs border-b border-divider last:border-b-0">
      <div className="min-w-0 flex-1 pr-td-xs">
        <p className="text-td-meta text-ink-soft truncate">{contact.label}</p>
        <p className="text-td-card-title text-ink tabular-nums">{contact.phone}</p>
        {contact.notes && (
          <p className="text-td-caption text-ink-mute mt-td-xxs">{contact.notes}</p>
        )}
      </div>
      <a
        href={`tel:${contact.phone.replace(/\s/g, "")}`}
        className="border border-divider px-td-xs py-1 text-td-caption rounded hover:bg-surface-soft transition-colors flex-shrink-0"
      >
        전화
      </a>
    </li>
  );
}

function PhraseCard({ phrase }: { phrase: SituationalPhrase }) {
  const label = PHRASE_SITUATION_LABEL[phrase.situation] ?? phrase.situation;
  return (
    <div className="bg-surface-card border border-divider rounded-lg p-td-sm">
      <span className="inline-block bg-purple-soft text-purple-deep px-td-xs py-0.5 rounded-full text-td-caption font-bold mb-td-xxs">
        {label}
      </span>
      <p className="text-td-body text-ink font-medium">{phrase.korean}</p>
      <p className="text-td-body text-purple-deep mt-td-xxs">{phrase.local}</p>
      {phrase.pronunciation && (
        <p className="text-td-caption text-ink-mute italic mt-td-xxs">
          {phrase.pronunciation}
        </p>
      )}
    </div>
  );
}

function CuratedGuideCard({ guide }: { guide: CuratedGuide }) {
  const gradient = guide.hero?.gradient ?? "from-purple to-purple-deep";
  return (
    <article
      id={`guide-${guide.id}`}
      className="bg-surface-card border border-divider rounded-xl overflow-hidden shadow-sm scroll-mt-24"
    >
      <div className={`bg-gradient-to-br ${gradient} px-td-md py-td-md text-white`}>
        <div className="flex items-start gap-td-sm">
          {guide.hero?.emoji && (
            <span className="text-3xl" aria-hidden>{guide.hero.emoji}</span>
          )}
          <div>
            <h4 className="text-td-card-title font-bold">{guide.title}</h4>
            {guide.subtitle && (
              <p className="text-td-meta opacity-90 mt-td-xxs">{guide.subtitle}</p>
            )}
          </div>
        </div>
      </div>
      <div className="p-td-md space-y-td-md">
        {guide.sections.map((s, i) => (
          <section key={i}>
            <h5 className="text-td-body font-semibold text-ink mb-td-xxs">{s.heading}</h5>
            <p className="text-td-meta text-ink-soft leading-relaxed">{s.body}</p>
            {s.tip && (
              <p className="mt-td-xs text-td-caption text-amber-deep bg-amber-soft px-td-xs py-td-xxs rounded">
                💡 {s.tip}
              </p>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}
