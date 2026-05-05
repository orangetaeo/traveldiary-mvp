/**
 * 캐시 키 생성 유틸리티.
 *
 * createHash("sha256").update(seed).digest("hex").slice(0, 32) 패턴 9곳 DRY 추출.
 */
import { createHash } from "crypto";

/** seed 문자열 → 32자 hex 해시 키. */
export function hashCacheKey(seed: string): string {
  return createHash("sha256").update(seed).digest("hex").slice(0, 32);
}
