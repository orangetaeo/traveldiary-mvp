/**
 * Photo Caption Edit + Delete — 단위 테스트.
 *
 * 검증:
 *  - PhotoAlbumView: 캡션 수정 버튼 + 삭제 버튼 존재 (호버 시)
 *  - PhotoAlbumView: editPhoto + removePhoto import 존재
 *  - PhotoAlbumView: 캡션 수정 모달 존재
 *  - actions/photo.ts: editPhoto 함수 + audit log
 *  - repository: updatePhoto 함수 존재
 *  - audit whitelist: photo.update 포함
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/* ════════════════════════════════════════════
 * PhotoAlbumView — 소스 정적 검증
 * ════════════════════════════════════════════ */

describe("PhotoAlbumView — 캡션 수정 + 삭제 연동", () => {
  const src = fs.readFileSync(
    path.resolve("components/album/PhotoAlbumView.tsx"),
    "utf-8",
  );

  it("editPhoto import 존재", () => {
    expect(src).toContain("editPhoto");
  });

  it("removePhoto import 존재", () => {
    expect(src).toContain("removePhoto");
  });

  it("캡션 수정 버튼 aria-label 존재", () => {
    expect(src).toContain('aria-label="캡션 수정"');
  });

  it("사진 삭제 버튼 aria-label 존재", () => {
    expect(src).toContain('aria-label="사진 삭제"');
  });

  it("캡션 수정 모달 제목 존재", () => {
    expect(src).toContain("캡션 수정");
  });

  it("캡션 수정 input aria-label 존재", () => {
    expect(src).toContain('aria-label="사진 캡션 수정"');
  });

  it("Enter 키 제출 지원", () => {
    expect(src).toContain("Enter");
  });

  it("Escape 키 닫기 지원", () => {
    expect(src).toContain("Escape");
  });

  it("삭제 확인 confirm 호출 존재", () => {
    expect(src).toContain("사진을 삭제할까요");
  });

  it("옵티미스틱 삭제 — hiddenIds state 존재", () => {
    expect(src).toContain("hiddenIds");
  });

  it("옵티미스틱 캡션 — captionOverrides state 존재", () => {
    expect(src).toContain("captionOverrides");
  });

  it("handleDelete 함수 정의 존재", () => {
    expect(src).toContain("handleDelete");
  });

  it("handleEditCaption 함수 정의 존재", () => {
    expect(src).toContain("handleEditCaption");
  });

  it("수정 실패 시 롤백 로직 존재", () => {
    expect(src).toContain("캡션 수정 실패");
  });

  it("삭제 실패 시 롤백 로직 존재", () => {
    expect(src).toContain("삭제 실패");
  });

  it("router.refresh 호출 존재", () => {
    expect(src).toContain("router.refresh");
  });
});

/* ════════════════════════════════════════════
 * actions/photo.ts — editPhoto 서버 액션
 * ════════════════════════════════════════════ */

describe("actions/photo.ts — editPhoto", () => {
  const src = fs.readFileSync(
    path.resolve("actions/photo.ts"),
    "utf-8",
  );

  it("editPhoto 함수 존재", () => {
    expect(src).toContain("export async function editPhoto");
  });

  it("writeAuditLog 호출 — photo.update 코드", () => {
    expect(src).toContain('action: "photo.update"');
  });

  it("updatePhoto import 존재", () => {
    expect(src).toContain("updatePhoto");
  });

  it("canWriteTripOrViaShareLink 권한 체크", () => {
    expect(src).toContain("canWriteTripOrViaShareLink");
  });

  it("caption 200자 제한", () => {
    expect(src).toContain("slice(0, 200)");
  });
});

/* ════════════════════════════════════════════
 * photo.repository — updatePhoto
 * ════════════════════════════════════════════ */

describe("photo.repository — updatePhoto", () => {
  const src = fs.readFileSync(
    path.resolve("lib/repositories/photo.repository.ts"),
    "utf-8",
  );

  it("updatePhoto 함수 export 존재", () => {
    expect(src).toContain("export async function updatePhoto");
  });

  it("UpdatePhotoResult 타입 export 존재", () => {
    expect(src).toContain("export interface UpdatePhotoResult");
  });

  it("before/after caption 스냅샷 반환", () => {
    expect(src).toContain("before: { caption:");
    expect(src).toContain("after: { caption:");
  });

  it("not_found 분기 존재", () => {
    expect(src).toContain("not_found");
  });
});

/* ════════════════════════════════════════════
 * audit whitelist — photo.update
 * ════════════════════════════════════════════ */

describe("audit whitelist — photo.update", () => {
  const src = fs.readFileSync(
    path.resolve("tests/unit/audit-action-codes.test.ts"),
    "utf-8",
  );

  it("photo.update가 화이트리스트에 포함", () => {
    expect(src).toContain('"photo.update"');
  });
});
