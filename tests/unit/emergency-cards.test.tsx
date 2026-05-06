/**
 * EmergencyCards 컴포넌트 단위 테스트.
 * PR #141 — 응급 페이지에서 추출된 ContactCard + LossGuideCard.
 *
 * 위치: components/city/EmergencyCards.tsx
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ContactCard,
  LossGuideCard,
  EMERGENCY_CATEGORY_LABEL,
  EMERGENCY_CATEGORY_ICON,
} from "@/components/city/EmergencyCards";
import type { EmergencyContact } from "@/lib/types";
import type { LossGuide } from "@/lib/constants/koreanLossContacts";

describe("EMERGENCY_CATEGORY_LABEL / ICON", () => {
  it("주요 카테고리 라벨 매핑 정합", () => {
    expect(EMERGENCY_CATEGORY_LABEL.embassy).toBe("영사관");
    expect(EMERGENCY_CATEGORY_LABEL.police).toBe("경찰");
    expect(EMERGENCY_CATEGORY_LABEL.ambulance).toBe("병원·응급");
  });

  it("주요 카테고리 아이콘 매핑 정합 (Material Symbols)", () => {
    expect(EMERGENCY_CATEGORY_ICON.embassy).toBe("account_balance");
    expect(EMERGENCY_CATEGORY_ICON.police).toBe("local_police");
    expect(EMERGENCY_CATEGORY_ICON.ambulance).toBe("local_hospital");
  });
});

describe("ContactCard", () => {
  const baseContact: EmergencyContact = {
    label: "주 호치민 영사관",
    phone: "+84 28 3822 5757",
    category: "embassy",
    hours: "평일 08:30~17:00",
    notes: "한국어 가능",
  };

  it("label / phone / hours / notes 모두 표시", () => {
    const html = renderToStaticMarkup(<ContactCard contact={baseContact} />);
    expect(html).toContain("주 호치민 영사관");
    expect(html).toContain("+84 28 3822 5757");
    expect(html).toContain("평일 08:30~17:00");
    expect(html).toContain("한국어 가능");
  });

  it("category에 맞는 아이콘 + aria-label 사용", () => {
    const html = renderToStaticMarkup(<ContactCard contact={baseContact} />);
    expect(html).toContain("account_balance");
    expect(html).toContain('aria-label="영사관 전화"');
  });

  it("phone 있으면 tel: 링크 (공백 제거)", () => {
    const html = renderToStaticMarkup(<ContactCard contact={baseContact} />);
    expect(html).toContain('href="tel:+842838225757"');
  });

  it("phone 없으면 tel: 링크 미렌더", () => {
    const noPhone: EmergencyContact = {
      label: "URL only",
      phone: "",
      category: "card_lost",
    };
    const html = renderToStaticMarkup(<ContactCard contact={noPhone} />);
    expect(html).not.toContain("tel:");
    expect(html).toContain("URL only");
  });

  it("category 미매핑 → '연락처' fallback 라벨 + phone icon", () => {
    const unknown: EmergencyContact = {
      label: "기타",
      phone: "1234",
      category: "fire",
    };
    const html = renderToStaticMarkup(<ContactCard contact={unknown} />);
    // EMERGENCY_CATEGORY_LABEL에 fire 없음 → '연락처' fallback
    expect(html).toContain('aria-label="연락처 전화"');
  });
});

describe("LossGuideCard", () => {
  const guide: LossGuide = {
    category: "passport",
    title: "여권 분실",
    emoji: "📕",
    steps: [
      "1. 가까운 경찰서에서 분실신고",
      "2. 영사관에서 여권 재발급",
      "3. 재출국 전 비자 재신청",
    ],
    contacts: [
      {
        label: "외교부 영사 콜센터",
        phone: "+82 2 3210 0404",
        notes: "24시간",
      },
      {
        label: "외교부 해외안전여행",
        url: "https://www.0404.go.kr",
      },
    ],
    preparation: "출국 전 여권 사본 휴대",
  };

  it("title / emoji / 모든 step 노출", () => {
    const html = renderToStaticMarkup(<LossGuideCard guide={guide} />);
    expect(html).toContain("여권 분실");
    expect(html).toContain("📕");
    expect(html).toContain("1. 가까운 경찰서에서 분실신고");
    expect(html).toContain("3. 재출국 전 비자 재신청");
  });

  it("contact.phone → tel: 링크 (공백 제거)", () => {
    const html = renderToStaticMarkup(<LossGuideCard guide={guide} />);
    expect(html).toContain('href="tel:+82232100404"');
    expect(html).toContain("+82 2 3210 0404");
  });

  it("contact.url → 외부 링크 + noopener 보안", () => {
    const html = renderToStaticMarkup(<LossGuideCard guide={guide} />);
    expect(html).toContain('href="https://www.0404.go.kr"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
  });

  it("contact.notes 표시", () => {
    const html = renderToStaticMarkup(<LossGuideCard guide={guide} />);
    expect(html).toContain("24시간");
  });

  it("contacts=[] → '연락·자료' 섹션 미렌더", () => {
    const html = renderToStaticMarkup(
      <LossGuideCard guide={{ ...guide, contacts: [] }} />,
    );
    expect(html).not.toContain("연락·자료");
    expect(html).toContain("여권 분실"); // header는 그대로
  });

  it("steps는 ordered list (ol)", () => {
    const html = renderToStaticMarkup(<LossGuideCard guide={guide} />);
    expect(html).toContain("<ol");
  });
});
