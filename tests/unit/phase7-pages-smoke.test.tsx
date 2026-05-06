/**
 * Phase 7 신규 페이지 렌더 스모크 테스트.
 *
 * /settings, /booking/[bookingId], /permission/location, /permission/notification.
 * renderToStaticMarkup 정적 마크업 검증 (testing-library 미도입 정책).
 *
 * 인터랙션 핸들러(navigator.geolocation, Notification.requestPermission)는
 * 클릭 시에만 호출되므로 초기 렌더에는 추가 mock 불필요.
 */

import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// ─── Mocks ────────────────────────────────────────────────

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
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  notFound: vi.fn(() => {
    throw new Error("notFound called");
  }),
}));

// ─── Imports ──────────────────────────────────────────────

import SettingsPage from "@/app/settings/page";
import BookingConfirmationPage from "@/app/booking/[bookingId]/page";
import LocationPermissionPage from "@/app/permission/location/page";
import NotificationPermissionPage from "@/app/permission/notification/page";
import CameraPermissionPage from "@/app/permission/camera/page";

// ─── Tests ────────────────────────────────────────────────

describe("Phase 7 페이지 렌더 스모크", () => {
  describe("/settings", () => {
    it("정적 마크업 생성 + 5개 섹션 헤더 노출", () => {
      const html = renderToStaticMarkup(<SettingsPage />);
      expect(html).toContain("설정");
      expect(html).toContain("계정");
      expect(html).toContain("알림");
      expect(html).toContain("위치 &amp; 프라이버시");
      expect(html).toContain("데이터");
      expect(html).toContain("앱 정보");
    });

    it("주요 링크 href 노출", () => {
      const html = renderToStaticMarkup(<SettingsPage />);
      expect(html).toContain('href="/profile"');
      expect(html).toContain('href="/permission/notification"');
      expect(html).toContain('href="/permission/location"');
    });

    it("위험 액션(계정 삭제) danger 클래스", () => {
      const html = renderToStaticMarkup(<SettingsPage />);
      expect(html).toContain("계정 삭제");
      expect(html).toContain("text-danger");
    });
  });

  describe("/booking/[bookingId]", () => {
    it("정적 마크업 생성 + 핵심 정보 노출", () => {
      const html = renderToStaticMarkup(
        <BookingConfirmationPage params={{ bookingId: "demo" }} />,
      );
      expect(html).toContain("예약 완료");
      expect(html).toContain("예약이 완료되었어요!");
      expect(html).toContain("Klook");
      expect(html).toContain("다낭 바나힐");
    });

    it("BLOCKER 7 데모 안내 노출", () => {
      const html = renderToStaticMarkup(
        <BookingConfirmationPage params={{ bookingId: "demo" }} />,
      );
      expect(html).toContain("데모 예약");
      expect(html).toContain("BLOCKER 7");
    });

    it("내 일정 + 공유 액션", () => {
      const html = renderToStaticMarkup(
        <BookingConfirmationPage params={{ bookingId: "demo" }} />,
      );
      expect(html).toContain("내 일정에서 확인");
      expect(html).toContain("일행에게 공유");
    });
  });

  describe("/permission/location", () => {
    it("정적 마크업 생성 + 핵심 카피 노출", () => {
      const html = renderToStaticMarkup(<LocationPermissionPage />);
      expect(html).toContain("위치 정보가 필요해요");
      expect(html).toContain("자동으로 여행 모드");
      expect(html).toContain("위치 허용하기");
      expect(html).toContain("나중에 할게요");
    });

    it("3가지 베네핏 노출", () => {
      const html = renderToStaticMarkup(<LocationPermissionPage />);
      expect(html).toContain("D-Day 자동 모드 전환");
      expect(html).toContain("실시간 주변 정보");
      expect(html).toContain("프라이버시 보호");
    });

    it("ADR-017 프라이버시 인용 노출", () => {
      const html = renderToStaticMarkup(<LocationPermissionPage />);
      expect(html).toContain("ADR-017");
    });
  });

  describe("/permission/notification", () => {
    it("정적 마크업 생성 + 핵심 카피 노출", () => {
      const html = renderToStaticMarkup(<NotificationPermissionPage />);
      expect(html).toContain("알림을 받으시겠어요?");
      expect(html).toContain("알림 허용하기");
      expect(html).toContain("나중에 할게요");
    });

    it("3가지 베네핏 노출", () => {
      const html = renderToStaticMarkup(<NotificationPermissionPage />);
      expect(html).toContain("일정 리마인더");
      expect(html).toContain("Live Replan 알림");
      expect(html).toContain("D-Day 카운트다운");
    });
  });

  // 사이클 4 (G9) — /permission/camera 사전 프롬프트 + 거부 fallback
  describe("/permission/camera", () => {
    it("정적 마크업 생성 + 핵심 카피 노출", () => {
      const html = renderToStaticMarkup(<CameraPermissionPage />);
      expect(html).toContain("카메라 접근이 필요해요");
      expect(html).toContain("베트남어 메뉴를 촬영");
      expect(html).toContain("카메라 허용하기");
      expect(html).toContain("나중에 할게요");
    });

    it("3가지 베네핏 노출 (실시간 OCR + 한국어 번역 + 알레르기 검사)", () => {
      const html = renderToStaticMarkup(<CameraPermissionPage />);
      expect(html).toContain("실시간 OCR");
      expect(html).toContain("한국어 번역");
      expect(html).toContain("알레르기 검사");
    });

    it("갤러리 fallback CTA 링크 노출 (/translate)", () => {
      const html = renderToStaticMarkup(<CameraPermissionPage />);
      expect(html).toContain("갤러리에서 사진 선택");
      expect(html).toContain('href="/translate"');
    });

    it("ADR-019 프라이버시 정책 인용 (OCR 7일 / 번역 30일)", () => {
      const html = renderToStaticMarkup(<CameraPermissionPage />);
      expect(html).toContain("ADR-019");
      expect(html).toContain("7일");
      expect(html).toContain("30일");
    });

    it("초기 렌더에는 거부 fallback 가이드 미표시 (denied=false)", () => {
      const html = renderToStaticMarkup(<CameraPermissionPage />);
      // OS별 가이드 카피는 거부 후에만 노출
      expect(html).not.toContain("iOS Safari");
      expect(html).not.toContain("Android Chrome");
      expect(html).not.toContain("카메라가 차단됐어요");
    });
  });
});
