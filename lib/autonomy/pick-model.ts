/**
 * 자율 모드 모델 라우팅 헬퍼 (사이클 AAAA2, ADR-047 트리거 1).
 *
 * R1 결정 (사이클 AAAA2): 절충 방식 (c)
 *   - pickModel은 권장 모델 반환 (강제 throw 아님)
 *   - Opus 4-체크 미달 시 console.warn + audit 'opus.gate.bypass' 기록
 *   - 강제 throw는 AAAA3 트리거 (분포 데이터 1주일 누적 후 실측 기반)
 *   - dryRunCap1 옵션: 자율 시동 첫 검증 단계에서 1 사이클만 실행하도록 강제 (T13 권고)
 *
 * 분포 목표 (ADR-047):
 *   Haiku 5~10% / Sonnet 70~75% / Opus 15~25%
 */

export type ModelStage =
  | "triage"
  | "meeting"
  | "impl"
  | "review"
  | "recap"
  | "r1-gate"
  | "m1-design";

export type ModelTier = "haiku" | "sonnet" | "opus";

export interface PickModelCriteria {
  /** 영향 범위 — 5+ 파일이면 Opus 후보 */
  fileCount?: number;
  /** 아키텍처/거버넌스 결정 — Opus 후보 */
  isArchitecture?: boolean;
  /** 보안 회귀/SQL/XSS — Opus 후보 (환각 저허용) */
  isSecurity?: boolean;
  /** Sonnet 연속 실패 횟수 — 2회 이상이면 Opus 승격 */
  sonnetFailures?: number;
  /** release 전 최종 QA — Opus 후보 */
  isReleaseQa?: boolean;
  /** R1 dry-run cap=1 강제 (자율 시동 첫 검증) — true일 때 항상 'haiku' 반환 */
  dryRunCap1?: boolean;
  /** 명시적 강제 — pickModel 결과 무시하고 호출처가 결정한 tier 사용 */
  forceTier?: ModelTier;
}

export interface PickModelResult {
  model: ModelTier;
  reason: string;
}

const STAGE_DEFAULT: Record<ModelStage, ModelTier> = {
  triage: "haiku",
  meeting: "sonnet",
  impl: "sonnet",
  review: "sonnet",
  recap: "haiku",
  "r1-gate": "opus",
  "m1-design": "opus",
};

/**
 * Opus 4-체크 (ADR-047): 모두 Yes일 때만 Opus 권장.
 * - 5+ 파일 영향
 * - 아키텍처 또는 보안 이슈
 * - Sonnet 2회 이상 실패
 * - 또는 release 전 최종 QA
 */
function passesOpusGate(criteria: PickModelCriteria): boolean {
  const checks = [
    (criteria.fileCount ?? 0) >= 5,
    criteria.isArchitecture === true || criteria.isSecurity === true,
    (criteria.sonnetFailures ?? 0) >= 2,
    criteria.isReleaseQa === true,
  ];
  return checks.every(Boolean);
}

export function pickModel(
  stage: ModelStage,
  criteria: PickModelCriteria = {},
): PickModelResult {
  // 1. forceTier override (호출처가 명시적 결정)
  if (criteria.forceTier) {
    return {
      model: criteria.forceTier,
      reason: `forceTier override: ${criteria.forceTier}`,
    };
  }

  // 2. dryRunCap1 — 자율 시동 첫 검증 시 항상 haiku
  if (criteria.dryRunCap1) {
    return {
      model: "haiku",
      reason: "dryRunCap1 enforced (R1 자율 시동 1 사이클 검증 정책)",
    };
  }

  // 3. r1-gate / m1-design은 항상 opus (4-체크 우회 — 거버넌스/M1 보호)
  if (stage === "r1-gate") {
    return { model: "opus", reason: "r1-gate stage → opus (거버넌스 결정)" };
  }
  if (stage === "m1-design") {
    return {
      model: "opus",
      reason: "m1-design stage → opus (PRD 핵심 가치)",
    };
  }

  // 4. 4-체크 통과 시 Opus 권장 (가장 엄격한 gate, sonnet 실패 단독 승격보다 우선)
  if (passesOpusGate(criteria)) {
    return {
      model: "opus",
      reason: "Opus 4-체크 통과 (5+ 파일 + 아키/보안 + sonnet 실패 + release QA)",
    };
  }

  // 5. Sonnet 2+ 실패 시 Opus 승격 (4-체크 미달이라도 막힌 작업 풀기 위한 단독 승격)
  if ((criteria.sonnetFailures ?? 0) >= 2) {
    return {
      model: "opus",
      reason: `sonnet ${criteria.sonnetFailures}회 실패 → opus 승격`,
    };
  }

  // 6. stage default 그대로
  const def = STAGE_DEFAULT[stage];
  return {
    model: def,
    reason: `stage default: ${stage} → ${def}`,
  };
}

