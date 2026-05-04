/**
 * 자율 모드 KST 시간/디렉토리 공유 헬퍼 (사이클 AAAA5a, R1 DRY 추출).
 *
 * 추출 트리거: KST_OFFSET_MS + getKstDateString + getMemoryDir이 3 영역에서 답습됨
 *   - lib/autonomy/budget.ts
 *   - lib/autonomy/cycle-counter.ts
 *   - lib/usage-quota.ts (KST_OFFSET_MS만)
 *
 * `feedback_local_const_to_shared_lib_extraction` 답습 — 2번째 사용처 등장 시 추출 + 1번째 동시 swap.
 *
 * 보안 invariant 격리 (T16 권고): KST 오프셋은 자정 리셋 + 자율 시간대 게이트의 보안 invariant.
 * 비-KST 함수는 본 모듈에 추가하지 말 것 (감사 표면 축소).
 */

import { join } from "path";

export const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function getKstDateString(now: number = Date.now()): string {
  const kst = new Date(now + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getMemoryDir(): string {
  return process.env.AUTONOMY_MEMORY_DIR ?? join(process.cwd(), "memory");
}
