/**
 * 설정·상수 파일 구조 검증 테스트.
 *
 * 대상:
 *  - next.config.js — 보안 헤더 5종 (S-11 §5)
 *  - tailwind.config.ts — 디자인 토큰 무결성
 *  - lib/constants/countries.ts — 3개국 데이터 + getCountry/listCountries
 *  - lib/constants/koreanLossContacts.ts — 4 카테고리 분실 가이드 + getLossGuide
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

// ─── next.config.js (CommonJS → fs 파싱) ──────────────────────

const nextConfigSrc = fs.readFileSync(
  path.resolve("next.config.js"),
  "utf-8",
);

// ─── tailwind.config.ts (fs 파싱) ─────────────────────────────

const tailwindSrc = fs.readFileSync(
  path.resolve("tailwind.config.ts"),
  "utf-8",
);

// ─── countries.ts (ESM import) ────────────────────────────────

import {
  GLOBAL_EMERGENCY_CONTACTS,
  COUNTRIES,
  getCountry,
  listCountries,
} from "@/lib/constants/countries";

// ─── koreanLossContacts.ts (ESM import) ───────────────────────

import {
  KOREAN_LOSS_GUIDES,
  getLossGuide,
} from "@/lib/constants/koreanLossContacts";
import type { LossCategory } from "@/lib/constants/koreanLossContacts";

/* ════════════════════════════════════════════
 * next.config.js — 보안 헤더
 * ════════════════════════════════════════════ */

describe("next.config.js — 보안 헤더", () => {
  it("Strict-Transport-Security 존재 + max-age ≥ 1년", () => {
    expect(nextConfigSrc).toContain("Strict-Transport-Security");
    const match = nextConfigSrc.match(/max-age=(\d+)/);
    expect(match).not.toBeNull();
    const maxAge = Number(match![1]);
    expect(maxAge).toBeGreaterThanOrEqual(31536000); // 365일
  });

  it("HSTS includeSubDomains + preload", () => {
    expect(nextConfigSrc).toContain("includeSubDomains");
    expect(nextConfigSrc).toContain("preload");
  });

  it("X-Frame-Options DENY (클릭재킹 방어)", () => {
    expect(nextConfigSrc).toContain("X-Frame-Options");
    expect(nextConfigSrc).toContain("DENY");
  });

  it("X-Content-Type-Options nosniff (MIME 스니핑 방어)", () => {
    expect(nextConfigSrc).toContain("X-Content-Type-Options");
    expect(nextConfigSrc).toContain("nosniff");
  });

  it("Referrer-Policy strict-origin-when-cross-origin", () => {
    expect(nextConfigSrc).toContain("Referrer-Policy");
    expect(nextConfigSrc).toContain("strict-origin-when-cross-origin");
  });

  it("Permissions-Policy — camera/geolocation self, microphone 차단", () => {
    expect(nextConfigSrc).toContain("Permissions-Policy");
    expect(nextConfigSrc).toContain("camera=(self)");
    expect(nextConfigSrc).toContain("geolocation=(self)");
    expect(nextConfigSrc).toContain("microphone=()");
  });

  it("reactStrictMode: true", () => {
    expect(nextConfigSrc).toContain("reactStrictMode: true");
  });

  it("모든 경로에 헤더 적용 (/:path*)", () => {
    expect(nextConfigSrc).toContain("/:path*");
  });

  it("보안 헤더 6종 모두 존재", () => {
    const requiredHeaders = [
      "Strict-Transport-Security",
      "X-Frame-Options",
      "X-Content-Type-Options",
      "Referrer-Policy",
      "Permissions-Policy",
      "Content-Security-Policy",
    ];
    for (const header of requiredHeaders) {
      expect(nextConfigSrc, `${header} 누락`).toContain(header);
    }
  });

  it("CSP — default-src 'self'", () => {
    expect(nextConfigSrc).toContain("default-src 'self'");
  });

  it("CSP — frame-ancestors 'none' (X-Frame-Options 보완)", () => {
    expect(nextConfigSrc).toContain("frame-ancestors 'none'");
  });

  it("CSP — img-src 허용 출처 (self + data + blob + picsum + Google Maps)", () => {
    expect(nextConfigSrc).toContain("img-src");
    expect(nextConfigSrc).toContain("data:");
    expect(nextConfigSrc).toContain("blob:");
    expect(nextConfigSrc).toContain("picsum.photos");
    expect(nextConfigSrc).toContain("maps.googleapis.com");
  });

  it("CSP — frame-src Google Maps embed만 허용", () => {
    expect(nextConfigSrc).toContain("frame-src");
    expect(nextConfigSrc).toContain("www.google.com");
  });

  it("CSP — form-action + base-uri self 제한", () => {
    expect(nextConfigSrc).toContain("form-action 'self'");
    expect(nextConfigSrc).toContain("base-uri 'self'");
  });
});

