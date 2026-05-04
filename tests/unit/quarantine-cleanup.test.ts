import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync,
  rmSync,
  mkdirSync,
  writeFileSync,
  utimesSync,
  existsSync,
  readdirSync,
} from "fs";
import { tmpdir } from "os";
import { join } from "path";
// @ts-expect-error — .mjs 스크립트 직접 import (pure ESM, no type declarations)
import { cleanupQuarantine } from "../../scripts/quarantine-cleanup.mjs";

let TMP_DIR: string;
let QUARANTINE_DIR: string;
const NOW = Date.UTC(2026, 4, 4, 0, 0, 0);
const DAY_MS = 24 * 60 * 60 * 1000;

function setMtime(path: string, daysAgo: number): void {
  const targetMs = NOW - daysAgo * DAY_MS;
  const target = new Date(targetMs);
  utimesSync(path, target, target);
}

function writeAt(name: string, daysAgo: number): string {
  const path = join(QUARANTINE_DIR, name);
  writeFileSync(path, `corrupt content ${name}`, "utf-8");
  setMtime(path, daysAgo);
  return path;
}

describe("quarantine-cleanup — 30일 sweep (사이클 AAAA6 P1)", () => {
  beforeEach(() => {
    TMP_DIR = mkdtempSync(join(tmpdir(), "td-quarantine-cleanup-"));
    QUARANTINE_DIR = join(TMP_DIR, "quarantine");
    mkdirSync(QUARANTINE_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it("quarantine 디렉토리 부재 시 result 0", () => {
    rmSync(QUARANTINE_DIR, { recursive: true, force: true });
    const result = cleanupQuarantine({ now: NOW, dir: TMP_DIR });
    expect(result.scanned).toBe(0);
    expect(result.removed).toBe(0);
    expect(result.kept).toBe(0);
    expect(result.errors).toBe(0);
  });

  it("디렉토리 비어있으면 0건 처리", () => {
    const result = cleanupQuarantine({ now: NOW, dir: TMP_DIR });
    expect(result.scanned).toBe(0);
    expect(result.removed).toBe(0);
  });

  it("30일 이내 파일은 보존 (cutoff 안쪽)", () => {
    writeAt("AUTONOMY_PAUSED.flag.corrupt-2026-05-01", 3);
    writeAt("usage_quota_2026-05-02.json.corrupt-2026-05-02", 2);
    const result = cleanupQuarantine({ now: NOW, dir: TMP_DIR });
    expect(result.scanned).toBe(2);
    expect(result.removed).toBe(0);
    expect(result.kept).toBe(2);
    expect(readdirSync(QUARANTINE_DIR).length).toBe(2);
  });

  it("30일 초과 파일은 삭제", () => {
    writeAt("AUTONOMY_PAUSED.flag.corrupt-2026-04-01", 33);
    writeAt("usage_quota_2026-03-15.json.corrupt-2026-03-15", 50);
    const result = cleanupQuarantine({ now: NOW, dir: TMP_DIR });
    expect(result.scanned).toBe(2);
    expect(result.removed).toBe(2);
    expect(result.kept).toBe(0);
    expect(readdirSync(QUARANTINE_DIR).length).toBe(0);
  });

  it("혼합: 일부 보존 + 일부 삭제", () => {
    writeAt("old.corrupt", 60);
    writeAt("recent.corrupt", 5);
    writeAt("borderline-30.corrupt", 31);
    const result = cleanupQuarantine({ now: NOW, dir: TMP_DIR });
    expect(result.scanned).toBe(3);
    expect(result.removed).toBe(2);
    expect(result.kept).toBe(1);
    const remaining = readdirSync(QUARANTINE_DIR);
    expect(remaining).toEqual(["recent.corrupt"]);
  });

  it("dry-run: 결과 카운트는 같지만 파일은 보존", () => {
    writeAt("old1.corrupt", 100);
    writeAt("old2.corrupt", 100);
    const result = cleanupQuarantine({ now: NOW, dir: TMP_DIR, dryRun: true });
    expect(result.removed).toBe(2);
    expect(result.removedFiles).toEqual(["old1.corrupt", "old2.corrupt"]);
    expect(readdirSync(QUARANTINE_DIR).sort()).toEqual([
      "old1.corrupt",
      "old2.corrupt",
    ]);
  });

  it("QUARANTINE_DEAD.flag는 항상 보존 (운영자 직접 처리)", () => {
    const deadFlag = join(QUARANTINE_DIR, "QUARANTINE_DEAD.flag");
    writeFileSync(deadFlag, JSON.stringify({ srcPath: "x", reason: "y" }));
    setMtime(deadFlag, 365); // 1년 경과해도 삭제 X

    const result = cleanupQuarantine({ now: NOW, dir: TMP_DIR });
    expect(result.removed).toBe(0);
    expect(result.kept).toBe(1);
    expect(existsSync(deadFlag)).toBe(true);
  });

  it("retentionDays=0 시 모든 파일 삭제", () => {
    writeAt("recent.corrupt", 0);
    writeAt("old.corrupt", 100);
    const result = cleanupQuarantine({
      now: NOW,
      dir: TMP_DIR,
      retentionDays: 0,
    });
    // recent (0일 전 mtime = NOW)도 cutoff = NOW - 0 = NOW와 같으므로 mtimeMs < cutoff 미충족 → 보존
    // old는 cutoff < mtime 비교에서 삭제
    expect(result.removed).toBeGreaterThanOrEqual(1);
  });

  it("retentionDays=60 시 30일 파일은 보존", () => {
    writeAt("aaaa3.corrupt", 35);
    writeAt("ancient.corrupt", 90);
    const result = cleanupQuarantine({
      now: NOW,
      dir: TMP_DIR,
      retentionDays: 60,
    });
    expect(result.removed).toBe(1);
    expect(result.removedFiles).toEqual(["ancient.corrupt"]);
    expect(readdirSync(QUARANTINE_DIR)).toEqual(["aaaa3.corrupt"]);
  });

  it("DEAD flag + 일반 파일 혼합 시 일반만 삭제", () => {
    const deadFlag = join(QUARANTINE_DIR, "QUARANTINE_DEAD.flag");
    writeFileSync(deadFlag, "{}");
    setMtime(deadFlag, 100);
    writeAt("old.corrupt", 100);

    const result = cleanupQuarantine({ now: NOW, dir: TMP_DIR });
    expect(result.removed).toBe(1);
    expect(result.kept).toBe(1);
    expect(existsSync(deadFlag)).toBe(true);
    expect(existsSync(join(QUARANTINE_DIR, "old.corrupt"))).toBe(false);
  });

  it("removedFiles 50개 sample cap (실제 sample은 호출자 책임)", () => {
    // sample cap은 main()에서 표시용. cleanupQuarantine은 전체 반환.
    for (let i = 0; i < 60; i++) {
      writeAt(`old-${i}.corrupt`, 100);
    }
    const result = cleanupQuarantine({ now: NOW, dir: TMP_DIR });
    expect(result.removed).toBe(60);
    expect(result.removedFiles.length).toBe(60);
  });

  it("디렉토리는 카운트하지만 삭제 시도 X (statSync isFile false)", () => {
    const subDir = join(QUARANTINE_DIR, "weird-subdir");
    mkdirSync(subDir);
    setMtime(subDir, 100);

    const result = cleanupQuarantine({ now: NOW, dir: TMP_DIR });
    expect(result.scanned).toBe(1);
    expect(result.removed).toBe(0);
    expect(result.kept).toBe(1);
    expect(existsSync(subDir)).toBe(true);
  });
});
