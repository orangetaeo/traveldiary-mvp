"use client";

/**
 * 사이클 LL — AddCostForm (CostView에서 추출).
 *
 * 답습: 사이클 O/CC/DD/HH/JJ (presentation 컴포넌트 추출).
 * 책임: 비용 입력 폼 UI + 폼 state. 제출은 부모 콜백으로 위임.
 *
 * 사이클 A5 (디자인 갭 자율 발견 #3) — 그룹 분담금 자동 계산 UX:
 *  - props에 entries (옵셔널, 후방 호환) — 기존 splitWith 빈도 추출 소스
 *  - "일행과 정산" details 안에 빈도 칩 + "1/N 자동 채우기" 버튼
 *  - 칩 클릭: 결제자 빈 칸이면 결제자, 아니면 함께 부담에 추가
 *  - "1/N 자동 채우기": 빈도 ≥ 2 멤버 모두 적용 (결제자 비면 빈도 1위 → 결제자)
 */

import { useMemo, useState } from "react";
import type { CostEntry, CostStatus } from "@/lib/types";
import { parseSplitToken } from "@/lib/services/settlement";
import { COST_CATEGORY_OPTIONS } from "@/lib/utils/cost-constants";
import {
  extractCommonMembers,
  type MemberFrequency,
} from "@/lib/cost-split-suggestions";

const TODAY_ISO = new Date().toISOString().slice(0, 10);

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
  /** 사이클 A5 — 기존 entries (빈도 칩 추천 소스). 미전달 시 추천 영역 미노출. */
  entries?: CostEntry[];
  /** 편집 모드 — 이 값이 세팅되면 폼이 수정 모드로 전환. */
  editEntry?: CostEntry | null;
  /** 편집 취소 콜백. */
  onCancelEdit?: () => void;
}

/** 함께 부담 input 문자열에 신규 이름 추가 — 중복 회피, 쉼표 구분 */
function appendToOthers(current: string, name: string): string {
  const tokens = current
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (tokens.includes(name)) return current;
  tokens.push(name);
  return tokens.join(", ");
}

