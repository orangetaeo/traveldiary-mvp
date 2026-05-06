/**
 * 파이프라인 공통 유틸리티.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { OUTPUT_DIR } from "./config";

// ═══════════════════════════════════════════════════════════════════
// 파일 I/O
// ═══════════════════════════════════════════════════════════════════

const ROOT = join(__dirname, "..", "..");

export function outputPath(filename: string): string {
  return join(ROOT, OUTPUT_DIR, filename);
}

export function ensureDir(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function writeJson<T>(filename: string, data: T): void {
  const path = outputPath(filename);
  ensureDir(path);
  writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
  console.log(`  ✓ ${filename} (${JSON.stringify(data).length.toLocaleString()} bytes)`);
}

export function readJson<T>(filename: string): T | null {
  const path = outputPath(filename);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

// ═══════════════════════════════════════════════════════════════════
// API 호출 헬퍼
// ═══════════════════════════════════════════════════════════════════

export function getRequiredEnv(key: string): string {
  const val = process.env[key];
  if (!val || val.length === 0) {
    throw new Error(`환경변수 ${key} 미설정. .env.local 또는 쉘에서 export 필요.`);
  }
  return val;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════
// 로그
// ═══════════════════════════════════════════════════════════════════

export function log(phase: string, message: string): void {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] [${phase}] ${message}`);
}

export function logError(phase: string, message: string): void {
  const ts = new Date().toISOString().slice(11, 19);
  console.error(`[${ts}] [${phase}] ❌ ${message}`);
}

// ═══════════════════════════════════════════════════════════════════
// 진행률
// ═══════════════════════════════════════════════════════════════════

export function progressBar(current: number, total: number, width = 30): string {
  const pct = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  return `[${bar}] ${pct}% (${current}/${total})`;
}
