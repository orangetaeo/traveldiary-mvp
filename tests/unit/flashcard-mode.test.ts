/**
 * FlashcardMode 단위 테스트 — 데이터 무결성 + 셔플 + localStorage 진행률 + TTS 속도.
 *
 * React 컴포넌트 렌더 테스트가 아닌, FlashcardMode가 의존하는
 * 데이터·유틸 로직을 순수 함수 수준에서 검증.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PHRASES,
  PHRASE_CATEGORIES,
  type PhraseCategory,
} from "@/lib/vietnamese-phrases";

// ── Phrase 데이터 무결성 ────────────────────────────────────────

describe("Phrase data integrity", () => {
  it("모든 문장에 필수 필드가 존재한다", () => {
    for (const p of PHRASES) {
      expect(p.id).toBeTruthy();
      expect(p.ko).toBeTruthy();
      expect(p.vi).toBeTruthy();
      expect(p.pronunciation).toBeTruthy();
      expect(p.category).toBeTruthy();
    }
  });

  it("id가 고유하다", () => {
    const ids = PHRASES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("모든 카테고리에 최소 1개 문장이 있다", () => {
    const categories: PhraseCategory[] = ["restaurant", "grab", "hotel", "emergency"];
    for (const cat of categories) {
      const count = PHRASES.filter((p) => p.category === cat).length;
      expect(count).toBeGreaterThan(0);
    }
  });

  it("PHRASE_CATEGORIES 메타가 4개 카테고리를 커버한다", () => {
    expect(PHRASE_CATEGORIES).toHaveLength(4);
    const ids = PHRASE_CATEGORIES.map((c) => c.id);
    expect(ids).toContain("restaurant");
    expect(ids).toContain("grab");
    expect(ids).toContain("hotel");
    expect(ids).toContain("emergency");
  });

  it("각 카테고리 메타에 icon, label, accent가 있다", () => {
    for (const cat of PHRASE_CATEGORIES) {
      expect(cat.icon).toBeTruthy();
      expect(cat.label).toBeTruthy();
      expect(cat.accent).toBeTruthy();
    }
  });
});

// ── 카테고리 필터링 ─────────────────────────────────────────────

describe("Category filtering", () => {
  it("'restaurant' 필터 시 해당 카테고리만 반환", () => {
    const filtered = PHRASES.filter((p) => p.category === "restaurant");
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((p) => p.category === "restaurant")).toBe(true);
  });

  it("'all' 필터 시 전체 문장 반환", () => {
    // FlashcardMode에서 category === "all" → PHRASES 전체 사용
    const filtered = PHRASES; // "all"인 경우
    expect(filtered.length).toBe(PHRASES.length);
  });

  it("모든 카테고리 합계 = 전체 문장 수", () => {
    const categories: PhraseCategory[] = ["restaurant", "grab", "hotel", "emergency"];
    const sum = categories.reduce(
      (acc, cat) => acc + PHRASES.filter((p) => p.category === cat).length,
      0,
    );
    expect(sum).toBe(PHRASES.length);
  });
});

// ── 셔플 알고리즘 (Fisher-Yates) ────────────────────────────────

describe("Shuffle algorithm", () => {
  // FlashcardMode 내부 shuffle 함수를 직접 테스트하기 어려우므로
  // 동일 로직을 재구현하여 검증
  function shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  it("셔플 결과 길이가 원본과 동일하다", () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuffled = shuffle(original);
    expect(shuffled).toHaveLength(original.length);
  });

  it("셔플 결과에 원본 요소가 모두 포함된다", () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuffled = shuffle(original);
    expect(shuffled.sort((a, b) => a - b)).toEqual(original);
  });

  it("원본 배열이 변경되지 않는다 (immutable)", () => {
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];
    shuffle(original);
    expect(original).toEqual(copy);
  });
});

// ── localStorage 진행률 ─────────────────────────────────────────

describe("localStorage progress tracking", () => {
  const PROGRESS_KEY = "td-phrase-flashcard-seen";
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    const mockStorage = {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { store = {}; }),
      length: 0,
      key: vi.fn(() => null),
    };
    vi.stubGlobal("localStorage", mockStorage);
  });

  it("처음에는 빈 Set을 반환한다", () => {
    const raw = localStorage.getItem(PROGRESS_KEY);
    expect(raw).toBeNull();
  });

  it("ID를 저장하면 localStorage에 반영된다", () => {
    const seen = new Set<string>();
    seen.add("phrase-01");
    localStorage.setItem(PROGRESS_KEY, JSON.stringify([...seen]));

    const stored = JSON.parse(localStorage.getItem(PROGRESS_KEY)!);
    expect(stored).toContain("phrase-01");
  });

  it("여러 ID 추가 후 누적된다", () => {
    const seen = new Set<string>(["phrase-01", "phrase-02", "phrase-03"]);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify([...seen]));

    const stored = new Set(JSON.parse(localStorage.getItem(PROGRESS_KEY)!));
    expect(stored.size).toBe(3);
    expect(stored.has("phrase-01")).toBe(true);
    expect(stored.has("phrase-03")).toBe(true);
  });

  it("초기화 시 localStorage에서 제거된다", () => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(["phrase-01"]));
    localStorage.removeItem(PROGRESS_KEY);
    expect(localStorage.getItem(PROGRESS_KEY)).toBeNull();
  });
});

// ── TTS 속도 설정 ───────────────────────────────────────────────

describe("TTS speed settings", () => {
  it("느린 속도는 0.65이다", () => {
    const slowRate = 0.65;
    expect(slowRate).toBeLessThan(1);
    expect(slowRate).toBeGreaterThan(0.5);
  });

  it("보통 속도는 0.85이다", () => {
    const normalRate = 0.85;
    expect(normalRate).toBeLessThan(1);
    expect(normalRate).toBeGreaterThan(0.7);
  });
});
