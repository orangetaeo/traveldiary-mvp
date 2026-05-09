/**
 * 사진 다중 업로드 — 한 번에 여러 장 선택 + 순차 압축/저장 + 진행 카운터.
 *
 * 사용자 시나리오: 여행 후 한 번에 30장 사진 추가 — 1장씩 모달 반복 부담 해소.
 *
 * 검증:
 *  - input multiple + handleFilesSelect (FileList 처리)
 *  - filePreviews 배열 state + 미리보기 grid + 개별 제거 버튼
 *  - 순차 addPhoto 호출 + uploadProgress (current/total/succeeded/failed)
 *  - 부분 실패 시 실패 사진만 남기기 + 사용자 안내
 *  - URL 모드는 단일 (기존 동작 보존)
 *  - 추가 버튼 라벨 동적 (1장 → "추가" / N장 → "N장 추가" / 진행 중 → "추가 중 N/M")
 */

import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import path from "node:path";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {}, push: () => {} }),
}));

import { PhotoAlbumView } from "@/components/album/PhotoAlbumView";
import type { TripPhoto } from "@/lib/types";

const NOW = "2026-05-08T00:00:00Z";
const dbPhoto = (id: string): TripPhoto => ({
  id,
  tripId: "t1",
  actorId: "user-1",
  url: `https://example.com/${id}.jpg`,
  caption: `사진 ${id}`,
  dayIndex: 0,
  sortOrder: 0,
  createdAt: NOW,
});

/* ════════════════════════════════════════════
 * 사진 추가 모달 — 다중 파일 선택 UI
 * ════════════════════════════════════════════ */

describe("PhotoAlbumView — 다중 파일 선택 UI", () => {
  it("file input multiple 속성", () => {
    const html = renderToStaticMarkup(
      <PhotoAlbumView tripId="t1" photos={[dbPhoto("a")]} totalDays={3} />,
    );
    // showAddModal=false라 input 미렌더링. SRC에서 단언.
    expect(html).toBeTypeOf("string");
  });
});

