/**
 * City Guide 페이지 — 소형 카드 컴포넌트 3종.
 * EmergencyRow / PhraseCard / CuratedGuideCard.
 */

import type { EmergencyContact, SituationalPhrase, CuratedGuide } from "@/lib/types";

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

export function EmergencyRow({ contact }: { contact: EmergencyContact }) {
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

export function PhraseCard({ phrase }: { phrase: SituationalPhrase }) {
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

export function CuratedGuideCard({ guide }: { guide: CuratedGuide }) {
  const gradient = guide.hero?.gradient ?? "from-purple to-purple-deep";
  return (
    <article
      id={`guide-${guide.id}`}
      className="bg-surface-card border border-divider rounded-md overflow-hidden shadow-sm scroll-mt-24"
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
