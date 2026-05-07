"use client";

/**
 * FlashcardMode — 베트남어 핵심 문장 플래시카드 학습 모드.
 *
 * 앞면: 한국어 문장 + 상황 힌트.
 * 뒷면: 베트남어 + 발음 + TTS 재생.
 * 셔플 + 진행률 카운터 (localStorage).
 * TTS 속도 토글 (느림 0.65 / 보통 0.85).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Phrase, PhraseCategory } from "@/lib/vietnamese-phrases";
import { PHRASES, PHRASE_CATEGORIES } from "@/lib/vietnamese-phrases";

// ── localStorage 학습 기록 ───────────────────────────────────
const PROGRESS_KEY = "td-phrase-flashcard-seen";

function getSeenIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markSeen(id: string): Set<string> {
  const seen = getSeenIds();
  seen.add(id);
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify([...seen]));
  } catch { /* ignore */ }
  return seen;
}

function resetProgress(): void {
  try {
    localStorage.removeItem(PROGRESS_KEY);
  } catch { /* ignore */ }
}

// ── 셔플 (Fisher-Yates) ──────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface Props {
  category: PhraseCategory | "all";
}

export function FlashcardMode({ category }: Props) {
  const deck = useMemo(() => {
    const filtered = category === "all"
      ? PHRASES
      : PHRASES.filter((p) => p.category === category);
    return shuffle(filtered);
  }, [category]);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [slowMode, setSlowMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    setSeen(getSeenIds());
  }, []);

  // 카테고리 변경 시 인덱스 리셋
  useEffect(() => {
    setIndex(0);
    setFlipped(false);
  }, [deck]);

  const card: Phrase | undefined = deck[index];
  const total = deck.length;
  const seenInDeck = deck.filter((p) => seen.has(p.id)).length;
  const isComplete = index >= total;

  const catMeta = card
    ? PHRASE_CATEGORIES.find((c) => c.id === card.category)
    : null;

  const handleFlip = useCallback(() => {
    if (!card) return;
    setFlipped(true);
    setSeen(markSeen(card.id));
  }, [card]);

  const handleNext = useCallback(() => {
    setFlipped(false);
    setIndex((i) => i + 1);
  }, []);

  const handlePrev = useCallback(() => {
    if (index <= 0) return;
    setFlipped(false);
    setIndex((i) => i - 1);
  }, [index]);

  const handleRestart = useCallback(() => {
    setIndex(0);
    setFlipped(false);
  }, []);

  const handleReset = useCallback(() => {
    resetProgress();
    setSeen(new Set());
    setIndex(0);
    setFlipped(false);
  }, []);

  function handleSpeak(phrase: Phrase) {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(phrase.vi);
    utterance.lang = "vi-VN";
    utterance.rate = slowMode ? 0.65 : 0.85;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  // 키보드 네비게이션
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (isComplete) handleRestart();
        else if (!flipped) handleFlip();
        else handleNext();
      }
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, isComplete, handleFlip, handleNext, handlePrev, handleRestart]);

  // ── 완료 화면 ──────────────────────────────────────────────
  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-5xl mb-td-md" aria-hidden>🎉</span>
        <h3 className="text-td-title text-ink font-bold mb-td-xs">
          {total}개 문장 완료!
        </h3>
        <p className="text-td-body text-ink-soft mb-td-md">
          누적 학습: {seen.size} / {PHRASES.length}개
        </p>
        <div className="flex gap-td-sm">
          <button
            type="button"
            onClick={handleRestart}
            className="px-td-lg py-2.5 bg-purple text-white rounded-lg text-td-body font-semibold hover:opacity-90 transition-opacity"
          >
            다시 학습
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-td-lg py-2.5 bg-surface-card border border-divider text-ink-soft rounded-lg text-td-body font-medium hover:bg-surface-soft transition-colors"
          >
            진행률 초기화
          </button>
        </div>
      </div>
    );
  }

  if (!card) return null;

  // ── 카드 렌더 ──────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center">
      {/* 진행률 바 */}
      <div className="w-full mb-td-sm">
        <div className="flex justify-between text-td-meta text-ink-soft mb-1">
          <span>{index + 1} / {total}</span>
          <span>학습 완료: {seenInDeck} / {total}</span>
        </div>
        <div className="w-full h-1.5 bg-divider rounded-full overflow-hidden">
          <div
            className="h-full bg-purple rounded-full transition-all duration-300"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* TTS 속도 토글 */}
      <div className="flex justify-end w-full mb-td-xs">
        <button
          type="button"
          onClick={() => setSlowMode((v) => !v)}
          className={`flex items-center gap-1 px-td-sm py-1 rounded-full text-td-meta font-medium border transition-colors ${
            slowMode
              ? "bg-amber-soft border-amber text-amber-deep"
              : "bg-surface-card border-divider text-ink-soft hover:border-purple/40"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden>
            {slowMode ? "slow_motion_video" : "speed"}
          </span>
          {slowMode ? "느리게" : "보통 속도"}
        </button>
      </div>

      {/* 플래시카드 */}
      <button
        type="button"
        onClick={flipped ? handleNext : handleFlip}
        aria-label={flipped ? "다음 카드" : "뒤집기"}
        className="w-full min-h-[280px] bg-surface-card border-2 border-divider rounded-xl p-td-lg flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
      >
        {!flipped ? (
          /* ── 앞면: 한국어 ── */
          <div className="flex flex-col items-center gap-td-sm">
            {catMeta && (
              <span className="inline-flex items-center gap-1 px-td-sm py-1 rounded-full bg-surface-soft text-ink-mute text-td-meta">
                <span className="material-symbols-outlined text-[16px]" aria-hidden>
                  {catMeta.icon}
                </span>
                {catMeta.label}
              </span>
            )}
            <p className="text-td-title text-ink font-bold leading-relaxed">
              {card.ko}
            </p>
            {card.context && (
              <p className="text-td-body text-ink-mute">💬 {card.context}</p>
            )}
            <p className="text-td-caption text-ink-mute mt-td-sm">
              탭하여 정답 확인
            </p>
          </div>
        ) : (
          /* ── 뒷면: 베트남어 + 발음 ── */
          <div className="flex flex-col items-center gap-td-sm">
            {catMeta && (
              <span className="inline-flex items-center gap-1 px-td-sm py-1 rounded-full bg-surface-soft text-ink-mute text-td-meta">
                <span className="material-symbols-outlined text-[16px]" aria-hidden>
                  {catMeta.icon}
                </span>
                {catMeta.label}
              </span>
            )}
            <p className="text-td-body text-ink-soft">{card.ko}</p>
            <p className="text-2xl text-purple-deep font-bold leading-relaxed">
              {card.vi}
            </p>
            <p className="text-td-body text-ink-soft">
              <span className="font-mono text-ink-mute mr-1">발음</span>
              {card.pronunciation}
            </p>
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                handleSpeak(card);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  handleSpeak(card);
                }
              }}
              aria-label={`${card.ko} 발음 재생`}
              className={`flex items-center gap-td-xxs rounded-full px-td-md py-2 transition-colors ${
                isSpeaking
                  ? "bg-purple text-white"
                  : "bg-purple-soft text-purple-deep hover:bg-purple hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-td-icon" aria-hidden>
                {isSpeaking ? "graphic_eq" : "volume_up"}
              </span>
              <span className="text-td-meta font-medium">
                {isSpeaking ? "재생 중" : "발음 듣기"}
              </span>
            </div>
            <p className="text-td-caption text-ink-mute mt-td-xs">
              탭하여 다음 카드 →
            </p>
          </div>
        )}
      </button>

      {/* 네비게이션 */}
      <div className="flex items-center gap-td-md mt-td-md">
        <button
          type="button"
          onClick={handlePrev}
          disabled={index <= 0}
          aria-label="이전 카드"
          className="w-12 h-12 flex items-center justify-center rounded-full border border-divider text-ink-soft hover:bg-surface-soft disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <span className="text-td-body text-ink font-medium tabular-nums">
          {index + 1} / {total}
        </span>
        <button
          type="button"
          onClick={flipped ? handleNext : handleFlip}
          aria-label={flipped ? "다음 카드" : "뒤집기"}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-purple text-white hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined">
            {flipped ? "chevron_right" : "flip"}
          </span>
        </button>
      </div>

      {/* 키보드 단축키 안내 */}
      <p className="text-td-caption text-ink-mute mt-td-sm hidden sm:block">
        스페이스: 뒤집기/다음 · ←→: 이동
      </p>
    </div>
  );
}
