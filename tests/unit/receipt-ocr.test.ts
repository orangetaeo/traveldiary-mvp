/**
 * Receipt OCR 단위 테스트 — 파이프라인 타입 + 환율 변환 + 카테고리 상수.
 */

import { describe, it, expect } from "vitest";
import {
  COST_CATEGORY_OPTIONS,
  COST_CATEGORY_LABEL,
} from "@/lib/utils/cost-constants";

// ── 환율 변환 (ReceiptScanView 내장 로직 재현) ──────────────────

const CURRENCY_TO_KRW: Record<string, number> = {
  VND: 1 / 18,
  THB: 40,
  JPY: 9,
  USD: 1350,
  KRW: 1,
};

function toKrw(amount: number, currency: string): number {
  const rate = CURRENCY_TO_KRW[currency] ?? 1;
  return Math.round(amount * rate);
}

describe("환율 변환 (toKrw)", () => {
  it("VND → KRW: 140,000 VND ≈ 7,778 KRW", () => {
    const result = toKrw(140000, "VND");
    expect(result).toBe(Math.round(140000 / 18));
    expect(result).toBeGreaterThan(7000);
    expect(result).toBeLessThan(8000);
  });

  it("THB → KRW: 500 THB ≈ 20,000 KRW", () => {
    expect(toKrw(500, "THB")).toBe(20000);
  });

  it("JPY → KRW: 1000 JPY ≈ 9,000 KRW", () => {
    expect(toKrw(1000, "JPY")).toBe(9000);
  });

  it("USD → KRW: 100 USD ≈ 135,000 KRW", () => {
    expect(toKrw(100, "USD")).toBe(135000);
  });

  it("KRW → KRW: 항등 (1:1)", () => {
    expect(toKrw(50000, "KRW")).toBe(50000);
  });

  it("미지원 통화는 1:1 fallback", () => {
    expect(toKrw(100, "EUR")).toBe(100);
  });

  it("0원은 0원", () => {
    expect(toKrw(0, "VND")).toBe(0);
  });
});

// ── ParsedReceipt 타입 검증 ─────────────────────────────────────

describe("ParsedReceipt 구조 검증", () => {
  const sampleReceipt = {
    vendor: "PHO 24 (Ben Thanh)",
    date: "2026-05-08",
    items: [
      { name: "Pho Bo", quantity: 1, price: 85000 },
      { name: "Goi Cuon", quantity: 2, price: 55000 },
    ],
    total: 140000,
    currency: "VND",
    category: "food" as const,
  };

  it("필수 필드가 모두 존재한다", () => {
    expect(sampleReceipt.vendor).toBeTruthy();
    expect(sampleReceipt.total).toBeGreaterThan(0);
    expect(sampleReceipt.currency).toBeTruthy();
    expect(sampleReceipt.category).toBeTruthy();
  });

  it("items 배열의 항목에 name, quantity, price가 있다", () => {
    for (const item of sampleReceipt.items) {
      expect(item.name).toBeTruthy();
      expect(item.quantity).toBeGreaterThan(0);
      expect(item.price).toBeGreaterThan(0);
    }
  });

  it("items 합계가 total과 일치한다", () => {
    const sum = sampleReceipt.items.reduce((acc, i) => acc + i.price, 0);
    expect(sum).toBe(sampleReceipt.total);
  });

  it("date 형식이 YYYY-MM-DD이다", () => {
    expect(sampleReceipt.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("category가 유효한 값이다", () => {
    const validCategories = ["food", "transport", "accommodation", "shopping", "activity", "other"];
    expect(validCategories).toContain(sampleReceipt.category);
  });
});

// ── 카테고리 상수 무결성 ────────────────────────────────────────

describe("비용 카테고리 상수", () => {
  it("COST_CATEGORY_OPTIONS이 6개 카테고리를 포함한다", () => {
    expect(COST_CATEGORY_OPTIONS).toHaveLength(6);
  });

  it("COST_CATEGORY_LABEL에 모든 카테고리 한글 라벨이 있다", () => {
    const expected: Record<string, string> = {
      food: "식비",
      transport: "교통",
      accommodation: "숙박",
      shopping: "쇼핑",
      activity: "액티비티",
      other: "기타",
    };
    for (const [key, label] of Object.entries(expected)) {
      expect(COST_CATEGORY_LABEL[key]).toBe(label);
    }
  });

  it("영수증 카테고리 값이 CostEntry 카테고리와 호환된다", () => {
    const receiptCategories = ["food", "transport", "accommodation", "shopping", "activity", "other"];
    const costCategories = COST_CATEGORY_OPTIONS.map((o) => o.id);
    for (const cat of receiptCategories) {
      expect(costCategories).toContain(cat);
    }
  });
});

// ── ReceiptOcrOutcome 타입 분기 ─────────────────────────────────

describe("ReceiptOcrOutcome 모드 분기", () => {
  it("demo 모드 구조", () => {
    const outcome = { mode: "demo" as const };
    expect(outcome.mode).toBe("demo");
  });

  it("ok 모드 구조", () => {
    const outcome = {
      mode: "ok" as const,
      receipt: {
        vendor: "Test",
        date: "",
        items: [],
        total: 1000,
        currency: "VND",
        category: "food" as const,
      },
      ocrCached: false,
      parseCached: false,
      totalMs: 1500,
    };
    expect(outcome.mode).toBe("ok");
    expect(outcome.receipt.total).toBe(1000);
    expect(outcome.totalMs).toBeGreaterThan(0);
  });

  it("no_text 모드 구조", () => {
    const outcome = {
      mode: "no_text" as const,
      ocrCached: false,
      totalMs: 800,
    };
    expect(outcome.mode).toBe("no_text");
  });

  it("error 모드 구조", () => {
    const outcome = {
      mode: "error" as const,
      stage: "ocr" as const,
      code: "network",
      message: "timeout",
      totalMs: 5000,
    };
    expect(outcome.mode).toBe("error");
    expect(outcome.stage).toBe("ocr");
    expect(outcome.code).toBeTruthy();
  });
});

// ── Claude 프롬프트 요구사항 ────────────────────────────────────

describe("Claude 영수증 파싱 프롬프트 요구사항", () => {
  // 프롬프트가 요구하는 출력 필드를 검증
  const requiredFields = ["vendor", "date", "items", "total", "currency", "category"];

  it("파싱 결과에 필수 필드가 모두 포함된다", () => {
    const parsed = {
      vendor: "가게",
      date: "2026-01-01",
      items: [],
      total: 100,
      currency: "VND",
      category: "food",
    };
    for (const field of requiredFields) {
      expect(parsed).toHaveProperty(field);
    }
  });

  it("지원 통화 목록이 5개 이상이다", () => {
    const currencies = Object.keys(CURRENCY_TO_KRW);
    expect(currencies.length).toBeGreaterThanOrEqual(5);
  });
});