export function AddCostForm({
  currency,
  currencySymbol,
  approxKrwRate,
  isPending,
  onSubmit,
  onError,
  entries,
  editEntry,
  onCancelEdit,
}: AddCostFormProps) {
  const [draftLabel, setDraftLabel] = useState("");
  const [draftAmountKrw, setDraftAmountKrw] = useState("");
  const [draftAmountLocal, setDraftAmountLocal] = useState("");
  const [draftCategory, setDraftCategory] = useState("food");
  const [draftStatus, setDraftStatus] = useState<CostStatus>("paid");
  const [draftDate, setDraftDate] = useState(TODAY_ISO);
  const [draftPayer, setDraftPayer] = useState("");
  const [draftSplitMembers, setDraftSplitMembers] = useState("");

  /** editEntry 변경 시 폼 필드 프리필 */
  const [lastEditId, setLastEditId] = useState<string | null>(null);
  if (editEntry && editEntry.id !== lastEditId) {
    setLastEditId(editEntry.id);
    setDraftLabel(editEntry.label);
    setDraftAmountKrw(String(editEntry.amountKrw));
    setDraftAmountLocal(editEntry.amountLocal ? String(editEntry.amountLocal.value) : "");
    setDraftCategory(editEntry.category ?? "food");
    setDraftStatus(editEntry.status);
    setDraftDate(editEntry.date);
    // splitWith[0] = 결제자 (ADR-039 컨벤션)
    if (editEntry.splitWith && editEntry.splitWith.length > 0) {
      const payer = editEntry.splitWith[0];
      setDraftPayer(typeof payer === "string" ? payer : payer.name);
      const others = editEntry.splitWith.slice(1).map((t) =>
        typeof t === "string" ? t : t.weight ? `${t.name}:${t.weight}` : t.name,
      );
      setDraftSplitMembers(others.join(", "));
    } else {
      setDraftPayer("");
      setDraftSplitMembers("");
    }
  }
  if (!editEntry && lastEditId !== null) {
    setLastEditId(null);
    setDraftLabel("");
    setDraftAmountKrw("");
    setDraftAmountLocal("");
    setDraftCategory("food");
    setDraftStatus("paid");
    setDraftDate(TODAY_ISO);
    setDraftPayer("");
    setDraftSplitMembers("");
  }

  const isEditMode = !!editEntry;

  /** 사이클 A5 — entries 변경 시 빈도 추출 (memo) */
  const memberFrequency: MemberFrequency[] = useMemo(
    () => (entries && entries.length > 0 ? extractCommonMembers(entries) : []),
    [entries],
  );

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

  /** 사이클 A5 — 칩 클릭. 결제자 빈 칸이면 결제자에, 아니면 함께 부담에 추가 */
  function handleSuggestionTap(name: string) {
    if (draftPayer.trim().length === 0) {
      setDraftPayer(name);
      return;
    }
    if (name === draftPayer.trim()) return; // 결제자와 동일 — 무시
    setDraftSplitMembers((current) => appendToOthers(current, name));
  }

  /** 사이클 A5 — "1/N 자동 채우기". 빈도 ≥ 2 멤버 모두 적용 (결제자 비면 빈도 1위 → 결제자) */
  function handleAutoFill() {
    const recurring = memberFrequency.filter((m) => m.count >= 2);
    if (recurring.length === 0) return;
    let payer = draftPayer.trim();
    let pool = recurring;
    if (payer.length === 0) {
      payer = recurring[0].name;
      pool = recurring.slice(1);
      setDraftPayer(payer);
    }
    setDraftSplitMembers((current) => {
      let next = current;
      for (const m of pool) {
        if (m.name === payer) continue;
        next = appendToOthers(next, m.name);
      }
      return next;
    });
  }

  const recurringCount = memberFrequency.filter((m) => m.count >= 2).length;

  return (
    <section id="add-cost-form" className="bg-surface-card border border-divider rounded-md p-td-md mb-td-lg">
      <h3 className="text-td-card-title text-ink mb-td-sm">
        {isEditMode ? "비용 수정" : "비용 추가"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-td-sm">
        <div>
          <input
            type="text"
            placeholder="항목명 (예: 즈엉동 야시장 저녁)"
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            className="w-full px-td-sm py-2 border border-divider rounded-md text-td-body bg-surface-soft focus:outline focus:outline-purple"
            maxLength={50}
            aria-label="항목명"
            aria-describedby="cost-label-count"
          />
          <p
            id="cost-label-count"
            className={`text-td-caption text-right mt-0.5 ${draftLabel.length >= 45 ? "text-danger" : "text-ink-mute"}`}
            aria-live="polite"
          >
            {draftLabel.length}/50
          </p>
        </div>
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
            {COST_CATEGORY_OPTIONS.map((c) => (
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
            {memberFrequency.length > 0 && (
              <div
                className="flex flex-wrap items-center gap-td-xs"
                aria-label="자주 함께한 동행자"
              >
                <span className="text-td-caption text-ink-mute">
                  자주 함께한 동행자:
                </span>
                {memberFrequency.map((m) => {
                  const isRecurring = m.count >= 2;
                  return (
                    <button
                      key={m.name}
                      type="button"
                      onClick={() => handleSuggestionTap(m.name)}
                      className={
                        isRecurring
                          ? "px-2 py-0.5 rounded-full text-td-caption bg-purple-soft text-purple-deep border border-purple-soft hover:bg-purple-soft/80"
                          : "px-2 py-0.5 rounded-full text-td-caption bg-surface-soft text-ink-soft border border-divider hover:bg-surface-card"
                      }
                      aria-label={`${m.name} 추가 — ${m.count}회 함께함`}
                    >
                      {m.name}
                      {isRecurring && (
                        <span className="ml-1 text-[10px] tabular-nums opacity-80">
                          ×{m.count}
                        </span>
                      )}
                    </button>
                  );
                })}
                {recurringCount >= 1 && (
                  <button
                    type="button"
                    onClick={handleAutoFill}
                    className="ml-auto px-2 py-0.5 rounded-md text-td-caption text-purple-deep font-semibold hover:underline"
                    aria-label="자주 함께한 동행자 모두로 1/N 자동 채우기"
                  >
                    1/N 자동 채우기 →
                  </button>
                )}
              </div>
            )}
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
        <div className={isEditMode ? "flex gap-td-sm" : ""}>
          {isEditMode && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex-1 py-2 border border-divider text-ink rounded-md text-td-body font-semibold hover:bg-surface-soft transition-colors"
            >
              취소
            </button>
          )}
          <button
            type="submit"
            disabled={isPending}
            className={`${isEditMode ? "flex-1" : "w-full"} py-2 bg-purple text-white rounded-md text-td-body font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity`}
          >
            {isPending
              ? isEditMode ? "수정 중…" : "추가 중…"
              : isEditMode ? "수정" : "비용 추가"}
          </button>
        </div>
      </form>
    </section>
  );
}
