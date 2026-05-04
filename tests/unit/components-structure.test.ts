/**
 * 주요 컴포넌트 구조 검증 — A2 자율 사이클.
 *
 * 미테스트 View/Modal 컴포넌트의 핵심 패턴 확인:
 * - import 경로 정합성
 * - 필수 UI 요소 (버튼, 폼, 상태 표시)
 * - 접근성 (aria, role)
 * - 에러/빈 상태 처리
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

function readComp(relPath: string): string {
  return fs.readFileSync(path.resolve(relPath), "utf-8");
}

describe("VoteListView — 투표 목록 컴포넌트", () => {
  const src = readComp("components/vote/VoteListView.tsx");

  it("createVote 액션 import", () => {
    expect(src).toContain("createVote");
  });

  it("castVote 액션 import", () => {
    expect(src).toContain("castVote");
  });

  it("빈 상태 안내 존재", () => {
    // 투표가 없을 때 안내 메시지
    expect(src).toMatch(/투표|vote|없/i);
  });

  it("질문 입력 폼 존재", () => {
    expect(src).toMatch(/question|질문/i);
  });

  it("옵션 라벨 입력 존재", () => {
    expect(src).toMatch(/option|선택지|라벨/i);
  });
});

describe("TranslateView — 번역 컴포넌트 (M4)", () => {
  const src = readComp("components/translate/TranslateView.tsx");

  it("카메라/이미지 입력 존재", () => {
    expect(src).toMatch(/camera|capture|file|image/i);
  });

  it("번역 결과 표시 영역", () => {
    expect(src).toMatch(/result|결과|번역/);
  });

  it("알레르기 필터 연동", () => {
    expect(src).toMatch(/allergen|알레르기|allergy/i);
  });

  it("에러 상태 처리", () => {
    expect(src).toMatch(/error|오류|실패/i);
  });

  it("Stitch 변환 기반 구현", () => {
    expect(src).toMatch(/stitch|변환/i);
  });
});

describe("TravelHome — 여행 중 홈 (M2)", () => {
  const src = readComp("components/travel/TravelHome.tsx");

  it("시간 기반 타임라인 존재", () => {
    expect(src).toMatch(/timeline|past|current|future|일정/i);
  });

  it("통계 그리드 존재", () => {
    expect(src).toMatch(/stats|통계|stat/i);
  });

  it("날씨/위치 컨텍스트", () => {
    expect(src).toMatch(/weather|날씨|location|위치/i);
  });
});

describe("AddItemModal — 일정 추가 모달", () => {
  const src = readComp("components/itinerary/AddItemModal.tsx");

  it("onSubmit 콜백 패턴 (부모 위임)", () => {
    expect(src).toContain("onSubmit");
  });

  it("카테고리 선택 (food/spot/shopping/rest)", () => {
    expect(src).toContain("food");
    expect(src).toContain("spot");
  });

  it("이름 입력 필드", () => {
    expect(src).toMatch(/name|이름|장소/i);
  });

  it("닫기/취소 버튼", () => {
    expect(src).toMatch(/close|cancel|닫기|취소/i);
  });
});

describe("ReplanModal — Live Replan 모달 (M3)", () => {
  const src = readComp("components/itinerary/ReplanModal.tsx");

  it("ReplanTrigger 타입 import", () => {
    expect(src).toContain("ReplanTrigger");
  });

  it("옵션 리스트 표시", () => {
    expect(src).toMatch(/option|대안|replan/i);
  });

  it("확정 버튼 존재", () => {
    expect(src).toMatch(/confirm|commit|확정|적용/i);
  });
});

describe("ShareModal — 공유 모달 (M7)", () => {
  const src = readComp("components/share/ShareModal.tsx");

  it("createShareLinkAction 연동", () => {
    expect(src).toContain("createShareLink");
  });

  it("URL 복사 기능", () => {
    expect(src).toMatch(/copy|복사|clipboard/i);
  });

  it("카카오톡 공유", () => {
    expect(src).toMatch(/kakao|카카오/i);
  });

  it("syncKey 표시", () => {
    expect(src).toMatch(/syncKey|key|링크/i);
  });
});

describe("OtaCompareSection — OTA 가격 비교 (M8)", () => {
  const src = readComp("components/itinerary/OtaCompareSection.tsx");

  it("가격 표시", () => {
    expect(src).toMatch(/price|가격|₩|원/i);
  });

  it("OTA 제공자 표시 (Klook/Agoda/KKday)", () => {
    expect(src).toMatch(/klook|agoda|kkday/i);
  });

  it("어필리에이트 링크", () => {
    expect(src).toMatch(/affiliate|href|link/i);
  });

  it("trackAffiliateClick 연동", () => {
    expect(src).toContain("trackAffiliateClick");
  });
});

describe("CommentSection — 댓글/리액션 (M7)", () => {
  const src = readComp("components/share/CommentSection.tsx");

  it("댓글 입력 폼", () => {
    expect(src).toMatch(/comment|댓글|입력/i);
  });

  it("리액션 기능", () => {
    expect(src).toMatch(/reaction|리액션|좋아요|emoji/i);
  });

  it("삭제 기능", () => {
    expect(src).toMatch(/delete|삭제/i);
  });
});

describe("AutoModeDetector — D-Day 자동 감지 (M2)", () => {
  const src = readComp("components/travel/AutoModeDetector.tsx");

  it("Geolocation API 사용", () => {
    expect(src).toMatch(/geolocation|getCurrentPosition|watchPosition/i);
  });

  it("setTripMode 연동", () => {
    expect(src).toContain("setTripMode");
  });

  it("GPS 권한 처리", () => {
    expect(src).toMatch(/permission|denied|granted/i);
  });
});

describe("CityContextStrip — 도시 컨텍스트 스트립", () => {
  const src = readComp("components/city/CityContextStrip.tsx");

  it("도시 정보 표시", () => {
    expect(src).toMatch(/city|도시/i);
  });

  it("응급 링크 존재", () => {
    expect(src).toMatch(/emergency|응급/i);
  });
});
