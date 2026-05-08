/**
 * 사진 추가 — 파일 업로드 + URL 입력 두 모드 wiring 회귀 가드.
 *
 * 갭 2 fix: 사용자 보고 "사진 추가시 왜 url을 입력 하게 하지?" (2026-05-08).
 * 파일 선택(촬영·앨범)을 default로 + URL 입력은 fallback 옵션.
 *
 * 검증:
 *  - 사진 추가 모달이 segmented control + file/URL 분기 노출
 *  - 파일 input accept="image/*" + 압축 안내
 *  - URL input은 URL 모드일 때만 노출
 *  - addPhoto action url length cap이 5MB 영역으로 완화됨
 *  - Prisma schema url이 @db.Text로 마이그레이션됨
 *  - migration SQL이 ALTER TABLE TripPhoto.url → TEXT
 *  - lib/utils/image-compress 클라이언트 압축 유틸 무결성
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");
const read = (rel: string) => fs.readFileSync(path.resolve(ROOT, rel), "utf-8");

/* ════════════════════════════════════════════
 * Prisma schema — url 컬럼 TEXT 마이그레이션
 * ════════════════════════════════════════════ */

describe("Prisma schema — TripPhoto.url Text 마이그레이션", () => {
  const SCHEMA = read("prisma/schema.prisma");

  it("TripPhoto.url은 @db.Text (VARCHAR(500) 제거)", () => {
    expect(SCHEMA).toMatch(/url\s+String\s+@db\.Text/);
    expect(SCHEMA).not.toMatch(/url\s+String\s+@db\.VarChar\(500\)/);
  });

  it("caption은 그대로 VARCHAR(200) (의도하지 않은 변경 차단)", () => {
    expect(SCHEMA).toMatch(/caption\s+String\?\s+@db\.VarChar\(200\)/);
  });
});

describe("Migration 20260508_trip_photo_url_text", () => {
  const SQL_PATH = "prisma/migrations/20260508_trip_photo_url_text/migration.sql";

  it("migration SQL 파일 존재", () => {
    expect(fs.existsSync(path.resolve(ROOT, SQL_PATH))).toBe(true);
  });

  it("ALTER TABLE TripPhoto.url → TEXT", () => {
    const sql = read(SQL_PATH);
    expect(sql).toMatch(/ALTER\s+TABLE\s+"TripPhoto"\s+ALTER\s+COLUMN\s+"url"\s+SET\s+DATA\s+TYPE\s+TEXT/i);
  });
});

/* ════════════════════════════════════════════
 * actions/photo.ts — addPhoto length cap 완화
 * ════════════════════════════════════════════ */

describe("actions/photo.ts — addPhoto length cap", () => {
  const SRC = read("actions/photo.ts");

  it("PHOTO_URL_MAX_LENGTH 상수 정의 (500 hard-coded 제거)", () => {
    expect(SRC).toMatch(/PHOTO_URL_MAX_LENGTH\s*=\s*5_500_000/);
    expect(SRC).not.toMatch(/input\.url\.length\s*>\s*500\b/);
  });

  it("길이 검증은 PHOTO_URL_MAX_LENGTH 사용", () => {
    expect(SRC).toMatch(/input\.url\.length\s*>\s*PHOTO_URL_MAX_LENGTH/);
  });

  it("invalid 코드 반환 (감사 로그 + revalidate 회귀 가드)", () => {
    expect(SRC).toMatch(/return\s*\{\s*ok:\s*false,\s*code:\s*"invalid"\s*\}/);
    expect(SRC).toContain('action: "photo.add"');
  });
});

/* ════════════════════════════════════════════
 * lib/utils/image-compress — 클라이언트 압축 유틸
 * ════════════════════════════════════════════ */

describe("lib/utils/image-compress — 무결성", () => {
  const SRC = read("lib/utils/image-compress.ts");

  it("compressImageToDataUrl export", () => {
    expect(SRC).toMatch(/export\s+async\s+function\s+compressImageToDataUrl/);
  });

  it("MAX_DIMENSION = 1280 (긴 변 기준 축소)", () => {
    expect(SRC).toContain("MAX_DIMENSION = 1280");
  });

  it("JPEG_QUALITY = 0.7 (DB 부담 최소화)", () => {
    expect(SRC).toContain("JPEG_QUALITY = 0.7");
  });

  it("not_image / load_failed / encode_failed 결과 구분", () => {
    expect(SRC).toMatch(/reason:\s*"not_image"/);
    expect(SRC).toMatch(/reason:\s*"load_failed"/);
    expect(SRC).toMatch(/reason:\s*"encode_failed"/);
  });

  it("File.type이 image/ prefix 아니면 not_image 반환", () => {
    expect(SRC).toContain('ACCEPTED_PREFIX = "image/"');
    expect(SRC).toMatch(/file\.type\.startsWith\(ACCEPTED_PREFIX\)/);
  });

  it("URL.createObjectURL + revokeObjectURL 메모리 누수 방지", () => {
    expect(SRC).toContain("URL.createObjectURL");
    expect(SRC).toContain("URL.revokeObjectURL");
  });

  it("canvas drawImage + toDataURL 사용", () => {
    expect(SRC).toContain("canvas.toDataURL");
    expect(SRC).toContain("ctx.drawImage");
  });

  it("리사이즈는 longSide > MAX_DIMENSION 일 때만 (작은 이미지 보존)", () => {
    expect(SRC).toMatch(/longSide\s*>\s*MAX_DIMENSION/);
  });

  it("결과 mimeType은 image/jpeg 통일 (PNG/WebP/GIF 모두 JPEG)", () => {
    expect(SRC).toMatch(/mimeType:\s*"image\/jpeg"/);
  });
});