describe("PhotoAlbumView 소스 — 다중 파일 wiring", () => {
  const SRC = [
    fs.readFileSync(path.resolve(__dirname, "../../components/album/PhotoAlbumView.tsx"), "utf-8"),
    fs.readFileSync(path.resolve(__dirname, "../../components/album/PhotoAddModal.tsx"), "utf-8"),
  ].join("\n");

  it("input에 multiple 속성", () => {
    expect(SRC).toMatch(/<input[\s\S]*?type="file"[\s\S]*?multiple/);
  });

  it("input accept image/* + multiple 동시", () => {
    expect(SRC).toMatch(/accept="image\/\*"\s+multiple/);
  });

  it("handleFilesSelect 함수 (FileList 처리)", () => {
    expect(SRC).toContain("handleFilesSelect");
    expect(SRC).toMatch(/Array\.from\(files\)/);
  });

  it("filePreviews state는 string[] (배열)", () => {
    expect(SRC).toMatch(/useState<string\[\]>\(\[\]\)/);
    expect(SRC).toContain("filePreviews");
  });

  it("removeFilePreview로 개별 사진 선택 해제", () => {
    expect(SRC).toContain("removeFilePreview");
    expect(SRC).toMatch(/prev\.filter\(\(_,\s*i\)\s*=>\s*i\s*!==\s*idx\)/);
  });

  it("UploadProgress 인터페이스 (current/total/succeeded/failed)", () => {
    expect(SRC).toContain("interface UploadProgress");
    expect(SRC).toContain("current: number");
    expect(SRC).toContain("total: number");
    expect(SRC).toContain("succeeded: number");
    expect(SRC).toContain("failed: number");
  });

  it("uploadProgress state + setUploadProgress", () => {
    expect(SRC).toMatch(/useState<UploadProgress\s*\|\s*null>\(null\)/);
  });

  it("순차 addPhoto 호출 (for loop)", () => {
    expect(SRC).toMatch(/for\s*\(let\s+i\s*=\s*0;\s*i\s*<\s*queued\.length/);
  });

  it("addPhoto 호출 시 dataUrl + caption + dayIndex 전달", () => {
    expect(SRC).toMatch(/addPhoto\(\{[\s\S]*?url:\s*dataUrl[\s\S]*?caption:\s*captionInput[\s\S]*?dayIndex:\s*dayIdx/);
  });

  it("실패 시 실패한 사진만 남기기 (succeeded slice)", () => {
    expect(SRC).toMatch(/prev\.slice\(succeeded\)/);
  });

  it("부분 성공도 router.refresh (성공한 사진은 갤러리에 노출)", () => {
    // PhotoAddModal은 onPhotoAdded 콜백, 부모가 router.refresh로 연결
    expect(SRC).toMatch(/succeeded\s*>\s*0\s*&&\s*!demoEncountered/);
    expect(SRC).toMatch(/onPhotoAdded|router\.refresh/);
  });

  it("URL 모드는 단일 (기존 동작 보존)", () => {
    expect(SRC).toMatch(/\/\/\s*URL\s*모드/);
    expect(SRC).toMatch(/payloadUrl\s*=\s*url\.trim\(\)/);
  });

  it("자동 압축 안내 문구 (1280px / 70%)", () => {
    expect(SRC).toContain("1280px");
    expect(SRC).toContain("70%");
  });

  it("\"여러 장\" 명시 (사용자 자연 기대값 노출)", () => {
    expect(SRC).toContain("여러 장");
  });
});

describe("PhotoAlbumView 소스 — 미리보기 grid + progress UI", () => {
  const SRC = [
    fs.readFileSync(path.resolve(__dirname, "../../components/album/PhotoAlbumView.tsx"), "utf-8"),
    fs.readFileSync(path.resolve(__dirname, "../../components/album/PhotoAddModal.tsx"), "utf-8"),
  ].join("\n");

  it("미리보기 grid (grid-cols-3 + aspect-square)", () => {
    expect(SRC).toContain("grid-cols-3");
    expect(SRC).toContain("aspect-square");
  });

  it("미리보기 카운트 노출 (\"N장 선택됨\")", () => {
    expect(SRC).toContain("filePreviews.length");
    expect(SRC).toContain("장 선택됨");
  });

  it("개별 사진 alt + aria-label (sequence 노출)", () => {
    expect(SRC).toMatch(/alt=\{`추가할 사진 \$\{idx\s*\+\s*1\}\/\$\{filePreviews\.length\}`\}/);
    expect(SRC).toMatch(/aria-label=\{`\$\{idx\s*\+\s*1\}번째 사진 선택 해제`\}/);
  });

  it("선택 해제 버튼 disabled 시 isPending (업로드 중 변경 차단)", () => {
    expect(SRC).toMatch(/onClick=\{\(\)\s*=>\s*removeFilePreview\(idx\)\}[\s\S]*?disabled=\{isPending\}/);
  });

  it("progressbar role + aria-valuenow/valuemin/valuemax/aria-label", () => {
    expect(SRC).toContain('role="progressbar"');
    expect(SRC).toContain("aria-valuenow={uploadProgress.current}");
    expect(SRC).toContain("aria-valuemin={0}");
    expect(SRC).toContain("aria-valuemax={uploadProgress.total}");
  });

  it("진행 카운터 노출 (current / total)", () => {
    expect(SRC).toMatch(/\{uploadProgress\.current\}\s*\/\s*\{uploadProgress\.total\}/);
  });

  it("실패 카운트 노출 (uploadProgress.failed > 0)", () => {
    expect(SRC).toMatch(/uploadProgress\.failed\s*>\s*0/);
    expect(SRC).toContain("실패");
  });

  it("aria-live=\"polite\" (스크린리더 진행 안내)", () => {
    expect(SRC).toMatch(/aria-live="polite"/);
  });
});

describe("PhotoAlbumView 소스 — 추가 버튼 라벨 동적", () => {
  const SRC = [
    fs.readFileSync(path.resolve(__dirname, "../../components/album/PhotoAlbumView.tsx"), "utf-8"),
    fs.readFileSync(path.resolve(__dirname, "../../components/album/PhotoAddModal.tsx"), "utf-8"),
  ].join("\n");

  it("진행 중 라벨 \"추가 중 N/M\"", () => {
    expect(SRC).toMatch(/추가 중 \$\{uploadProgress\.current\}\/\$\{uploadProgress\.total\}/);
  });

  it("다중 모드 라벨 \"N장 추가\"", () => {
    expect(SRC).toMatch(/\$\{filePreviews\.length\}장 추가/);
  });

  it("disabled: filePreviews.length === 0 (단일 filePreview 분기 제거)", () => {
    expect(SRC).toMatch(/filePreviews\.length\s*===\s*0/);
    expect(SRC).not.toMatch(/!filePreview\b/);
  });

  it("공통 caption 라벨 (다중일 때 \"공통 설명\")", () => {
    expect(SRC).toContain("공통 설명");
  });
});

describe("PhotoAlbumView 소스 — a11y 정정", () => {
  const SRC = [
    fs.readFileSync(path.resolve(__dirname, "../../components/album/PhotoAlbumView.tsx"), "utf-8"),
    fs.readFileSync(path.resolve(__dirname, "../../components/album/PhotoAddModal.tsx"), "utf-8"),
  ].join("\n");

  it('aria-selected는 명시적 string ("true"/"false")', () => {
    expect(SRC).toContain('aria-selected={addMode === "file" ? "true" : "false"}');
    expect(SRC).toContain('aria-selected={addMode === "url" ? "true" : "false"}');
  });

  it("select에 aria-label (\"여행 일차 선택\")", () => {
    expect(SRC).toContain('aria-label="여행 일차 선택"');
  });

  it("file input aria-label \"여러 장 가능\"", () => {
    expect(SRC).toContain('aria-label="사진 파일 선택 (여러 장 가능)"');
  });
});
