"use client";

/**
 * 사이클 LL — AddCostForm (CostView에서 추출).
 *
 * 답습: 사이클 O/CC/DD/HH/JJ (presentation 컴포넌트 추출).
 * 책임: 비용 입력 폼 UI + 폼 state. 제출은 부모 콜백으로 위임.
 */

import { useState } from "react";
import type { CostStatus } from "@/lib/types";
import { parseSplitToken } from "@/lib/services/settlement";

const TODAY_ISO = new Date().toISOString().slice(0, 10);

const CATEGORY_OPTIONS = [
  { id: "food", label: "식비" },
  { id: "transport", label: "교통" },
  { id: "accommodation", label: "숙박" },
  { id: "shopping", label: "쇼핑" },
  { id: "activity", label: "액티비티" },
  { id: "other", label: "기타" },
];

export interface AddCostFormSubmit {
  label: string;
  amountKrw: number;
  amountLocal?: { value: number; currency: string };
  status: CostStatus;
  category: string;
  date: string;
  splitWith?: Array<string | { name: string; weight?: number }>;
}

interface AddCostFormProps {
  currency: string;
  currencySymbol: string;
  approxKrwRate: number;
  isPending: boolean;
  onSubmit: (input: AddCostFormSubmit) => void;
  onError: (msg: string) => void;
}

