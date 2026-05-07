/**
 * A4 결제 가이드 — /city/[slug]/payment 정적 마크업 + 가이드 invariant.
 *
 * 답습:
 *  - legal-pages-smoke.test.tsx (next/link mock + renderToStaticMarkup)
 *  - phase7-pages-smoke.test.tsx (notFound mock)
 */

import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => <a href={href} {...rest}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("notFound called");
  }),
}));

import CityPaymentPage from "@/app/city/[slug]/payment/page";
import {
  VN_PAYMENT_METHODS,
  VN_EXCHANGE_TIPS,
  EXCHANGE_KRW_SAMPLES,
} from "@/lib/constants/koreanPaymentGuide";

describe("/city/[slug]/payment — 베트남 도시", () => {
  it("푸꾸옥 — 도시명 + 통화 + 환율 노출", () => {
    const html = renderToStaticMarkup(
      <CityPaymentPage params={{ slug: "phu-quoc" }} />,
    );
    expect(html).toContain("푸꾸옥");
    expect(html).toContain("결제 가이드");
    expect(html).toContain("VND");
    expect(html).toContain("₫");
    expect(html).toContain("100");
  });

  it("환전 환산 카드 — KRW 샘플 5개 모두 표시", () => {
    const html = renderToStaticMarkup(
      <CityPaymentPage params={{ slug: "phu-quoc" }} />,
    );
    for (const krw of EXCHANGE_KRW_SAMPLES) {
      expect(html).toContain(krw.toLocaleString() + "원");
    }
  });

  it("결제 수단 4 카드 — 모두 노출 (현금·카드·QR·그룹)", () => {
    const html = renderToStaticMarkup(
      <CityPaymentPage params={{ slug: "phu-quoc" }} />,
    );
    expect(html).toContain('data-payment-method="cash"');
    expect(html).toContain('data-payment-method="card"');
    expect(html).toContain('data-payment-method="qr"');
    expect(html).toContain('data-payment-method="split"');
    expect(html).toContain("현금 (VND)");
    expect(html).toContain("신용/체크카드");
    expect(html).toContain("QR 결제");
    expect(html).toContain("그룹 더치페이");
  });

  it("각 결제 수단 — 추천 상황 + 주의사항 헤더", () => {
    const html = renderToStaticMarkup(
      <CityPaymentPage params={{ slug: "phu-quoc" }} />,
    );
    // 추천 상황 4번 + 주의사항 4번 = 4 카드 × 2
    const bestForCount = (html.match(/추천 상황/g) ?? []).length;
    const cautionCount = (html.match(/주의사항/g) ?? []).length;
    expect(bestForCount).toBe(VN_PAYMENT_METHODS.length);
    expect(cautionCount).toBe(VN_PAYMENT_METHODS.length);
  });

  it("베트남 결제 팁 5건 — 모두 노출", () => {
    const html = renderToStaticMarkup(
      <CityPaymentPage params={{ slug: "phu-quoc" }} />,
    );
    for (const t of VN_EXCHANGE_TIPS) {
      expect(html).toContain(t.title);
    }
    // 핵심 키워드
    expect(html).toContain("위조지폐");
    expect(html).toContain("DCC");
    expect(html).toContain("ATM");
  });

  it("정산 카드 cross-link — 매칭 trip → /trips/[tripId] + destination 컨텍스트", () => {
    const html = renderToStaticMarkup(
      <CityPaymentPage params={{ slug: "phu-quoc" }} />,
    );
    // 옵션 G — 매칭 trip이 있으면 동적 trip 링크
    expect(html).toContain('href="/trips/demo-trip-phu-quoc"');
    expect(html).toContain("푸꾸옥 여행 정산 보기");
    expect(html).toContain('data-trip-aware="true"');
  });

  it("정산 카드 cross-link — 매칭 없으면 /trips 일반 진입 (회귀 fallback)", () => {
    // hoi-an은 베트남 도시지만 listDemoTrips()에 trip 없음 → fallback
    const html = renderToStaticMarkup(
      <CityPaymentPage params={{ slug: "hoi-an" }} />,
    );
    expect(html).toContain('href="/trips"');
    expect(html).toContain("내 여행 정산 보기");
    expect(html).toContain('data-trip-aware="false"');
    // 매칭 trip 없으므로 destination 메시지 변형 미사용
    expect(html).not.toContain("호이안 여행 정산 보기");
  });

  it("뒤로가기 — /city/${slug}", () => {
    const html = renderToStaticMarkup(
      <CityPaymentPage params={{ slug: "phu-quoc" }} />,
    );
    expect(html).toContain('href="/city/phu-quoc"');
  });

  it("ARIA — 4 섹션 모두 aria-labelledby", () => {
    const html = renderToStaticMarkup(
      <CityPaymentPage params={{ slug: "phu-quoc" }} />,
    );
    expect(html).toContain('aria-labelledby="exchange-calc-heading"');
    expect(html).toContain('aria-labelledby="methods-heading"');
    expect(html).toContain('aria-labelledby="tips-heading"');
    expect(html).toContain('aria-labelledby="settlement-heading"');
  });
});