/* ════════════════════════════════════════════
 * next.config.js — CDN 캐시 헤더
 * ════════════════════════════════════════════ */

describe("next.config.js — CDN 캐시 헤더", () => {
  it("_next/static 에셋에 immutable 장기 캐시 적용", () => {
    expect(nextConfigSrc).toContain("/_next/static/:path*");
    expect(nextConfigSrc).toContain("immutable");
  });

  it("OG 이미지 경로에 s-maxage + stale-while-revalidate 적용", () => {
    expect(nextConfigSrc).toContain("/api/og/:path*");
    expect(nextConfigSrc).toContain("s-maxage=86400");
    expect(nextConfigSrc).toContain("stale-while-revalidate");
  });

  it("share 페이지에 짧은 CDN 캐시 + stale-while-revalidate 적용", () => {
    expect(nextConfigSrc).toContain("/share/:path*");
    expect(nextConfigSrc).toContain("s-maxage=300");
  });

  it("cacheRules 배열이 headers() 반환에 포함", () => {
    expect(nextConfigSrc).toContain("...cacheRules");
  });
});

/* ════════════════════════════════════════════
 * tailwind.config.ts — 디자인 토큰
 * ════════════════════════════════════════════ */

describe("tailwind.config.ts — 컬러 시스템", () => {
  it("6색 + surface 컬러 그룹 존재", () => {
    const groups = ["ink", "accent", "purple", "amber", "success", "danger", "surface"];
    for (const group of groups) {
      expect(tailwindSrc, `${group} 컬러 그룹 누락`).toContain(`${group}:`);
    }
  });

  it("DEFAULT + soft + deep 3단 구조 (ink 제외 6색)", () => {
    const colorGroups = ["accent", "purple", "amber", "success", "danger"];
    for (const _group of colorGroups) {
      // 각 group 블록 안에 DEFAULT, soft, deep 포함
      expect(tailwindSrc).toContain("DEFAULT:");
      expect(tailwindSrc).toContain("soft:");
      expect(tailwindSrc).toContain("deep:");
    }
  });

  it("hex 형식 (#RRGGBB) 6자리", () => {
    const hexMatches = tailwindSrc.match(/#[0-9A-Fa-f]{6}/g);
    expect(hexMatches).not.toBeNull();
    expect(hexMatches!.length).toBeGreaterThanOrEqual(15); // 최소 15개 색상
    // 모든 hex가 6자리인지 확인
    for (const hex of hexMatches!) {
      expect(hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("divider 색상 존재", () => {
    expect(tailwindSrc).toContain("divider:");
  });
});

describe("tailwind.config.ts — 타이포그래피", () => {
  it("5단 타이포 스케일 존재", () => {
    const scales = ["td-title", "td-card-title", "td-body", "td-meta", "td-caption"];
    for (const scale of scales) {
      expect(tailwindSrc, `${scale} 누락`).toContain(`"${scale}"`);
    }
  });

  it("타이포 크기 내림차순 (title 22 > caption 11)", () => {
    const sizeMap: Record<string, number> = {};
    const regex = /"td-(\w[\w-]*)"\s*:\s*\["(\d+)px"/g;
    let match;
    while ((match = regex.exec(tailwindSrc)) !== null) {
      sizeMap[match[1]] = Number(match[2]);
    }
    expect(sizeMap["title"]).toBe(22);
    expect(sizeMap["card-title"]).toBe(18);
    expect(sizeMap["body"]).toBe(14);
    expect(sizeMap["meta"]).toBe(12);
    expect(sizeMap["caption"]).toBe(11);
    // 내림차순
    expect(sizeMap["title"]).toBeGreaterThan(sizeMap["card-title"]);
    expect(sizeMap["card-title"]).toBeGreaterThan(sizeMap["body"]);
    expect(sizeMap["body"]).toBeGreaterThan(sizeMap["meta"]);
    expect(sizeMap["meta"]).toBeGreaterThan(sizeMap["caption"]);
  });

  it("모든 fontSize에 lineHeight 존재", () => {
    const scales = ["td-title", "td-card-title", "td-body", "td-meta", "td-caption"];
    for (const _scale of scales) {
      // 각 scale 뒤에 lineHeight가 나와야 함
      expect(tailwindSrc).toContain("lineHeight:");
    }
  });
});

describe("tailwind.config.ts — 스페이싱", () => {
  it("5단 스페이싱 존재", () => {
    const spacings = ["td-xxs", "td-xs", "td-sm", "td-md", "td-lg"];
    for (const sp of spacings) {
      expect(tailwindSrc, `${sp} 누락`).toContain(`"${sp}"`);
    }
  });

  it("스페이싱 값 오름차순 (4 < 8 < 12 < 16 < 24)", () => {
    const expected = [
      { name: "td-xxs", px: 4 },
      { name: "td-xs", px: 8 },
      { name: "td-sm", px: 12 },
      { name: "td-md", px: 16 },
      { name: "td-lg", px: 24 },
    ];
    for (const { name, px } of expected) {
      // 정렬 공백이 있을 수 있으므로 regex 사용
      expect(tailwindSrc).toMatch(new RegExp(`"${name}":\\s+"${px}px"`));
    }
    // 오름차순 검증
    for (let i = 1; i < expected.length; i++) {
      expect(expected[i].px).toBeGreaterThan(expected[i - 1].px);
    }
  });
});

describe("tailwind.config.ts — 기타", () => {
  it("Pretendard 폰트 최우선", () => {
    expect(tailwindSrc).toContain("Pretendard");
    // Pretendard가 sans 배열 첫 번째
    const fontMatch = tailwindSrc.match(/sans:\s*\["([^"]+)"/);
    expect(fontMatch).not.toBeNull();
    expect(fontMatch![1]).toBe("Pretendard");
  });

  it("borderRadius sm < md < lg", () => {
    const smMatch = tailwindSrc.match(/sm:\s*"(\d+)px"/);
    const mdMatch = tailwindSrc.match(/md:\s*"(\d+)px"/);
    const lgMatch = tailwindSrc.match(/lg:\s*"(\d+)px"/);
    expect(smMatch).not.toBeNull();
    expect(mdMatch).not.toBeNull();
    expect(lgMatch).not.toBeNull();
    expect(Number(smMatch![1])).toBeLessThan(Number(mdMatch![1]));
    expect(Number(mdMatch![1])).toBeLessThan(Number(lgMatch![1]));
  });

  it("content 경로 — app + components", () => {
    expect(tailwindSrc).toContain("./app/**");
    expect(tailwindSrc).toContain("./components/**");
  });
});

/* ════════════════════════════════════════════
 * lib/constants/countries.ts
 * ════════════════════════════════════════════ */

describe("GLOBAL_EMERGENCY_CONTACTS", () => {
  it("2건 존재 (영사 콜센터 + 카드사 통합)", () => {
    expect(GLOBAL_EMERGENCY_CONTACTS).toHaveLength(2);
  });

  it("모두 label + phone 존재", () => {
    for (const c of GLOBAL_EMERGENCY_CONTACTS) {
      expect(c.label.length).toBeGreaterThan(0);
      expect(c.phone!.length).toBeGreaterThan(0);
    }
  });

  it("영사 콜센터 — +82-2-3210-0404", () => {
    const consulate = GLOBAL_EMERGENCY_CONTACTS.find((c) =>
      c.label.includes("영사"),
    );
    expect(consulate).toBeDefined();
    expect(consulate!.phone).toContain("0404");
  });

  it("카드사 통합 — 1577-0000", () => {
    const card = GLOBAL_EMERGENCY_CONTACTS.find((c) =>
      c.label.includes("카드"),
    );
    expect(card).toBeDefined();
    expect(card!.phone).toContain("1577-0000");
  });
});

describe("COUNTRIES — 3개국 공통 구조", () => {
  const codes = ["VN", "TH", "JP"] as const;

  it("3개국 등록", () => {
    expect(Object.keys(COUNTRIES)).toHaveLength(3);
    for (const code of codes) {
      expect(COUNTRIES[code]).toBeDefined();
    }
  });

  it.each(codes.map((c) => [c]))("%s — code 일치", (code) => {
    expect(COUNTRIES[code].code).toBe(code);
  });

  it.each(codes.map((c) => [c]))("%s — name 비어있지 않음", (code) => {
    expect(COUNTRIES[code].name.length).toBeGreaterThan(0);
  });

  it.each(codes.map((c) => [c]))("%s — defaultPhrases ≥ 5", (code) => {
    expect(COUNTRIES[code].defaultPhrases.length).toBeGreaterThanOrEqual(5);
  });

  it.each(codes.map((c) => [c]))(
    "%s — phrases에 greeting + thanks 존재",
    (code) => {
      const situations = COUNTRIES[code].defaultPhrases.map(
        (p) => p.situation,
      );
      expect(situations).toContain("greeting");
      expect(situations).toContain("thanks");
    },
  );

  it.each(codes.map((c) => [c]))(
    "%s — phrases 모두 korean + local + pronunciation 존재",
    (code) => {
      for (const phrase of COUNTRIES[code].defaultPhrases) {
        expect(phrase.korean.length).toBeGreaterThan(0);
        expect(phrase.local.length).toBeGreaterThan(0);
        expect(phrase.pronunciation!.length).toBeGreaterThan(0);
      }
    },
  );
});

describe("COUNTRIES — paymentDefaults", () => {
  it("VN — VND ₫", () => {
    const { currency, currencySymbol, approxKrwRate } =
      COUNTRIES.VN.paymentDefaults;
    expect(currency).toBe("VND");
    expect(currencySymbol).toBe("₫");
    expect(approxKrwRate).toBeGreaterThan(0);
  });

  it("TH — THB ฿", () => {
    const { currency, currencySymbol, approxKrwRate } =
      COUNTRIES.TH.paymentDefaults;
    expect(currency).toBe("THB");
    expect(currencySymbol).toBe("฿");
    expect(approxKrwRate).toBeGreaterThan(0);
  });

  it("JP — JPY ¥", () => {
    const { currency, currencySymbol, approxKrwRate } =
      COUNTRIES.JP.paymentDefaults;
    expect(currency).toBe("JPY");
    expect(currencySymbol).toBe("¥");
    expect(approxKrwRate).toBeGreaterThan(0);
  });

  it("통화 코드 3자리 ISO", () => {
    for (const code of ["VN", "TH", "JP"]) {
      expect(COUNTRIES[code].paymentDefaults.currency).toMatch(/^[A-Z]{3}$/);
    }
  });
});

describe("COUNTRIES — utilities", () => {
  it.each(["VN", "TH", "JP"].map((c) => [c]))(
    "%s — voltage + plugType + simAvailable",
    (code) => {
      const { voltage, plugType, simAvailable } = COUNTRIES[code].utilities;
      expect(voltage).toMatch(/^\d{3}V$/); // 100V, 220V 등
      expect(plugType.length).toBeGreaterThan(0);
      expect(typeof simAvailable).toBe("boolean");
    },
  );

  it("JP 100V vs VN/TH 220V", () => {
    expect(COUNTRIES.JP.utilities.voltage).toBe("100V");
    expect(COUNTRIES.VN.utilities.voltage).toBe("220V");
    expect(COUNTRIES.TH.utilities.voltage).toBe("220V");
  });
});

describe("COUNTRIES — visa", () => {
  it.each(["VN", "TH", "JP"].map((c) => [c]))(
    "%s — visaFreeDays 양수 + notes 존재",
    (code) => {
      const { visaFreeDays, notes } = COUNTRIES[code].visa;
      expect(visaFreeDays).toBeGreaterThan(0);
      expect(notes!.length).toBeGreaterThan(0);
    },
  );

  it("VN 45일, TH 90일, JP 90일", () => {
    expect(COUNTRIES.VN.visa.visaFreeDays).toBe(45);
    expect(COUNTRIES.TH.visa.visaFreeDays).toBe(90);
    expect(COUNTRIES.JP.visa.visaFreeDays).toBe(90);
  });
});

describe("COUNTRIES — countryEmergencyContacts", () => {
  it.each(["VN", "TH", "JP"].map((c) => [c]))(
    "%s — 경찰 + 응급 의료 최소 2건",
    (code) => {
      const contacts = COUNTRIES[code].countryEmergencyContacts;
      expect(contacts.length).toBeGreaterThanOrEqual(2);
      const categories = contacts.map((c) => c.category);
      expect(categories).toContain("police");
      expect(categories).toContain("ambulance");
    },
  );

  it.each(["VN", "TH", "JP"].map((c) => [c]))(
    "%s — 모든 응급 연락처에 phone 존재",
    (code) => {
      for (const contact of COUNTRIES[code].countryEmergencyContacts) {
        expect(contact.phone.length).toBeGreaterThan(0);
      }
    },
  );
});

describe("getCountry / listCountries", () => {
  it("getCountry('VN') → 베트남", () => {
    const vn = getCountry("VN");
    expect(vn).not.toBeNull();
    expect(vn!.name).toBe("베트남");
  });

  it("getCountry('XX') → null", () => {
    expect(getCountry("XX")).toBeNull();
  });

  it("getCountry 빈 문자열 → null", () => {
    expect(getCountry("")).toBeNull();
  });

  it("listCountries → 3개국", () => {
    const all = listCountries();
    expect(all).toHaveLength(3);
    const codes = all.map((c) => c.code).sort();
    expect(codes).toEqual(["JP", "TH", "VN"]);
  });
});

/* ════════════════════════════════════════════
 * lib/constants/koreanLossContacts.ts
 * ════════════════════════════════════════════ */

describe("KOREAN_LOSS_GUIDES — 4 카테고리", () => {
  it("4건 존재", () => {
    expect(KOREAN_LOSS_GUIDES).toHaveLength(4);
  });

  it("카테고리 4종 커버", () => {
    const categories = KOREAN_LOSS_GUIDES.map((g) => g.category).sort();
    expect(categories).toEqual(["card", "passport", "phone", "theft"]);
  });

  it("모든 가이드에 title + emoji 존재", () => {
    for (const guide of KOREAN_LOSS_GUIDES) {
      expect(guide.title.length).toBeGreaterThan(0);
      expect(guide.emoji.length).toBeGreaterThan(0);
    }
  });

  it("모든 가이드에 steps ≥ 3", () => {
    for (const guide of KOREAN_LOSS_GUIDES) {
      expect(
        guide.steps.length,
        `${guide.category} steps ${guide.steps.length} < 3`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it("모든 가이드에 contacts ≥ 1", () => {
    for (const guide of KOREAN_LOSS_GUIDES) {
      expect(
        guide.contacts.length,
        `${guide.category} contacts 비어있음`,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it("모든 contacts에 label 존재", () => {
    for (const guide of KOREAN_LOSS_GUIDES) {
      for (const contact of guide.contacts) {
        expect(contact.label.length).toBeGreaterThan(0);
      }
    }
  });

  it("steps 번호 1부터 순서대로", () => {
    for (const guide of KOREAN_LOSS_GUIDES) {
      for (let i = 0; i < guide.steps.length; i++) {
        expect(guide.steps[i]).toMatch(new RegExp(`^${i + 1}\\.`));
      }
    }
  });
});

describe("KOREAN_LOSS_GUIDES — 개별 카테고리", () => {
  it("passport — 영사 콜센터 + 0404.go.kr", () => {
    const guide = KOREAN_LOSS_GUIDES.find((g) => g.category === "passport")!;
    expect(guide.emoji).toBe("📕");
    const phones = guide.contacts.map((c) => c.phone).filter(Boolean);
    expect(phones.some((p) => p!.includes("0404"))).toBe(true);
    const urls = guide.contacts.map((c) => c.url).filter(Boolean);
    expect(urls.some((u) => u!.includes("0404.go.kr"))).toBe(true);
  });

  it("passport — preparation 존재", () => {
    const guide = KOREAN_LOSS_GUIDES.find((g) => g.category === "passport")!;
    expect(guide.preparation).toBeDefined();
    expect(guide.preparation!.length).toBeGreaterThan(0);
  });

  it("card — 1577-0000 통합 분실신고", () => {
    const guide = KOREAN_LOSS_GUIDES.find((g) => g.category === "card")!;
    expect(guide.emoji).toBe("💳");
    const phones = guide.contacts.map((c) => c.phone).filter(Boolean);
    expect(phones.some((p) => p!.includes("1577-0000"))).toBe(true);
  });

  it("phone — Find My / Google 링크", () => {
    const guide = KOREAN_LOSS_GUIDES.find((g) => g.category === "phone")!;
    expect(guide.emoji).toBe("📱");
    const urls = guide.contacts.map((c) => c.url).filter(Boolean);
    expect(urls.length).toBeGreaterThanOrEqual(1);
  });

  it("theft — 5단계 (가장 긴 절차)", () => {
    const guide = KOREAN_LOSS_GUIDES.find((g) => g.category === "theft")!;
    expect(guide.emoji).toBe("🚨");
    expect(guide.steps.length).toBe(5);
  });

  it("theft — 영사 콜센터 포함", () => {
    const guide = KOREAN_LOSS_GUIDES.find((g) => g.category === "theft")!;
    const phones = guide.contacts.map((c) => c.phone).filter(Boolean);
    expect(phones.some((p) => p!.includes("0404"))).toBe(true);
  });
});

describe("getLossGuide", () => {
  it("passport → 여권 분실", () => {
    const guide = getLossGuide("passport");
    expect(guide).toBeDefined();
    expect(guide!.title).toContain("여권");
  });

  it("card → 카드 분실", () => {
    const guide = getLossGuide("card");
    expect(guide).toBeDefined();
    expect(guide!.title).toContain("카드");
  });

  it("phone → 휴대폰 분실", () => {
    const guide = getLossGuide("phone");
    expect(guide).toBeDefined();
    expect(guide!.title).toContain("휴대폰");
  });

  it("theft → 도난·강도", () => {
    const guide = getLossGuide("theft");
    expect(guide).toBeDefined();
    expect(guide!.title).toContain("도난");
  });

  it("존재하지 않는 카테고리 → undefined", () => {
    const guide = getLossGuide("unknown" as LossCategory);
    expect(guide).toBeUndefined();
  });
});
