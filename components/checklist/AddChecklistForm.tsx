"use client";

/**
 * 사이클 QQ — AddChecklistForm (ChecklistView에서 추출).
 *
 * 답습: 사이클 LL AddCostForm (presentation + 자체 state 관리).
 * 책임: 항목 입력 폼. 제출은 부모 콜백으로 위임.
 */

import { useState } from "react";
import type { ChecklistCategory, DDayBucket } from "@/lib/types";

const BUCKET_ORDER: DDayBucket[] = [
  "D-30",
  "D-14",
  "D-7",
  "D-1",
  "during",
  "after",
];

const BUCKET_LABEL: Record<DDayBucket, string> = {
  "D-30": "D-30 · 사전 준비",
  "D-14": "D-14 · 예약 마감",
  "D-7": "D-7 · 짐 준비",
  "D-1": "D-1 · 출발 직전",
  during: "여행 중",
  after: "귀국 후",
};

const CATEGORY_LABEL: Record<ChecklistCategory, string> = {
  documents: "서류",
  clothing: "의류",
  electronics: "전자",
  forbidden: "반입 금지",
  declarable: "신고 대상",
  custom: "기타",
};

export interface AddChecklistFormSubmit {
  text: string;
  category: ChecklistCategory;
  dDayBucket: DDayBucket;
}

interface Props {
  isPending: boolean;
  onSubmit: (input: AddChecklistFormSubmit) => void;
}

export function AddChecklistForm({ isPending, onSubmit }: Props) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState<ChecklistCategory>("custom");
  const [bucket, setBucket] = useState<DDayBucket>("D-7");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit({ text: trimmed, category, dDayBucket: bucket });
    setText("");
  }

  return (
    <section className="mt-td-lg bg-surface-card border border-divider rounded-xl p-td-md">
      <h3 className="text-td-card-title text-ink mb-td-sm">항목 추가</h3>
      <form onSubmit={handleSubmit} className="space-y-td-sm">
        <input
          type="text"
          aria-label="항목명"
          placeholder="예: 우산, 약, 한국 컵라면"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full px-td-sm py-2 border border-divider rounded-lg text-td-body bg-surface-soft focus:outline focus:outline-purple"
          maxLength={100}
        />
        <div className="grid grid-cols-2 gap-td-sm">
          <select
            aria-label="카테고리"
            value={category}
            onChange={(e) => setCategory(e.target.value as ChecklistCategory)}
            className="px-td-sm py-2 border border-divider rounded-lg text-td-body bg-surface-soft"
          >
            {(Object.keys(CATEGORY_LABEL) as ChecklistCategory[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
          <select
            aria-label="D-Day 시점"
            value={bucket}
            onChange={(e) => setBucket(e.target.value as DDayBucket)}
            className="px-td-sm py-2 border border-divider rounded-lg text-td-body bg-surface-soft"
          >
            {BUCKET_ORDER.map((b) => (
              <option key={b} value={b}>
                {BUCKET_LABEL[b]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={isPending || !text.trim()}
          className="w-full py-2 bg-purple text-white rounded-lg text-td-body font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {isPending ? "추가 중…" : "추가"}
        </button>
      </form>
    </section>
  );
}
