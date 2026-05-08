"use client";

/**
 * PhraseCard — 베트남어 핵심 문장 단건 카드 (A3 디자인 갭).
 *
 * 한국어 + 베트남어 + 발음 + 음성 재생 + 복사 버튼.
 * - 음성 재생 = 브라우저 SpeechSynthesis Web API (의존성 0).
 * - 복사 = navigator.clipboard.writeText (베트남어 텍스트 복사 — 음성 미지원 환경
 *   사용자가 Google Translate / 카카오톡 / 호텔 직원에게 보여주기 등 fallback).
 * 미지원 환경에서는 각각 안내 상태로 진입.
 */

import { useState } from "react";
import type { Phrase } from "@/lib/vietnamese-phrases";

interface Props {
  phrase: Phrase;
}

type CopyState = "idle" | "copied" | "error";

export function PhraseCard({ phrase }: Props) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUnsupported, setIsUnsupported] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");

  function handleSpeak() {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) {
      setIsUnsupported(true);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(phrase.vi);
    utterance.lang = "vi-VN";
    utterance.rate = 0.85; // 학습용 약간 느리게
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.cancel(); // 진행 중 취소
    window.speechSynthesis.speak(utterance);
  }

  async function handleCopy() {
    if (typeof window === "undefined") return;
    if (!navigator.clipboard?.writeText) {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 1500);
      return;
    }
    try {
      await navigator.clipboard.writeText(phrase.vi);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 1500);
    }
  }

  return (
    <article
      data-testid="phrase-card"
      data-phrase-id={phrase.id}
      className="bg-surface-card rounded-md border border-divider p-td-md"
    >
      <p className="text-td-body text-ink font-medium mb-td-xxs">{phrase.ko}</p>
      <p className="text-td-card-title text-purple-deep font-medium mb-td-xxs leading-snug">
        {phrase.vi}
      </p>
      <p className="text-td-meta text-ink-soft">
        <span className="font-mono text-ink-mute mr-td-xxs">발음</span>
        {phrase.pronunciation}
      </p>
      {phrase.context && (
        <p className="text-td-caption text-ink-mute mt-td-xxs">
          💬 {phrase.context}
        </p>
      )}
      <div className="mt-td-sm flex items-center justify-end gap-td-xs">
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`${phrase.vi} 베트남어 복사`}
          aria-live="polite"
          className={`flex items-center gap-td-xxs rounded-sm px-td-sm py-td-xxs transition-colors ${
            copyState === "copied"
              ? "bg-purple text-white"
              : copyState === "error"
                ? "bg-ink/10 text-ink-mute"
                : "bg-purple-soft text-purple-deep hover:bg-purple hover:text-white"
          }`}
        >
          <span className="material-symbols-outlined text-td-icon" aria-hidden>
            {copyState === "copied"
              ? "check"
              : copyState === "error"
                ? "error"
                : "content_copy"}
          </span>
          <span className="text-td-meta font-medium">
            {copyState === "copied"
              ? "복사됨!"
              : copyState === "error"
                ? "복사 실패"
                : "복사"}
          </span>
        </button>
        <button
          type="button"
          onClick={handleSpeak}
          disabled={isUnsupported}
          aria-label={`${phrase.ko} 베트남어 발음 재생`}
          aria-pressed={isSpeaking ? "true" : "false"}
          className={`flex items-center gap-td-xxs rounded-sm px-td-sm py-td-xxs transition-colors ${
            isUnsupported
              ? "bg-ink/10 text-ink-mute cursor-not-allowed"
              : isSpeaking
                ? "bg-purple text-white"
                : "bg-purple-soft text-purple-deep hover:bg-purple hover:text-white"
          }`}
        >
          <span className="material-symbols-outlined text-td-icon" aria-hidden>
            {isSpeaking ? "graphic_eq" : "volume_up"}
          </span>
          <span className="text-td-meta font-medium">
            {isUnsupported ? "음성 미지원" : isSpeaking ? "재생 중" : "발음 듣기"}
          </span>
        </button>
      </div>
    </article>
  );
}
