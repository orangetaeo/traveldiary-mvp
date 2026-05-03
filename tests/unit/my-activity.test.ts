/**
 * 사이클 YY — /shared 본인 활동 회귀.
 *
 * prisma 의존 함수의 가드 단언만 + 타입/export 정합성. DB 통합은 E2E nightly에서.
 */

import { describe, it, expect } from "vitest";
import {
  listMyActivityByClientUuid,
  type MyActivityItem,
} from "@/lib/repositories/shareComment.repository";

describe("사이클 YY — listMyActivityByClientUuid 가드", () => {
  it("빈 clientUuid → 빈 배열", async () => {
    const items = await listMyActivityByClientUuid("");
    expect(items).toEqual([]);
  });

  it("너무 짧은 clientUuid (8자 미만) → 빈 배열", async () => {
    const items = await listMyActivityByClientUuid("short");
    expect(items).toEqual([]);
  });

  it("너무 긴 clientUuid (200자 초과) → 빈 배열", async () => {
    const huge = "x".repeat(201);
    const items = await listMyActivityByClientUuid(huge);
    expect(items).toEqual([]);
  });

  it("prisma 미연결 시 빈 배열 (DB url 미설정 데모 환경)", async () => {
    // 정상 길이 clientUuid이지만 prisma null이라 빈 배열
    const items = await listMyActivityByClientUuid(
      "abcdefgh-aaaa-bbbb-cccc-dddddddddddd",
    );
    expect(items).toEqual([]);
  });
});

describe("사이클 YY — MyActivityItem 타입 정합성", () => {
  it("타입 필드 8개 명시 (회귀 보장)", () => {
    const sample: MyActivityItem = {
      commentId: "c1",
      syncKey: "sync-key-1",
      destination: "다낭",
      body: "테스트",
      reaction: "LIKE",
      itemId: null,
      createdAt: new Date().toISOString(),
      isShareLinkActive: true,
    };
    expect(sample.commentId).toBeTruthy();
    expect(sample.syncKey).toBeTruthy();
    expect(sample.isShareLinkActive).toBe(true);
  });

  it("destination null 허용 (trip relation 부재 케이스)", () => {
    const sample: MyActivityItem = {
      commentId: "c1",
      syncKey: "sync-key-1",
      destination: null,
      body: "",
      reaction: null,
      itemId: null,
      createdAt: new Date().toISOString(),
      isShareLinkActive: false,
    };
    expect(sample.destination).toBeNull();
    expect(sample.isShareLinkActive).toBe(false);
  });
});
