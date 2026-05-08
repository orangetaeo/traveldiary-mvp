/**
 * 알림 "모두 읽음" + 개별 읽음 기능 테스트.
 *
 * NotificationListView 소스 코드 검증 (데모 모드 — 클라이언트 상태).
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const viewSrc = fs.readFileSync(
  path.resolve("components/notifications/NotificationListView.tsx"),
  "utf-8",
);

/* ═══════ 1. 모두 읽음 버튼 ═══════ */

describe("알림 — 모두 읽음 버튼", () => {
  it("handleMarkAllRead 함수 존재", () => {
    expect(viewSrc).toContain("handleMarkAllRead");
  });

  it("모두 읽음 버튼 텍스트 존재", () => {
    expect(viewSrc).toContain("모두 읽음");
  });

  it("aria-label 존재", () => {
    expect(viewSrc).toContain('aria-label="모두 읽음 처리"');
  });

  it("unreadCount > 0일 때만 표시", () => {
    // 조건부 렌더링 패턴: unreadCount > 0 && ( ... 모두 읽음 ... )
    const markAllIdx = viewSrc.indexOf("모두 읽음 처리");
    const precedingBlock = viewSrc.slice(Math.max(0, markAllIdx - 500), markAllIdx);
    expect(precedingBlock).toContain("unreadCount > 0");
  });

  it("모든 항목을 read: true로 전환", () => {
    expect(viewSrc).toContain("read: true");
  });
});

/* ═══════ 2. 개별 읽음 처리 ═══════ */

describe("알림 — 개별 읽음 처리", () => {
  it("handleMarkOneRead 함수 존재", () => {
    expect(viewSrc).toContain("handleMarkOneRead");
  });

  it("onRead prop이 NotificationCard에 전달됨", () => {
    expect(viewSrc).toContain("onRead={handleMarkOneRead}");
  });

  it("카드 클릭 시 handleClick 호출", () => {
    expect(viewSrc).toContain("onClick={handleClick}");
  });

  it("읽지 않은 알림만 읽음 처리 (n.read 체크)", () => {
    expect(viewSrc).toContain("if (!n.read) onRead(n.id)");
  });
});

/* ═══════ 3. 상태 관리 ═══════ */

describe("알림 — 클라이언트 상태 관리", () => {
  it("items 상태 관리 (useState)", () => {
    expect(viewSrc).toContain("useState<AppNotification[]>(notifications)");
  });

  it("items 기준으로 필터링", () => {
    // filter === "all" ? items : items.filter(...)
    expect(viewSrc).toContain("? items");
  });

  it("items 기준으로 unreadCount 계산", () => {
    expect(viewSrc).toContain("items.filter((n) => !n.read).length");
  });
});

/* ═══════ 4. 접근성 ═══════ */

describe("알림 — 접근성", () => {
  it("href 없는 카드에 role=button 존재", () => {
    expect(viewSrc).toContain('role="button"');
  });

  it("href 없는 카드에 tabIndex 존재", () => {
    expect(viewSrc).toContain("tabIndex={0}");
  });

  it("키보드 Enter/Space 지원", () => {
    expect(viewSrc).toContain("onKeyDown");
    expect(viewSrc).toContain('"Enter"');
    expect(viewSrc).toContain('" "');
  });
});