describe("/city/[slug]/payment — 비-베트남 차단", () => {
  it("도쿄(VN 아님) → notFound throw", () => {
    expect(() =>
      renderToStaticMarkup(<CityPaymentPage params={{ slug: "tokyo" }} />),
    ).toThrow("notFound called");
  });

  it("존재하지 않는 도시 → notFound throw", () => {
    expect(() =>
      renderToStaticMarkup(
        <CityPaymentPage params={{ slug: "no-such-city" }} />,
      ),
    ).toThrow("notFound called");
  });
});

describe("/city/[slug]/payment — 베트남 6 도시 모두 정상 렌더", () => {
  const VN_SLUGS = [
    "phu-quoc",
    "ho-chi-minh",
    "hanoi",
    "da-nang",
    "nha-trang",
    "da-lat",
  ];
  it.each(VN_SLUGS)("%s — 결제 가이드 페이지 정상 렌더", (slug) => {
    const html = renderToStaticMarkup(
      <CityPaymentPage params={{ slug }} />,
    );
    expect(html).toContain("결제 가이드");
    expect(html).toContain("결제 수단 비교");
    expect(html).toContain("VND");
  });
});

describe("VN_PAYMENT_METHODS — 데이터 invariant", () => {
  it("정확히 4 수단 (cash·card·qr·split)", () => {
    expect(VN_PAYMENT_METHODS).toHaveLength(4);
    const methods = VN_PAYMENT_METHODS.map((m) => m.method);
    expect(methods).toEqual(["cash", "card", "qr", "split"]);
  });

  it("각 수단 — bestFor ≥2건 + cautions ≥1건", () => {
    for (const m of VN_PAYMENT_METHODS) {
      expect(m.bestFor.length).toBeGreaterThanOrEqual(2);
      expect(m.cautions.length).toBeGreaterThanOrEqual(1);
      expect(m.title.length).toBeGreaterThan(0);
      expect(m.emoji.length).toBeGreaterThan(0);
      expect(m.iconName.length).toBeGreaterThan(0);
    }
  });

  it("toneClass는 4종 디자인 토큰만 (danger/success/purple/amber)", () => {
    const allowed = new Set(["danger", "success", "purple", "amber"]);
    for (const m of VN_PAYMENT_METHODS) {
      expect(allowed.has(m.toneClass)).toBe(true);
    }
  });
});

describe("VN_EXCHANGE_TIPS — 데이터 invariant", () => {
  it("정확히 5 팁", () => {
    expect(VN_EXCHANGE_TIPS).toHaveLength(5);
  });

  it("각 팁 — emoji + title + body 비어있지 않음", () => {
    for (const t of VN_EXCHANGE_TIPS) {
      expect(t.emoji.length).toBeGreaterThan(0);
      expect(t.title.length).toBeGreaterThan(0);
      expect(t.body.length).toBeGreaterThan(20);
    }
  });
});

describe("/city/[slug] page — payment 풀 페이지 cross-link 회귀", () => {
  const SRC = readFileSync(
    resolve(process.cwd(), "app/city/[slug]/page.tsx"),
    "utf-8",
  );

  it('payment 섹션에 "/city/${city.slug}/payment" 링크 + "전체 결제 가이드" 카피', () => {
    expect(SRC).toContain("/city/${city.slug}/payment");
    expect(SRC).toContain("전체 결제 가이드");
  });
});

describe("CityContextStrip 환전 카드 — payment 풀 페이지 진입 (회귀)", () => {
  const SRC = readFileSync(
    resolve(process.cwd(), "components/city/CityContextStrip.tsx"),
    "utf-8",
  );

  it("환전 카드 href = /city/${city.slug}/payment (anchor 미사용)", () => {
    expect(SRC).toContain("/city/${city.slug}/payment");
    expect(SRC).not.toContain("/city/${city.slug}#payment");
  });
});
