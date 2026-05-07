/**
 * 응급 페이지 하위 카드 컴포넌트 2종 + 카테고리 상수.
 * ContactCard / LossGuideCard.
 */

"use client";

import { useState } from "react";
import type { EmergencyContact } from "@/lib/types";
import type { LossGuide } from "@/lib/constants/koreanLossContacts";

export const EMERGENCY_CATEGORY_LABEL: Record<string, string> = {
  embassy: "영사관",
  police: "경찰",
  ambulance: "병원·응급",
  card_lost: "카드 분실",
  translator: "통역",
  consulate_after_hours: "영사관 야간",
};

export const EMERGENCY_CATEGORY_ICON: Record<string, string> = {
  embassy: "account_balance",
  police: "local_police",
  ambulance: "local_hospital",
  card_lost: "credit_card_off",
  translator: "translate",
  consulate_after_hours: "schedule",
};

export function ContactCard({ contact }: { contact: EmergencyContact }) {
  const icon = EMERGENCY_CATEGORY_ICON[contact.category ?? ""] ?? "phone";
  const label = EMERGENCY_CATEGORY_LABEL[contact.category ?? ""] ?? "연락처";

  return (
    <div className="bg-surface-card border border-divider p-3 rounded-md flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-surface-soft p-2 rounded-lg text-danger shrink-0">
          <span className="material-symbols-outlined" aria-hidden>
            {icon}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-td-body font-semibold text-ink truncate">{contact.label}</p>
            {contact.hours && (
              <span className="text-td-caption text-ink-mute">
                {contact.hours}
              </span>
            )}
          </div>
          {contact.phone && (
            <p className="text-td-meta text-ink-mute tabular-nums">
              {contact.phone}
            </p>
          )}
          {contact.notes && (
            <p className="text-td-caption text-danger mt-0.5">
              {contact.notes}
            </p>
          )}
        </div>
      </div>
      {contact.phone && (
        <div className="flex items-center gap-1 shrink-0">
          <CopyButton text={contact.phone.replace(/\s/g, "")} label={`${label} 번호 복사`} />
          <a
            href={`tel:${contact.phone.replace(/\s/g, "")}`}
            className="text-ink-mute hover:text-purple transition-colors"
            aria-label={`${label} 전화`}
          >
            <span className="material-symbols-outlined">call</span>
          </a>
        </div>
      )}
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드 API 미지원 시 무시
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      className="text-ink-mute hover:text-purple transition-colors"
    >
      <span className="material-symbols-outlined text-[20px]">
        {copied ? "check" : "content_copy"}
      </span>
    </button>
  );
}

export function LossGuideCard({ guide }: { guide: LossGuide }) {
  return (
    <article className="bg-surface-card border border-divider rounded-md shadow-[0_4px_12px_rgba(15,23,42,0.05)] overflow-hidden">
      <header className="bg-amber-soft border-b border-amber/40 px-4 py-3 flex items-center gap-2">
        <span className="text-[24px]" aria-hidden>
          {guide.emoji}
        </span>
        <h4 className="text-td-body font-bold text-amber-deep">
          {guide.title}
        </h4>
      </header>
      <div className="p-4 space-y-4">
        {/* Steps */}
        <div>
          <p className="text-td-caption text-ink-mute uppercase mb-2">
            단계
          </p>
          <ol className="space-y-1.5">
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
            <p className="text-td-caption text-ink-mute uppercase mb-2">
              연락·자료
            </p>
            <ul className="space-y-1.5">
              {guide.contacts.map((c, i) => (
                <li
                  key={i}
                  className="text-td-meta text-ink-soft"
                >
                  <div className="font-medium text-ink">{c.label}</div>
                  {c.phone && (
                    <a
                      href={`tel:${c.phone.replace(/\s/g, "")}`}
                      className="block text-purple tabular-nums mt-0.5 hover:underline"
                    >
                      {c.phone}
                    </a>
                  )}
                  {c.url && (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-purple mt-0.5 hover:underline truncate"
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