export function AddCostForm({
  currency,
  currencySymbol,
  approxKrwRate,
  isPending,
  onSubmit,
  onError,
}: AddCostFormProps) {
  const [draftLabel, setDraftLabel] = useState("");
  const [draftAmountKrw, setDraftAmountKrw] = useState("");
  const [draftAmountLocal, setDraftAmountLocal] = useState("");
  const [draftCategory, setDraftCategory] = useState("food");
  const [draftStatus, setDraftStatus] = useState<CostStatus>("paid");
  const [draftDate, setDraftDate] = useState(TODAY_ISO);
  const [draftPayer, setDraftPayer] = useState("");
  const [draftSplitMembers, setDraftSplitMembers] = useState("");

  /** KRW 또는 local 둘 중 하나만 입력해도 자동 산출. 둘 다 입력 시 우선: local */
  function deriveAmounts(
    krwInput: string,
    localInput: string,
  ): { amountKrw: number; amountLocal?: { value: number; currency: string } } | null {
    const krw = parseFloat(krwInput);
    const local = parseFloat(localInput);

    if (!isNaN(local) && local > 0) {
      return {
        amountKrw: Math.round(local / approxKrwRate),
        amountLocal: { value: local, currency },
      };
    }
    if (!isNaN(krw) && krw > 0) {
      return {
        amountKrw: Math.round(krw),
        amountLocal: {
          value: Math.round(krw * approxKrwRate),
          currency,
        },
      };
    }
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draftLabel.trim()) {
      onError("항목 이름을 입력해주세요.");
      return;
    }
    const amounts = deriveAmounts(draftAmountKrw, draftAmountLocal);
    if (!amounts) {
      onError("KRW 또는 현지통화 중 하나는 입력해주세요.");
      return;
    }

    // splitWith[0] = 결제자 컨벤션 (ADR-039 v2)
    const payerToken = parseSplitToken(draftPayer);
    const payerName =
      typeof payerToken === "string"
        ? payerToken
        : payerToken
          ? payerToken.name
          : "";
    const otherTokens = draftSplitMembers
      .split(",")
      .map((s) => parseSplitToken(s))
      .filter((t): t is string | { name: string; weight?: number } => {
        if (t === null) return false;
        const name = typeof t === "string" ? t : t.name;
        return name.length > 0 && name !== payerName;
      });
    const splitWith =
      payerName.length > 0 && payerToken !== null
        ? [payerToken, ...otherTokens]
        : undefined;

    onSubmit({
      label: draftLabel.trim(),
      amountKrw: amounts.amountKrw,
      amountLocal: amounts.amountLocal,
      status: draftStatus,
      category: draftCategory,
      date: draftDate,
      splitWith,
    });

    setDraftLabel("");
    setDraftAmountKrw("");
    setDraftAmountLocal("");
    setDraftPayer("");
    setDraftSplitMembers("");
  }

  return (
    <section id="add-cost-form" className="bg-surface-card border border-divider rounded-md p-td-md mb-td-lg">
      <h3 className="text-td-card-title text-ink mb-td-sm">비용 추가</h3>
      <form onSubmit={handleSubmit} className="space-y-td-sm">
        <input
          type="text"
          placeholder="항목명 (예: 즈엉동 야시장 저녁)"
          value={draftLabel}
          onChange={(e) => setDraftLabel(e.target.value)}
          className="w-full px-td-sm py-2 border border-divider rounded-md text-td-body bg-surface-soft focus:outline focus:outline-purple"
          maxLength={50}
          aria-label="항목명"
        />
        <div className="grid grid-cols-2 gap-td-sm">
          <label className="flex flex-col">
            <span className="text-td-caption text-ink-soft mb-1">KRW</span>
            <input
              type="number"
              placeholder="원"
              value={draftAmountKrw}
              onChange={(e) => setDraftAmountKrw(e.target.value)}
              className="px-td-sm py-2 border border-divider rounded-md text-td-body bg-surface-soft tabular-nums"
              min="0"
              step="100"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-td-caption text-ink-soft mb-1">
              {currency} ({currencySymbol})
            </span>
            <input
              type="number"
              placeholder={currencySymbol}
              value={draftAmountLocal}
              onChange={(e) => setDraftAmountLocal(e.target.value)}
              className="px-td-sm py-2 border border-divider rounded-md text-td-body bg-surface-soft tabular-nums"
              min="0"
            />
          </label>
        </div>
        <p className="text-td-caption text-ink-mute">
          💡 둘 중 하나만 입력하면 자동 변환됩니다.
        </p>
        <div className="grid grid-cols-3 gap-td-sm">
          <select
            value={draftCategory}
            onChange={(e) => setDraftCategory(e.target.value)}
            className="px-td-sm py-2 border border-divider rounded-md text-td-meta bg-surface-soft"
            aria-label="카테고리"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={draftStatus}
            onChange={(e) => setDraftStatus(e.target.value as CostStatus)}
            className="px-td-sm py-2 border border-divider rounded-md text-td-meta bg-surface-soft"
            aria-label="결제 상태"
          >
            <option value="paid">결제 완료</option>
            <option value="booked">예약 (선결제)</option>
            <option value="planned">예정</option>
          </select>
          <input
            type="date"
            value={draftDate}
            onChange={(e) => setDraftDate(e.target.value)}
            className="px-td-sm py-2 border border-divider rounded-md text-td-meta bg-surface-soft"
            aria-label="결제 일자"
          />
        </div>
        <details className="text-td-meta">
          <summary className="cursor-pointer text-td-caption text-ink-mute hover:text-ink py-1">
            일행과 정산 (선택)
          </summary>
          <div className="space-y-td-xs mt-td-xs">
            <input
              type="text"
              placeholder="결제자 (예: 나)"
              value={draftPayer}
              onChange={(e) => setDraftPayer(e.target.value.slice(0, 30))}
              className="w-full px-td-sm py-2 border border-divider rounded-md text-td-body bg-surface-soft"
              aria-label="결제자"
            />
            <input
              type="text"
              placeholder="함께 부담 (쉼표 구분, 예: 영희, 철수:2 — 가중치)"
              value={draftSplitMembers}
              onChange={(e) =>
                setDraftSplitMembers(e.target.value.slice(0, 200))
              }
              className="w-full px-td-sm py-2 border border-divider rounded-md text-td-body bg-surface-soft"
              aria-label="함께 부담한 사람"
            />
            <p className="text-td-caption text-ink-mute">
              💡 결제자 포함 자동 분담. <strong>이름:가중치</strong> 형식
              (예: 어른은 2, 아동은 1). 가중치 생략 시 1.
            </p>
          </div>
        </details>
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2 bg-purple text-white rounded-md text-td-body font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {isPending ? "추가 중…" : "비용 추가"}
        </button>
      </form>
    </section>
  );
}
