/**
 * Trip 삭제 기능 — 소스 grep + 구조 검증.
 *
 * 리포지토리 · 액션 · 컴포넌트 · 페이지 소스를 직접 읽어 패턴 준수 확인.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const REPO_SRC = fs.readFileSync(
  path.resolve("lib/repositories/trip.repository.ts"),
  "utf-8",
);
const ACTION_SRC = fs.readFileSync(
  path.resolve("actions/trip.ts"),
  "utf-8",
);
const BUTTON_SRC = fs.readFileSync(
  path.resolve("components/dashboard/TripDeleteButton.tsx"),
  "utf-8",
);
const PAGE_SRC = fs.readFileSync(
  path.resolve("app/trips/[tripId]/page.tsx"),
  "utf-8",
);

/* ════════════════════════════════════════════
 * Repository — softDeleteTrip
 * ════════════════════════════════════════════ */

describe("trip.repository — softDeleteTrip", () => {
  it("softDeleteTrip 함수 export 존재", () => {
    expect(REPO_SRC).toMatch(/export async function softDeleteTrip/);
  });

  it("prisma 미연결 시 null 반환", () => {
    expect(REPO_SRC).toContain("if (!prisma) return null");
  });

  it("deletedAt 설정 (soft-delete)", () => {
    expect(REPO_SRC).toContain("deletedAt: new Date()");
  });

  it("ShareLink revoke (revokedAt 설정)", () => {
    expect(REPO_SRC).toContain("shareLink.updateMany");
    expect(REPO_SRC).toContain("revokedAt:");
  });

  it("트랜잭션 사용", () => {
    // softDeleteTrip 함수 내에서 $transaction 사용
    expect(REPO_SRC).toContain("$transaction");
  });

  it("try/catch 에러 핸들링", () => {
    expect(REPO_SRC).toContain("softDeleteTrip failed");
  });
});

/* ════════════════════════════════════════════
 * Action — deleteTrip
 * ════════════════════════════════════════════ */

describe("actions/trip.ts — deleteTrip", () => {
  it("deleteTrip 함수 export 존재", () => {
    expect(ACTION_SRC).toMatch(/export async function deleteTrip/);
  });

  it("writeAuditLog 호출 — trip.delete 액션 코드", () => {
    expect(ACTION_SRC).toContain('"trip.delete"');
  });

  it("canWriteTrip 권한 검사", () => {
    expect(ACTION_SRC).toContain("canWriteTrip");
  });

  it("isDbConnected 데모 가드", () => {
    expect(ACTION_SRC).toContain("isDbConnected");
  });

  it("DEMO_TRIP_ID 데모 가드", () => {
    expect(ACTION_SRC).toContain("DEMO_TRIP_ID");
  });

  it("softDeleteTrip 호출", () => {
    expect(ACTION_SRC).toContain("softDeleteTrip");
  });

  it("revalidatePath 호출 (/trips)", () => {
    expect(ACTION_SRC).toContain('revalidatePath("/trips")');
  });

  it("forbidden 코드 반환", () => {
    expect(ACTION_SRC).toContain('"forbidden"');
  });

  it("not_found 코드 반환", () => {
    expect(ACTION_SRC).toContain('"not_found"');
  });
});

/* ════════════════════════════════════════════
 * Component — TripDeleteButton
 * ════════════════════════════════════════════ */

describe("TripDeleteButton — 구조", () => {
  it("use client 지시문", () => {
    expect(BUTTON_SRC).toContain('"use client"');
  });

  it("deleteTrip import", () => {
    expect(BUTTON_SRC).toContain("deleteTrip");
  });

  it("useTransition 사용 (낙관적 UX)", () => {
    expect(BUTTON_SRC).toContain("useTransition");
  });

  it("useRouter 사용 (삭제 후 리다이렉트)", () => {
    expect(BUTTON_SRC).toContain("useRouter");
  });

  it("router.replace('/trips') — 삭제 후 리다이렉트", () => {
    expect(BUTTON_SRC).toContain('router.replace("/trips")');
  });
});

describe("TripDeleteButton — 접근성", () => {
  it("role=dialog 모달", () => {
    expect(BUTTON_SRC).toContain('role="dialog"');
  });

  it("aria-modal=true", () => {
    expect(BUTTON_SRC).toContain("aria-modal");
  });

  it("aria-labelledby trip-delete-title", () => {
    expect(BUTTON_SRC).toContain('aria-labelledby="trip-delete-title"');
  });

  it("role=alert 에러 메시지", () => {
    expect(BUTTON_SRC).toContain('role="alert"');
  });
});

describe("TripDeleteButton — UX", () => {
  it("확인 모달 — 목적지 표시", () => {
    expect(BUTTON_SRC).toContain("{destination}");
  });

  it("pending 상태 — '삭제 중…' 표시", () => {
    expect(BUTTON_SRC).toContain("삭제 중…");
  });

  it("취소 버튼 존재", () => {
    expect(BUTTON_SRC).toContain("취소");
  });

  it("에러 메시지 — 권한 없음", () => {
    expect(BUTTON_SRC).toContain("권한이 없습니다");
  });

  it("에러 메시지 — 이미 삭제됨", () => {
    expect(BUTTON_SRC).toContain("이미 삭제되었거나");
  });

  it("pending 중 취소 불가", () => {
    expect(BUTTON_SRC).toContain("if (isPending) return");
  });
});

/* ════════════════════════════════════════════
 * Page — /trips/[tripId] 통합
 * ════════════════════════════════════════════ */

describe("/trips/[tripId]/page.tsx — 삭제 버튼 통합", () => {
  it("TripDeleteButton import", () => {
    expect(PAGE_SRC).toContain("TripDeleteButton");
  });

  it("TripDeleteButton 렌더링 — tripId 전달", () => {
    expect(PAGE_SRC).toContain("tripId={trip.id}");
  });

  it("TripDeleteButton 렌더링 — destination 전달", () => {
    expect(PAGE_SRC).toContain("destination={trip.destination}");
  });
});