/* ════════════════════════════════════════════
 * PhotoAlbumView 소스 — file picker + URL fallback wiring
 * ════════════════════════════════════════════ */

describe("PhotoAlbumView 소스 — 사진 추가 모드 wiring", () => {
  const SRC = read("components/album/PhotoAlbumView.tsx");

  it("compressImageToDataUrl import", () => {
    expect(SRC).toMatch(
      /import\s+\{\s*compressImageToDataUrl\s*\}\s+from\s+"@\/lib\/utils\/image-compress"/,
    );
  });

  it("AddMode union type (file | url)", () => {
    expect(SRC).toMatch(/type\s+AddMode\s*=\s*"file"\s*\|\s*"url"/);
  });

  it("addMode state default = file (촬영·앨범 우선)", () => {
    expect(SRC).toMatch(/useState<AddMode>\("file"\)/);
  });

  it("filePreviews state (다중) + isCompressing state", () => {
    expect(SRC).toContain("filePreviews");
    expect(SRC).toContain("isCompressing");
  });

  it("fileInputRef로 reset 시 input value 초기화", () => {
    expect(SRC).toContain("fileInputRef");
    expect(SRC).toMatch(/fileInputRef\.current\.value\s*=\s*""/);
  });

  it("handleFilesSelect → compressImageToDataUrl 호출", () => {
    expect(SRC).toContain("handleFilesSelect");
    expect(SRC).toMatch(/compressImageToDataUrl\(file\)/);
  });

  it("handleAdd: file 모드는 filePreviews 다중 처리, url 모드는 단일", () => {
    expect(SRC).toMatch(/addMode\s*===\s*"file"/);
    expect(SRC).toMatch(/filePreviews\.length\s*===\s*0/);
  });

  it("resetAddForm으로 모달 닫기 + state 초기화", () => {
    expect(SRC).toContain("resetAddForm");
  });

  it("router.refresh on result.demo === false (DB 모드)", () => {
    expect(SRC).toMatch(/!result\.demo\)[\s\S]*?router\.refresh/);
  });
});

describe("PhotoAlbumView UI — 사진 추가 모달 segmented control", () => {
  const SRC = read("components/album/PhotoAlbumView.tsx");

  it('role="tablist" + aria-label="사진 추가 방식"', () => {
    expect(SRC).toContain('role="tablist"');
    expect(SRC).toContain('aria-label="사진 추가 방식"');
  });

  it('"촬영·앨범" tab + photo_camera 아이콘', () => {
    expect(SRC).toContain("촬영·앨범");
    expect(SRC).toContain("photo_camera");
  });

  it('"URL" tab + link 아이콘 (fallback)', () => {
    expect(SRC).toContain('addMode === "url"');
    // material-symbols span 내부에 "link" 텍스트 (별도 라인, CR/LF 무관)
    expect(SRC).toMatch(/material-symbols-outlined[^>]*>\s*link\s*</);
  });

  it("aria-selected는 명시적 \"true\"/\"false\" string (IDE a11y 정정)", () => {
    expect(SRC).toContain('aria-selected={addMode === "file" ? "true" : "false"}');
    expect(SRC).toContain('aria-selected={addMode === "url" ? "true" : "false"}');
  });

  it("file input accept=\"image/*\" + multiple + aria-label (다중 가능 명시)", () => {
    expect(SRC).toContain('accept="image/*"');
    expect(SRC).toContain('aria-label="사진 파일 선택 (여러 장 가능)"');
  });

  it("file input type=\"file\" + multiple + handleFilesSelect onChange", () => {
    expect(SRC).toMatch(/type="file"[\s\S]*?multiple[\s\S]*?onChange=\{[\s\S]*?handleFilesSelect/);
  });

  it("압축 안내 텍스트 (1280px / 70% 품질)", () => {
    expect(SRC).toContain("1280px");
    expect(SRC).toContain("70%");
  });

  it("isCompressing 노출 (사진 처리 중 메시지)", () => {
    expect(SRC).toContain("사진을 처리하고 있어요");
  });

  it("미리 보기 grid (sequence alt 텍스트 + grid-cols-3)", () => {
    expect(SRC).toMatch(/추가할 사진 \$\{idx\s*\+\s*1\}\/\$\{filePreviews\.length\}/);
    expect(SRC).toContain("grid-cols-3");
  });

  it("error는 role=\"alert\" (스크린리더 즉시 안내)", () => {
    expect(SRC).toMatch(/role="alert"/);
  });

  it("URL 모드에서만 URL input 노출 (addMode === \"file\" ? <file> : <url> ternary)", () => {
    // file 모드 분기가 ternary의 truthy 쪽 (UI 우선)
    expect(SRC).toMatch(/addMode === "file"\s*\?\s*\(/);
    // URL input은 ternary의 falsy 쪽에 위치 + label "이미지 URL"
    expect(SRC).toMatch(/:\s*\(\s*<>[\s\S]*?이미지 URL/);
  });

  it("추가 버튼 disabled 분기 (file → filePreviews.length === 0 / url → !url.trim)", () => {
    expect(SRC).toMatch(/addMode === "file"\s*\?\s*filePreviews\.length\s*===\s*0\s*:\s*!url\.trim\(\)/);
  });

  it("isCompressing 중에도 추가 버튼 disabled", () => {
    expect(SRC).toMatch(/disabled=\{[\s\S]*?isCompressing[\s\S]*?\}/);
  });

  it("배경 클릭 시 resetAddForm (showAddModal = false)", () => {
    expect(SRC).toMatch(/e\.target\s*===\s*e\.currentTarget[\s\S]*?resetAddForm\(\)/);
  });

  it("취소 버튼 onClick=resetAddForm (state 초기화)", () => {
    expect(SRC).toMatch(/onClick=\{resetAddForm\}/);
  });
});
